"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";

export default function ConceptNotFound() {
    const { projectId, runId } = useParams<{ projectId: string; runId: string }>();
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="px-4 py-6 md:px-10">
                <h1 className="text-2xl font-medium">Concept not found</h1>
                <p className="mt-3 text-content-secondary">
                    This concept or run does not belong to the selected project.
                </p>
                <Link
                    href={`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/results`}
                    className="mt-5 inline-flex min-h-11 items-center rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                    Back to Concept Explorer
                </Link>
            </main>
        </div>
    );
}
