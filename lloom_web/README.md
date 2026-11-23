# LLooM Web

## 1. Overview

LLooM Web is the Next.js 16 / React 19 frontend for Language Model-based Concept Induction: discovering and inspecting concepts in text collections. It demonstrates project workspaces, run configuration/review, simulated execution, Concept Explorer, Concept Details, and Document Details using fictional fixtures. No LLooM backend is connected.

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
| Create Project | `/projects/new` | Form/file selection; creation/upload are placeholders |
| Project Workspace | `/projects/[projectId]` | Fixture project |
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

## 4. Fixture Data Reference

### Projects and datasets

| Project ID | Name | Dataset IDs |
|---|---|---|
| `1` | Customer Feedback Analysis | `survey-2025`, `survey-2026`, `political-posts` |
| `2` | Reddit Discussion Analysis | `political-posts` |
| `3` | Survey Responses | None; empty workspace |

| Dataset ID | Filename | Rows | Columns / supported result text column |
|---|---|---|---|
| `survey-2025` | survey_2025.csv | 1,000 | `response_id`, `response_text`, `follow_up`; results support `response_text` |
| `survey-2026` | survey_2026.csv | 1,200 | Same columns; results support `response_text` |
| `political-posts` | political_posts.csv | 1,200 | `post_id`, `message`; results support `message` |

Survey `follow_up` can be configured but has no result preview. Result documents are generated fixtures, not parsed sample rows. IDs are `0001`–`1000` for survey-2025 and `0001`–`1200` for the other datasets.

### Runs

| Project | Run ID | Name | Status | Dataset / results |
|---|---|---|---|---|
| `1` | `run-3` | Run 3 — New experiment | Draft | survey-2025; no results; Resume requests 12 concepts, 2 rounds, Customer experience seed |
| `1` | `run-2` | Run 2 — Political posts analysis | Completed | political-posts; 6 concepts |
| `1` | `run-1` | Run 1 — 2025 survey | Completed | survey-2025; 18 concepts |
| `2` | `reddit-run-1` | Run 1 — Community themes | Completed | political-posts; 9 concepts |

All three completed runs support Explorer and both details interfaces after refresh. There is no completed survey-2026 run; use simulated execution for that dataset.

`demo-success` / `demo-failure` are explicit progress previews for projects with datasets, not stored run fixtures. Review creates IDs shaped like `sim-1-[timestamp]-[sequence]`; these exist only while the project provider remains mounted.

### Concepts, documents, and grouping

Concept IDs follow `[datasetId]-concept-[1-based index]`.

| Run | Concept ID | Name | Representative documents |
|---|---|---|---|
| Project 1 / run-2 | `political-posts-concept-1` | Fighting Injustice | `0002`: match, 1.00 with evidence; `0001`: non-match, 0.00 without evidence |
| Project 1 / run-2 | `political-posts-concept-2` | Economic Strategies | Same documents; scores depend on concept |
| Project 1 / run-2 | `political-posts-concept-6` | Environmental Policy | Zero matches, intentionally |
| Project 1 / run-1 | `survey-2025-concept-1` | Customer Support | `0002`: match; metadata is empty |
| Project 2 / reddit-run-1 | `political-posts-concept-9` | Public Accountability | Zero matches, intentionally |

Political catalogues also include Security and Defense, Healthcare Issues, Educational and Social Initiatives, and (in the 9-concept run) Transport Access and Housing Affordability. Survey results contain 18 customer-experience themes. The last concept in multi-concept previews intentionally has zero matches. Outlier is derived, not a concept with its own details route.

Political results offer `groupBy=syntheticLikes` (default) and `groupBy=all`. **Likes (synthetic)** is preview metadata calculated as `(zero-based document index × 37) % 233`, not a dataset fixture column. Document `0002` has 37 synthetic likes. Survey results offer only All Documents.

