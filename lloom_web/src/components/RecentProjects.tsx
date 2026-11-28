import RecentProjectItem from "./RecentProjectItem";
import { Suspense } from "react";
import { ApiError } from "@/lib/api/client";
import { getProjects } from "@/lib/api/projects";

async function ProjectList() {
    let projects;
    try {
        projects = await getProjects();
    } catch (error) {
        return (
            <div className="px-5 py-6 text-content-secondary">
                <p role="alert">
                    {error instanceof ApiError ? error.message : "Unable to load projects."}
                </p>
                <form action="/" method="get">
                    <button
                        type="submit"
                        className="mt-3 inline-block cursor-pointer text-primary underline"
                    >
                        Try again
                    </button>
                </form>
            </div>
        );
    }
    if (projects.length === 0) {
        return <p className="px-5 py-6 text-content-secondary">No projects yet.</p>;
    }
    return (
        <>
            {projects.map((project) => (
                <RecentProjectItem
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    lastOpened={new Date(project.lastOpened)}
                />
            ))}
        </>
    );
}

export default function RecentProjects() {
    return (
        <section
            aria-labelledby="recent-projects-heading"
            className="mt-8 flex flex-1 flex-col md:min-h-0"
        >
            <h1
                id="recent-projects-heading"
                className="mb-4 shrink-0 border-b border-content pb-1 text-2xl font-medium text-content"
            >
                Recents
            </h1>

            <div className="flex-1 rounded-xl border border-outline bg-surface md:min-h-0 md:overflow-y-auto">
                <Suspense
                    fallback={
                        <p role="status" className="px-5 py-6 text-content-secondary">
                            Loading projects…
                        </p>
                    }
                >
                    <ProjectList />
                </Suspense>
            </div>
        </section>
    );
}
