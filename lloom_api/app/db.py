import json
import sqlite3
from collections.abc import Generator
from typing import Any
from fastapi import Request

# Possible Run Statuses
RUN_STATUS = ("Draft", "Pending", "Running", "Completed", "Failed", "Cancelled")

# Possible Job Statuses
JOB_STATUS = ("Pending", "Running", "Completed", "Failed", "Cancelled")

#Functions that help us build database pipeline


#opening a new connection based of path, and choosing connection settings
def open_connection(path:str) -> sqlite3.Connection:
    """Open a SQLite connection for one request/worker operation.    
    """
    connection = sqlite3.connect(path,timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection





# this is intializing the SQLite Schema for LLOOM
# the Schema has been oranizied as (projects → datasets → runs → jobs)
def initialize_database(path: str) -> None:
    """Create the SQLite schema without changing existing data."""
    connection = open_connection(path)

    try:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                last_opened_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                format TEXT NOT NULL CHECK (format IN ('CSV', 'JSON')),
                file_blob BLOB NOT NULL,
                columns_json TEXT NOT NULL DEFAULT '[]',
                text_columns_json TEXT NOT NULL DEFAULT '[]',
                row_count INTEGER NOT NULL DEFAULT 0,
                sample_rows_json TEXT NOT NULL DEFAULT '[]',
                id_column TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            );

            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                name TEXT NOT NULL,
                config_json TEXT NOT NULL DEFAULT '{}',
                status TEXT NOT NULL CHECK (
                    status IN ('Draft', 'Pending', 'Running', 'Completed', 'Failed', 'Cancelled')
                ),
                params_json TEXT NOT NULL DEFAULT '{}',
                generation_estimate_json TEXT,
                score_estimate_json TEXT,
                cost_so_far REAL NOT NULL DEFAULT 0,
                elapsed_seconds REAL NOT NULL DEFAULT 0,
                session_pickle BLOB,
                previous_status TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (dataset_id) REFERENCES datasets(id)
            );

            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL CHECK (
                    status IN ('Pending', 'Running', 'Completed', 'Failed', 'Cancelled')
                ),
                step TEXT,
                done INTEGER NOT NULL DEFAULT 0,
                total INTEGER NOT NULL DEFAULT 0,
                error TEXT,
                cancel_requested INTEGER NOT NULL DEFAULT 0 CHECK (
                    cancel_requested IN (0, 1)
                ),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs(id)
            );

            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                api_key TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS projects_last_opened_at_idx
                ON projects(last_opened_at DESC);

            CREATE INDEX IF NOT EXISTS datasets_project_id_idx
                ON datasets(project_id);

            CREATE INDEX IF NOT EXISTS runs_project_id_idx
                ON runs(project_id);

            CREATE INDEX IF NOT EXISTS runs_dataset_id_idx
                ON runs(dataset_id);

            CREATE INDEX IF NOT EXISTS jobs_run_id_idx
                ON jobs(run_id);
            """
        )
        connection.commit()
    finally:
        connection.close()



#The fastapi dependency gnerator, gives each request its own database connections,
# also handling the cleanup 
def get_db(request: Request) -> Generator[sqlite3.Connection, None, None]:
    """
    Fast API runs this function, then route can recieve it with,
    connection: sqlite.Connection = Depends(get_db)
    """

    connection = open_connection(request.app.state.db_path)

    try:
        yield connection
        connection.commit()
    except Exception: #Checks if any exceptions ocurr, cleanup
        connection.rollback()()
        raise

    finally:
        connection.close()




#Adding info to the projects table, updating the database when commit() is called
def create_project(
    connection: sqlite3.Connection,
    *,# says the other parameters must be passed by the keywords
    project_id: str,
    name: str,
    description: str,
    created_at: str,
    last_opened_at: str,
) -> None:
    connection.execute(
        """
        INSERT INTO projects (
            id, name, description, created_at, last_opened_at
        )
        VALUES (?, ?, ?, ?, ?)
        """,
        (project_id, name, description, created_at, last_opened_at),
    )



# looks up a single project ID then returns it if it exists, None other wise
def get_project(connection: sqlite3.Connection, project_id: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT * FROM projects WHERE id = ?",
        (project_id,),).fetchone()  


def list_projects(connection: sqlite3.Connection) -> list[sqlite3.Row]:
    return connection.execute(
        "SELECT * FROM projects ORDER BY last_opened_at DESC"
    ).fetchall()

def update_project_last_opened(connection: sqlite3.Connection,*,
    project_id: str,
    last_opened_at: str,
) -> None:
    connection.execute(
        "UPDATE projects SET last_opened_at = ? WHERE id = ?",
        (last_opened_at, project_id),
    )



#Now the Dataset functions,


def create_dataset(
    connection: sqlite3.Connection,
    *,
    dataset_id: str,
    project_id: str,
    name: str,
    file_format: str,
    file_blob: bytes,
    columns: list[str],
    text_columns: list[str],
    row_count: int,
    sample_rows: list[dict[str, Any]],
    id_column: str | None,
    created_at: str,
) -> None:
    connection.execute(
        """
        INSERT INTO datasets (
            id,
            project_id,
            name,
            format,
            file_blob,
            columns_json,
            text_columns_json,
            row_count,
            sample_rows_json,
            id_column,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            dataset_id,
            project_id,
            name,
            file_format,
            file_blob,
            json.dumps(columns),
            json.dumps(text_columns),
            row_count,
            json.dumps(sample_rows),
            id_column,
            created_at,
        ),
    )


