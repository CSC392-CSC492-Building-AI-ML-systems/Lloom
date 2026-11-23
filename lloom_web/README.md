# LLooM Web

The Next.js frontend for LLooM (Language Model-based Concept Induction).

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

## Getting Started

### Prerequisites

- Node.js 20.9 or newer
- npm

### Installation

From the `lloom_web/` directory, install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Changes to the source code will automatically update the application.

## Development Workflow

The project uses ESLint, TypeScript strict mode, and Prettier to maintain code quality and consistency.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format` | Automatically format source files with Prettier |
| `npm run format:check` | Check formatting without modifying files |
| `npm run check` | Run linting, type checking, and formatting checks |

### Before Pushing Changes

All contributors should run:

```bash
npm run check
npm run build
```

If the formatting check fails, run:

```bash
npm run format
```

Then rerun the checks before pushing.

## Development Guidelines

Frontend architecture, coding conventions, styling guidelines, and expectations for AI coding agents are documented in [AGENTS.md](./AGENTS.md).

The frontend's visual design is maintained in [Figma](https://www.figma.com/design/ZD63PswmLrGbgtIn4OulsL/LLooM-Web-UI-Design?node-id=1-2&t=m9eXBtnLz6cpRU9c-1).

## Run progress prototype

Start Run on Review creates a configuration snapshot and opens
`/projects/[projectId]/runs/[runId]/progress`. `ProjectRunProvider` keeps temporary
runs in memory while that project layout is mounted, including when returning to
the Workspace. Refreshing or leaving the project discards them. A lost temporary
run displays an unavailable message; no state is reconstructed from its URL.

The four visible stages simulate distillation, repeated clustering/synthesis with
optional automatic review, and document scoring. Timing is fixed demo timing, not
an estimate of real execution. Cancellation and demo completion stop the timers.
Concept counts are illustrative and capped by the selected dataset's curated
catalogue (18 survey themes or 9 political themes), not generated results. An
unsupported text column has no result preview. Model metadata uses the existing
fixture settings, independently of API & Model Settings.

For projects with datasets, reproducible preview URLs are:

- `/projects/1/runs/demo-success/progress`
- `/projects/1/runs/demo-failure/progress` (fails during the first synthesis round)

Existing completed fixture runs can also be viewed at the progress route; their
configuration summary uses illustrative defaults because historical configuration
is not stored in those fixtures. View Completed Results completes an active
simulation and opens its illustrative Concept Explorer preview. Completed runs
open that preview directly. No backend execution, provider requests, or persistence
is implemented.

## Concept Explorer prototype

Completed runs open `/projects/[projectId]/runs/[runId]/results` from Workspace or
Progress. Existing completed fixture runs survive refresh; simulated results
require their completed in-memory run. Unknown/cross-project IDs are rejected.
Unfinished runs and unsupported dataset/text-column combinations have explicit
unavailable states, rather than unrelated fallback results.

`src/fixtures/run-results.ts` defines concepts, full documents, metadata, ordinal
agreement scores, evidence/rationale, and slice definitions. Curated fictional
records are built deterministically in `run-results.fixtures.ts`. These records
are not parsed from dataset files or generated from seed phrases/model settings.
The default match threshold is 1. Chart counts, matrix cells, and Outliers share
the same scores. Documents can match multiple concepts; Outlier is derived and is
excluded from the generated concept count. Missing scores are distinct from zero
and do not establish that a document is an Outlier. The final concept in multi-
concept previews intentionally has zero matches.

Political previews offer **Likes (synthetic)** numeric slices and **All Documents**.
Synthetic Likes exists only in the result fixture records; no Likes field is added
to the existing dataset fixtures. Survey previews offer All Documents. Matrix
bubble area represents counts, including accessible exact counts. All charts and
matrices support local horizontal scrolling and keyboard controls.

Run Settings, Outlier Details, and Document Details remain accessible placeholder
feedback. No editing, real execution, authentication, or persistence is implemented.

## Concept Details prototype

Concept names and bars open
`/projects/[projectId]/runs/[runId]/results/concepts/[conceptId]`. Matrix cells also
carry their exact slice. Explorer grouping is restored by the Back to Concept
Explorer link. Outlier stays a derived-category placeholder; it has no invented
concept definition or score.

Matches and Non-matches share one page. Validated URL parameters are `groupBy`,
`slice`, `view` (`matches` / `non-matches`), `q` (case-insensitive ID/text search),
`sort` (`id` ascending / `score` descending with ID tie-breaking), and `page`.
Native browser history updates filters without reloading the project provider.
Search replaces history entries; view, slice, sort, and pagination changes push
entries. Filtering and sorting reset pagination to page one. Invalid parameters
show an explicit reset action instead of broadening the selection silently.

The overview's match total is global; Document Scores counts reflect its current
view, slice, and search. Five documents are shown per page. Missing score records
and null scores are excluded from both views and reported separately; zero remains
a valid non-match. Description, criteria, and representative excerpts come from
the existing shared fixtures. Repeated example excerpts are shown only once.

Document View displays accessible placeholder feedback. No document overlay is
implemented yet. Existing completed fixtures survive refresh, while temporary
run details require the same in-memory project session as Concept Explorer.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
