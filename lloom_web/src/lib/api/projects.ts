import "server-only";

import { ApiError, requestJson } from "./client";

import { cache } from "react";
import type { Dataset, ProjectDetail, ProjectRun, ProjectSummary } from "./types";
export type { ProjectSummary } from "./types";

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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isDataset(value: unknown): value is Dataset {
    return (
        isRecord(value) &&
        typeof value.id === "string" &&
        typeof value.name === "string" &&
        (value.format === "CSV" || value.format === "JSON") &&
        isStringArray(value.columns) &&
        isStringArray(value.textColumns) &&
        Number.isInteger(value.rowCount) &&
        Number(value.rowCount) >= 0 &&
        Array.isArray(value.sampleRows) &&
        value.sampleRows.every(
            (row: unknown) =>
                isRecord(row) && Object.values(row).every((cell) => typeof cell === "string"),
        )
    );
}

function isRun(value: unknown): value is ProjectRun {
    if (
        !isRecord(value) ||
        typeof value.id !== "string" ||
        typeof value.name !== "string" ||
        typeof value.datasetId !== "string" ||
        typeof value.created !== "string" ||
        !Number.isFinite(Date.parse(value.created))
    )
        return false;
    if (value.status === "Draft") return isRecord(value.configuration);
    if (value.status === "Completed")
        return Number.isInteger(value.concepts) && Number(value.concepts) >= 0;
    return (
        ["Pending", "Running", "Failed", "Cancelled"].includes(String(value.status)) &&
        value.temporary === true
    );
}

function projectDetail(body: unknown): ProjectDetail {
    if (
        !isProjectSummary(body) ||
        !("datasets" in body) ||
        !Array.isArray(body.datasets) ||
        !body.datasets.every(isDataset) ||
        !("runs" in body) ||
        !Array.isArray(body.runs) ||
        !body.runs.every(isRun)
    ) {
        throw new ApiError("The backend returned an invalid project response.", "response");
    }
    return { ...body, datasets: body.datasets, runs: body.runs };
}

// Request-scoped only: metadata and page rendering share one GET and lastOpened update.
export const getProject = cache(async (id: string): Promise<ProjectDetail> =>
    projectDetail(await requestJson(`/projects/${encodeURIComponent(id)}`, { cache: "no-store" })),
);

export async function createProject(form: FormData): Promise<ProjectDetail> {
    return projectDetail(
        await requestJson("/projects", { method: "POST", body: form, timeoutMs: 60_000 }),
    );
}
