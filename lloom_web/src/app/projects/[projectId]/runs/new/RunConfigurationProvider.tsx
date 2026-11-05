"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { datasetFixtures, defaultConfiguration } from "./configure-run.fixtures";
import type { RunConfiguration } from "./run-configuration";

type ConfigurationContextValue = {
    configuration: RunConfiguration;
    updateConfiguration: (patch: Partial<RunConfiguration>) => void;
    selectDataset: (datasetId: string) => void;
};

const ConfigurationContext = createContext<ConfigurationContextValue | null>(null);

export default function RunConfigurationProvider({ children }: { children: ReactNode }) {
    const [configuration, setConfiguration] = useState<RunConfiguration>(defaultConfiguration);

    function updateConfiguration(patch: Partial<RunConfiguration>) {
        setConfiguration((current) => ({ ...current, ...patch }));
    }

    function selectDataset(datasetId: string) {
        const dataset = datasetFixtures.find((item) => item.id === datasetId);
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
        <ConfigurationContext value={{ configuration, updateConfiguration, selectDataset }}>
            {children}
        </ConfigurationContext>
    );
}

export function useRunConfiguration() {
    const context = useContext(ConfigurationContext);
    if (!context) throw new Error("useRunConfiguration requires RunConfigurationProvider");
    return context;
}
