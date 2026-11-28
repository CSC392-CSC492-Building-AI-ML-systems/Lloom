import io
import json
import sqlite3
from typing import Any
from uuid import uuid4

import pandas as pd
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from text_lloom.workbench import lloom

from app.db import (
    create_run,
    get_dataset,
    get_latest_job,
    get_project,
    get_run,
    list_runs_for_project,
    transaction,
    update_run_draft,
)
from app.jobs import job_response, now

router = APIRouter(tags=["runs"])

# The synthesis rounds the frontend offers
SYNTHESIS_ROUNDS = (1, 2, 3)

# Largest whole number JavaScript's Number.isSafeInteger accepts
MAX_SAFE_INTEGER = 2**53 - 1


# The frontend's RunConfiguration, plus an optional run name.
# targetConcepts comes from a text field, so it may be a string ("8").
class RunRequest(BaseModel):
    datasetId: str
    textColumn: str
    documentIdColumn: str
    targetConcepts: str | int
    seedPhrase: str
    synthesisRounds: int
    automaticReview: bool
    name: str | None = None


# targetConcepts as a positive whole number, or None if it isn't one
def target_concepts(value: str | int) -> int | None:
    try:
        number = float(str(value).strip())
    except ValueError:
        return None
    if not number.is_integer() or not 1 <= number <= MAX_SAFE_INTEGER:
        return None
    return int(number)


# Same rules and messages as validateConfiguration in the frontend's run-configuration.ts
def validate_configuration(config: RunRequest, dataset: sqlite3.Row | None) -> dict[str, str]:
    errors = {}
    columns = json.loads(dataset["columns_json"]) if dataset else []
    text_columns = json.loads(dataset["text_columns_json"]) if dataset else []

    if dataset is None:
        errors["datasetId"] = "Select a dataset."
    if config.textColumn not in text_columns:
        errors["textColumn"] = "Select a text column from this dataset."
    if config.documentIdColumn and config.documentIdColumn not in columns:
        errors["documentIdColumn"] = "Select an ID column from this dataset."
    if target_concepts(config.targetConcepts) is None:
        errors["targetConcepts"] = "Enter a positive whole number."
    if config.synthesisRounds not in SYNTHESIS_ROUNDS:
        errors["synthesisRounds"] = "Select an available number of rounds."
    return errors


# The dataset, or None if it doesn't exist or belongs to another project
def project_dataset(connection, project_id: str, dataset_id: str) -> sqlite3.Row | None:
    dataset = get_dataset(connection, dataset_id)
    if dataset is None or dataset["project_id"] != project_id:
        return None
    return dataset


# Reads the stored file back into the table B3 parsed at upload
def read_dataset(dataset: sqlite3.Row) -> pd.DataFrame:
    if dataset["format"] == "CSV":
        return pd.read_csv(io.BytesIO(dataset["file_blob"]))
    return pd.read_json(io.BytesIO(dataset["file_blob"]))


# Doc IDs are always strings (decision 7). With no ID column, lloom_id ("0", "1", ...) is added.
def prepare_df(df: pd.DataFrame, id_col: str) -> tuple[pd.DataFrame, str]:
    if not id_col:
        id_col = "lloom_id"
        df[id_col] = range(len(df))
    df[id_col] = df[id_col].astype(str)
    return df, id_col


# The gen() arguments that come from the configuration. B7 calls this on the stored config.
def params_for_run(config: dict[str, Any]) -> dict[str, Any]:
    return {
        "seed": config["seedPhrase"] or None,
        "n_synth": config["synthesisRounds"],
        "auto_review": config["automaticReview"],
    }


