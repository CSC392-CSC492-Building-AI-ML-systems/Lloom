"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import type { ProjectFixture } from "@/fixtures/projects";
import { getConceptCounts } from "@/fixtures/run-results";
import type { ResultConcept, RunResults } from "@/fixtures/run-results";
import { useRunResults } from "../../useRunResults";
import { explorerHref, readResultQuery } from "../../results-navigation";
import DocumentScores from "./DocumentScores";

const linkClass =
    "inline-flex min-h-11 items-center justify-center rounded-[8px] border border-outline bg-surface px-5 text-[15px] text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function ConceptDetails({
    project,
    runId,
    conceptId,
}: {
    project: ProjectFixture;
    runId: string;
    conceptId: string;
}) {
    const { results, status, temporary, name } = useRunResults(project, runId);
    const { projectId } = useParams<{ projectId: string }>();
    if (!results || status !== "Completed")
        return (
            <section className="rounded-[14px] border border-outline bg-surface p-5">
                <h1 className="text-2xl font-medium">
                    {!status
                        ? "Temporary results unavailable"
                        : status !== "Completed"
                          ? "Results are not ready"
                          : "Results preview unavailable"}
                </h1>
                <p className="mt-3 text-content-secondary">
                    {!status
                        ? "Refreshing or leaving the project resets temporary runs. No results have been recovered."
                        : status !== "Completed"
                          ? `This run is ${status.toLowerCase()}. Only completed runs have concept details.`
                          : "This dataset and text-column combination has no supported result fixture."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/projects/${encodeURIComponent(projectId)}`} className={linkClass}>
                        Back to Project
                    </Link>
                    {temporary && (
                        <Link
                            href={`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/progress`}
                            className={linkClass}
                        >
                            View Progress
                        </Link>
                    )}
                </div>
            </section>
        );
    const concept = results.concepts.find((concept) => concept.id === conceptId);
    if (!concept) notFound();
    return (
        <DetailsContent
            project={project}
            projectId={projectId}
            runId={runId}
            runName={name}
            concept={concept}
            results={results}
        />
    );
}

function DetailsContent({
    project,
    projectId,
    runId,
    runName,
    concept,
    results,
}: {
    project: ProjectFixture;
    projectId: string;
    runId: string;
    runName: string;
    concept: ResultConcept;
    results: RunResults;
}) {
    const search = useSearchParams();
    const filters = readResultQuery(search, results);
    const backHref = explorerHref(projectId, runId, filters.groupingId);
    const count =
        getConceptCounts(results).find((row) => row.id === concept.id)?.documentIds.length ?? 0;
    const dataset = project.datasets.find((dataset) => dataset.id === results.datasetId);
    const examples = [
        ...new Set(
            concept.exampleDocumentIds.slice(0, 2).flatMap((id) => {
                const document = results.documents.find((document) => document.id === id);
                if (!document) return [];
                const record = results.scores.find(
                    (record) => record.documentId === id && record.conceptId === concept.id,
                );
                return [
                    record?.evidence.find((excerpt) => document.text.includes(excerpt)) ??
                        document.text,
                ];
            }),
        ),
    ];
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
                            href={`/projects/${encodeURIComponent(projectId)}`}
                            className="rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            {project.name}
                        </Link>
                    </li>
                    <li className="min-w-0 break-words text-content-secondary">
                        <span aria-hidden="true" className="mr-2">
                            /
                        </span>
                        {runName}
                    </li>
                    <li>
                        <span aria-hidden="true" className="mr-2">
                            /
                        </span>
                        <Link
                            href={backHref}
                            className="rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            Concept Explorer
                        </Link>
                    </li>
                    <li aria-current="page" className="min-w-0 break-words text-content-secondary">
                        <span aria-hidden="true" className="mr-2">
                            /
                        </span>
                        {concept.name}
                    </li>
                </ol>
            </nav>
            <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                    <h1 className="text-2xl font-medium md:text-[30px]">{concept.name}</h1>
                    <p className="mt-1 text-base text-content-secondary">
                        Explore the definition and supporting documents for this generated concept.
                    </p>
                </div>
                <Link href={backHref} className={linkClass}>
                    Back to Concept Explorer
                </Link>
            </div>
            <section
                aria-labelledby="concept-overview-heading"
                className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
            >
                <h2
                    id="concept-overview-heading"
                    className="border-l-[3px] border-primary pl-2.5 text-xl font-medium"
                >
                    Concept Overview
                </h2>
                <h3 className="mt-4 text-[13px] text-content-secondary">Description</h3>
                <p className="mt-1 text-lg">
                    {concept.description || "No description is available in this fixture."}
                </p>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_.8fr_1.4fr_1fr]">
                    {[
                        ["Concept name", concept.name],
                        ["Matching documents", String(count)],
                        ["Source dataset", dataset?.name ?? results.datasetId],
                        ["Run", runName],
                    ].map(([label, value]) => (
                        <div key={label} className="min-w-0">
                            <dt className="text-[13px] text-content-secondary">{label}</dt>
                            <dd className="mt-1 text-base font-medium break-words">{value}</dd>
                        </div>
                    ))}
                </dl>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <div>
                        <h3 className="text-base font-medium">Inclusion criteria</h3>
                        <p className="mt-2 text-[15px] text-content-secondary">
                            {concept.inclusionCriteria ||
                                "No inclusion criteria are available in this fixture."}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-base font-medium">Representative examples</h3>
                        {examples.length ? (
                            examples.map((example, index) => (
                                <blockquote
                                    key={index}
                                    className="mt-2 text-[15px] text-content-secondary"
                                >
                                    “{example}”
                                </blockquote>
                            ))
                        ) : (
                            <p className="mt-2 text-[15px] text-content-secondary">
                                No representative examples are available for this concept.
                            </p>
                        )}
                    </div>
                </div>
                <p className="mt-6 rounded-[8px] bg-info-surface px-3 py-2 text-[13px] text-content-secondary">
                    Illustrative fixture concepts and fictional documents, not model output. Review
                    descriptions and inclusion criteria alongside supporting documents.
                </p>
            </section>
            <DocumentScores
                key={concept.id}
                results={results}
                concept={concept}
                filters={filters}
            />
        </div>
    );
}
