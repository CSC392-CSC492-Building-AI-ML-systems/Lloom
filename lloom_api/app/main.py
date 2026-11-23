import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import initialize_database

from app.projects import router as projects_router
# lloom_api/lloom.db, independent of the current directory
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "lloom.db"

# The Next.js dev server in lloom_web/
FRONTEND_ORIGINS = ["http://localhost:3000"]


def create_app() -> FastAPI:
    app = FastAPI(title="LLooM API")

    app.include_router(projects_router)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=FRONTEND_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.db_path = os.environ.get("LLOOM_DB_PATH", str(DEFAULT_DB_PATH))

    @app.on_event("startup")
    def create_database():
        initialize_database(app.state.db_path)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
