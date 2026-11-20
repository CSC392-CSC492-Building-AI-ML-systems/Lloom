import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getProjectFixture } from "@/fixtures/projects";
import ProjectRunProvider from "./ProjectRunProvider";

export default async function ProjectLayout({
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
        <ProjectRunProvider key={projectId} project={project}>
            {children}
        </ProjectRunProvider>
    );
}
