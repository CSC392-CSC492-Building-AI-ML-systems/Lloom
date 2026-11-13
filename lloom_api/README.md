# lloom_api

FastAPI backend for the LLooM web app (`lloom_web/`).

## Install

From the repo root, with your virtualenv active:

```bash
pip install -e ./text_lloom -e "./lloom_api[dev]"
```

## Run

```bash
cd lloom_api
uvicorn app.main:app --reload
```

Then open http://127.0.0.1:8000/health and http://127.0.0.1:8000/docs.

## Test

From the repo root:

```bash
python -m pytest lloom_api/tests
```

## Configuration

- `LLOOM_DB_PATH` (optional): where the SQLite database is stored. Defaults to `lloom_api/lloom.db`.
