# LLooM Web

Home, Create Project, and UUID project workspaces now use FastAPI. Run creation/execution, model settings, results, and Add Dataset remain unconnected.

Copy `.env.example` to `.env.local` in this directory. `LLOOM_API_BASE_URL` defaults to `http://localhost:8000`; restart Next.js after changing it. The example is versioned and local overrides are ignored. Start FastAPI separately using `../lloom_api/README.md`.

Creation sends multipart `name`, `description`, and repeated `files` fields through the narrow `POST /api/projects` Route Handler. It reuses the server-only client and a 60-second backend timeout; reads retain the 10-second default. No Server Actions, public backend URL, CORS changes, or automatic mutation retries are involved. No application upload-size cap is imposed; uploads are buffered, so this local prototype is not designed for large-file streaming. A lost response can follow a successful creation: check Recents before retrying an ambiguous failure.

The workspace retrieves persisted project and dataset metadata, columns, text columns, row counts, and sample rows. Only a backend 404 produces project-not-found; other failures offer reload/retry. API contracts and validation are independent of fixture types. Metadata and workspace share a request-scoped detail lookup. Recent/detail requests use `cache: "no-store"`. Home also refreshes on activation to update restored client navigations. Recent-row prefetch is disabled because detail retrieval updates `lastOpened`. There is no polling while Home stays open.

Explicit demo IDs (`1`, `2`, `3`, and `fixture-project`) retain their simulated workflows. This compatibility decision is centralized in `projects/[projectId]/project-data.ts`; backend failures never select a fixture. Backend workspaces do not receive the simulation provider. New Run is disabled, and existing backend run summaries have no Resume/Progress/Results actions. Direct run/results routes remain fixture-only. Add Dataset is disabled for backend projects; explicit fixture projects retain the locally validated selection-only demonstration. Dataset details use compact disclosures within the existing cards.

Manual integration check: open Home, choose New project, enter a name/description, select CSV and/or JSON files with a text column, and submit. Inspect the UUID workspace, expand dataset previews, refresh, return using Projects or the logo, then reopen the project from Recents. Invalid uploads retain values/files for correction. The direct fixture URLs below remain available for simulation demos.

## 1. Overview

LLooM Web is the Next.js 16 / React 19 frontend for Language Model-based Concept Induction: discovering and inspecting concepts in text collections. It demonstrates project workspaces, run configuration/review, simulated execution, Concept Explorer, Concept Details, and Document Details.

**Run workflows and results remain illustrative demos.** Project creation and UUID workspaces use actual uploaded datasets; fixture routes use fictional data. `src/fixtures/projects.ts` defines fictional dataset metadata and sample rows; `src/fixtures/run-results.fixtures.ts` generates illustrative documents, concepts, scores, evidence, and rationales. Those results are not derived from the sample rows or a connected LLooM backend.

## 2. Getting Started

Requires Node.js 20.9+ and npm. From the repository root:

```bash
cd lloom_web
npm ci
npm run dev
```

Open http://localhost:3000. The script is `next dev`, without a custom port; if 3000 is occupied, substitute the port printed by Next.js throughout this guide.

```bash
npm run check   # ESLint, TypeScript, source formatting
npm run build   # Production build
npm run start   # Serve the production build
node --test tests/api.test.mjs # API contracts, multipart forwarding, errors, timeouts
```

Individual checks: `npm run lint`, `npm run typecheck`, `npm run format:check`. `npm run format` formats `src/**/*.{ts,tsx,css}`; these formatting scripts do not cover README Markdown. Use `npm ci` for locked dependencies, or `npm install` when intentionally updating them.

## 3. Site Map

