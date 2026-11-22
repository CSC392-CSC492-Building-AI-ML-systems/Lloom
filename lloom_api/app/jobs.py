import uuid
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from app.db import (
    create_job,
    get_run,
    transaction,
    update_job_progress,
    update_run_status,
)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


# Runs work in the background, one job at a time.
# It is given the database PATH, not a connection: a connection belongs to one
# request (or one thread), and the worker keeps going after the request has ended,
# so every step opens its own short connection with transaction().
class JobManager:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        # One worker: extra jobs wait in the executor's queue, still Pending
        self.executor = ThreadPoolExecutor(max_workers=1)

    def submit(self, run_id: str, fn: Callable[[], None]) -> str:
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
    def _work(self, job_id: str, run_id: str, fn: Callable[[], None]) -> None:
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

        fn()

    def shutdown(self, wait: bool = True) -> None:
        self.executor.shutdown(wait=wait)