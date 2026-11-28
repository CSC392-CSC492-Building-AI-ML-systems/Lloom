from __future__ import annotations
import io
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Any
from uuid import uuid4
import pandas as pd
from fastapi import (
    APIRouter,
    File, 
    Form, 
    HTTPException, 
    Request,
    UploadFile, 
    status
)

from app.db import (
    create_dataset,
    create_project,
    get_project,
    list_datasets_for_project,
    list_projects,
    list_runs_for_project,
    transaction,
    update_project_last_opened,
)
from app.runs import run_costs



# Creates a collection of routes, where every route you add,
# gets projects prefix and is placed under the projects heading in the API docs
router = APIRouter(prefix="/projects", tags=["projects"])

# returns current time as a string
def time_now() -> str:
    return datetime.now(timezone.utc).isoformat()


# checks uploaded files usability, then takes the file and returns a tuple.
# Tuple in the format of (file type label, the raw bytes, the parsed table).
async def parse_dataset(upload: UploadFile) -> tuple[str, bytes, pd.DataFrame]:
    # uploaded file into memory as bytes
    content = await upload.read()

    # file empty case
    if not content.strip():
        raise HTTPException(422,f"{upload.filename}:empty file.")

    # Gets name and make sure all cases are accounted for.
    ext = Path(upload.filename or "").suffix.lower()

    # rejecting unsupported zip file
    if ext == ".zip":
        raise HTTPException(415, f"{upload.filename}: ZIP file not supported.")

    try:
        # Each file type case

        if ext == ".csv":
            dframe = pd.read_csv(io.BytesIO(content))
            file_type = "CSV"

        # Json must be a list, and every item in it must be a dict
        elif ext == ".json":
            records = json.loads(content.decode("utf-8"))

            if not isinstance(records, list) or not all(
                isinstance(record, dict) for record in records
            ):
                raise ValueError("JSON needs to be a list of records.")

            # Turns Json back into a string , wraps it in memory as a txt file
            # and gets panadas to read it into a Dataframe 
            dframe = pd.read_json(io.StringIO(json.dumps(records)))
            file_type = "JSON"

        else:
            # any other extension, case is accounted for 
            raise HTTPException(
                415,
                f"{upload.filename}: upload a CSV, JSON, or ZIP file.",
            )

    #If any of the fail exception cases have been raised.
    except HTTPException:
        raise 
    except (UnicodeDecodeError, ValueError, pd.errors.EmptyDataError, pd.errors.ParserError) as error:
        raise HTTPException(422, f"{upload.filename}: malformed file.") from error

    # The no rows error case
    if dframe.empty:
        raise HTTPException(422,f"{upload.filename}:No rows found in file.")

    return file_type,content,dframe


# Converts the Dataset into a Dict that will summarize it  

def dataset_metadata(dframe: pd.DataFrame) -> dict[str, Any]:
    #creates a list of every column name, converted as a string
    columns = [str(column) for column in dframe.columns]

    # Keeping only the column names that panadas except
    text_columns = [
        str(column)
        for column in dframe.columns
        if pd.api.types.is_string_dtype(dframe[column].dtype)
    ]

    #No column passes, exception is raised
    if not text_columns:
        raise HTTPException(422, "Dataset must have at least one text column.")

    # Builds a list of example rows.
    # Each row is a dict mapping column names
    sample_rows = [
        {str(column): str(value) for column, value in row.items()}

        # Turns the first three rows of the table, turning each into a dict.
        for row in dframe.head(3).to_dict(orient="records")
    ]

    # This is the column summary, camelCase keys to be acceptable for the frontend
    return {"columns": columns,"textColumns": text_columns,"rowCount": len(dframe),"sampleRows": sample_rows, }


# Converting the dataset row from the database into client directory 
def serialize_dataset(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "format": row["format"],
        "columns": json.loads(row["columns_json"]),
        "textColumns": json.loads(row["text_columns_json"]),
        "rowCount": row["row_count"],
        "sampleRows": json.loads(row["sample_rows_json"]),
    }

# Converting the run row from the database into client directory 
def serialize_run(row: sqlite3.Row) -> dict[str, Any]:
    run_response: dict[str, Any] = {
        "id": row["id"],
        "name": row["name"],
        "datasetId": row["dataset_id"],
        "created": row["created_at"],
        "status": row["status"],
        **run_costs(row),
    }
    if row["status"] == "Draft":
        run_response["configuration"] = json.loads(row["config_json"])

    elif row["status"] in {"Pending", "Running", "Failed", "Cancelled"}:
        run_response["temporary"] = True

    elif row["status"] == "Completed":
        #Completed runs therefore currently have zero active
        # concepts; later milestones can replace this with their database count.
        run_response["concepts"] = 0

    return run_response


