import RecentProjectItem from "./RecentProjectItem";

import { projectFixtures } from "@/fixtures/projects";

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
                {projectFixtures.map((project) => (
                    <RecentProjectItem
                        key={project.id}
                        id={project.id}
                        name={project.name}
                        lastOpened={new Date(project.lastOpened)}
                    />
                ))}
            </div>
        </section>
    );
}
