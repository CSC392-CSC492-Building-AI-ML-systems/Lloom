import type { ReactNode } from "react";
import { getDemoProject } from "./project-data";
import ProjectRunProvider from "./ProjectRunProvider";

export default async function ProjectLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = await params;
    const project = getDemoProject(projectId);
    if (!project) return children;
    return (
        <ProjectRunProvider key={projectId} project={project}>
            {children}
        </ProjectRunProvider>
    );
}