# Registering the function below as a handler for POST/projects.
# if it succeds , user status will be 201, which means created
@router.post("", status_code=status.HTTP_201_CREATED)

# Handler function that creates a project with its uploaded datasets.
async def create_project_with_datasets(

    request: Request,
    name: Annotated[str, Form()],

    #Optional text field description, can be used to add proj description.
    description: Annotated[str, Form()] = "",
    # Optional list of uploaded files
    files: Annotated[list[UploadFile] | None, File()] = None,
):
    if not name.strip():
        raise HTTPException(422, "Project name is required.")

    if not files:
        raise HTTPException(422, "Upload at least one dataset file.")

    #Empty list that holds all parsed files
    parsed_files = []

    for upload in files:
        # Unpacking returned file values
        file_format, contents, dataframe = await parse_dataset(upload)

        #adds a dict for this file into parsed_files
        parsed_files.append(
            {
                "filename": upload.filename or "dataset",
                "format": file_format,
                "contents": contents,
                "metadata": dataset_metadata(dataframe),
            }
        )


    # Logs the timestamp, used to create everything for this request 
    created_at = time_now()
    # generates random id, for new proj as a string
    project_id = str(uuid4())

    # Opened after the files are parsed. One transaction: if any insert fails,
    # the whole project is rolled back
    with transaction(request.app.state.db_path) as connection:
        #Creating the project
        create_project(
            connection,
            project_id=project_id,
            name=name.strip(),
            description=description.strip(),
            created_at=created_at,
            last_opened_at=created_at,
        )

        # holds clients dataset info
        datasets = []

        #each parsed file is parsed to save it 
        for parsed_file in parsed_files:
            dataset_id = str(uuid4())
            #shortcut variable
            metadata = parsed_file["metadata"]

            #Saving one dataset row in database , linked to proj with project_id
            create_dataset(
                connection,
                dataset_id=dataset_id,
                project_id=project_id,
                name=parsed_file["filename"],
                format=parsed_file["format"],
                file_blob=parsed_file["contents"],
                columns=metadata["columns"],
                text_columns=metadata["textColumns"],
                row_count=metadata["rowCount"],
                sample_rows=metadata["sampleRows"],
                id_column=None,
                created_at=created_at,
            )

            # adds dataset info into response list 
            datasets.append(
                {
                    "id": dataset_id,
                    "name": parsed_file["filename"],
                    "format": parsed_file["format"],
                    **metadata,
                }
            )

    # sends back new proj, has empty list of runs, to be populated later
    return {
        "id": project_id,
        "name": name.strip(),
        "description": description.strip(),
        "created": created_at,
        "lastOpened": created_at,
        "datasets": datasets,
        "runs": [],
    }


# Registers below func as a handler for GET /project
@router.get("")

# Get project handler
def get_projects(request: Request):
    with transaction(request.app.state.db_path) as connection:
        rows = list_projects(connection)

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "created": row["created_at"],
            "lastOpened": row["last_opened_at"],
        }
        for row in rows
    ]



# Registers the handler for GET /projects/{project_id}. 
# The part in braces is the URL.
@router.get("/{project_id}")

# Handler that returns one proj, proj id comes from URl
def get_project_by_id(
    project_id: str,
    request: Request,
):  
    with transaction(request.app.state.db_path) as connection:
        # searching for proj via proj id 
        project = get_project(connection, project_id)

        # No proj found case
        if project is None:
            raise HTTPException(404, "Project not found.")

        #take current time to use as last opened 
        last_opened = time_now()
        update_project_last_opened(
            connection,
            project_id=project_id,
            last_opened_at=last_opened,
        )

        # gets all dataset of this proj
        datasets = list_datasets_for_project(connection, project_id)
        # gets all run rows of this proj 
        runs = list_runs_for_project(connection, project_id)

    return {
        "id": project["id"],
        "name": project["name"],
        "description": project["description"],
        "created": project["created_at"],
        "lastOpened": last_opened,
        "datasets": [serialize_dataset(dataset) for dataset in datasets],
        "runs": [serialize_run(run) for run in runs],
    }
