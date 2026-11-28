import asyncio
import pickle
import uuid
from collections.abc import Awaitable, Callable
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any

from app.db import (
    create_job,
    get_job,
    get_run,
    is_cancel_requested,
    request_job_cancel,
    transaction,
    update_job_progress,
    update_run_state,
    update_run_status,
)

# What a job runs: an async function that gets the session and a progress callback
# progress(step, done, total) is what LLooM's gen() and score() call
Progress = Callable[[str, int, int], None]
Work = Callable[[Any, Progress], Awaitable[None]]


# LLooM reports its own step names. The frontend shows five stages, so each
# step is mapped to one of them. An unknown step is shown as it is.
STAGES = {
    "Distill-filter": "Distill",
    "Distill-summarize": "Distill",
    "Cluster": "Cluster",
    "Synthesize": "Synthesize",
    "Review": "Synthesize",
    "Score": "Score",
}


# Raised inside the progress callback to stop a job that was asked to cancel
class JobCancelled(Exception):
    pass


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


# The job shape the frontend reads. error is only set for a Failed job.
def job_response(job) -> dict:
    return {
        "id": job["id"],
        "status": job["status"],
        "step": job["step"],
        "done": job["done"],
        "total": job["total"],
        "error": job["error"],
    }


# The session helpers take a connection (not a path), so they work inside any
# transaction: a worker's, or a route's.

# Rebuilds the LLooM session saved on the run. Models are never saved with it
# (API clients can't be pickled), so the caller gives fresh ones. `models` is the
# dict from build_models: distill_model, cluster_model, synth_model, score_model.
# Only unpickle data this app saved itself: pickle can run code, so it is unsafe
# for anything from outside.
def load_session(connection, run_id: str, models: dict) -> Any:
    run = get_run(connection, run_id)
    if run is None:
        raise ValueError(f"Run {run_id} does not exist")
    if run["session_pickle"] is None:
        raise ValueError(f"Run {run_id} has no saved session")

    session = pickle.loads(run["session_pickle"])
    session.distill_model = models["distill_model"]
    session.cluster_model = models["cluster_model"]
    session.synth_model = models["synth_model"]
    session.score_model = models["score_model"]
    return session


# get_pkl_str() pickles the session without its models. The other columns
# (estimates, cost, elapsed time) are passed as None, so they stay as they were.
def save_session(connection, run_id: str, session: Any) -> None:
    update_run_state(
        connection,
        run_id=run_id,
        generation_estimate=None,
        score_estimate=None,
        session_pickle=session.get_pkl_str(),
        cost_so_far=None,
        elapsed_seconds=None,
        updated_at=now(),
    )


# Puts a job and its run in a final status (Completed, Failed or Cancelled). The job
# keeps the step, done and total it last reported, so the frontend can still show
# where it stopped. Takes a connection, so the caller decides what else goes in
# the same transaction (the worker saves the session in it).
def finish_job(
    connection,
    job_id: str,
    run_id: str,
    status: str,
    error: str | None,
) -> None:
    time = now()
    job = get_job(connection, job_id)
    update_job_progress(
        connection,
        job_id=job_id,
        status=status,
        step=job["step"],
        done=job["done"],
        total=job["total"],
        error=error,
        updated_at=time,
    )
    update_run_status(
        connection,
        run_id=run_id,
        status=status,
        previous_status=get_run(connection, run_id)["status"],
        updated_at=time,
    )


# Asks a job to cancel. Returns False if it can't (it doesn't exist, or already finished).
# A Running job is only flagged: the worker raises JobCancelled at its next progress call.
# A Pending job has not started, so it is cancelled on the spot, along with its run,
# instead of staying Pending until the worker gets to it.
def cancel_job(connection, job_id: str) -> bool:
    job = get_job(connection, job_id)
    if job is None or not request_job_cancel(connection, job_id=job_id, updated_at=now()):
        return False

    if job["status"] == "Pending":
        finish_job(connection, job_id, job["run_id"], "Cancelled", None)
    return True


