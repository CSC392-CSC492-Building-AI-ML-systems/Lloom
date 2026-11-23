import type { ReactNode } from "react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProjectFixture } from "@/fixtures/projects";
import RunConfigurationProvider from "./RunConfigurationProvider";

export default async function NewRunLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = await params;
    const project = getProjectFixture(projectId);
    if (!project) notFound();
    return (
        <Suspense fallback={<p className="p-6">Loading run configuration...</p>}>
            <RunConfigurationProvider key={projectId} project={project}>
                {children}
            </RunConfigurationProvider>
        </Suspense>
    );
}
