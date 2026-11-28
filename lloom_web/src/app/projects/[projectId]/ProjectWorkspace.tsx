"use client";

import Link from "next/link";
import { FileText, Settings } from "lucide-react";
import { useState } from "react";
import type { Dataset } from "@/lib/api/types";
import type { WorkspaceRun } from "./ProjectRunsTable";
import ProjectRunsTable from "./ProjectRunsTable";
import AddDatasetDialog from "@/components/AddDatasetDialog";

const cardClass = "min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6";
const headingClass = "border-l-[5px] border-primary pl-3 text-[23px] font-medium";
const focusClass =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export type WorkspaceProject = {
    id: string;
    name: string;
    description: string;
    datasets: Dataset[];
    runs: WorkspaceRun[];
};

export default function ProjectWorkspace({
    project,
    demo = false,
}: {
    project: WorkspaceProject;
    demo?: boolean;
}) {
    const [notice, setNotice] = useState("");
    const [addingDataset, setAddingDataset] = useState(false);
    const latestCompleted = project.runs
        .filter((run) => run.status === "Completed")
        .sort((a, b) => b.created.localeCompare(a.created))[0];
    const summaries = [
        { title: "Datasets", value: project.datasets.length, caption: "Uploaded datasets" },
        { title: "LLooM Runs", value: project.runs.length, caption: "Total analyses" },
        {
            title: "Latest completed run",
            value: latestCompleted?.status === "Completed" ? latestCompleted.concepts : "—",
            caption: latestCompleted ? "Concepts generated" : "No completed runs yet",
        },
    ];
    return (
        <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                    <h1 className="text-2xl font-medium break-words md:text-[32px]">
                        {project.name}
                    </h1>
                    <p className="mt-1 text-base text-content-secondary">{project.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                    <button
                        type="button"
                        onClick={() =>
                            setNotice(
                                "Project settings are not implemented yet. No settings have been changed.",
                            )
                        }
                        className={`flex min-h-[46px] items-center gap-1 rounded px-2 text-[15px] text-content-secondary hover:bg-surface-subtle ${focusClass}`}
                    >
                        <Settings size={18} aria-hidden="true" />
                        Project Settings
                    </button>
                    {demo ? (
                        <Link
                            href={`/projects/${project.id}/runs/new`}
                            className={`flex min-h-[46px] min-w-[154px] items-center justify-center rounded-[9px] bg-primary px-4 text-[15px] font-medium text-on-primary hover:opacity-90 ${focusClass}`}
                        >
                            New Run
                        </Link>
                    ) : (
                        <button
                            disabled
                            className="flex min-h-[46px] min-w-[154px] items-center justify-center rounded-[9px] bg-primary px-4 text-[15px] font-medium text-on-primary opacity-50"
                        >
                            New Run
                        </button>
                    )}
                </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
                {summaries.map((summary) => (
                    <section key={summary.title} aria-label={summary.title} className={cardClass}>
                        <h2 className="text-[15px] font-medium">{summary.title}</h2>
                        <p className="mt-1 text-[30px] font-medium">{summary.value}</p>
                        <p className="mt-1 text-[15px] text-content-secondary">{summary.caption}</p>
                    </section>
                ))}
            </div>
            <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,900fr)_minmax(0,436fr)]">
                <section aria-labelledby="workspace-runs-heading" className={cardClass}>
                    <h2 id="workspace-runs-heading" className={headingClass}>
                        LLooM Runs
                    </h2>
                    <p className="mt-2 text-[15px] text-content-secondary">
                        View previous analyses and their results.
                    </p>
                    <ProjectRunsTable project={project} demo={demo} />
                </section>
                <section aria-labelledby="workspace-datasets-heading" className={cardClass}>
                    <h2 id="workspace-datasets-heading" className={headingClass}>
                        Datasets
                    </h2>
                    <p className="mt-2 text-[15px] text-content-secondary">
                        Files available for analysis.
                    </p>
                    {project.datasets.length ? (
                        <ul className="mt-4 space-y-3">
                            {project.datasets.map((dataset) => (
                                <li
                                    key={dataset.id}
                                    className="flex min-w-0 items-center gap-3 rounded-[9px] bg-surface-subtle px-3 py-4"
                                >
                                    <FileText
                                        size={21}
                                        className="shrink-0 text-content-secondary"
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-medium break-words">
                                            {dataset.name}
                                        </h3>
                                        <p className="mt-2 text-[13px] text-content-secondary">
                                            {dataset.rowCount.toLocaleString("en-US")} documents ·{" "}
                                            {dataset.format}
                                        </p>
                                        {!demo && (
                                            <details className="mt-2 text-[13px] text-content-secondary">
                                                <summary className="cursor-pointer rounded text-primary focus-visible:outline-2 focus-visible:outline-primary">
                                                    Columns and preview
                                                </summary>
                                                <p className="mt-2 break-words">
                                                    Columns: {dataset.columns.join(", ") || "None"}
                                                </p>
                                                <p className="mt-1 break-words">
                                                    Text columns:{" "}
                                                    {dataset.textColumns.join(", ") || "None"}
                                                </p>
                                                {dataset.sampleRows.length ? (
                                                    <div
                                                        role="region"
                                                        aria-label={`${dataset.name} preview`}
                                                        tabIndex={0}
                                                        className="mt-2 max-h-48 overflow-auto rounded border border-outline focus-visible:outline-2 focus-visible:outline-primary"
                                                    >
                                                        <table className="w-full text-left text-xs">
                                                            <caption className="sr-only">
                                                                First sample rows of {dataset.name}
                                                            </caption>
                                                            <thead>
                                                                <tr>
                                                                    {dataset.columns.map(
                                                                        (column) => (
                                                                            <th
                                                                                key={column}
                                                                                scope="col"
                                                                                className="px-2 py-1 font-medium"
                                                                            >
                                                                                {column}
                                                                            </th>
                                                                        ),
                                                                    )}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {dataset.sampleRows.map(
                                                                    (row, index) => (
                                                                        <tr
                                                                            key={index}
                                                                            className="border-t border-outline"
                                                                        >
                                                                            {dataset.columns.map(
                                                                                (column) => (
                                                                                    <td
                                                                                        key={column}
                                                                                        className="max-w-64 min-w-24 px-2 py-1 break-words"
                                                                                    >
                                                                                        {row[
                                                                                            column
                                                                                        ] ?? ""}
                                                                                    </td>
                                                                                ),
                                                                            )}
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="mt-2">
                                                        No sample rows available.
                                                    </p>
                                                )}
                                            </details>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-[15px] text-content-secondary">
                            No datasets yet. Additional dataset uploads are not connected yet.
                        </p>
                    )}
                    <button
                        type="button"
                        disabled={!demo}
                        aria-describedby={!demo ? "add-dataset-unavailable" : undefined}
                        onClick={() => {
                            if (demo) setAddingDataset(true);
                        }}
                        className={`mt-4 disabled:cursor-not-allowed disabled:opacity-50 min-h-11 w-full rounded-[9px] border border-primary px-3 text-[15px] font-medium text-primary hover:bg-surface-subtle ${focusClass}`}
                    >
                        + Add Dataset
                    </button>
                    {!demo && (
                        <p
                            id="add-dataset-unavailable"
                            className="mt-2 text-sm text-content-secondary"
                        >
                            Adding datasets to existing projects is not yet supported.
                        </p>
                    )}
                </section>
            </div>
            <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-sm text-content-secondary empty:hidden"
            >
                {notice}
            </p>
            <p className="text-xs text-content-secondary">
                {demo
                    ? "Fixture project preview — datasets and runs are illustrative. Nothing is uploaded or executed."
                    : "Run creation, execution, and results are not connected yet. Adding datasets to existing projects is not yet supported."}
            </p>
            {demo && addingDataset && (
                <AddDatasetDialog
                    projectName={project.name}
                    onClose={() => setAddingDataset(false)}
                />
            )}
        </div>
    );
}
