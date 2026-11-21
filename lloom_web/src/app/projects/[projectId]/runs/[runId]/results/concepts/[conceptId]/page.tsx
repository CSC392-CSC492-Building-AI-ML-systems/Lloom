import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { getProjectFixture } from "@/fixtures/projects";
import { isKnownResultRun } from "../../results-navigation";
import ConceptDetails from "./ConceptDetails";

export const metadata: Metadata = { title: "Concept Details | LLooM Web" };
export default async function ConceptPage({
    params,
}: {
    params: Promise<{ projectId: string; runId: string; conceptId: string }>;
}) {
    const { projectId, runId, conceptId } = await params;
    const project = getProjectFixture(projectId);
    if (!project || !isKnownResultRun(project, runId)) notFound();
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="min-w-0 flex-1 px-4 py-6 md:px-10">
                <ConceptDetails project={project} runId={runId} conceptId={conceptId} />
            </main>
        </div>
    );
}
