import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { getProjectFixture } from "@/fixtures/projects";
import { isKnownResultRun } from "./results-navigation";
import ConceptExplorer from "./ConceptExplorer";

export const metadata: Metadata = { title: "Concept Explorer | LLooM Web" };
export default async function ResultsPage({
    params,
}: {
    params: Promise<{ projectId: string; runId: string }>;
}) {
    const { projectId, runId } = await params;
    const project = getProjectFixture(projectId);
    if (!project) notFound();
    if (!isKnownResultRun(project, runId)) notFound();
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="min-w-0 flex-1 px-4 py-6 md:px-10">
                <ConceptExplorer project={project} runId={runId} />
            </main>
        </div>
    );
}
