import { projectFixtures } from "./projects";
import { createDefaultConfiguration } from "@/app/projects/[projectId]/runs/new/configure-run.fixtures";
import type { RunConfiguration } from "@/app/projects/[projectId]/runs/new/run-configuration";

// Illustrative whole-run totals, NOT pricing calculations or real model estimates.
// A value belongs to one exact configuration; edits without a matching fixture return null.
const defaultEstimates: Record<string, number> = {
    "survey-2025": 0.48,
    "survey-2026": 0.56,
    "political-posts": 0.64,
};
const estimates = projectFixtures.flatMap((project) => [
    ...project.datasets.map((dataset) => ({
        configuration: createDefaultConfiguration([dataset]),
        estimatedCost: defaultEstimates[dataset.id] ?? null,
    })),
    ...project.runs.flatMap((run) =>
        run.status === "Draft"
            ? [
                  {
                      configuration: run.configuration,
                      estimatedCost: run.estimatedCost,
                  },
              ]
            : [],
    ),
]);

export function getFixtureEstimatedCost(configuration: RunConfiguration) {
    return (
        estimates.find((entry) =>
            (Object.keys(entry.configuration) as (keyof RunConfiguration)[]).every(
                (key) => entry.configuration[key] === configuration[key],
            ),
        )?.estimatedCost ?? null
    );
}