# Builds the session and estimates the whole run: generate, then score every concept (B7).
# Returns the columns a draft stores.
def build_draft(config: RunRequest, dataset: sqlite3.Row, models: dict) -> dict[str, Any]:
    n_concepts = target_concepts(config.targetConcepts)
    df, id_col = prepare_df(read_dataset(dataset), config.documentIdColumn)
    session = lloom(df=df, text_col=config.textColumn, id_col=id_col, **models)
    params = session.auto_suggest_parameters(target_n_concepts=n_concepts)
    return {
        "config": config.model_dump(exclude={"name"}),
        "params": params,
        "generation_estimate": session.estimate_gen_cost(params),
        # B7 scores with score()'s default batch_size=1
        "score_estimate": session.estimate_score_cost(n_concepts=n_concepts, batch_size=1),
        "session_pickle": session.get_pkl_str(),
    }


# The frontend's RunCosts, in US dollars. Both are None without a priced estimate:
# a model with no price records a cost of 0. actualCost is written by B7.
def run_costs(run: sqlite3.Row) -> dict[str, float | None]:
    generation = json.loads(run["generation_estimate_json"] or "null")
    score = json.loads(run["score_estimate_json"] or "null")
    if not (generation and score and generation["available"] and score["available"]):
        return {"estimatedCost": None, "actualCost": None}
    return {
        "estimatedCost": generation["total"] + score["total"],
        "actualCost": run["cost_so_far"] if run["status"] == "Completed" else None,
    }


# The run shape the frontend reads (POST, PATCH and GET all return it)
def run_response(connection, run: sqlite3.Row) -> dict[str, Any]:
    config = json.loads(run["config_json"])
    job = get_latest_job(connection, run["id"])
    return {
        "id": run["id"],
        "name": run["name"],
        "projectId": run["project_id"],
        "datasetId": run["dataset_id"],
        "created": run["created_at"],
        "status": run["status"],
        "configuration": config,
        **run_costs(run),
        # Recorded by B7 when the run starts
        "model": config.get("model"),
        "latestJob": job_response(job) if job else None,
    }


@router.post("/projects/{project_id}/runs", status_code=status.HTTP_201_CREATED)
def create_draft_run(project_id: str, body: RunRequest, request: Request):
    with transaction(request.app.state.db_path) as connection:
        if get_project(connection, project_id) is None:
            raise HTTPException(404, "Project not found.")

        dataset = project_dataset(connection, project_id, body.datasetId)
        errors = validate_configuration(body, dataset)
        if errors:
            raise HTTPException(422, errors)

        draft = build_draft(body, dataset, request.app.state.get_models())
        n = len(list_runs_for_project(connection, project_id)) + 1
        run_id = uuid4().hex
        time = now()
        create_run(
            connection,
            run_id=run_id,
            project_id=project_id,
            dataset_id=dataset["id"],
            name=body.name or f"Run {n} — {dataset['name']}",
            status="Draft",
            created_at=time,
            updated_at=time,
            **draft,
        )
        run = run_response(connection, get_run(connection, run_id))
    return run


@router.patch("/runs/{run_id}")
def update_draft_run(run_id: str, body: RunRequest, request: Request):
    with transaction(request.app.state.db_path) as connection:
        run = get_run(connection, run_id)
        if run is None:
            raise HTTPException(404, "Run not found.")
        if run["status"] != "Draft":
            raise HTTPException(409, "Only a Draft run can be edited.")

        dataset = project_dataset(connection, run["project_id"], body.datasetId)
        errors = validate_configuration(body, dataset)
        if errors:
            raise HTTPException(422, errors)

        draft = build_draft(body, dataset, request.app.state.get_models())
        update_run_draft(
            connection,
            run_id=run_id,
            dataset_id=dataset["id"],
            name=body.name or run["name"],
            updated_at=now(),
            **draft,
        )
        run = run_response(connection, get_run(connection, run_id))
    return run


@router.get("/runs/{run_id}")
def read_run(run_id: str, request: Request):
    with transaction(request.app.state.db_path) as connection:
        run = get_run(connection, run_id)
        if run is None:
            raise HTTPException(404, "Run not found.")
        response = run_response(connection, run)
    return response
