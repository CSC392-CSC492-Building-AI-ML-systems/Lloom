"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";

export default function ResultsNotFound() {
    const { projectId } = useParams<{ projectId: string }>();
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="px-4 py-6 md:px-10">
                <h1 className="text-2xl font-medium">Run results not found</h1>
                <p className="mt-3 text-content-secondary">
                    This run is not available for the selected project.
                </p>
                <Link
                    href={`/projects/${encodeURIComponent(projectId)}`}
                    className="mt-5 inline-flex min-h-11 items-center rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                    Back to Project
                </Link>
            </main>
        </div>
    );
}
