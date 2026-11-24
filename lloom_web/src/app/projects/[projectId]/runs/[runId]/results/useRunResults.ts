"use client";

import type { RunResults } from "@/fixtures/run-results";
import type { ProjectFixture } from "@/fixtures/projects";
import { createResultFixture, existingRunResults } from "@/fixtures/run-results.fixtures";
import { useProjectRuns } from "../../../ProjectRunProvider";

// The same availability and fixture resolution for Explorer and Concept Details.
export function useRunResults(project: ProjectFixture, runId: string) {
    const { runs } = useProjectRuns();
    const temporary = runs.find((run) => run.id === runId && run.projectId === project.id);
    const fixture = project.runs.find((run) => run.id === runId);
    const status = temporary?.status ?? fixture?.status;
    let results: RunResults | undefined;
    if (temporary?.status === "Completed") {
        const dataset = project.datasets.find((dataset) => dataset.id === temporary.datasetId);
        if (dataset)
            results = createResultFixture(
                project.id,
                runId,
                dataset,
                temporary.configuration.textColumn,
                temporary.concepts,
            );
    } else if (fixture?.status === "Completed") results = existingRunResults(project, runId);
    return {
        results,
        status,
        temporary,
        name: temporary?.name ?? fixture?.name ?? "Temporary run",
        estimatedCost: temporary ? temporary.estimatedCost : (fixture?.estimatedCost ?? null),
        actualCost: temporary ? temporary.actualCost : (fixture?.actualCost ?? null),
    };
}
