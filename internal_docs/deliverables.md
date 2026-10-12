# LLooM: Deliverables for the Next 3 Months

## 1. Summary

We inherited LLooM as-is. We're committing to an **MVP of three deliverables plus a set of critical bug fixes**. Two stretch deliverables follow if we have time.

| # | Deliverable | Tier | Skills | Effort | Share of 12 weeks |
|---|---|---|---|---|---|
| D1 | Web app: React frontend + FastAPI backend | MVP | SWE, AI eng | L | ~30–35% |
| D2 | Tests, input/output validation and safeguards | MVP | SWE, AI eng | M | ~20% |
| D3 | Cut LLM calls and cost | MVP | AI eng, SWE | M | ~15% |
| C | Critical bug fixes (MVP extension) | MVP | SWE, AI eng | S | ~5% |
| D4 | Typed LLM calls (enums + schemas) + minor bug fixes | Stretch 1 | SWE, AI eng | M | ~10% |
| D5 | Classical-model scoring (ML cascade) | Stretch 2 | ML eng, AI eng | L | ~15–20% |

**Scope:**
- The web app is a local prototype: no deployment, hosting or auth.
- All work goes into this repo.

**Assumptions:**
- 6 people for 12 weeks.
- OpenAI stays the LLM provider.

---

## 2. How LLooM works today

LLooM is a Python library that runs only inside Jupyter. You give it a table of text documents, and it uses LLMs to find "concepts" (themes) and then score every document against every concept.

| Step | What it does | LLM calls |
|---|---|---|
| Distill | Extract quotes, then summarize each doc into bullets | 1–2 per doc (the quote step is skipped when the suggested quote count is 1, i.e. short docs) |
| Cluster | Embed bullets and group them | few (embeddings) |
| Synthesize + Review | Turn clusters into named concepts, remove or merge weak ones | a handful |
| **Score** | Ask the LLM whether each doc matches each concept | **1 per (doc × concept)** |

Scoring is where the cost is: 100 docs with 8 concepts is about 200 calls to generate concepts and **about 800 calls to score them** (`lloom.score()` defaults to `batch_size=1`; `score_concepts` defaults to 5).

Key code:
- `text_lloom/src/text_lloom/workbench.py`: the `lloom` session class (the public API).
- `concept_induction.py`: the pipeline steps.
- `llm.py` / `llm_openai.py`: LLM calls.
- `src/components/*.svelte`: the current in-notebook visualizations.

Current gaps:
- No tests.
- No UI outside Jupyter.
- Failed LLM calls fail silently (in scoring, distill and synthesize; `json_load` also swallows parse errors).
- The package can't be imported without `npm run build` (`__init__.py` reads the built JS at import) and always loads `ipywidgets`/anywidget.
- No labeled data in the repo for quality checks.

---

## 3. MVP

### D1. Web app: React frontend + FastAPI backend
**Goal:** run the whole LLooM workflow in a browser, locally, without a notebook.

**Scope:**
- **Backend (FastAPI):**
  - Endpoints to upload a CSV, pick columns, see a cost estimate, approve, generate concepts, select/edit concepts, score, and view/export results.
  - Long steps run as background jobs with progress reporting.
  - Sessions are stored in SQLite.
  - The API key comes from a local `.env`.
- **Refactor `lloom`** so it runs outside Jupyter:
  - replace the blocking `input()` prompts with an approval step (the cost estimators currently only print; make them return values);
  - make the notebook-only code optional: the widget imports in `__init__.py` / `concept_induction.py`, `yaspin` spinners, `display()`, and the state read from `select_widget` (`__get_active_concepts`, `__set_all_concepts_active`, `add`);
  - split `visualize()` so it returns the JSON data without building a `MatrixWidget`;
  - add a progress callback (progress is currently tqdm/spinners only);
  - run the pipeline in a worker thread/process: embeddings use the synchronous OpenAI client and UMAP/HDBSCAN are CPU-bound, so they would block the FastAPI event loop.
