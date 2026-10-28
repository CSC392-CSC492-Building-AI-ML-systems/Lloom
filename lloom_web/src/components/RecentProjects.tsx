import RecentProjectItem from "./RecentProjectItem";

type Project = {
    id: string;
    name: string;
    lastOpened: Date;
};

const mockProjects: Project[] = [
    {
        id: "1",
        name: "Customer Feedback Analysis",
        lastOpened: new Date("2026-10-27T14:30:00"),
    },
    {
        id: "2",
        name: "Reddit Discussion Analysis",
        lastOpened: new Date("2026-10-25T10:15:00"),
    },
    {
        id: "3",
        name: "Survey Responses",
        lastOpened: new Date("2026-10-20T16:45:00"),
    },
];

export default function RecentProjects() {
    return (
        <section
            aria-labelledby="recent-projects-heading"
            className="mt-8 flex flex-1 flex-col md:min-h-0"
        >
            <h2
                id="recent-projects-heading"
                className="mb-4 shrink-0 text-xl font-medium text-content"
            >
                Recents
            </h2>

            <div className="flex-1 rounded-xl border border-outline bg-surface md:min-h-0 md:overflow-y-auto">
                {mockProjects.map((project) => (
                    <RecentProjectItem
                        key={project.id}
                        name={project.name}
                        lastOpened={project.lastOpened}
                    />
                ))}
            </div>
        </section>
    );
}