| Screen | Route or state | Access |
|---|---|---|
| Landing Page | `/` | Project list/search |
| Create Project | `/projects/new` | CSV/JSON upload and persisted project creation |
| Project Workspace | `/projects/[projectId]` | Backend UUID project or explicit fixture demo; Add Dataset is disabled for backend projects |
| Configure Run | `/projects/[projectId]/runs/new` | Defaults, or `?draft=run-3` in project 1 |
| Review Run | `/projects/[projectId]/runs/new/review` | Current configuration; direct access loads defaults or requested draft |
| Run Progress | `/projects/[projectId]/runs/[runId]/progress` | Completed fixture, explicit preview, or temporary run |
| API & Model Settings | `/settings/models` | Simulated test and page-local settings |
| Concept Explorer | `/projects/[projectId]/runs/[runId]/results` | Completed supported run |
| Concept Details | `/projects/[projectId]/runs/[runId]/results/concepts/[conceptId]` | Concept in that run |
| Document Details | Concept Details plus `?document=[documentId]` | Modal; not a separate route |

```text
Landing → Project Workspace → Configure Run → Review Run → Run Progress
                   ↑                                          ↓
                   └──────────────────────────────── Concept Explorer
                                                       ↓
                                                 Concept Details
                                                       ↓
                                             Document Details modal

Landing → Create Project (form prototype)
Profile menu → API & Model Settings
```

## 4. Fixture Reference

| Project ID | Name | Run ID and status |
|---|---|---|
| `1` | Customer Feedback Analysis | `run-3`: Draft; `run-2`, `run-1`: Completed |
| `2` | Reddit Discussion Analysis | `reddit-run-1`: Completed |
| `3` | Survey Responses | No runs or dataset fixtures; empty workspace |

In project 1, **Run 3 — New experiment** demonstrates draft Resume, **Run 2 — Political posts analysis** demonstrates political results, and **Run 1 — 2025 survey** demonstrates survey results. Project 2's **Run 1 — Community themes** offers another completed political example. All completed fixture runs support Explorer and both details interfaces after refresh.

Review shows an illustrative **Estimated cost (USD)** for generation plus scoring: the unchanged Run 3 draft shows `~$0.42`. Default configurations have separate fixture estimates. Editing any configuration field without an exact estimate fixture shows **Not available**, so an old estimate is never carried onto a new configuration. Results show estimated and actual costs separately. **Actual cost** is currently **Not available** for every run; a future authoritative `actualCost` value is required, not a database default or a simulated amount.

| Project / run | Concept ID | Useful document or state |
|---|---|---|
| `1` / `run-2` | `political-posts-concept-1` — Fighting Injustice | `0002`: match, score 1.00 with evidence; `0001`: non-match, score 0.00 without evidence |
| `1` / `run-2` | `political-posts-concept-6` — Environmental Policy | Intentionally has zero matches |
| `1` / `run-1` | `survey-2025-concept-1` — Customer Support | `0002`: match; no document metadata |

Political results offer **Likes (synthetic)** grouping; this is illustrative result metadata, not a column in an actual dataset. Survey results offer All Documents. Use the filtered URL below to demonstrate a specific slice without configuring it manually.

Scores express ordered agreement with inclusion criteria, not probabilities. Matches score 1.00; lower known scores appear under Non-matches. Missing scores differ from zero. Outlier is a derived category and has no details interface.

## 5. Direct Demo URLs

These examples work in a fresh browser session after starting the server. Completed fixture results need no simulated execution. Progress previews start a new simulation on arrival.

| Demo | Copyable local URL |
|---|---|
| Landing | http://localhost:3000/ |
| Create Project form | http://localhost:3000/projects/new |
| Project Workspace | http://localhost:3000/projects/1 |
| Empty workspace | http://localhost:3000/projects/3 |
| Configure / Resume fixture draft | http://localhost:3000/projects/1/runs/new?draft=run-3 |
| Review fixture draft | http://localhost:3000/projects/1/runs/new/review?draft=run-3 |
| Success progress preview | http://localhost:3000/projects/1/runs/demo-success/progress |
| Failure progress preview | http://localhost:3000/projects/1/runs/demo-failure/progress |
| Political Explorer | http://localhost:3000/projects/1/runs/run-2/results |
| Survey Explorer | http://localhost:3000/projects/1/runs/run-1/results |
| Reddit Explorer | http://localhost:3000/projects/2/runs/reddit-run-1/results |
| Concept Details / Matches (default) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1 |
| Non-matches | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?view=non-matches |
| Filtered Matches (synthetic Likes slice) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?groupBy=syntheticLikes&slice=likes-30-69&view=matches |
| Document Details (matching 0002) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?document=0002 |
| Document Details (zero-score 0001) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?view=non-matches&document=0001 |
| API & Model Settings | http://localhost:3000/settings/models |