- **Frontend (React + Vite):**
  - screens for upload, configuration, progress, concept selection/editing, results and export;
  - the existing concept matrix (a Svelte 4 component using D3) mounted from a React wrapper. It only reads six keys via `model.get`, so a plain object can stand in for the anywidget model. `MatrixInner.svelte` imports D3 from an esm.sh URL; switch it to the npm `d3` import already noted in a comment there and add `d3` to `package.json`.
- The notebook API keeps working.

**Done when:**
- All 4 sample datasets run end to end through the UI.
- An end-to-end API test and a UI smoke test pass.
- The notebook workflow is unchanged.

**Depends on:** D2 (tests and validation) and the critical fixes C1–C6, because the web app runs non-interactively and needs visible errors.

### D2. Tests, input/output validation and safeguards
**Goal:** make sure LLooM works correctly and catches bad input or bad LLM output, instead of silently producing wrong results.

**Scope:**
- **Input validation** (before any LLM call):
  - The dataset: the text and ID columns exist, there are no empty texts or duplicate IDs, and ID types are consistent.
  - Run settings: parameters such as quote/bullet counts are sensible, and custom prompts contain the required placeholders.
  - User-added concepts: the name and criteria are non-empty.
  - Document length: warn when a document is too long for the model and would be silently truncated. Truncation (`truncate_tokens_fn`) cuts the *end* of the prompt, which in the score prompt is the task and output format, so this matters most when scoring in batches.
- **Output validation** (on every LLM reply):
  - The reply has the expected fields and shape.
  - Score answers are one of A–E.
  - Returned document IDs exist in the input.
  - Every document gets a score for every concept.
  - Extracted quotes and highlights actually appear in the document (use fuzzy matching; the LLM often paraphrases or changes whitespace).
  - Concept names to merge or remove refer to real concepts.
  - An invalid reply is retried, then clearly flagged as failed, never silently scored 0.
- **Run-level safeguards:**
  - Warn or stop when the failure rate for a step is too high.
  - Flag concepts that match almost no documents or almost all of them.
  - Show the estimated cost before running.
- **Tests:**
  - Unit tests for each pipeline step and each validator, using a fake LLM.
  - End-to-end runs of all 4 sample datasets using recorded LLM replies.
  - Quality validation with the live LLM: scoring accuracy against a small hand-labeled set (none exists yet, so it has to be created), concept coverage (using the existing `auto_eval`, which also needs a hand-written list of reference concepts), and run-to-run stability.
  - Tests that import the package need `npm run build` first (or the widget imports made optional, see D1) and network access for the `nltk` download in `workbench.py`. Together these form the baseline that D3 and D5 are compared against.
- Enum typing (D4) extends this later by enforcing the same rules through types.

**Done when:**
- Every LLM step validates its inputs and outputs.
- No failure is silently turned into a result.
- Each pipeline step and validator has tests.
- All 4 datasets run end to end on recorded replies.
- A baseline quality report exists.

**Depends on:** nothing. **Start here;** everything else builds on it.

### D3. Cut LLM calls and cost
**Goal:** substantially fewer LLM calls without hurting result quality.

**Scope:**
- Cache LLM responses, so re-runs cost nothing. `model.fn` (`call_llm_fn`) is the single chokepoint, but a 0-call re-run also needs:
  - a fixed `random_state` for UMAP (clusters otherwise change between runs, so every downstream prompt misses the cache);
  - a seeded shuffle in `summarize_concept` (`sample(frac=1)`);
  - a cache for embeddings, which use a separate call path (`call_embed_fn`).
