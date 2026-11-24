"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import type { ProjectFixture } from "@/fixtures/projects";
import { useProjectRuns } from "../../../ProjectRunProvider";
import { completedFixtureRun, isSimulationPreview, getLatestJob } from "../../run-simulation";
import type { SimulatedRun } from "../../run-simulation";
import AnalysisProgress from "./AnalysisProgress";
import { modelLabel, providerLabel } from "@/fixtures/models";

const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-[8px] border border-outline bg-surface px-5 text-[15px] text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function RunProgress({
    project,
    runId,
}: {
    project: ProjectFixture;
    runId: string;
}) {
    const { runs, openPreview, cancelRun, finishRun, retryRun } = useProjectRuns();
    const router = useRouter();
    const { projectId } = useParams<{ projectId: string }>();
    const resultsHref = `/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/results`;
    const run = runs.find((item) => item.id === runId) ?? completedFixtureRun(project, runId);
    const [notice, setNotice] = useState("");
    useEffect(() => {
        if (!run && isSimulationPreview(runId)) openPreview(runId);
    }, [run, runId, openPreview]);
    if (!run)
        return (
            <section>
                <h1 className="text-2xl font-medium">
                    {isSimulationPreview(runId)
                        ? "Preparing simulated run"
                        : "Temporary run unavailable"}
                </h1>
                <p className="mt-3 text-content-secondary">
                    Temporary runs reset on refresh or when leaving this project. No backend
                    analysis was started.
                </p>
                <Link href={`/projects/${project.id}`} className={`${buttonClass} mt-5`}>
                    Back to Project
                </Link>
            </section>
        );
    return (
        <ProgressContent
            key={run.id}
            project={project}
            run={run}
            notice={notice}
            onCancel={() => {
                cancelRun(run.id);
                setNotice("Simulation cancelled. No backend analysis was running.");
            }}
            onComplete={() => {
                finishRun(run.id);
                router.push(resultsHref);
            }}
            onResults={() => router.push(resultsHref)}
            onRetry={() => {
                retryRun(run.id);
                setNotice("Simulation restarted from Distill. No backend job was submitted.");
            }}
        />
    );
}