Runs started from Review receive temporary `sim-*` URLs. Obtain those by starting a run; they require the same in-memory project session. Similarly, complete a `demo-*` progress preview before opening its results. A fresh results-only visit cannot recover a temporary run.

## 6. Demo Walkthrough

### Short demo: completed results, no execution required

1. Open Political Explorer above. Explain that counts and documents are illustrative fixtures.
2. Inspect concept bars, the zero-match concept, and the derived Outlier category.
3. In Concept Matrix, use Likes (synthetic). Open a Fighting Injustice bubble to carry its slice into Concept Details, or click its name/bar for all documents.
4. Switch Matches / Non-matches, search a document ID, change sort/slice, and paginate.
5. Click View. Inspect full text, synthetic metadata, ordinal score, evidence, and rationale. Non-matches can lack evidence; zero is a valid score.
6. Close with Escape or the close button; table filters and position remain. Demonstrate Back/Forward, then copy the modal URL and refresh to show completed fixture deep links.

### Full workflow: simulated execution

1. Open the fixture workspace directly at http://localhost:3000/projects/1.
2. Resume Run 3 — New experiment, or choose Configure New Run for defaults. Draft edits are temporary.
3. Inspect the data configuration and concept-generation settings, then proceed to Review Run. Review the illustrative total estimated cost. Return to Configure and edit a setting to demonstrate an unavailable estimate.
4. Click Start Run. Inspect the configuration summary and simulated distillation, clustering/synthesis, review, and scoring stages.
5. Wait for completion, or click **View Completed Results** while active to finish immediately and open the preview. No provider requests occur.
6. Explore concepts/matrix cells, open Concept Details, switch Matches / Non-matches, and open Document Details.
7. Return to the same workspace to see the temporary run. Refreshing or leaving that project discards it; completed fixture runs remain available.

For a predictable failure during first-round synthesis, use the Failure progress preview. The failure reason appears in Current Activity. Failed and cancelled runs offer **Retry**, which opens a confirmation with the estimated cost and real-run charge warning. **Confirm Retry** preserves the run ID and configuration, clears progress/error, and restarts from Distill; dismissing the dialog changes nothing. This deterministic preview fails again on every attempt; no backend job is submitted or charges incurred. Cancellation still stops an active simulation. Frontend guards prevent duplicate confirmations; Phase 2 must also enforce duplicate-request protection server-side.

API & Model Settings offers OpenAI with **LLooM default (recommended)** (`default`), GPT-4o (`gpt-4o`), and GPT-4o mini (`gpt-4o-mini`). LLooM default uses GPT-4o for synthesis/review and GPT-4o mini for distillation/scoring; explicit choices apply to all chat-model stages. Embeddings stay `text-embedding-3-large`. Test Connection remains simulated: `demo-fail-not-a-real-api-key` demonstrates failure. Settings stay page-local and do not change execution fixtures or existing run snapshots.

### File selection and error demo

Open Create Project, or choose **+ Add Dataset** in an explicit fixture workspace. File browsing and drag-and-drop use the same local validation queue. All selections remain visible, including unsupported formats and empty files. The existing table shows **Validating**, **Valid**, or **Error**, with concise per-file explanations. Remove invalid files or select corrected replacements. Create Project requires a nonempty name and at least one file, all files locally valid, and no submission in flight.

