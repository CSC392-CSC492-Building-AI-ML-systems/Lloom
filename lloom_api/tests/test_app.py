from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def test_cors_allows_frontend():
    client = TestClient(create_app())

    response = client.get("/health", headers={"Origin": "http://localhost:3000"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_blocks_other_origins():
    client = TestClient(create_app())

    response = client.get("/health", headers={"Origin": "http://example.com"})

    assert "access-control-allow-origin" not in response.headers


def test_db_path_from_env(monkeypatch, tmp_path):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setenv("LLOOM_DB_PATH", db_path)

    assert create_app().state.db_path == db_path


def test_db_path_default(monkeypatch):
    monkeypatch.delenv("LLOOM_DB_PATH", raising=False)

    assert Path(create_app().state.db_path).parts[-2:] == ("lloom_api", "lloom.db")
