import type { ProjectFixture } from "@/fixtures/projects";
import { allDocumentsSlice } from "@/fixtures/run-results";
import type { RunResults } from "@/fixtures/run-results";
import { isSimulationPreview } from "../../run-simulation";

export function isKnownResultRun(project: ProjectFixture, runId: string) {
    return (
        project.runs.some((run) => run.id === runId) ||
        new RegExp(`^sim-${project.id}-[0-9]+-[0-9]+$`).test(runId) ||
        (isSimulationPreview(runId) && project.datasets.length > 0)
    );
}
export function explorerHref(projectId: string, runId: string, groupingId: string) {
    return `/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/results?${new URLSearchParams({ groupBy: groupingId })}`;
}
export function conceptHref(
    projectId: string,
    runId: string,
    conceptId: string,
    groupingId: string,
    sliceId = "all",
) {
    const query = new URLSearchParams({ groupBy: groupingId, slice: sliceId, view: "matches" });
    return `/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/results/concepts/${encodeURIComponent(conceptId)}?${query}`;
}

export function readResultQuery(
    search: Pick<URLSearchParams, "getAll" | "get">,
    results: RunResults,
) {
    const keys = ["groupBy", "slice", "view", "sort", "q", "page"];
    let error = keys.some((key) => search.getAll(key).length > 1)
        ? "A filter was supplied more than once."
        : "";
    const groupingId = search.get("groupBy") ?? results.groupings[0]?.id ?? "all";
    const grouping = results.groupings.find((item) => item.id === groupingId);
    if (groupingId !== "all" && !grouping)
        error = "This grouping is not available for this result fixture.";
    const sliceId = search.get("slice") ?? "all";
    const slice =
        sliceId === "all"
            ? allDocumentsSlice
            : grouping?.slices.find((item) => item.id === sliceId);
    if (!slice) error = "This dataset slice does not belong to the selected grouping.";
    const view = search.get("view") ?? "matches";
    if (view !== "matches" && view !== "non-matches")
        error = "This document view is not supported.";
    const sort = search.get("sort") ?? "id";
    if (sort !== "id" && sort !== "score") error = "This sort option is not supported.";
    const rawPage = search.get("page") ?? "1";
    const page = Number(rawPage);
    if (!/^[1-9][0-9]*$/.test(rawPage) || !Number.isSafeInteger(page))
        error = "The page number must be a positive integer.";
    return {
        groupingId,
        grouping,
        sliceId,
        slice,
        view: view === "non-matches" ? ("non-matches" as const) : ("matches" as const),
        sort: sort === "score" ? ("score" as const) : ("id" as const),
        query: search.get("q") ?? "",
        page,
        error,
    };
}

// Native history updates query-only UI state without reloading or unmounting the project.
export function updateResultQuery(patch: Record<string, string | null>, replace = false) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
        if (value === null) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
    }
    const href = url.pathname + (url.search ? url.search : "");
    // Next.js copies its router state into these entries and synchronizes search params.
    if (replace) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
}
export function resetResultQuery(results: RunResults) {
    const query = new URLSearchParams({ groupBy: results.groupings[0]?.id ?? "all" });
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
}
