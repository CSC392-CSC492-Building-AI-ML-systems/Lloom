"use client";

import Link from "next/link";
import Header from "@/components/Header";

export default function ProjectError() {
    return (
        <>
            <Header showSearch={false} />
            <main className="px-4 py-6 md:px-10">
                <h1 className="text-2xl font-medium">Unable to load project</h1>
                <p role="alert" className="mt-3 text-content-secondary">
                    The backend could not return this project. Check that it is running, then reload
                    to try again. If you just created this project, it may already be saved; you do
                    not need to upload it again.
                </p>
                <form method="get" className="mt-4">
                    <button
                        type="submit"
                        className="rounded text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        Try again
                    </button>
                </form>
                <Link
                    href="/"
                    className="mt-4 inline-block rounded text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                    Back to projects
                </Link>
            </main>
        </>
    );
}
