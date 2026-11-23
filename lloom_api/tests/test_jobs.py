import asyncio
import pickle
import threading

from app.db import (
    create_dataset,
    create_job,
    create_project,
    create_run,
    fail_interrupted_jobs,
    get_job,
    get_latest_job,
    get_run,
    initialize_database,
    transaction,
)
from app.jobs import JobManager, cancel_job


TIMESTAMP = "2026-11-22T12:00:00Z"
LATER = "2026-11-22T13:00:00Z"

# The four models LLooM's build_models returns. The jobs here never call them.
MODELS = {"distill_model": 1, "cluster_model": 2, "synth_model": 3, "score_model": 4}


# Stands in for a LLooM session: it can be pickled, and its label shows whether
# the saved copy is the old one or one a job changed.
class FakeSession:
    def __init__(self, label):
        self.label = label

    def get_pkl_str(self):
        return pickle.dumps(self)


def make_database(tmp_path):
    path = str(tmp_path / "jobs.db")
    initialize_database(path)

    with transaction(path) as connection:
        create_project(
            connection,
            project_id="project-1",
            name="My project",
            description="",
            created_at=TIMESTAMP,
            last_opened_at=TIMESTAMP,
        )
        create_dataset(
            connection,
            dataset_id="dataset-1",
            project_id="project-1",
            name="responses.csv",
            format="CSV",
            file_blob=b"",
            columns=[],
            text_columns=[],
            row_count=0,
            sample_rows=[],
            id_column=None,
            created_at=TIMESTAMP,
        )
    return path


# A run whose saved session is labelled "before"
def add_run(path, run_id, status="Draft"):
    with transaction(path) as connection:
        create_run(
            connection,
            run_id=run_id,
            project_id="project-1",
            dataset_id="dataset-1",
            name=run_id,
            config={},
            status=status,
            params={},
            generation_estimate=None,
            score_estimate=None,
            session_pickle=pickle.dumps(FakeSession("before")),
            created_at=TIMESTAMP,
            updated_at=TIMESTAMP,
        )


def add_job(path, job_id, run_id, status):
    with transaction(path) as connection:
        create_job(
            connection,
            job_id=job_id,
            run_id=run_id,
            status=status,
            step=None,
            done=0,
            total=0,
            error=None,
            created_at=TIMESTAMP,
            updated_at=TIMESTAMP,
        )


def read_state(path, job_id, run_id):
    with transaction(path) as connection:
        return get_job(connection, job_id), get_run(connection, run_id)


def saved_label(run):
    return pickle.loads(run["session_pickle"]).label


# Submits one job and waits for the worker to finish it
def run_job(path, run_id, work):
    manager = JobManager(path, lambda: MODELS)
    job_id = manager.submit(run_id, work)
    manager.executor.shutdown(wait=True)
    return job_id


def test_a_job_reports_progress_and_finishes(tmp_path):
    path = make_database(tmp_path)
    add_run(path, "run-1")
    seen = {}

    async def work(session, progress):
        seen["model"] = session.distill_model
        progress("Distill-filter", 1, 5)
        progress("Review", 2, 5)  # a LLooM step name: shown as the Synthesize stage
        session.label = "after"

    job_id = run_job(path, "run-1", work)
    job, run = read_state(path, job_id, "run-1")

    assert job["status"] == "Completed"
    assert run["status"] == "Completed"
    assert (job["step"], job["done"], job["total"]) == ("Synthesize", 2, 5)
    assert seen["model"] == 1  # the job got a session with fresh models attached
    assert saved_label(run) == "after"


def test_a_job_that_raises_fails_and_leaves_the_saved_session_alone(tmp_path):
    path = make_database(tmp_path)
    add_run(path, "run-1")

    async def work(session, progress):
        progress("Score", 1, 5)
        session.label = "half scored"
        raise ValueError("the model failed")

    job_id = run_job(path, "run-1", work)
    job, run = read_state(path, job_id, "run-1")

    assert job["status"] == "Failed"
    assert job["error"] == "the model failed"
    assert run["status"] == "Failed"
    assert saved_label(run) == "before"