| Slice parameter | Synthetic Likes values |
|---|---|
| `slice=all` | All documents |
| `slice=likes-0-29` | 0–29 |
| `slice=likes-30-69` | 30–69 |
| `slice=likes-70-112` | 70–112 |
| `slice=likes-113-232` | 113–232 |

Specific Likes slices require `groupBy=syntheticLikes`. Concept Details also accepts `view=matches` (default) / `view=non-matches`, `sort=id` (ascending, default) / `sort=score` (descending), `q` (case-insensitive ID/text search), and positive integer `page` (five documents per page). Filter/sort changes reset the page. Invalid/duplicate filter values offer reset; out-of-range pages offer a first-page action.

`document` accepts one nonempty run-scoped ID. Unknown, malformed, or duplicate values open a recoverable unavailable-document modal. Document selection is independent of table filters. Scores are ordinal agreement categories (1.00, 0.75, 0.50, 0.25, 0.00), not probabilities. Matches use threshold 1.00. Missing scores differ from zero and are excluded from both views.

## 5. Direct Demo URLs

All examples below work in a fresh browser session. Progress previews initialize a simulation on arrival; completed fixture URLs need no simulation.

| Demo | Copyable local URL |
|---|---|
| Landing | http://localhost:3000/ |
| Create Project form | http://localhost:3000/projects/new |
| Project Workspace | http://localhost:3000/projects/1 |
| Empty workspace | http://localhost:3000/projects/3 |
| Configure defaults | http://localhost:3000/projects/1/runs/new |
| Resume fixture draft | http://localhost:3000/projects/1/runs/new?draft=run-3 |
| Review fixture draft | http://localhost:3000/projects/1/runs/new/review?draft=run-3 |
| Success progress preview | http://localhost:3000/projects/1/runs/demo-success/progress |
| Failure progress preview | http://localhost:3000/projects/1/runs/demo-failure/progress |
| Completed run progress | http://localhost:3000/projects/1/runs/run-2/progress |
| Political Explorer | http://localhost:3000/projects/1/runs/run-2/results |
| Survey Explorer | http://localhost:3000/projects/1/runs/run-1/results |
| Reddit Explorer | http://localhost:3000/projects/2/runs/reddit-run-1/results |
| Concept Details (default Matches) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1 |
| Explicit Matches | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?view=matches |
| Non-matches | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?view=non-matches |
| Filtered Matches (30–69 Likes) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?groupBy=syntheticLikes&slice=likes-30-69&view=matches |
| Document Details (matching 0002) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?groupBy=syntheticLikes&slice=all&view=matches&document=0002 |
| Document Details (zero-score 0001) | http://localhost:3000/projects/1/runs/run-2/results/concepts/political-posts-concept-1?view=non-matches&document=0001 |
| API & Model Settings | http://localhost:3000/settings/models |

Generated `sim-*` progress/results/details URLs are **session-dependent**: obtain them by starting a run, not by substituting an arbitrary ID. Refreshing or leaving the project makes them unavailable. Likewise, visit a `demo-*` progress preview and complete it before opening its results; a fresh results-only visit cannot recover it.

## 6. Demo Walkthrough

### Short demo: completed results, no execution required

1. Open Political Explorer above. Explain that counts/documents are illustrative fixtures.
2. Inspect concept bars, the zero-match concept, and derived Outlier category.
3. In Concept Matrix, select Likes (synthetic). Open a Fighting Injustice bubble to carry its slice into Concept Details, or click its name/bar for all documents.
4. Switch Matches / Non-matches, search a document ID, change sort/slice, and paginate.
5. Click View. Inspect full text, synthetic metadata, ordinal score, evidence, and rationale. Non-matches can lack evidence; zero is a valid score.
6. Close with Escape or the close button. Demonstrate Back/Forward. Copy the overlay URL and refresh to demonstrate completed fixture deep links.

### Full workflow: simulated execution

