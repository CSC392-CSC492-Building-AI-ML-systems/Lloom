import Link from "next/link";
import Header from "@/components/Header";

export default function ProjectNotFound() {
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="px-4 py-6 md:px-10">
                <h1 className="text-2xl font-medium">Project not found</h1>
                <p className="mt-3 text-content-secondary">This project could not be found.</p>
                <Link
                    href="/"
                    className="mt-5 inline-flex min-h-11 items-center rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                    Back to projects
                </Link>
            </main>
        </div>
    );
}