function ProgressContent({
    project,
    run,
    notice,
    onCancel,
    onComplete,
    onResults,
    onRetry,
}: {
    project: ProjectFixture;
    run: SimulatedRun;
    notice: string;
    onCancel: () => void;
    onComplete: () => void;
    onResults: () => void;
    onRetry: () => void;
}) {
    const dataset = project.datasets.find((item) => item.id === run.datasetId);
    const active = run.status === "Pending" || run.status === "Running";
    const operation = run.operations[run.operationIndex];
    const latestJob = getLatestJob(run);
    const title =
        run.status === "Pending"
            ? "Run Pending"
            : run.status === "Running"
              ? "Run in Progress"
              : `Run ${run.status}`;
    const activity =
        run.status === "Running"
            ? operation?.title
            : run.status === "Pending"
              ? "Waiting to start"
              : `Simulation ${run.status.toLowerCase()}`;
    const description =
        run.status === "Running"
            ? operation?.description
            : run.status === "Completed"
              ? `Simulated discovery and scoring are complete. ${run.concepts} fixture concepts are represented; no actual concepts or scores were generated.`
              : run.status === "Failed"
                ? latestJob.error ||
                  "The run failed without a failure reason. No provider requests occur in this simulation."
                : run.status === "Cancelled"
                  ? "The simulation has stopped. Remaining operations will not run."
                  : "The simulated pipeline will start shortly. No model requests are made.";
    const summary = [
        ["Run", run.name],
        ["Dataset", dataset?.name ?? "Unavailable dataset"],
        ["Documents", dataset?.rowCount.toLocaleString("en-US") ?? "—"],
        ["Target concepts", run.configuration.targetConcepts],
        ["Model", modelLabel(run.model.model)],
    ];
    const Icon = active ? LoaderCircle : run.status === "Completed" ? CircleCheck : CircleX;
    return (
        <div className="space-y-6">
            <nav aria-label="Breadcrumb" className="text-[15px]">
                <ol className="flex flex-wrap gap-x-2 gap-y-1">
                    <li>
                        <Link
                            href="/"
                            className="rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            Projects
                        </Link>
                    </li>
                    <li className="min-w-0">
                        <span aria-hidden="true" className="mr-2">
                            /
                        </span>
                        <Link
                            href={`/projects/${project.id}`}
                            className="rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            {project.name}
                        </Link>
                    </li>
                    <li aria-current="page" className="min-w-0 break-words text-content-secondary">
                        <span aria-hidden="true" className="mr-2">
                            /
                        </span>
                        {run.name}
                    </li>
                </ol>
            </nav>
            <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                    <h1 className="text-2xl font-medium md:text-[30px]">{title}</h1>
                    <p className="mt-1 text-base text-content-secondary">
                        Simulating LLooM&apos;s document analysis and concept generation.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                    <span
                        className={`inline-flex min-h-8 items-center gap-2 rounded-full px-5 text-[13px] ${run.status === "Completed" ? "bg-success-surface text-success" : run.status === "Failed" || run.status === "Cancelled" ? "bg-surface text-danger" : "bg-info-surface text-primary"}`}
                    >
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                        {run.status}
                    </span>
                    <Link href={`/projects/${project.id}`} className={buttonClass}>
                        Back to Project
                    </Link>
                </div>
            </div>
            <dl
                aria-label="Run summary"
                className="grid min-w-0 gap-5 rounded-[14px] border border-outline bg-surface p-5 sm:grid-cols-2 md:p-6 xl:grid-cols-[1.7fr_1.6fr_1fr_1fr_1fr]"
            >
                {summary.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                        <dt className="text-[13px] text-content-secondary">{label}</dt>
                        <dd className="mt-1.5 text-base font-medium break-words">{value}</dd>
                    </div>
                ))}
            </dl>
            <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,850fr)_minmax(0,486fr)]">
                <AnalysisProgress run={run} />
                <section
                    aria-labelledby="current-activity-heading"
                    className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
                >
                    <h2
                        id="current-activity-heading"
                        className="border-l-[3px] border-primary pl-2.5 text-xl font-medium"
                    >
                        Current Activity
                    </h2>
                    <div className="mt-6 flex items-center gap-3">
                        <span
                            aria-hidden="true"
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${run.status === "Completed" ? "bg-success-surface text-success" : "bg-info-surface text-primary"}`}
                        >
                            <Icon
                                size={24}
                                className={active ? "animate-spin motion-reduce:animate-none" : ""}
                            />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-lg font-medium text-primary">{activity}</h3>
                            {operation?.round && run.status === "Running" && (
                                <p className="text-sm text-content-secondary">
                                    Round {operation.round} of {run.configuration.synthesisRounds}
                                </p>
                            )}
                        </div>
                    </div>
                    <p
                        role={run.status === "Failed" ? "alert" : undefined}
                        className="mt-6 text-base whitespace-pre-wrap break-words text-content-secondary"
                    >
                        {description}
                    </p>
                    <div className="mt-6 border-t border-outline pt-5">
                        <div className="rounded-[9px] bg-info-surface p-4">
                            <h3 className="text-sm font-medium">Simulated processing time</h3>
                            <p className="mt-2 text-sm text-content-secondary">
                                Fixed demo timing is used here. Actual processing time depends on
                                dataset size, model selection, and API response times.
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-content-secondary">
                        {providerLabel(run.model.provider)} · {run.configuration.synthesisRounds}{" "}
                        synthesis {run.configuration.synthesisRounds === 1 ? "round" : "rounds"} ·
                        Automatic review {run.configuration.automaticReview ? "on" : "off"}
                    </p>
                </section>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex flex-wrap items-start gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={!active}
                        className="inline-flex min-h-11 min-w-[152px] items-center justify-center rounded-[8px] border border-danger bg-surface px-5 text-[15px] text-danger hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel Run
                    </button>
                    {run.status === "Failed" && (
                        <div>
                            <button type="button" onClick={onRetry} className={buttonClass}>
                                Retry
                            </button>
                            <p className="mt-1 text-xs text-content-secondary">
                                Restarts the entire simulated run from Distill.
                            </p>
                        </div>
                    )}
                    {(active || run.status === "Completed") && (
                        <div>
                            <button
                                type="button"
                                onClick={active ? onComplete : onResults}
                                className={buttonClass}
                            >
                                View Completed Results
                            </button>
                            <p className="mt-1 text-xs text-content-secondary">
                                {active
                                    ? "Prototype demo: complete the simulated run."
                                    : "Open the illustrative fixture results preview."}
                            </p>
                        </div>
                    )}
                </div>
                <p className="max-w-[470px] text-sm text-content-secondary">
                    {active
                        ? "Simulation continues within this project."
                        : "Simulation has stopped."}{" "}
                    Refreshing or leaving the project resets temporary runs.
                </p>
            </div>
            <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-sm text-content-secondary"
            >
                {notice ||
                    `${run.status}: ${activity}${operation?.round && run.status === "Running" ? `. Round ${operation.round} of ${run.configuration.synthesisRounds}.` : "."}`}
            </p>
        </div>
    );
}