# Runs work in the background, one job at a time.
# It is given the database PATH, not a connection: a connection belongs to one
# request (or one thread), and the worker keeps going after the request has ended,
# so every step opens its own short connection with transaction().
class JobManager:
    # get_models: a function that returns fresh models (the build_models dict)
    def __init__(self, db_path: str, get_models: Callable[[], dict]) -> None:
        self.db_path = db_path
        self.get_models = get_models
        # One worker: extra jobs wait in the executor's queue, still Pending
        self.executor = ThreadPoolExecutor(max_workers=1)

    def submit(self, run_id: str, fn: Work) -> str:
        """Record a Pending job for the run, schedule fn, and return the job ID at once."""
        job_id = uuid.uuid4().hex
        time = now()

        with transaction(self.db_path) as connection:
            run = get_run(connection, run_id)
            if run is None:
                raise ValueError(f"Run {run_id} does not exist")

            create_job(
                connection,
                job_id=job_id,
                run_id=run_id,
                status="Pending",
                step=None,
                done=0,
                total=0,
                error=None,
                created_at=time,
                updated_at=time,
            )
            update_run_status(
                connection,
                run_id=run_id,
                status="Pending",
                previous_status=run["status"],
                updated_at=time,
            )
        # The with block has committed by here, so anyone polling can see the job.
        # Only then do we hand the work to the worker.

        self.executor.submit(self._work, job_id, run_id, fn)
        return job_id

    # Runs in the worker thread, when it is this job's turn
    def _work(self, job_id: str, run_id: str, fn: Work) -> None:
        # Nothing may escape this method: an exception here would vanish inside
        # the executor's Future and leave the job Running forever. Every way out
        # ends with the job and the run in a final status.
        try:
            with transaction(self.db_path) as connection:
                job = get_job(connection, job_id)
                cancelled = is_cancel_requested(connection, job_id)

            # Cancelled while it was waiting in the queue (cancel_job already marked
            # it and its run Cancelled): leave everything alone. The run may even
            # have a newer job by now, and touching the run would overwrite it.
            if job["status"] != "Pending":
                return
            # Flagged in the moment before the worker picked it up: don't start it
            if cancelled:
                raise JobCancelled()

            time = now()
            with transaction(self.db_path) as connection:
                update_job_progress(
                    connection,
                    job_id=job_id,
                    status="Running",
                    step=None,
                    done=0,
                    total=0,
                    error=None,
                    updated_at=time,
                )
                update_run_status(
                    connection,
                    run_id=run_id,
                    status="Running",
                    previous_status="Pending",
                    updated_at=time,
                )

            # Short connections on purpose: none is held open while fn runs (it can
            # take minutes), so other requests are never blocked by this job
            with transaction(self.db_path) as connection:
                session = load_session(connection, run_id, self.get_models())

            # fn is async, and this thread has no event loop, so asyncio.run supplies one
            asyncio.run(fn(session, self._progress(job_id)))

            # Only reached if fn finished without an error. The session is saved
            # in the same transaction that marks the job Completed, so they
            # can't disagree.
            with transaction(self.db_path) as connection:
                save_session(connection, run_id, session)
                finish_job(connection, job_id, run_id, "Completed", None)
        except JobCancelled:
            # The saved session is left as it was before the job started
            with transaction(self.db_path) as connection:
                finish_job(connection, job_id, run_id, "Cancelled", None)
        except Exception as error:
            with transaction(self.db_path) as connection:
                finish_job(connection, job_id, run_id, "Failed", str(error))

    # Builds the progress(step, done, total) callback for one job
    def _progress(self, job_id: str) -> Progress:
        def progress(step: str, done: int, total: int) -> None:
            with transaction(self.db_path) as connection:
                # LLooM calls this at the start of each step, so this is the
                # moment a cancel request can take effect
                if is_cancel_requested(connection, job_id):
                    raise JobCancelled()

                update_job_progress(
                    connection,
                    job_id=job_id,
                    status="Running",
                    step=STAGES.get(step, step),
                    done=done,
                    total=total,
                    error=None,
                    updated_at=now(),
                )

        return progress

    # Lets the job that is running finish, and drops the ones still waiting. Dropped
    # jobs stay Pending in the database, and the next startup marks them Failed.
    def shutdown(self, wait: bool = True) -> None:
        self.executor.shutdown(wait=wait, cancel_futures=True)