def test_cancelling_a_running_job_stops_it_at_its_next_progress_call(tmp_path):
    path = make_database(tmp_path)
    add_run(path, "run-1")
    reached = []

    async def work(session, progress):
        progress("Cluster", 1, 5)

        # Cancel from outside the job, the way the route does
        with transaction(path) as connection:
            job = get_latest_job(connection, "run-1")
            assert cancel_job(connection, job["id"])

        session.label = "half done"
        progress("Synthesize", 2, 5)  # this call must raise
        reached.append("after the progress call")

    job_id = run_job(path, "run-1", work)
    job, run = read_state(path, job_id, "run-1")

    assert reached == []
    assert job["status"] == "Cancelled"
    assert run["status"] == "Cancelled"
    assert job["step"] == "Cluster"  # where it stopped
    assert saved_label(run) == "before"


def test_startup_fails_jobs_that_never_finished_and_their_runs(tmp_path):
    path = make_database(tmp_path)
    for run_id, status in [
        ("run-running", "Running"),
        ("run-pending", "Pending"),
        ("run-done", "Completed"),
    ]:
        add_run(path, run_id, status)
        add_job(path, f"job-{run_id}", run_id, status)

    with transaction(path) as connection:
        fail_interrupted_jobs(connection, updated_at=LATER)

    for run_id in ["run-running", "run-pending"]:
        job, run = read_state(path, f"job-{run_id}", run_id)
        assert job["status"] == "Failed"
        assert job["error"] == "Server restarted"
        assert run["status"] == "Failed"
        assert saved_label(run) == "before"

    # A job that had already finished is not touched
    job, run = read_state(path, "job-run-done", "run-done")
    assert job["status"] == "Completed"
    assert job["error"] is None
    assert run["status"] == "Completed"


def test_cancelling_a_queued_job_cancels_it_at_once_and_leaves_a_restarted_run_alone(tmp_path):
    path = make_database(tmp_path)
    for run_id in ["run-1", "run-2", "run-3"]:
        add_run(path, run_id)
    manager = JobManager(path, lambda: MODELS)
    started = threading.Event()
    gate = threading.Event()
    ran = []
    run_2_status = []

    # Keeps the only worker busy, so the next jobs have to wait in the queue
    async def hold(session, progress):
        started.set()
        while not gate.is_set():
            await asyncio.sleep(0.01)

    async def work(session, progress):
        ran.append("ran")

    # Queued between the cancelled job and the restarted one, so it runs after the
    # worker has dealt with the cancelled job and before the restarted job starts
    async def probe(session, progress):
        with transaction(path) as connection:
            run_2_status.append(get_run(connection, "run-2")["status"])

    try:
        manager.submit("run-1", hold)
        assert started.wait(timeout=5)
        queued_id = manager.submit("run-2", work)

        with transaction(path) as connection:
            assert cancel_job(connection, queued_id)

        # Cancelled right away, while the worker is still busy with run-1
        job, run = read_state(path, queued_id, "run-2")
        assert job["status"] == "Cancelled"
        assert run["status"] == "Cancelled"

        # The user starts run-2 again before the worker reaches the old job
        manager.submit("run-3", probe)
        restarted_id = manager.submit("run-2", work)
    finally:
        gate.set()
    manager.executor.shutdown(wait=True)

    old_job, _ = read_state(path, queued_id, "run-2")
    new_job, _ = read_state(path, restarted_id, "run-2")

    assert old_job["status"] == "Cancelled"
    assert new_job["status"] == "Completed"
    assert ran == ["ran"]  # only the restarted job did any work
    # While the restarted job waited, its run still said Pending. The old cancelled
    # job must not have set it back to Cancelled.
    assert run_2_status == ["Pending"]
