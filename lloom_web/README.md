# LLooM Web

Home now retrieves recent projects from FastAPI. The remaining screens retain their fixture-based behavior described below.

Copy `.env.example` to `.env.local` in this directory. `LLOOM_API_BASE_URL` defaults to `http://localhost:8000`; restart Next.js after changing it. The example is versioned and local overrides are ignored. Start FastAPI separately using `../lloom_api/README.md`.

The server-only client in `src/lib/api/` uses native fetch with a 10-second timeout (overridable per request with `timeoutMs`) and supports caller cancellation signals. Endpoint functions validate their actual response contracts independently of fixture types. HTTP errors, FastAPI string/validation details, invalid responses, timeouts, and connection failures are handled without falling back to fixtures.

Home streams the recent list with loading, empty, and error states. Retry performs a full GET navigation. Project requests use `cache: "no-store"`; reload or revisit Home to fetch changes. There is no polling. Browser history restoration and development HMR can reuse existing UI/data; use a full reload when checking backend changes.

Backend project rows are temporarily non-interactive: workspace routes still validate fixture IDs rather than UUIDs. Workspace integration will restore navigation. Use the direct fixture URLs below for the existing simulated workflow. Creation, uploads, runs, results, and settings are not connected by this integration.

## 1. Overview

LLooM Web is the Next.js 16 / React 19 frontend for Language Model-based Concept Induction: discovering and inspecting concepts in text collections. It demonstrates project workspaces, run configuration/review, simulated execution, Concept Explorer, Concept Details, and Document Details.

**Outside Home, this is an illustrative frontend demo.** No actual datasets are loaded or stored by these screens. `src/fixtures/projects.ts` defines fictional dataset metadata and sample rows; `src/fixtures/run-results.fixtures.ts` generates illustrative documents, concepts, scores, evidence, and rationales. Those results are not derived from the sample rows or a connected LLooM backend.

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
```

Individual checks: `npm run lint`, `npm run typecheck`, `npm run format:check`. `npm run format` formats `src/**/*.{ts,tsx,css}`; these formatting scripts do not cover README Markdown. Use `npm ci` for locked dependencies, or `npm install` when intentionally updating them.

## 3. Site Map

| Screen | Route or state | Access |
|---|---|---|
| Landing Page | `/` | Project list/search |
| Create Project | `/projects/new` | CSV/JSON selection and validation; creation/upload are not connected |
| Project Workspace | `/projects/[projectId]` | Fixture project; Add Dataset opens a selection-only modal |
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

Open Create Project, or choose **+ Add Dataset** in a workspace. Select or drop CSV/JSON files (extensions are case-insensitive). Unsupported extensions, including ZIP, and empty files are rejected by filename; valid files in the same batch remain selected. Remove files or select corrected files to try again. Create Project preserves its name/description and selections after errors. Add Dataset selections last until its modal closes. Submitting either interface explains that nothing was uploaded or created; the fixture dataset list does not change. These checks do not parse file contents or enforce a file-size limit. The shared uploader can also display a future backend `{ detail: string }` error without clearing selections.

## 7. Current Limitations

- **Illustrative data and execution:** No actual datasets are loaded, stored, uploaded, or analyzed. Dataset metadata/sample rows and generated results are fictional fixtures. Execution uses demo timing; seeds and model selections do not generate real results. Some configurations, such as survey `follow_up`, have no result preview.
- **Temporary state:** Configuration edits, simulated runs, and model settings are held in memory. Refreshing resets them; leaving the project discards its temporary runs. Completed fixture results remain directly accessible.
- **Unimplemented operations:** Project creation, actual dataset uploads, project settings, Run Settings, Outlier Details, authentication, and advanced model settings are not connected. Create Project and Add Dataset provide selection/error previews only. Connection tests are simulated; API keys are never sent or persisted, and model settings apply only on that page.
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
