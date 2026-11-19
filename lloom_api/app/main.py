import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# lloom_api/lloom.db, independent of the current directory
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "lloom.db"

# The Next.js dev server in lloom_web/
FRONTEND_ORIGINS = ["http://localhost:3000"]


def create_app() -> FastAPI:
    app = FastAPI(title="LLooM API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=FRONTEND_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.db_path = os.environ.get("LLOOM_DB_PATH", str(DEFAULT_DB_PATH))

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
