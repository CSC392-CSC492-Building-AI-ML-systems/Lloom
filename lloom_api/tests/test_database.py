import json
import pickle



from app.db import (
    create_dataset,
    create_job,
    create_project,
    create_run,
    get_dataset,
    get_job,
    get_project,
    get_run,
    initialize_database,
    open_connection,
)


TIMESTAMP = "2026-11-18T12:00:00Z"



from fastapi.testclient import TestClient

from app.main import create_app


def test_startup_creates_database_schema(monkeypatch, tmp_path):
    db_path = tmp_path / "startup.db"
    monkeypatch.setenv("LLOOM_DB_PATH", str(db_path))

    with TestClient(create_app()):
        pass

    assert db_path.exists()




def make_connection(tmp_path):
    db_path = tmp_path / "test_lloom.db"
    initialize_database(str(db_path))
    connection = open_connection(str(db_path))
    return db_path, connection


def insert_project(connection):
    create_project(
        connection,
        project_id="project-1",
        name="My project",
        description="A test project",
        created_at=TIMESTAMP,
        last_opened_at=TIMESTAMP,
    )


def insert_dataset(connection):
    insert_project(connection)

    create_dataset(
        connection,
        dataset_id="dataset-1",
        project_id="project-1",
        name="responses.csv",
        file_blob=b"question,answer\none,\x00two\n",
        columns=["lloom_id", "question", "answer"],
        text_columns=["question", "answer"],
        row_count=1,
        sample_rows=[
            {
                "lloom_id": "row-1",
                "question": "one",
                "answer": "two",
            }
        ],
        id_column="lloom_id",
        created_at=TIMESTAMP,
    )


def insert_run(connection):
    insert_dataset(connection)

    create_run(
        connection,
        run_id="run-1",
        project_id="project-1",
        dataset_id="dataset-1",
        config={"model": "gpt-5", "num_concepts": 10},
        status="awaiting_approval",
        params={"temperature": 0.2},
        generation_estimate={"cost": 0.01, "seconds": 10},
        score_estimate=None,
        session_pickle=pickle.dumps({"session": "saved"}),
        created_at=TIMESTAMP,
        updated_at=TIMESTAMP,
    )


def test_project_round_trip(tmp_path):
    _, connection = make_connection(tmp_path)

    try:
        insert_project(connection)
        connection.commit()

        project = get_project(connection, "project-1")

        assert project is not None
        assert project["id"] == "project-1"
        assert project["name"] == "My project"
        assert project["description"] == "A test project"
        assert project["created_at"] == TIMESTAMP
        assert project["last_opened_at"] == TIMESTAMP
    finally:
        connection.close()


def test_dataset_blob_and_json_round_trip(tmp_path):
    _, connection = make_connection(tmp_path)
    expected_blob = b"question,answer\none,\x00two\n"

    try:
        insert_dataset(connection)
        connection.commit()

        dataset = get_dataset(connection, "dataset-1")

        assert dataset is not None
        assert dataset["project_id"] == "project-1"
        assert dataset["file_blob"] == expected_blob
        assert json.loads(dataset["columns_json"]) == [
            "lloom_id",
            "question",
            "answer",
        ]
        assert json.loads(dataset["text_columns_json"]) == ["question", "answer"]
        assert dataset["row_count"] == 1
        assert json.loads(dataset["sample_rows_json"]) == [
            {
                "lloom_id": "row-1",
                "question": "one",
                "answer": "two",
            }
        ]
        assert dataset["id_column"] == "lloom_id"
    finally:
        connection.close()


def test_run_pickle_round_trip(tmp_path):
    _, connection = make_connection(tmp_path)
    expected_pickle = pickle.dumps({"session": "saved"})

    try:
        insert_run(connection)
        connection.commit()

        run = get_run(connection, "run-1")

        assert run is not None
        assert run["project_id"] == "project-1"
        assert run["dataset_id"] == "dataset-1"
        assert run["status"] == "awaiting_approval"
        assert json.loads(run["config_json"]) == {
            "model": "gpt-5",
            "num_concepts": 10,
        }
        assert json.loads(run["params_json"]) == {"temperature": 0.2}
        assert run["session_pickle"] == expected_pickle
    finally:
        connection.close()


def test_job_round_trip(tmp_path):
    _, connection = make_connection(tmp_path)

    try:
        insert_run(connection)

        create_job(
            connection,
            job_id="job-1",
            run_id="run-1",
            kind="generate",
            status="running",
            step="creating concepts",
            done=2,
            total=10,
            error=None,
            created_at=TIMESTAMP,
            updated_at=TIMESTAMP,
        )
        connection.commit()

        job = get_job(connection, "job-1")

        assert job is not None
        assert job["run_id"] == "run-1"
        assert job["kind"] == "generate"
        assert job["status"] == "running"
        assert job["step"] == "creating concepts"
        assert job["done"] == 2
        assert job["total"] == 10
        assert job["error"] is None
    finally:
        connection.close()


def test_initializing_twice_preserves_data(tmp_path):
    db_path, connection = make_connection(tmp_path)

    try:
        insert_project(connection)
        connection.commit()
    finally:
        connection.close()

    initialize_database(str(db_path))

    connection = open_connection(str(db_path))
    try:
        project = get_project(connection, "project-1")

        assert project is not None
        assert project["name"] == "My project"
    finally:
        connection.close()



