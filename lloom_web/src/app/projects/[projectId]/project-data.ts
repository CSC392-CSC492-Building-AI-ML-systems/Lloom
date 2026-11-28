import "server-only";

import { getProjectFixture } from "@/fixtures/projects";
import { getProject } from "@/lib/api/projects";

// Explicit demo routes are preserved; backend failures never select a fixture.
export const getDemoProject = getProjectFixture;

export async function resolveProject(id: string) {
    const demo = getDemoProject(id);
    if (demo) return { source: "demo" as const, project: demo };
    return { source: "backend" as const, project: await getProject(id) };
}
