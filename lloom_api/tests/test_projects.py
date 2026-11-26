import json
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.db import create_run, get_dataset, open_connection
from app.main import create_app

#path to repo root
REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

# four csv examples given found in docs/public/data
CSV_SAMPLES = [
    REPOSITORY_ROOT / "docs/public/data/political_fb_posts_100.csv",
    REPOSITORY_ROOT / "docs/public/data/neurips_statements_150.csv",
    REPOSITORY_ROOT / "docs/public/data/toxicity_feminism_200.csv",
    REPOSITORY_ROOT / "docs/public/data/uist_abstracts_210.csv",
]

TIMESTAMP = "2026-11-23T12:00:00+00:00"


# Gives each test a fresh app, with own temp database
@pytest.fixture
def api_client(monkeypatch, tmp_path):
    db_path = tmp_path / "projects.db"
    monkeypatch.setenv("LLOOM_DB_PATH", str(db_path))

    with TestClient(create_app()) as client:
        yield client, db_path


# uploading csv file helper
def upload_csv(client: TestClient, csv_path: Path):
    return client.post(
        "/projects",
        data={
            "name": f"Project for {csv_path.stem}",
            "description": "B3 upload test",
        },
        files=[
            (
                "files",
                (
                    csv_path.name,
                    csv_path.read_bytes(),
                    "text/csv",
                ),
            )
        ],
    )


# TEST: uploading a csv returns metadata and stores original
@pytest.mark.parametrize("csv_path", CSV_SAMPLES)
def test_uploads_each_sample_csv_and_returns_metadata(api_client, csv_path):
    client, db_path = api_client

    response = upload_csv(client, csv_path)

    assert response.status_code == 201
    project = response.json()
    dataset = project["datasets"][0]

    expected = pd.read_csv(csv_path)

    assert dataset["name"] == csv_path.name
    assert dataset["format"] == "CSV"
    assert dataset["columns"] == [str(column) for column in expected.columns]
    assert dataset["textColumns"] == [
        str(column)
        for column in expected.columns
        if pd.api.types.is_string_dtype(expected[column].dtype)
    ]
    assert dataset["rowCount"] == len(expected)

    expected_sample_rows = [
        {str(column): str(value) for column, value in row.items()}
        for row in expected.head(3).to_dict(orient="records")
    ]
    assert dataset["sampleRows"] == expected_sample_rows

    # Confirms the original uploaded bytes, not a reconstructed CSV, were stored.
    connection = open_connection(str(db_path))
    try:
        saved_dataset = get_dataset(connection, dataset["id"])
        assert saved_dataset is not None
        assert saved_dataset["file_blob"] == csv_path.read_bytes()
    finally:
        connection.close()



# Test: invalid json is rejected, 422 and message
def test_malformed_json_returns_422(api_client):
    client, _ = api_client

    response = client.post(
        "/projects",
        data={"name": "Bad project"},
        files=[
            (
                "files",
                ("broken.json", b'[{"text": }]', "application/json"),
            )
        ],
    )

    assert response.status_code == 422
    assert "malformed" in response.json()["detail"].lower()


#Test: a valid JSON is accepted/metadata is correct
def test_json_upload_returns_metadata(api_client):
    client, _ = api_client

    response = client.post(
        "/projects",
        data={"name": "JSON project"},
        files=[
            (
                "files",
                (
                    "records.json",
                    b'[{"id": 1, "text": "First"}, {"id": 2, "text": "Second"}]',
                    "application/json",
                ),
            )
        ],
    )

    assert response.status_code == 201
    assert response.json()["datasets"] == [
        {
            "id": response.json()["datasets"][0]["id"],
            "name": "records.json",
            "format": "JSON",
            "columns": ["id", "text"],
            "textColumns": ["text"],
            "rowCount": 2,
            "sampleRows": [
                {"id": "1", "text": "First"},
                {"id": "2", "text": "Second"},
            ],
        }
    ]

