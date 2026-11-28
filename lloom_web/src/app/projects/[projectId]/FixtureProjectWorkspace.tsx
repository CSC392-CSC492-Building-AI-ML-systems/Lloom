"use client";

import type { ProjectFixture, RunFixture } from "@/fixtures/projects";
import { useProjectRuns } from "./ProjectRunProvider";
import ProjectWorkspace from "./ProjectWorkspace";

export default function FixtureProjectWorkspace({
    project: fixtureProject,
}: {
    project: ProjectFixture;
}) {
    const { runs } = useProjectRuns();
    const temporaryRuns: RunFixture[] = runs.map((run) => {
        const common = {
            id: run.id,
            name: run.name,
            datasetId: run.datasetId,
            created: run.created,
            temporary: true as const,
            estimatedCost: run.estimatedCost,
            actualCost: run.actualCost,
        };
        return run.status === "Completed"
            ? { ...common, status: "Completed", concepts: run.concepts }
            : { ...common, status: run.status };
    });
    const project = { ...fixtureProject, runs: [...fixtureProject.runs, ...temporaryRuns] };
    return <ProjectWorkspace project={project} demo />;
}
