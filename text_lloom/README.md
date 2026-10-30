Directory for the LLooM python package

## Setup

First, build the frontend assets from the repository root:

```bash
npm install
npm run build
```

Navigate to the `text_lloom` directory:

```bash
cd text_lloom
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment:

**Windows:**

```bash
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install LLooM and its dependencies in editable mode:

```bash
pip install -e .
```

Changes made to the source code in `src/text_lloom/` will be reflected without needing to reinstall the package.

To deactivate the virtual environment:

```bash
deactivate
```

## Configure the LLM provider

LLooM reads its settings from environment variables. Copy `.env.example` (in the repository root) to `.env` and fill it in:

```bash
cp .env.example .env
```

`.env` is ignored by git. Load it before creating a `lloom` in a notebook or script (`setup_test.py` already does), and restart the kernel after changing it:

```python
from dotenv import load_dotenv
load_dotenv()
```

**OpenAI (default):** set `OPENAI_API_KEY`.

**Any OpenAI-compatible API (Gemini, Ollama, ...):** set `LLM_BASE_URL` to use that API instead. `OPENAI_API_KEY` is then not used, and a blank `LLM_BASE_URL` means OpenAI.

| Variable | Needed | Meaning |
|---|---|---|
| `LLM_BASE_URL` | to use another provider | URL of the API, ex: `http://localhost:11434/v1/` |
| `LLM_API_KEY` | with `LLM_BASE_URL` | Key for that API (Ollama accepts any text) |
| `LLM_MODEL` | with `LLM_BASE_URL` | Chat model, used to distill, synthesize and score |
| `LLM_EMBED_MODEL` | with `LLM_BASE_URL` | Embedding model, used to cluster |
| `LLM_CONTEXT_WINDOW` | for unknown models | Context window in tokens, ex: `8192` |
| `LLM_COST` | for unknown models | Chat cost per token, `input_cost,output_cost`, ex: `0,0` |
| `LLM_EMBED_COST` | for unknown models | Embedding cost per token, same format |
| `LLM_RATE_LIMIT` | for unknown models | `n_requests,wait_time_secs`, ex: `1000,0` |

LLooM never guesses values for models it does not know (anything outside the OpenAI models in `llm_openai.py`), so the last four are required for them. Without `LLM_COST`, for example, you get `Model <name> not in our defaults. Please specify the 'cost' parameter`; if the model named in that message is your embedding model, set `LLM_EMBED_COST`.

To run locally with [Ollama](https://ollama.com), pull a chat and an embedding model (`ollama pull llama3.1:8b`, `ollama pull nomic-embed-text`) and use the Ollama example in `.env.example`. Set the `OLLAMA_CONTEXT_LENGTH` environment variable to the same value as `LLM_CONTEXT_WINDOW`, because Ollama cuts off longer prompts silently.