#TEST: EMPTY file case
def test_empty_file_returns_422(api_client):
    client, _ = api_client

    response = client.post(
        "/projects",
        data={"name": "Empty project"},
        files=[("files", ("empty.csv", b"", "text/csv"))],
    )

    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


#TEST: Zip file type test
def test_zip_returns_415(api_client):
    client, _ = api_client

    response = client.post(
        "/projects",
        data={"name": "ZIP project"},
        files=[("files", ("data.zip", b"PK\x03\x04", "application/zip"))],
    )

    assert response.status_code == 415
    assert "zip" in response.json()["detail"].lower()


#TEST: CSV with only numeric values/ rejected with 422
def test_file_with_no_text_columns_returns_422(api_client):
    client, _ = api_client

    response = client.post(
        "/projects",
        data={"name": "Numbers only"},
        files=[
            (
                "files",
                ("numbers.csv", b"id,score\n1,10\n2,20\n", "text/csv"),
            )
        ],
    )

    assert response.status_code == 422
    assert "text column" in response.json()["detail"].lower()

# TEST: GET /projects/{id} returns draft run with config.
def test_get_project_returns_draft_run_with_configuration(api_client):
    client, db_path = api_client
    csv_path = CSV_SAMPLES[0]

    create_response = upload_csv(client, csv_path)
    assert create_response.status_code == 201

    project = create_response.json()
    project_id = project["id"]
    dataset_id = project["datasets"][0]["id"]

    configuration = {
        "datasetId": dataset_id,
        "textColumn": "text",
        "documentIdColumn": "doc_id",
        "targetConcepts": "12",
        "seedPhrase": "",
        "synthesisRounds": 1,
        "automaticReview": True,
    }

    connection = open_connection(str(db_path))
    try:
        create_run(
            connection,
            run_id="run-1",
            project_id=project_id,
            dataset_id=dataset_id,
            name="Run 1 — Draft",
            config=configuration,
            status="Draft",
            params={},
            generation_estimate=None,
            score_estimate=None,
            session_pickle=None,
            created_at=TIMESTAMP,
            updated_at=TIMESTAMP,
        )
        connection.commit()
    finally:
        connection.close()

    response = client.get(f"/projects/{project_id}")

    assert response.status_code == 200
    returned_project = response.json()

    assert returned_project["id"] == project_id
    assert len(returned_project["datasets"]) == 1
    assert len(returned_project["runs"]) == 1

    returned_run = returned_project["runs"][0]
    assert returned_run == {
        "id": "run-1",
        "name": "Run 1 — Draft",
        "datasetId": dataset_id,
        "created": TIMESTAMP,
        "status": "Draft",
        "configuration": configuration,
    }

# TEST: Completed run comes back in the shape frontend excepts
def test_get_project_returns_completed_run_fixture_shape(api_client):
    client, db_path = api_client
    project = upload_csv(client, CSV_SAMPLES[0]).json()
    dataset_id = project["datasets"][0]["id"]

    connection = open_connection(str(db_path))
    try:
        create_run(
            connection,
            run_id="completed-run",
            project_id=project["id"],
            dataset_id=dataset_id,
            name="Completed run",
            config={},
            status="Completed",
            params={},
            generation_estimate=None,
            score_estimate=None,
            session_pickle=None,
            created_at=TIMESTAMP,
            updated_at=TIMESTAMP,
        )
        connection.commit()
    finally:
        connection.close()

    response = client.get(f"/projects/{project['id']}")

    assert response.status_code == 200
    assert response.json()["runs"] == [
        {
            "id": "completed-run",
            "name": "Completed run",
            "datasetId": dataset_id,
            "created": TIMESTAMP,
            "status": "Completed",
            "concepts": 0,
        }
    ]


# TEST: a newly created proj shows up in GET/projects
def test_get_projects_lists_created_project(api_client):
    client, _ = api_client

    response = upload_csv(client, CSV_SAMPLES[0])
    project = response.json()

    list_response = client.get("/projects")

    assert list_response.status_code == 200
    assert any(item["id"] == project["id"] for item in list_response.json())
