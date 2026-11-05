"use client";

import Link from "next/link";
import { useState } from "react";
import { useRunConfiguration } from "../RunConfigurationProvider";
import { datasetFixtures, fixtureModelSettings } from "../configure-run.fixtures";
import { validateConfiguration } from "../run-configuration";
import RunWorkflowSteps from "../RunWorkflowSteps";

const secondaryActionClass =
    "flex min-h-[46px] min-w-[115px] items-center justify-center rounded-[9px] border border-outline bg-surface px-5 text-[15px] font-medium hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function SummaryRows({ rows }: { rows: { label: string; value: string }[] }) {
    return (
        <dl className="mt-4 space-y-3 border-t border-outline pt-4">
            {rows.map(({ label, value }) => (
                <div
                    key={label}
                    className="grid min-w-0 gap-1 text-[15px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] sm:gap-4"
                >
                    <dt>{label}</dt>
                    <dd className="min-w-0 font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function ReviewRun({ configureHref }: { configureHref: string }) {
    const { configuration } = useRunConfiguration();
    const [notice, setNotice] = useState("");
    const errors = validateConfiguration(configuration, datasetFixtures);
    const valid = Object.keys(errors).length === 0;
    const dataset = datasetFixtures.find((item) => item.id === configuration.datasetId);

    function handleStartRun() {
        if (Object.keys(validateConfiguration(configuration, datasetFixtures)).length) return;
        setNotice(
            "Run execution is not implemented. No analysis has started. Your configuration remains available for editing.",
        );
    }

    return (
        <div className="mt-5">
            {valid && dataset ? (
                <>
                    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,616fr)_minmax(0,720fr)]">
                        <section
                            aria-labelledby="dataset-summary-heading"
                            className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
                        >
                            <h2
                                id="dataset-summary-heading"
                                className="border-l-[5px] border-primary pl-3 text-[23px] font-medium"
                            >
                                Dataset summary
                            </h2>
                            <p className="mt-2 text-[15px] text-content-secondary">
                                Confirm the documents LLooM will analyze.
                            </p>
                            <SummaryRows
                                rows={[
                                    { label: "Dataset", value: dataset.name },
                                    {
                                        label: "Documents",
                                        value: dataset.rowCount.toLocaleString("en-US"),
                                    },
                                    { label: "Text column", value: configuration.textColumn },
                                    {
                                        label: "Document ID",
                                        value: configuration.documentIdColumn || "Auto-generated",
                                    },
                                    {
                                        label: "File type",
                                        value:
                                            dataset.name.split(".").pop()?.toUpperCase() ||
                                            "Unknown",
                                    },
                                ]}
                            />
                        </section>
                        <section
                            aria-labelledby="run-configuration-heading"
                            className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
                        >
                            <h2
                                id="run-configuration-heading"
                                className="border-l-[5px] border-primary pl-3 text-[23px] font-medium"
                            >
                                Run configuration
                            </h2>
                            <p className="mt-2 text-[15px] text-content-secondary">
                                Review the settings used for concept discovery.
                            </p>
                            <SummaryRows
                                rows={[
                                    {
                                        label: "Target concepts",
                                        value: String(Number(configuration.targetConcepts)),
                                    },
                                    {
                                        label: "Seed phrase",
                                        value:
                                            configuration.seedPhrase.trim() ||
                                            "None (open-ended discovery)",
                                    },
                                    {
                                        label: "Synthesis rounds",
                                        value: String(configuration.synthesisRounds),
                                    },
                                    {
                                        label: "Automatic concept review",
                                        value: configuration.automaticReview
                                            ? "Enabled"
                                            : "Disabled",
                                    },
                                    {
                                        label: "LLM provider (fixture)",
                                        value: fixtureModelSettings.provider,
                                    },
                                    {
                                        label: "Default model (fixture)",
                                        value: fixtureModelSettings.model,
                                    },
                                ]}
                            />
                        </section>
                    </div>
                </>
            ) : (
                <section
                    aria-labelledby="invalid-configuration-heading"
                    className="rounded-[14px] border border-outline bg-surface p-5"
                >
                    <h2
                        id="invalid-configuration-heading"
                        className="text-xl font-medium text-danger"
                    >
                        Configuration needs attention
                    </h2>
                    <p className="mt-2 text-content-secondary">
                        Return to Configure Run to correct these selections before continuing.
                    </p>
                    <ul className="mt-3 list-inside list-disc text-sm text-danger">
                        {Object.entries(errors).map(([key, error]) => (
                            <li key={key}>{error}</li>
                        ))}
                    </ul>
                    <Link
                        href={configureHref}
                        className="mt-3 inline-block rounded text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Edit configuration
                    </Link>
                </section>
            )}
            <RunWorkflowSteps currentStep={2} />
            <p role="status" aria-live="polite" className="mt-3 text-sm text-content">
                {notice}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <Link href="/" className={secondaryActionClass}>
                    Cancel
                </Link>
                <div className="flex flex-wrap gap-3">
                    <Link href={configureHref} className={secondaryActionClass}>
                        Back
                    </Link>
                    <button
                        type="button"
                        disabled={!valid}
                        onClick={handleStartRun}
                        className="min-h-[46px] min-w-[120px] rounded-[9px] bg-primary px-5 text-[15px] font-medium text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Start Run
                    </button>
                </div>
            </div>
        </div>
    );
}