1. Start at Landing and open Customer Feedback Analysis.
2. Resume Run 3 — New experiment. Changes do not save back to the fixture draft. Alternatively choose Configure New Run for defaults.
3. Inspect dataset, text/ID columns, target concepts, seed, rounds, and automatic review. Proceed to Review Run; return to Configure if needed.
4. Click Start Run. Inspect its configuration snapshot and simulated distillation, clustering/synthesis, review, and scoring stages.
5. Wait for completion, or click **View Completed Results** while active to finish immediately and open the preview. No provider requests occur.
6. Explore concepts/matrix cells, open Concept Details, switch Matches / Non-matches, and open Document Details.
7. Return to the same workspace to see the temporary run. Refreshing or leaving that project discards it; completed fixture runs remain.

Use Failure progress preview for a predictable failure during first-round synthesis. API & Model Settings has an independent simulated connection test; its selections do not configure execution.

## 7. Current Limitations

- Projects, datasets, concepts, full text, scores, evidence, and rationales are fixtures. Result text is curated fiction, not uploaded content or model output. Explorer/Details counts derive from shared scores.
- Execution uses fixed demo timing. Concept counts are capped by the supported catalogue (18 survey themes / 9 political themes). Seeds/model selections do not generate text. Survey `follow_up` lacks result previews.
- Configuration and simulated runs are in memory. Refresh resets edits; leaving the configuration layout resets its configuration. Refreshing or leaving the project discards temporary runs. There is no backend recovery/persistence.
- Create Project/file selection do not create projects or upload/parse datasets. Adding datasets, project settings, Run Settings, Outlier Details, authentication, and other unfinished profile actions remain placeholders.
- API & Model Settings never sends/persists credentials. Tests simulate success/failure; Save applies provider/model only on that page. Advanced settings are unimplemented. Execution uses independent fixture model metadata.
- Unknown/cross-project run IDs and unknown concepts are rejected. Unfinished runs have no results. Empty project 3 cannot configure a valid run or initialize a progress preview. Historical completed-run progress summaries use illustrative configuration defaults.
- Missing/null scores are supported but not generated by the current fixture builder. Matches have evidence; current non-matches have none. Survey metadata is empty; political metadata contains synthetic Likes only.

## 8. Development Notes

| Location | Purpose |
|---|---|
| `src/app/` | App Router pages/layouts, global theme tokens |
| `src/components/` | Header, profile/theme controls, shared project UI |
| `src/fixtures/projects.ts` | Project/dataset/run IDs, sample rows, draft |
| `src/fixtures/run-results.ts` | Result types, document selection, shared counts |
| `src/fixtures/run-results.fixtures.ts` | Deterministic concepts/documents/scores/metadata/slices |
| `src/app/projects/[projectId]/ProjectRunProvider.tsx` | Project-scoped temporary execution |
| `src/app/projects/[projectId]/runs/new/` | Configuration provider, validation, configure/review UI |
| `src/app/projects/[projectId]/runs/run-simulation.ts` | Simulation stages and progress previews |
| `src/app/projects/[projectId]/runs/[runId]/results/` | Explorer/matrix, availability, URL helpers |
| `…/results/concepts/[conceptId]/` | Concept Details, document table, native dialog |

Query-only results navigation uses Next.js-integrated native history without unmounting the project provider. Search replaces history; view/slice/sort/page changes and document opening push entries. Closing a table-opened modal goes Back; closing a directly loaded modal removes only `document` through replacement. Back/Forward also controls visibility.

Use existing semantic theme tokens and browser capabilities. Run `npm run check` and `npm run build` before review. When fixtures/routes change, update these tables and verify every direct URL in a fresh context, plus the in-memory workflow.

See [AGENTS.md](./AGENTS.md) for conventions and [Figma](https://www.figma.com/design/ZD63PswmLrGbgtIn4OulsL/LLooM-Web-UI-Design) for visual references.