**Valid means client checks passed, not guaranteed backend acceptance.** CSV uses Papa Parse with comma separation, quote/escape/multiline handling, and 256 KiB chunks. A dedicated module worker scans the entire file and keeps column summaries. JSON uses native parsing in the worker and requires an array of objects with rows and columns. Common numeric/boolean/missing-only datasets are rejected; ambiguous object types, large numeric strings, and permissive CSV quote cases defer to FastAPI. Unclosed quotes and unexpected extra fields are detected where unambiguous. Type inference intentionally approximates pandas: named JSON dates, missing-value rules, encoding behavior, extreme numbers, and permissive parser behavior can differ. JavaScript JSON parsing rejects nonstandard constants that Python may accept. JSON still requires memory proportional to its complete document; very large CSV records may span chunks. No arbitrary file-size cap is introduced.

One file is validated at a time. Removing a file cancels its worker; clearing selections, closing the fixture dialog, and leaving the page terminate active workers. Stale callbacks cannot restore removed entries. Browser-restored pages restart any interrupted validation. Parsing remains off the main thread; no file contents are sent during local validation.

The backend validates every upload again. Errors with a unique explicit filename attach to that file and require removal/replacement. Unattributed errors (including the current generic no-text-column message) and duplicate-filename ambiguities stay at form level; no file is guessed and retry remains possible. Form values and file selections survive errors.

Add Dataset is disabled in backend workspaces with an explanatory message. Explicit fixture workspaces keep their demonstration: local validation runs, but submission sends no request and changes no dataset list.

### Dataset validation tests

```bash
node --test tests/api.test.mjs tests/dataset-validation.test.mjs
```

The pandas comparison test calls the actual backend validation functions without opening a database. It uses `text_lloom/.venv`, or `LLOOM_TEST_PYTHON` if set, and skips when that interpreter is unavailable. Browser/live tests use a separate FastAPI process with `LLOOM_DB_PATH` pointing at an isolated database. No development projects need to be changed.

## 7. Current Limitations

- **Illustrative execution:** UUID workspaces show uploaded data; explicit demo routes and generated results remain fictional fixtures. No backend analysis is connected. Execution uses demo timing; seeds and model selections do not generate real results. Some configurations, such as survey `follow_up`, have no result preview.
- **Temporary state:** Configuration edits, simulated runs, and model settings are held in memory. Refreshing resets them; leaving the project discards its temporary runs. Completed fixture results remain directly accessible.
- **Unimplemented operations:** Run creation/execution/results, project settings, Run Settings, Outlier Details, authentication, and advanced model settings are not connected. Add Dataset is disabled for backend projects and provides a locally validated selection preview in fixture projects. Connection tests are simulated; API keys are never sent or persisted, and model settings apply only on that page.
- **Result access:** Only completed, supported runs have results. Unknown IDs are rejected, and empty project 3 cannot start a valid run. Historical completed-run progress summaries use illustrative configuration defaults.

## 8. Development Notes

| Location | Purpose |
|---|---|
| `src/app/` | Pages, workflow screens, results interfaces, global theme tokens |
| `src/components/` | Shared header, project, profile, and theme UI |
| `src/fixtures/projects.ts` | Fictional projects, dataset metadata/sample rows, and runs |
| `src/fixtures/run-results.fixtures.ts` | Generated illustrative documents, concepts, scores, evidence, and metadata |
| `src/fixtures/run-results.ts` | Shared result types, document selection, and counts |
| `src/fixtures/run-costs*.ts`, `src/fixtures/models.ts` | Nullable run costs, illustrative estimate snapshots, and shared model values/labels |
| `src/components/DatasetUpload.tsx`, `AddDatasetDialog.tsx` | Shared CSV/JSON selection, accessible errors, and Workspace selection modal |

Run `npm run check` and `npm run build` before review. When routes or fixtures change, update the demo examples and verify direct links in a fresh browser session, plus the simulated workflow.

See [AGENTS.md](./AGENTS.md) for conventions and [Figma](https://www.figma.com/design/ZD63PswmLrGbgtIn4OulsL/LLooM-Web-UI-Design) for visual references.
