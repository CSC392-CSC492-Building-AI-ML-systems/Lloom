import "server-only";

import { ApiError, requestJson } from "./client";

// GET /projects in lloom_api/app/projects.py; distinct from workspace fixtures.
export type ProjectSummary = {
    id: string;
    name: string;
    description: string;
    created: string;
    lastOpened: string;
};

function isProjectSummary(value: unknown): value is ProjectSummary {
    if (typeof value !== "object" || value === null) return false;
    return (
        "id" in value &&
        typeof value.id === "string" &&
        "name" in value &&
        typeof value.name === "string" &&
        "description" in value &&
        typeof value.description === "string" &&
        "created" in value &&
        typeof value.created === "string" &&
        Number.isFinite(Date.parse(value.created)) &&
        "lastOpened" in value &&
        typeof value.lastOpened === "string" &&
        Number.isFinite(Date.parse(value.lastOpened))
    );
}

export async function getProjects(): Promise<ProjectSummary[]> {
    const body = await requestJson("/projects", { cache: "no-store" });
    if (!Array.isArray(body) || !body.every(isProjectSummary)) {
        throw new ApiError("The backend returned an invalid project list.", "response");
    }
    return body;
}
