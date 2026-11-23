import Link from "next/link";
import type { ProjectFixture } from "@/fixtures/projects";

const actionClass =
    "inline-flex min-h-11 items-center rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
});

export default function ProjectRunsTable({ project }: { project: ProjectFixture }) {
    if (!project.runs.length)
        return (
            <p className="mt-4 text-[15px] text-content-secondary">
                No runs yet. Choose New Run to configure your first analysis.
            </p>
        );
    return (
        <div
            role="region"
            aria-label="LLooM runs table"
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-md focus-visible:outline-2 focus-visible:outline-primary"
        >
            <table className="w-full min-w-[760px] text-left text-[13px]">
                <caption className="sr-only">Fixture analysis runs for {project.name}</caption>
                <thead className="bg-surface-subtle text-[11px] text-content-secondary">
                    <tr>
                        {["Run", "Dataset", "Status", "Concepts", "Created", "Action"].map(
                            (heading) => (
                                <th key={heading} scope="col" className="px-3 py-3 font-bold">
                                    {heading}
                                </th>
                            ),
                        )}
                    </tr>
                </thead>
                <tbody>
                    {[...project.runs]
                        .sort((a, b) => b.created.localeCompare(a.created))
                        .map((run) => (
                            <tr key={run.id} className="border-t border-outline">
                                <th scope="row" className="px-3 py-4 text-sm font-medium">
                                    {run.name}
                                </th>
                                <td className="px-3 py-4 text-content-secondary">
                                    {project.datasets.find(
                                        (dataset) => dataset.id === run.datasetId,
                                    )?.name ?? "Unavailable dataset"}
                                </td>
                                <td className="px-3 py-4">
                                    <span
                                        className={`inline-block min-w-[100px] rounded-full px-3 py-1 text-center font-medium ${run.status === "Completed" ? "bg-success-surface text-success" : run.status === "Running" || run.status === "Pending" ? "bg-info-surface text-primary" : run.status === "Failed" || run.status === "Cancelled" ? "bg-surface-subtle text-danger" : "bg-page text-content-secondary"}`}
                                    >
                                        {run.status}
                                    </span>
                                </td>
                                <td className="px-3 py-4 text-content-secondary">
                                    {run.status === "Completed" ? run.concepts : "—"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-content-secondary">
                                    <time dateTime={run.created}>
                                        {dateFormatter.format(
                                            new Date(
                                                run.created.length === 10
                                                    ? `${run.created}T00:00:00Z`
                                                    : run.created,
                                            ),
                                        )}
                                    </time>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                    {run.temporary && run.status !== "Completed" ? (
                                        <Link
                                            aria-label={`View progress for ${run.name}`}
                                            href={`/projects/${project.id}/runs/${encodeURIComponent(run.id)}/progress`}
                                            className={actionClass}
                                        >
                                            View Progress
                                        </Link>
                                    ) : run.status === "Draft" ? (
                                        <Link
                                            aria-label={`Resume ${run.name}`}
                                            href={`/projects/${project.id}/runs/new?draft=${encodeURIComponent(run.id)}`}
                                            className={actionClass}
                                        >
                                            Resume
                                        </Link>
                                    ) : (
                                        <Link
                                            aria-label={`View results for ${run.name}`}
                                            href={`/projects/${project.id}/runs/${encodeURIComponent(run.id)}/results`}
                                            className={actionClass}
                                        >
                                            View Results
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}
