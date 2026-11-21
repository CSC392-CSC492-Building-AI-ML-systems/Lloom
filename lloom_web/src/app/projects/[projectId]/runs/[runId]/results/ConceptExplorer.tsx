"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProjectFixture } from "@/fixtures/projects";
import { createResultFixture, existingRunResults } from "@/fixtures/run-results.fixtures";
import { getConceptCounts } from "@/fixtures/run-results";
import type { ConceptCounts, RunResults } from "@/fixtures/run-results";
import { useProjectRuns } from "../../../ProjectRunProvider";
import ConceptOverviewChart from "./ConceptOverviewChart";
import ConceptMatrix from "./ConceptMatrix";

const linkClass =
    "inline-flex min-h-11 items-center justify-center rounded-[8px] border border-outline bg-surface px-5 text-[15px] text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const cardClass = "min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6";

export default function ConceptExplorer({
    project,
    runId,
}: {
    project: ProjectFixture;
    runId: string;
}) {
    const { runs } = useProjectRuns();
    const temporary = runs.find((run) => run.id === runId && run.projectId === project.id);
    const fixture = project.runs.find((run) => run.id === runId);
    const status = temporary?.status ?? fixture?.status;
    // UI notices live in the child component, separately from fixture construction.
    const results = (() => {
        if (temporary?.status === "Completed") {
            const dataset = project.datasets.find((dataset) => dataset.id === temporary.datasetId);
            return dataset
                ? createResultFixture(
                      project.id,
                      runId,
                      dataset,
                      temporary.configuration.textColumn,
                      temporary.concepts,
                  )
                : undefined;
        }
        if (fixture?.status === "Completed") return existingRunResults(project, runId);
        return undefined;
    })();
    const name = temporary?.name ?? fixture?.name ?? "Temporary run";
    return (
        <div className="space-y-6">
            <nav aria-label="Breadcrumb" className="text-[15px]">
                <ol className="flex flex-wrap gap-x-2 gap-y-1">
                    <li>
                        <Link
                            href="/"
                            className="rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            Projects
                        </Link>
                    </li>
                    <li className="min-w-0">
                        <span aria-hidden="true" className="mr-2">
                            /
                        </span>
                        <Link
                            href={`/projects/${project.id}`}
                            className="rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            {project.name}
                        </Link>
                    </li>
                    <li aria-current="page" className="min-w-0 break-words text-content-secondary">
                        <span aria-hidden="true" className="mr-2">
                            /
                        </span>
                        {name}
                    </li>
                </ol>
            </nav>
            {status === "Completed" && results ? (
                <ExplorerContent
                    key={`${runId}:${results.textColumn}`}
                    results={results}
                    datasetName={
                        project.datasets.find((dataset) => dataset.id === results.datasetId)
                            ?.name ?? results.datasetId
                    }
                />
            ) : (
                <section className={cardClass}>
                    <h1 className="text-2xl font-medium">
                        {!status
                            ? "Temporary results unavailable"
                            : status !== "Completed"
                              ? "Results are not ready"
                              : "Results preview unavailable"}
                    </h1>
                    <p className="mt-3 text-content-secondary">
                        {!status
                            ? "The temporary run no longer exists in memory. Refreshing or leaving the project resets temporary runs; no results have been recovered or generated."
                            : status !== "Completed"
                              ? `This run is ${status.toLowerCase()}. Only completed runs can display results.`
                              : "No curated result fixture supports this dataset and text-column combination. No unrelated results have been substituted."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link href={`/projects/${project.id}`} className={linkClass}>
                            Back to Project
                        </Link>
                        {temporary && (
                            <Link
                                href={`/projects/${project.id}/runs/${encodeURIComponent(runId)}/progress`}
                                className={linkClass}
                            >
                                View Progress
                            </Link>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

function ExplorerContent({ results, datasetName }: { results: RunResults; datasetName: string }) {
    const [groupingId, setGroupingId] = useState(results.groupings[0]?.id ?? "all");
    const [notice, setNotice] = useState("");
    const rows = useMemo(() => getConceptCounts(results), [results]);
    function onConcept(row: ConceptCounts) {
        setNotice(
            `${row.name}: ${row.documentIds.length} matching documents. Concept Details and document views are not implemented yet. These are illustrative fixtures.`,
        );
    }
    const summary = [
        ["Documents analyzed", results.documents.length.toLocaleString("en-US")],
        ["Concepts generated", String(results.concepts.length)],
        ["Dataset", datasetName],
    ];
    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                    <h1 className="text-2xl font-medium md:text-[30px]">Concept Explorer</h1>
                    <p className="mt-1 text-[15px] text-content-secondary">
                        Explore generated concepts and how they appear across your dataset.
                    </p>
                </div>
                <div className="flex items-center gap-5">
                    <span className="rounded-full bg-success-surface px-5 py-1.5 text-[13px] text-success">
                        Completed
                    </span>
                    <button
                        type="button"
                        className={linkClass}
                        onClick={() =>
                            setNotice(
                                "Run Settings is not implemented yet. No configuration has been changed.",
                            )
                        }
                    >
                        Run Settings
                    </button>
                </div>
            </div>
            <p className="text-[13px] text-content-secondary">
                Illustrative fixture preview. Documents, concepts, scores, evidence, and metadata
                are synthetic examples, not actual model output. Seed phrases and synthesis settings
                do not generate these records.
            </p>
            <dl aria-label="Results summary" className="grid gap-6 sm:grid-cols-3">
                {summary.map(([label, value]) => (
                    <div
                        key={label}
                        className="min-w-0 rounded-[14px] border border-outline bg-surface p-5"
                    >
                        <dt className="text-[13px] text-content-secondary">{label}</dt>
                        <dd
                            className={`mt-1.5 break-words font-medium ${label === "Dataset" ? "text-xl" : "text-[28px]"}`}
                        >
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
            <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-sm text-content-secondary empty:hidden"
            >
                {notice}
            </p>
            {!results.concepts.length || !results.documents.length ? (
                <section className={cardClass}>
                    <h2 className="text-xl font-medium">No concepts to explore</h2>
                    <p className="mt-3 text-content-secondary">
                        This fixture result has no concepts or analyzed documents. No chart values
                        have been invented.
                    </p>
                </section>
            ) : (
                <>
                    <section aria-labelledby="concept-overview-heading" className={cardClass}>
                        <h2
                            id="concept-overview-heading"
                            className="border-l-[3px] border-primary pl-2.5 text-xl font-medium text-primary"
                        >
                            Concept Overview
                        </h2>
                        <p className="mt-3 text-[15px] text-content-secondary">
                            Number of documents matching each generated concept, with Outlier shown
                            separately.
                        </p>
                        <ConceptOverviewChart rows={rows} onSelect={onConcept} />
                        <p className="mt-4 text-[13px] text-content-secondary">
                            {results.concepts.length} generated concepts are shown alongside
                            Outlier. Documents can match multiple concepts; bars are not mutually
                            exclusive.
                        </p>
                        <p className="mt-1 text-[13px] text-content-secondary">
                            Matches use agreement score 1. Scores are ordinal, not probabilities.
                            Outliers have complete scores and match no concept; missing scores are
                            not treated as zero.
                        </p>
                    </section>
                    <ConceptMatrix
                        results={results}
                        rows={rows}
                        groupingId={groupingId}
                        onGroupingChange={(id) => {
                            setGroupingId(id);
                            setNotice(
                                id === "all"
                                    ? "Matrix now shows All Documents."
                                    : "Matrix now groups by synthetic Likes. This is not an original dataset field.",
                            );
                        }}
                        onConcept={onConcept}
                        onCell={(row, slice, count) =>
                            setNotice(
                                `${row.name}, ${slice.label}: ${count} matching documents. Matching Documents and Document Details are not implemented yet; no detail page was opened.`,
                            )
                        }
                    />
                </>
            )}
        </>
    );
}
