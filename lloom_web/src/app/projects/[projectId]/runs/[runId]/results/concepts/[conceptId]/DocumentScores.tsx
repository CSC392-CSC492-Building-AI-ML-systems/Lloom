"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { selectConceptDocuments } from "@/fixtures/run-results";
import type { ResultConcept, RunResults } from "@/fixtures/run-results";
import { resetResultQuery, updateResultQuery } from "../../results-navigation";
import type { readResultQuery } from "../../results-navigation";

const controlClass =
    "mt-1 min-h-11 w-full rounded-[8px] border border-outline bg-surface px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const pageClass =
    "inline-flex min-h-11 min-w-[108px] items-center justify-center rounded-[8px] border border-outline bg-surface px-4 text-[15px] text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-content-placeholder disabled:opacity-60";

export default function DocumentScores({
    results,
    concept,
    filters,
    onViewDocument,
}: {
    results: RunResults;
    concept: ResultConcept;
    filters: ReturnType<typeof readResultQuery>;
    onViewDocument: (id: string) => void;
}) {
    const [notice, setNotice] = useState({ key: "", message: "" });
    const filterKey = JSON.stringify([
        filters.groupingId,
        filters.sliceId,
        filters.view,
        filters.sort,
        filters.query,
        filters.page,
    ]);
    function announce(message: string) {
        setNotice({ key: filterKey, message });
    }
    const activeNotice = notice.key === filterKey ? notice.message : "";
    const matchesRef = useRef<HTMLButtonElement>(null);
    const nonMatchesRef = useRef<HTMLButtonElement>(null);
    function change(patch: Record<string, string | null>, replace = false) {
        announce("");
        updateResultQuery({ ...patch, page: "1" }, replace);
    }
    if (filters.error || !filters.slice)
        return (
            <section
                aria-labelledby="filter-error-heading"
                className="rounded-[14px] border border-outline bg-surface p-5 md:p-6"
            >
                <h2 id="filter-error-heading" className="text-xl font-medium text-danger">
                    Invalid document filters
                </h2>
                <p role="alert" className="mt-3 text-content-secondary">
                    {filters.error}
                </p>
                <button
                    type="button"
                    onClick={() => resetResultQuery(results)}
                    className={`${pageClass} mt-4`}
                >
                    Reset filters
                </button>
            </section>
        );
    const selection = selectConceptDocuments(results, concept.id, {
        slice: filters.slice,
        view: filters.view,
        query: filters.query,
        sort: filters.sort,
    });
    const total = selection.rows.length;
    const pageCount = Math.max(1, Math.ceil(total / 5));
    const rangeError = filters.page > pageCount;
    const rows = rangeError ? [] : selection.rows.slice((filters.page - 1) * 5, filters.page * 5);
    const start = total ? (filters.page - 1) * 5 + 1 : 0;
    const end = Math.min(filters.page * 5, total);
    const label = filters.view === "matches" ? "matching" : "non-matching";
    const columnSlice = filters.grouping?.slices.find((slice) => "columnId" in slice);
    const metadataKey = columnSlice && "columnId" in columnSlice ? columnSlice.columnId : undefined;
    return (
        <section
            aria-labelledby="document-scores-heading"
            className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2
                        id="document-scores-heading"
                        className="border-l-[3px] border-primary pl-2.5 text-xl font-medium"
                    >
                        Document Scores
                    </h2>
                    <p className="mt-1 text-[15px] text-content-secondary">
                        Inspect how LLooM evaluated documents against this concept.
                    </p>
                </div>
                <p className="text-sm font-medium text-content-secondary">
                    {total.toLocaleString("en-US")} {label} documents
                </p>
            </div>
            <div
                role="tablist"
                aria-label="Document score view"
                className="mt-4 inline-flex max-w-full rounded-[8px] border border-outline bg-surface-subtle p-1"
            >
                {(["matches", "non-matches"] as const).map((view) => (
                    <button
                        key={view}
                        ref={view === "matches" ? matchesRef : nonMatchesRef}
                        id={`${view}-tab`}
                        role="tab"
                        type="button"
                        aria-selected={filters.view === view}
                        aria-controls="document-score-panel"
                        tabIndex={filters.view === view ? 0 : -1}
                        onClick={() => change({ view })}
                        onKeyDown={(event) => {
                            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                                return;
                            event.preventDefault();
                            const next =
                                event.key === "Home"
                                    ? "matches"
                                    : event.key === "End"
                                      ? "non-matches"
                                      : filters.view === "matches"
                                        ? "non-matches"
                                        : "matches";
                            change({ view: next });
                            (next === "matches" ? matchesRef : nonMatchesRef).current?.focus();
                        }}
                        className={`min-h-9 rounded px-5 text-[15px] focus-visible:outline-2 focus-visible:outline-primary ${filters.view === view ? "bg-info-surface font-medium text-primary" : "text-content-secondary hover:bg-surface"}`}
                    >
                        {view === "matches" ? "Matches" : "Non-matches"}
                    </button>
                ))}
            </div>
            <p className="mt-3 text-[13px] text-content-secondary">
                Matches score 1.00. Non-matches have known scores below 1.00. Missing scores are
                excluded from both views.
            </p>
            <p className="mt-1 text-[13px] text-content-secondary">
                Score scale: 1.00 · 0.75 · 0.50 · 0.25 · 0.00 — ordered agreement with inclusion
                criteria, not probabilities.
            </p>
            <div
                id="document-score-panel"
                role="tabpanel"
                aria-labelledby={`${filters.view}-tab`}
                className="mt-4"
            >
                <div className="grid gap-4 md:grid-cols-[2.1fr_1fr_1fr]">
                    <div>
                        <label
                            htmlFor="document-search"
                            className="text-[13px] text-content-secondary"
                        >
                            Search documents
                        </label>
                        <div className="relative">
                            <Search
                                size={18}
                                aria-hidden="true"
                                className="absolute top-4 left-3 text-content-secondary"
                            />
                            <input
                                id="document-search"
                                type="search"
                                value={filters.query}
                                onChange={(event) =>
                                    change({ q: event.target.value || null }, true)
                                }
                                placeholder="Search documents"
                                className={`${controlClass} pl-10 placeholder:text-content-placeholder`}
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="document-slice"
                            className="text-[13px] text-content-secondary"
                        >
                            Dataset slice
                        </label>
                        <select
                            id="document-slice"
                            value={filters.sliceId}
                            onChange={(event) => change({ slice: event.target.value })}
                            className={controlClass}
                        >
                            <option value="all">
                                {filters.grouping
                                    ? `All ${filters.grouping.label} values`
                                    : "All Documents"}
                            </option>
                            {filters.grouping?.slices.map((slice) => (
                                <option key={slice.id} value={slice.id}>
                                    {slice.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor="document-sort"
                            className="text-[13px] text-content-secondary"
                        >
                            Sort by
                        </label>
                        <select
                            id="document-sort"
                            value={filters.sort}
                            onChange={(event) => change({ sort: event.target.value })}
                            className={controlClass}
                        >
                            <option value="id">Document ID</option>
                            <option value="score">Concept Score (highest first)</option>
                        </select>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-[13px]">
                    <p className="text-primary">
                        Current dataset slice:{" "}
                        {filters.slice.kind === "all" ? "All Documents" : filters.slice.label}
                    </p>
                    <p className="text-content-secondary">
                        {filters.grouping
                            ? `Filtering by ${filters.grouping.label}${filters.grouping.provenance === "synthetic" ? " — preview metadata only" : ""}`
                            : "No dataset grouping selected"}
                    </p>
                </div>
                {selection.missing > 0 && (
                    <p className="mt-3 text-sm text-content-secondary">
                        {selection.missing} documents in this slice/search have unavailable scores
                        and are excluded from both views.
                    </p>
                )}
                {rangeError ? (
                    <div className="mt-4 rounded border border-outline p-4">
                        <p role="alert">This page is outside the filtered document range.</p>
                        <button
                            type="button"
                            onClick={() => updateResultQuery({ page: "1" }, true)}
                            className={`${pageClass} mt-3`}
                        >
                            Go to first page
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            role="region"
                            aria-label="Document scores table"
                            tabIndex={0}
                            className="mt-3 overflow-x-auto rounded focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            <table className="w-full min-w-[800px] table-fixed text-left text-[15px]">
                                <caption className="sr-only">
                                    {concept.name}: {label} documents for the active slice and
                                    search
                                </caption>
                                <thead className="bg-surface-subtle text-[13px] text-content-secondary">
                                    <tr>
                                        <th scope="col" className="w-[110px] px-4 py-3 font-medium">
                                            Document ID
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-medium">
                                            Document text
                                        </th>
                                        {metadataKey && (
                                            <th
                                                scope="col"
                                                className="w-[140px] px-4 py-3 font-medium"
                                            >
                                                {filters.grouping?.label}
                                            </th>
                                        )}
                                        <th scope="col" className="w-[130px] px-4 py-3 font-medium">
                                            Concept Score
                                        </th>
                                        <th scope="col" className="w-[80px] px-4 py-3 font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(({ document, record }) => (
                                        <tr key={document.id} className="even:bg-surface-subtle">
                                            <th
                                                scope="row"
                                                className="px-4 py-4 align-top text-[13px] font-normal text-content-secondary"
                                            >
                                                {document.id}
                                            </th>
                                            <td className="px-4 py-4 align-top break-words [overflow-wrap:anywhere]">
                                                {document.text}
                                            </td>
                                            {metadataKey && (
                                                <td className="px-4 py-4 align-top text-[13px] text-content-secondary">
                                                    {document.metadata[metadataKey] ?? "—"}
                                                </td>
                                            )}
                                            <td className="px-4 py-4 align-top font-medium">
                                                {record.score?.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 align-top">
                                                <button
                                                    type="button"
                                                    aria-label={`View document ${document.id}`}
                                                    onClick={() => onViewDocument(document.id)}
                                                    className="min-h-11 rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!total && (
                            <p className="py-8 text-center text-[15px] text-content-secondary">
                                {filters.query.trim()
                                    ? "No documents match your search in this view and slice."
                                    : filters.view === "matches"
                                      ? "No matching documents in this slice."
                                      : "No non-matching documents in this slice."}
                            </p>
                        )}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <p className="text-[13px] text-content-secondary">
                                Showing {start}–{end} of {total.toLocaleString("en-US")} documents
                            </p>
                            <nav aria-label="Document pagination" className="flex gap-3">
                                <button
                                    type="button"
                                    disabled={filters.page <= 1}
                                    onClick={() => {
                                        announce("");
                                        updateResultQuery({ page: String(filters.page - 1) });
                                    }}
                                    className={pageClass}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={filters.page >= pageCount}
                                    onClick={() => {
                                        announce("");
                                        updateResultQuery({ page: String(filters.page + 1) });
                                    }}
                                    className="inline-flex min-h-11 min-w-[108px] items-center justify-center rounded-[8px] bg-primary px-4 text-[15px] text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </>
                )}
            </div>
            <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={activeNotice ? "mt-3 text-sm text-content-secondary" : "sr-only"}
            >
                {activeNotice ||
                    (rangeError
                        ? "Choose a valid document page."
                        : `${total} ${label} documents. Showing ${start}–${end}.`)}
            </p>
        </section>
    );
}
