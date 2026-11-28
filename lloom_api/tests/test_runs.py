# B5: draft runs, their cost estimate, and reading a run back
import pickle

import pytest
from fastapi.testclient import TestClient

from app.db import create_dataset, create_project, get_run, transaction, update_run_state, update_run_status
from app.main import create_app

TIMESTAMP = "2026-11-26T12:00:00+00:00"
CSV = b"doc_id,text,rating\n1,The delivery was late.,1\n2,Great food.,5\n3,Rude staff and cold food.,2\n"


# A fresh app and database with one project and one CSV dataset (inserted directly, no upload)
@pytest.fixture
def client(monkeypatch, tmp_path, fake_models):
    monkeypatch.setenv("LLOOM_DB_PATH", str(tmp_path / "runs.db"))
    with TestClient(create_app(get_models=fake_models)) as client:
        with transaction(client.app.state.db_path) as connection:
            create_project(connection, project_id="p1", name="Reviews", description="",
                           created_at=TIMESTAMP, last_opened_at=TIMESTAMP)
            create_dataset(connection, dataset_id="d1", project_id="p1", name="reviews.csv", format="CSV",
                           file_blob=CSV, columns=["doc_id", "text", "rating"], text_columns=["text"],
                           row_count=3, sample_rows=[], id_column=None, created_at=TIMESTAMP)
        yield client


# A valid RunConfiguration, as the frontend sends it
def config(**changes):
    return {"datasetId": "d1", "textColumn": "text", "documentIdColumn": "doc_id", "targetConcepts": "6",
            "seedPhrase": "", "synthesisRounds": 1, "automaticReview": True, **changes}


def create_draft(client, **changes):
    return client.post("/projects/p1/runs", json=config(**changes)).json()


def set_status(client, run_id, status):
    with transaction(client.app.state.db_path) as connection:
        update_run_status(connection, run_id=run_id, status=status, previous_status="Draft", updated_at=TIMESTAMP)


def test_create_returns_a_draft_with_an_estimate(client):
    response = client.post("/projects/p1/runs", json=config())
    assert response.status_code == 201
    run = response.json()
    assert run["status"] == "Draft"
    assert run["name"] == "Run 1 — reviews.csv"
    assert run["estimatedCost"] > 0


def test_unknown_text_column_returns_422(client):
    response = client.post("/projects/p1/runs", json=config(textColumn="missing"))
    assert response.status_code == 422
    assert response.json()["detail"] == {"textColumn": "Select a text column from this dataset."}


def test_patch_changes_the_configuration_and_estimate(client):
    run = create_draft(client)
    response = client.patch(f"/runs/{run['id']}", json=config(targetConcepts="12"))
    assert response.status_code == 200
    patched = response.json()
    assert patched["configuration"]["targetConcepts"] == "12"
    assert patched["estimatedCost"] > run["estimatedCost"]
    assert patched["name"] == run["name"]


def test_patch_on_a_started_run_returns_409(client):
    run = create_draft(client)
    set_status(client, run["id"], "Running")
    assert client.patch(f"/runs/{run['id']}", json=config()).status_code == 409


def test_get_returns_the_run_before_any_job(client):
    run = create_draft(client)
    response = client.get(f"/runs/{run['id']}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == run["id"]
    assert body["projectId"] == "p1"
    assert body["latestJob"] is None
    assert body["model"] is None
    assert body["actualCost"] is None


def test_completed_run_returns_its_actual_cost(client):
    run = create_draft(client)
    set_status(client, run["id"], "Completed")
    with transaction(client.app.state.db_path) as connection:
        update_run_state(connection, run_id=run["id"], generation_estimate=None, score_estimate=None,
                         session_pickle=None, cost_so_far=0.12, elapsed_seconds=None, updated_at=TIMESTAMP)
    assert client.get(f"/runs/{run['id']}").json()["actualCost"] == 0.12


def test_no_id_column_uses_lloom_id(client):
    run = create_draft(client, documentIdColumn="")
    with transaction(client.app.state.db_path) as connection:
        session = pickle.loads(get_run(connection, run["id"])["session_pickle"])
    assert session.doc_id_col == "lloom_id"
    assert list(session.in_df["lloom_id"]) == ["0", "1", "2"]


def test_unpriced_models_have_no_estimate(client, fake_models):
    # e.g. a local model with no price: the estimate is unavailable, not 0
    def unpriced_models():
        models = fake_models()
        for model in models.values():
            model.cost = None
        return models

    client.app.state.get_models = unpriced_models
    assert create_draft(client)["estimatedCost"] is None