- Score several documents per call instead of one. Batching already exists (`score(batch_size=...)`, multi-doc parsing in `get_score_df`), so the work is choosing the default by measuring quality on the D2 benchmark. Call count drops much more than cost: document text and per-doc output tokens don't shrink, only the repeated prompt does.
- Merge the two per-document distill calls into one. This is a prompt redesign, and only applies to docs where the quote step runs.
- Skip duplicate documents.
- Fix the cost estimates shown before a run: the score estimate counts document tokens once instead of once per concept, assumes a flat 100 output tokens per doc per concept, and `MODEL_INFO` prices (e.g. gpt-4o at $5/$15 per 1M tokens) look out of date, so check them.

**Done when:**
- ≥50% fewer scoring calls with ≤2 points of quality drop on the benchmark.
- A cached re-run makes 0 API calls.
- Cost estimates are within ±20% of actual cost.

**Depends on:** D2.

### MVP extension: critical bug fixes (C1–C6)
These bugs silently produce wrong results or crash a run, and the web app would hit them. Each fix ships with a regression test.

| ID | Bug | Impact | Location |
|---|---|---|---|
| C1 | Failed or unparseable LLM responses are scored 0 (distill and synthesize also silently drop failed docs/clusters) | Failures look like "no match", so results are silently wrong | `concept_induction.py`: `NAN_SCORE`, `get_score_df`, `get_empty_score_df`, `json_load` |
| C2 | Scoring fires all of a concept's requests at once (concepts are only staggered from each other), with no retries | Rate-limit errors on larger datasets, then silent 0s (C1) | `llm.py`: `multi_query_gpt_wrapper`, `multi_query_gpt` |
| C3 | The answer "Strongly agree" is read as "S" and scored 0; so are lowercase letters. Other label words are misread ("Agree" scores as A, "Disagree" as D) | True matches are lost or mis-scored | `concept_induction.py`: `parse_bucketed_score` |
| C4 | Scores are dropped when the LLM returns a doc ID in a different format | Silently filled with 0 | `concept_induction.py`: `get_score_df` |
| C5 | Concept review only runs when `debug=True` | The web app (non-interactive) would skip review and produce lower-quality concepts | `workbench.py`: `gen` |
| C6 | Concept review crashes if the LLM reply can't be parsed (`json_load` returns `None`) | The whole generation run is lost | `concept_induction.py`: `review_remove`, `review_merge`, `review_select` |

---

## 4. Stretch goals

### D4. Typed LLM calls (enums + schemas) + minor bug fixes
**Goal:** give every LLM call a typed contract, and fix the lower-risk bugs.

**Scope:**
- **Typed LLM inputs and outputs (enums + schemas).** Today every prompt is a free-form string and every reply is parsed by hand from loose JSON/YAML, so bad replies silently turn into wrong results (see C1, C3, C6). Replace this with:
  - **Enums for fixed values:**
    - `ScoreAnswer` (A–E), replacing the string parsing in `parse_bucketed_score`.
    - `Step` (distill_filter, distill_summarize, synthesize, review_remove, review_merge, review_select, score, summarize_concept), replacing the string keys used in `show_prompt` / `validate_prompt`.
  - **Typed input models for each prompt**, so a missing or wrong-typed prompt field (e.g. `n_quotes`, `seeding_phrase`) raises a clear error before any API call. Today a missing `.format()` field raises `KeyError` inside the `try` in `multi_query_gpt`, which prints it and returns `None`, so it fails silently.
  - **Typed output models for each prompt** (e.g. score results with `answer: ScoreAnswer`, synthesized concepts with name / prompt / example IDs), sent to OpenAI as structured outputs so the model can only reply in the allowed shape and values. A reply that still fails validation is retried, then marked failed, never scored as 0.
  - Strict structured outputs work with the default models (`gpt-4o`, `gpt-4o-mini`) but not with `gpt-3.5-turbo`, `gpt-4` or `gpt-4-turbo`, which are also in `MODEL_INFO`. Either keep a fallback parse path for them or drop them.
  - `example_id` can only be typed as a string unless a per-batch enum schema is built, so keep the "returned IDs exist in the input" check from D2.
