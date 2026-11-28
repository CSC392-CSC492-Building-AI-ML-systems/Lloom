import os
from collections.abc import Callable
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db import (
    fail_interrupted_jobs,
    get_job,
    get_latest_job,
    initialize_database,
    transaction,
)
from app.jobs import JobManager, cancel_job, job_response, now

# lloom_api/lloom.db, independent of the current directory
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "lloom.db"

# The Next.js dev server in lloom_web/
FRONTEND_ORIGINS = ["http://localhost:3000"]


# Where jobs get their LLM models. B4 (model settings) will build them from the
# saved settings. Until then a job that needs them fails with this message.
def get_models() -> dict:
    raise NotImplementedError("Model settings are not set up yet (B4)")


# get_models is a parameter so tests (and later B7) can hand in fake models
def create_app(get_models: Callable[[], dict] = get_models) -> FastAPI:
    app = FastAPI(title="LLooM API")

    # Project and dataset upload routes
    from app.projects import router as projects_router

    app.include_router(projects_router)

    # Draft run routes
    from app.runs import router as runs_router

    app.include_router(runs_router)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=FRONTEND_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.db_path = os.environ.get("LLOOM_DB_PATH", str(DEFAULT_DB_PATH))
    # On app.state so routes can reach it later (B7 calls submit)
    app.state.job_manager = JobManager(app.state.db_path, get_models)
    
    # Routes that build a session (B5 draft runs) get their models from here
    app.state.get_models = get_models

    @app.on_event("startup")
    def create_database():
        initialize_database(app.state.db_path)
        # No worker exists yet, so any job still Pending or Running was cut off
        # by the last shutdown or crash and can never finish
        with transaction(app.state.db_path) as connection:
            fail_interrupted_jobs(connection, updated_at=now())

    @app.on_event("shutdown")
    def stop_jobs():
        app.state.job_manager.shutdown()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    # Each route opens its own short transaction. It commits when the with block ends,
    # which is before the route returns, so the client never sees the old state.
    # An error raised inside the block (like the 404 below) rolls it back.
    @app.post("/runs/{run_id}/cancel")
    def cancel_run(run_id: str):
        with transaction(app.state.db_path) as connection:
            job = get_latest_job(connection, run_id)
            if job is None:
                raise HTTPException(status_code=404, detail="That run has no job")
            if not cancel_job(connection, job["id"]):
                raise HTTPException(status_code=409, detail="That run has no job to cancel")
            job = get_job(connection, job["id"])
        return job_response(job)

    @app.get("/jobs/{job_id}")
    def read_job(job_id: str):
        with transaction(app.state.db_path) as connection:
            job = get_job(connection, job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")
        return job_response(job)

    return app


app = create_app()
