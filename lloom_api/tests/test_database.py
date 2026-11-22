import json
import pickle
import sqlite3

import pytest

from app.db import (
    DATASET_FORMAT,
    JOB_STATUS,
    RUN_STATUS,
    create_dataset,
    create_job,
    create_project,
    create_run,
    get_dataset,
    get_job,
    get_project,
    get_run,
    get_settings,
    initialize_database,
    open_connection,
    save_settings,
    update_run_state,
    update_run_status,
)


TIMESTAMP = "2026-11-18T12:00:00Z"
LATER = "2026-11-18T13:00:00Z"



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
        format="CSV",
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


def add_run(connection, run_id="run-1", status="Draft"):
    # Needs the dataset (and so the project) to exist already
    create_run(
        connection,
        run_id=run_id,
        project_id="project-1",
        dataset_id="dataset-1",
        name="Run 1 — responses.csv",
        config={"model": "gpt-5", "num_concepts": 10},
        status=status,
        params={"temperature": 0.2},
        generation_estimate={"cost": 0.01, "seconds": 10},
        score_estimate=None,
        session_pickle=pickle.dumps({"session": "saved"}),
        created_at=TIMESTAMP,
        updated_at=TIMESTAMP,
    )


def insert_run(connection):
    insert_dataset(connection)
    add_run(connection)


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
        assert dataset["format"] == "CSV"
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
        assert run["name"] == "Run 1 — responses.csv"
        assert run["status"] == "Draft"
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
            status="Running",
            step="Distill",
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
        assert job["status"] == "Running"
        assert job["cancel_requested"] == 0  # nobody has asked to cancel yet
        assert job["step"] == "Distill"
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

def test_update_run_status_changes_the_status_and_remembers_the_old_one(tmp_path):
    _, connection = make_connection(tmp_path)

    try:
        insert_run(connection)

        update_run_status(
            connection,
            run_id="run-1",
            status="Running",
            previous_status="Pending",
            updated_at=LATER,
        )

        run = get_run(connection, "run-1")

        assert run["status"] == "Running"
        assert run["previous_status"] == "Pending"
        assert run["updated_at"] == LATER
    finally:
        connection.close()


def test_update_run_state_keeps_saved_values_when_passed_none(tmp_path):
    _, connection = make_connection(tmp_path)
    new_pickle = pickle.dumps({"session": "after scoring"})

    try:
        # insert_run saved a generation estimate and a pickle, but no score estimate
        insert_run(connection)

        # A scoring job: new score estimate and pickle, no generation estimate
        update_run_state(
            connection,
            run_id="run-1",
            generation_estimate=None,
            score_estimate={"cost": 0.5},
            session_pickle=new_pickle,
            cost_so_far=0.25,
            elapsed_seconds=12.0,
            updated_at=LATER,
        )

        run = get_run(connection, "run-1")

        assert json.loads(run["generation_estimate_json"]) == {"cost": 0.01, "seconds": 10}
        assert json.loads(run["score_estimate_json"]) == {"cost": 0.5}
        assert run["session_pickle"] == new_pickle
        assert run["cost_so_far"] == 0.25
        assert run["elapsed_seconds"] == 12.0
        assert run["updated_at"] == LATER

        # A later save that only reports cost: nothing already saved may be erased
        update_run_state(
            connection,
            run_id="run-1",
            generation_estimate=None,
            score_estimate=None,
            session_pickle=None,
            cost_so_far=None,
            elapsed_seconds=None,
            updated_at=LATER,
        )

        run = get_run(connection, "run-1")

        assert json.loads(run["score_estimate_json"]) == {"cost": 0.5}
        assert run["session_pickle"] == new_pickle
        assert run["cost_so_far"] == 0.25
        assert run["elapsed_seconds"] == 12.0
    finally:
        connection.close()


def test_every_status_and_format_in_the_code_is_accepted_by_the_schema(tmp_path):
    # The words in db.py and the words in the CHECK rules must stay the same list
    _, connection = make_connection(tmp_path)

    try:
        insert_dataset(connection)

        for status in RUN_STATUS:
            add_run(connection, run_id=f"run-{status}", status=status)

        for status in JOB_STATUS:
            create_job(
                connection,
                job_id=f"job-{status}",
                run_id="run-Draft",
                status=status,
                step=None,
                done=0,
                total=0,
                error=None,
                created_at=TIMESTAMP,
                updated_at=TIMESTAMP,
            )

        for data_format in DATASET_FORMAT:
            create_dataset(
                connection,
                dataset_id=f"dataset-{data_format}",
                project_id="project-1",
                name="file",
                format=data_format,
                file_blob=b"",
                columns=[],
                text_columns=[],
                row_count=0,
                sample_rows=[],
                id_column=None,
                created_at=TIMESTAMP,
            )

        # The format is saved as given, not defaulted to the first one
        assert get_dataset(connection, "dataset-JSON")["format"] == "JSON"

        # A word from the old design is refused, and so is a format we don't read
        with pytest.raises(sqlite3.IntegrityError):
            add_run(connection, run_id="run-old", status="awaiting_approval")
        with pytest.raises(sqlite3.IntegrityError):
            create_dataset(
                connection,
                dataset_id="dataset-zip",
                project_id="project-1",
                name="file",
                format="ZIP",
                file_blob=b"",
                columns=[],
                text_columns=[],
                row_count=0,
                sample_rows=[],
                id_column=None,
                created_at=TIMESTAMP,
            )
    finally:
        connection.close()


def test_settings_table_holds_only_one_row(tmp_path):
    _, connection = make_connection(tmp_path)

    try:
        connection.execute(
            "INSERT INTO settings (id, provider, model) VALUES (1, 'openai', 'default')"
        )

        # The key defaults to empty, and a second row is refused
        assert connection.execute("SELECT api_key FROM settings").fetchone()[0] == ""
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO settings (id, provider, model) VALUES (2, 'openai', 'gpt-4o')"
            )
    finally:
        connection.close()


def test_get_settings_returns_none_until_something_is_saved(tmp_path):
    _, connection = make_connection(tmp_path)

    try:
        assert get_settings(connection) is None

        # Insert by hand, so this test does not depend on save_settings
        connection.execute(
            "INSERT INTO settings (id, provider, model, api_key) VALUES (1, 'openai', 'gpt-4o', 'sk-test')"
        )

        settings = get_settings(connection)

        assert settings["provider"] == "openai"
        assert settings["model"] == "gpt-4o"
        assert settings["api_key"] == "sk-test"
    finally:
        connection.close()


def test_save_settings_replaces_the_saved_row_instead_of_adding_one(tmp_path):
    _, connection = make_connection(tmp_path)

    try:
        save_settings(connection, provider="openai", model="default", api_key="sk-first")
        save_settings(connection, provider="openai", model="gpt-4o", api_key="sk-second")

        rows = connection.execute("SELECT * FROM settings").fetchall()

        assert len(rows) == 1
        assert rows[0]["model"] == "gpt-4o"
        assert rows[0]["api_key"] == "sk-second"
    finally:
        connection.close()