- Per-call logging of tokens, latency, retries and failures, fed into the benchmark.
- Fix these bugs (each with a regression test):

| ID | Bug | Impact | Location |
|---|---|---|---|
| S1 | Concepts are matched to the wrong clusters when a synthesis batch size is set | Only affects a non-default option | `concept_induction.py`: `synthesize` |
| S2 | The duplicate check when merging concepts does nothing | Occasional duplicate merges | `concept_induction.py`: `review_merge` |
| S3 | Skipping the summarize step via custom prompts crashes | Edge case, advanced usage only | `workbench.py`: `gen` |
| S4 | `refine`, `edit_concept`, `check_concept_seed` are broken (they treat `Concept` objects as dicts or pass a model name string) | Unused code (no callers); fix or delete | `concept_induction.py` |
| S5 | `estimate_score_cost` calls `len(df_to_score)` before the `None` check; `estimate_gen_cost` uses `bullets_tokens_per_doc` that may be undefined | Crash when called directly / with a model without cost info | `workbench.py` |

**Done when:**
- Every LLM call site uses typed input and output models, with no hand-parsed replies left.
- LLM failure rate is <1% on the benchmark.
- S1–S5 are closed with tests.

**Depends on:** D2, C1–C6.

### D5. Classical-model scoring (ML cascade)
**Goal:** replace most scoring LLM calls with a cheap classifier where it's accurate enough.

Scoring is the only LLM step that is really a classification task: does this doc match this concept, yes or no. Concepts are created at runtime, so there's no pre-labeled data. Instead, for each concept:
1. LLM-score a sample of documents.
2. Train a logistic regression (baselines: random forest, kNN) on document embeddings. `scikit-learn` is already installed via `umap-learn`. The pipeline currently embeds bullets and discards the embeddings, so documents need their own (cheap) embedding pass.
3. Let the classifier label the documents it's confident about, and send the rest to the LLM. Scores count as a match only at "A" (threshold 1.0), and the `rationale`/`highlight` columns feed concept summaries and the UI, so the safest design is to skip only confident negatives and send every predicted positive to the LLM.
4. Fall back to full LLM scoring when a concept has too few matches to learn from.

It ships as an opt-in scoring mode; the default behaviour is unchanged.

**Done when:** ≥40% fewer scoring calls at F1 ≥ 0.85 against full-LLM scoring, on concepts that match ≥5% of docs. This target is provisional until a week-1 feasibility test confirms it.

**Risks:**
- The sample datasets are small (100–210 docs): a concept at 5% prevalence has only 5–10 matches, so a 30–50 doc labeled sample holds just 2–3 positives, and that sample already uses a third to a half of the calls. The target is unlikely to hold unless the sample counts toward the final results or a larger dataset is used.
- Rare or nuanced concepts may be hard for a classifier.

**Depends on:** D2, D3 (cache).

---

## 5. Timeline (12 weeks)

| Weeks | Work |
|---|---|
| 1–3 | **D2**. In parallel: **C1–C6**, D1 API design, and a 1-day D5 feasibility test. |
| 3–9 | **D1**: backend (weeks 3–6), then the React app (weeks 5–9). |
| 4–7 | **D3**, in parallel with D1. Cache first. |
| 8–9 | **MVP checkpoint**: demo the web app and review the before/after benchmark. Decide on stretch goals. |
| 9–11 | **D4**, then **D5** if the feasibility test was promising. |
| 12 | Final benchmark, demo, buffer. |

---

## 6. Open questions

1. Single-user prototype, or does it need multiple concurrent sessions?
2. What API budget do we have for benchmark runs?
3. Is there time to hand-label about 200–300 examples to validate D5?
4. Is a larger dataset (1k+ docs) available for benchmarking?
5. `lloom.submit()` sends the full dataset and an email address to an external server. Should we remove it?
