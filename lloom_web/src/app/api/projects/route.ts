import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { createProject } from "@/lib/api/projects";

export const runtime = "nodejs";

export async function POST(request: Request) {
    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return NextResponse.json(
            { detail: "Unable to read the upload. Please select your files and try again." },
            { status: 400 },
        );
    }
    try {
        const project = await createProject(form);
        return NextResponse.json({ id: project.id }, { status: 201 });
    } catch (error) {
        const status =
            error instanceof ApiError
                ? (error.status ?? (error.kind === "timeout" ? 504 : 502))
                : 500;
        const detail = error instanceof ApiError ? error.message : "Unable to create the project.";
        return NextResponse.json({ detail }, { status });
    }
}
