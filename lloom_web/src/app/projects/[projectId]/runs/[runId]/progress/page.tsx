import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { getProjectFixture } from "@/fixtures/projects";
import { isSimulationPreview } from "../../run-simulation";
import RunProgress from "./RunProgress";

export const metadata: Metadata = { title: "Run Progress | LLooM Web" };
export default async function RunProgressPage({
    params,
}: {
    params: Promise<{ projectId: string; runId: string }>;
}) {
    const { projectId, runId } = await params;
    const project = getProjectFixture(projectId);
    if (!project) notFound();
    const fixture = project.runs.find((run) => run.id === runId && run.status === "Completed");
    const temporary = new RegExp(`^sim-${project.id}-[0-9]+-[0-9]+$`).test(runId);
    if (!fixture && !temporary && !(isSimulationPreview(runId) && project.datasets.length))
        notFound();
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="min-w-0 flex-1 px-4 py-6 md:px-10">
                <RunProgress project={project} runId={runId} />
            </main>
        </div>
    );
}