def get_dataset(connection: sqlite3.Connection, dataset_id: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT * FROM datasets WHERE id = ?",
        (dataset_id,),
    ).fetchone()



# Now the Run functions 


def create_run(
    connection: sqlite3.Connection,
    *,
    run_id: str,
    project_id: str,
    dataset_id: str,
    name: str,
    config: dict[str, Any],
    status: str,
    params: dict[str, Any],
    generation_estimate: dict[str, Any] | None,
    score_estimate: dict[str, Any] | None,
    session_pickle: bytes | None,
    created_at: str,
    updated_at: str,
) -> None:
    connection.execute(
        """
        INSERT INTO runs (
            id,
            project_id,
            dataset_id,
            name,
            config_json,
            status,
            params_json,
            generation_estimate_json,
            score_estimate_json,
            session_pickle,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            project_id,
            dataset_id,
            name,
            json.dumps(config),
            status,
            json.dumps(params),
            json.dumps(generation_estimate)
            if generation_estimate is not None
            else None,
            json.dumps(score_estimate) if score_estimate is not None else None,
            session_pickle,
            created_at,
            updated_at,
        ),
    )


def get_run(connection: sqlite3.Connection, run_id: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT * FROM runs WHERE id = ?",
        (run_id,),
    ).fetchone()


def update_run_status(
    connection: sqlite3.Connection,
    *,
    run_id: str,
    status: str,
    previous_status: str | None,
    updated_at: str,
) -> None:
    connection.execute(
        """
        UPDATE runs
        SET status = ?, previous_status = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, previous_status, updated_at, run_id),
    )


def update_run_state(
    connection: sqlite3.Connection,
    *,
    run_id: str,
    generation_estimate: dict[str, Any] | None,
    score_estimate: dict[str, Any] | None,
    session_pickle: bytes | None,
    cost_so_far: float,
    elapsed_seconds: float,
    updated_at: str,
) -> None:
    # COALESCE(?, column) keeps the saved value when we pass None,
    # so a score job can save its pickle without erasing the generation estimate
    connection.execute(
        """
        UPDATE runs
        SET generation_estimate_json = COALESCE(?, generation_estimate_json),
            score_estimate_json = COALESCE(?, score_estimate_json),
            session_pickle = COALESCE(?, session_pickle),
            cost_so_far = ?,
            elapsed_seconds = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            json.dumps(generation_estimate) if generation_estimate is not None else None,
            json.dumps(score_estimate) if score_estimate is not None else None,
            session_pickle,
            cost_so_far,
            elapsed_seconds,
            updated_at,
            run_id,
        ),
    )




#Functions for JOBs
def create_job(
    connection: sqlite3.Connection,
    *,
    job_id: str,
    run_id: str,
    status: str,
    step: str | None,
    done: int,
    total: int,
    error: str | None,
    cancel_requested: int = 0,
    created_at: str,
    updated_at: str,
) -> None:
    connection.execute(
        """
        INSERT INTO jobs (
            id,
            run_id,
            status,
            step,
            done,
            total,
            error,
            cancel_requested,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            job_id,
            run_id,
            status,
            step,
            done,
            total,
            error,
            cancel_requested,
            created_at,
            updated_at,
        ),
    )


def get_job(connection: sqlite3.Connection, job_id: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT * FROM jobs WHERE id = ?",
        (job_id,),
    ).fetchone()

def update_job_progress(
    connection: sqlite3.Connection,
    *,
    job_id: str,
    status: str,
    step: str | None,
    done: int,
    total: int,
    error: str | None,
    updated_at: str,
) -> None:
    connection.execute(
        """
        UPDATE jobs
        SET status = ?, step = ?, done = ?, total = ?, error = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, step, done, total, error, updated_at, job_id),
    )


def get_settings(connection: sqlite3.Connection) -> sqlite3.Row | None:
    return connection.execute("SELECT provider, model, api_key FROM settings WHERE id = 1").fetchone()

def save_settings(connection: sqlite3.Connection, *, provider: str, model: str, api_key: str,) -> None:
    connection.execute(
        """
        INSERT INTO settings (id, provider, model, api_key)
        VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            provider = excluded.provider,
            model = excluded.model,
            api_key = excluded.api_key
        """,
        (provider, model, api_key),
    )