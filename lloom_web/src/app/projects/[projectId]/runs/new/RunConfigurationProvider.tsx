"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { DatasetFixture, ProjectFixture } from "@/fixtures/projects";
import { createDefaultConfiguration } from "./configure-run.fixtures";
import { validateConfiguration } from "./run-configuration";
import type { RunConfiguration } from "./run-configuration";
import { getFixtureEstimatedCost } from "@/fixtures/run-costs.fixtures";

type ConfigurationContextValue = {
    configuration: RunConfiguration;
    estimatedCost: number | null;
    datasets: DatasetFixture[];
    projectId: string;
    draftQuery: string;
    draftNotice: string;
    updateConfiguration: (patch: Partial<RunConfiguration>) => void;
    selectDataset: (datasetId: string) => void;
};
const ConfigurationContext = createContext<ConfigurationContextValue | null>(null);

export default function RunConfigurationProvider({
    project,
    children,
}: {
    project: ProjectFixture;
    children: ReactNode;
}) {
    const searchParams = useSearchParams();
    const draftValues = searchParams.getAll("draft");
    const requestedDraft = draftValues.length === 1 ? draftValues[0] : undefined;
    const draft = project.runs.find((run) => run.id === requestedDraft && run.status === "Draft");
    const validDraft =
        draft?.status === "Draft" &&
        Object.keys(validateConfiguration(draft.configuration, project.datasets)).length === 0
            ? draft
            : undefined;
    const initialConfiguration =
        validDraft?.configuration ?? createDefaultConfiguration(project.datasets);
    // Preserve even invalid query values between steps so temporary edits do not reset.
    const draftQuery = draftValues.length
        ? `?${new URLSearchParams(draftValues.map((value) => ["draft", value])).toString()}`
        : "";
    const draftNotice = validDraft
        ? "Fixture draft loaded. Changes are temporary and are not saved to this draft. Refreshing restores the fixture values."
        : draftValues.length
          ? "This draft is unavailable for this project. New run defaults are shown."
          : "";
    return (
        <ConfigurationState
            key={`${project.id}:${JSON.stringify(draftValues)}`}
            project={project}
            initialConfiguration={initialConfiguration}
            draftQuery={draftQuery}
            draftNotice={draftNotice}
        >
            {children}
        </ConfigurationState>
    );
}
function ConfigurationState({
    project,
    initialConfiguration,
    draftQuery,
    draftNotice,
    children,
}: {
    project: ProjectFixture;
    initialConfiguration: RunConfiguration;
    draftQuery: string;
    draftNotice: string;
    children: ReactNode;
}) {
    const { projectId } = useParams<{ projectId: string }>();
    const [configuration, setConfiguration] = useState<RunConfiguration>(initialConfiguration);
    function updateConfiguration(patch: Partial<RunConfiguration>) {
        setConfiguration((current) => ({ ...current, ...patch }));
    }
    function selectDataset(datasetId: string) {
        const dataset = project.datasets.find((item) => item.id === datasetId);
        setConfiguration((current) => ({
            ...current,
            datasetId,
            textColumn: dataset?.textColumns.includes(current.textColumn)
                ? current.textColumn
                : (dataset?.textColumns[0] ?? ""),
            documentIdColumn: dataset?.columns.includes(current.documentIdColumn)
                ? current.documentIdColumn
                : "",
        }));
    }
    return (
        <ConfigurationContext
            value={{
                configuration,
                estimatedCost: getFixtureEstimatedCost(configuration),
                datasets: project.datasets,
                projectId,
                draftQuery,
                draftNotice,
                updateConfiguration,
                selectDataset,
            }}
        >
            {children}
        </ConfigurationContext>
    );
}
export function useRunConfiguration() {
    const context = useContext(ConfigurationContext);
    if (!context) throw new Error("useRunConfiguration requires RunConfigurationProvider");
    return context;
}
