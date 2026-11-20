import type { ProjectFixture } from "@/fixtures/projects";
import type { RunConfiguration } from "./new/run-configuration";
import { createDefaultConfiguration, fixtureModelSettings } from "./new/configure-run.fixtures";

export type RunStatus = "Pending" | "Running" | "Completed" | "Failed" | "Cancelled";
export type Stage = "Distill" | "Cluster" | "Synthesize" | "Score";
export type Operation = {
    stage: Stage;
    title: string;
    description: string;
    duration: number;
    round?: number;
};
export type SimulatedRun = {
    id: string;
    name: string;
    projectId: string;
    datasetId: string;
    created: string;
    configuration: RunConfiguration;
    model: { provider: string; model: string };
    status: RunStatus;
    operations: Operation[];
    operationIndex: number;
    dueAt: number | null;
    scenario: "success" | "failure";
    concepts: number;
};
export const stages: { name: Stage; description: string }[] = [
    { name: "Distill", description: "Extracting representative text excerpts from the dataset." },
    { name: "Cluster", description: "Grouping semantically similar excerpts." },
    { name: "Synthesize", description: "Generating concepts from the identified clusters." },
    { name: "Score", description: "Evaluating documents against the generated concepts." },
];

// Mirrors workbench.gen(): distillation, repeated cluster/synthesize/review, then score().
// These durations demonstrate transitions; they are not estimates of real model performance.
export function createOperations(configuration: RunConfiguration): Operation[] {
    const operations: Operation[] = [
        {
            stage: "Distill",
            title: "Distilling documents",
            description:
                "Simulating excerpt filtering and bullet summaries from the selected text column.",
            duration: 3000,
        },
    ];
    for (let round = 1; round <= configuration.synthesisRounds; round++) {
        operations.push(
            {
                stage: "Cluster",
                title: "Clustering excerpts",
                description:
                    "Simulating groups of semantically similar excerpts or concepts from the previous round.",
                duration: 2000,
                round,
            },
            {
                stage: "Synthesize",
                title: "Synthesizing concepts",
                description:
                    "Simulating concept names and descriptions from the clustered excerpts.",
                duration: 3000,
                round,
            },
        );
        if (configuration.automaticReview)
            operations.push({
                stage: "Synthesize",
                title: "Reviewing concepts",
                description:
                    "Simulating removal of low-quality concepts and merging similar concepts.",
                duration: 1000,
                round,
            });
    }
    operations.push({
        stage: "Score",
        title: "Scoring documents",
        description:
            "Simulating document evaluation against the generated concepts. No model requests are made.",
        duration: 3000,
    });
    return operations;
}

export function createSimulatedRun(
    project: ProjectFixture,
    id: string,
    configuration: RunConfiguration,
    now: number,
    scenario: "success" | "failure" = "success",
): SimulatedRun {
    return {
        id,
        projectId: project.id,
        name: `Simulated run — ${project.datasets.find((d) => d.id === configuration.datasetId)?.name ?? "dataset"}`,
        datasetId: configuration.datasetId,
        created: new Date(now).toISOString(),
        configuration: { ...configuration },
        model: { ...fixtureModelSettings },
        operations: createOperations(configuration),
        operationIndex: -1,
        status: "Pending",
        dueAt: now + 500,
        scenario,
        concepts: 0,
    };
}

export function advanceRun(run: SimulatedRun, now: number): SimulatedRun {
    let next = run;
    while (next.dueAt !== null && next.dueAt <= now) {
        const current = next.operations[next.operationIndex];
        if (next.scenario === "failure" && current?.title === "Synthesizing concepts")
            return { ...next, status: "Failed", dueAt: null };
        const operationIndex = next.operationIndex + 1;
        const operation = next.operations[operationIndex];
        if (!operation) return completeRun(next);
        next = {
            ...next,
            operationIndex,
            status: "Running",
            dueAt: next.dueAt + operation.duration,
        };
    }
    return next;
}
export function completeRun(run: SimulatedRun): SimulatedRun {
    return {
        ...run,
        status: "Completed",
        operationIndex: run.operations.length,
        dueAt: null,
        concepts: Math.min(Number(run.configuration.targetConcepts), 6),
    };
}
export function stageStatus(run: SimulatedRun, stage: Stage) {
    if (run.status === "Completed") return "Completed";
    const current = run.operations[run.operationIndex];
    if (current?.stage === stage) return run.status === "Running" ? "In progress" : run.status;
    if (
        run.operations.some(
            (op, index) =>
                op.stage === stage &&
                index > run.operationIndex &&
                (!current?.round || !op.round || op.round === current.round),
        )
    )
        return run.status === "Failed" || run.status === "Cancelled" ? "Not run" : "Pending";
    return "Completed";
}

// Explicit, reproducible demo URLs; not real runs, credentials, or backend failures.
export function isSimulationPreview(id: string) {
    return id === "demo-success" || id === "demo-failure";
}
export function createPreviewRun(project: ProjectFixture, id: string, now: number) {
    if (!isSimulationPreview(id) || !project.datasets.length) return undefined;
    return createSimulatedRun(
        project,
        id,
        createDefaultConfiguration(project.datasets),
        now,
        id === "demo-failure" ? "failure" : "success",
    );
}
export function completedFixtureRun(project: ProjectFixture, id: string) {
    const fixture = project.runs.find((run) => run.id === id && run.status === "Completed");
    if (!fixture || fixture.status !== "Completed") return undefined;
    const dataset = project.datasets.find((d) => d.id === fixture.datasetId);
    if (!dataset) return undefined;
    const configuration = createDefaultConfiguration([dataset]);
    const run = completeRun(createSimulatedRun(project, fixture.id, configuration, 0));
    return { ...run, name: fixture.name, created: fixture.created, concepts: fixture.concepts };
}
