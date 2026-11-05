"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import DataConfiguration from "./DataConfiguration";
import ConceptGeneration from "./ConceptGeneration";
import { useRunConfiguration } from "./RunConfigurationProvider";
import { datasetFixtures } from "./configure-run.fixtures";
import { validateConfiguration } from "./run-configuration";
import type { RunConfiguration } from "./run-configuration";
import RunWorkflowSteps from "./RunWorkflowSteps";

export default function ConfigureRunForm() {
    const router = useRouter();
    const { projectId } = useParams<{ projectId: string }>();
    const { configuration, updateConfiguration, selectDataset } = useRunConfiguration();
    const [submitted, setSubmitted] = useState(false);
    const [notice, setNotice] = useState("");
    const formRef = useRef<HTMLFormElement>(null);
    const errors = submitted ? validateConfiguration(configuration, datasetFixtures) : {};

    function onChange(patch: Partial<RunConfiguration>) {
        updateConfiguration(patch);
        setNotice("");
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitted(true);
        const validation = validateConfiguration(configuration, datasetFixtures);
        const firstError = Object.keys(validation)[0];
        if (firstError) {
            setNotice("Check the highlighted configuration fields.");
            const control = formRef.current?.elements.namedItem(firstError);
            // Controls have matching IDs; query within this form to avoid unrelated page elements.
            if (control instanceof HTMLElement) control.focus();
            else formRef.current?.querySelector<HTMLElement>(`#${firstError}`)?.focus();
            return;
        }
        router.push(`/projects/${encodeURIComponent(projectId)}/runs/new/review`);
    }

    return (
        <form ref={formRef} noValidate onSubmit={handleSubmit} className="mt-5">
            <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,616fr)_minmax(0,720fr)]">
                <DataConfiguration
                    configuration={configuration}
                    datasets={datasetFixtures}
                    errors={errors}
                    onDatasetChange={(id) => {
                        selectDataset(id);
                        setNotice("");
                    }}
                    onChange={onChange}
                />
                <ConceptGeneration
                    configuration={configuration}
                    errors={errors}
                    onChange={onChange}
                />
            </div>
            <RunWorkflowSteps currentStep={1} />
            <p role="status" aria-live="polite" className="mt-3 text-sm text-content">
                {notice}
            </p>
            <div className="mt-5 flex items-center justify-between gap-4">
                <Link
                    href="/"
                    className="flex min-h-[46px] min-w-[115px] items-center justify-center rounded-[9px] border border-outline bg-surface px-5 text-[15px] font-medium hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    className="min-h-[46px] min-w-[120px] rounded-[9px] bg-primary px-5 text-[15px] font-medium text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    Next
                </button>
            </div>
        </form>
    );
}
