"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ProjectFixture } from "@/fixtures/projects";
import type { RunConfiguration } from "./runs/new/run-configuration";
import { validateConfiguration } from "./runs/new/run-configuration";
import {
    advanceRun,
    completeRun,
    createPreviewRun,
    createSimulatedRun,
    retrySimulatedRun,
} from "./runs/run-simulation";
import type { SimulatedRun } from "./runs/run-simulation";

type RunContext = {
    runs: SimulatedRun[];
    startRun: (configuration: RunConfiguration) => string | undefined;
    openPreview: (id: string) => void;
    cancelRun: (id: string) => void;
    finishRun: (id: string) => void;
    retryRun: (id: string) => void;
};
const Context = createContext<RunContext | null>(null);
export default function ProjectRunProvider({
    project,
    children,
}: {
    project: ProjectFixture;
    children: ReactNode;
}) {
    const [runs, setRuns] = useState<SimulatedRun[]>([]);
    const sequence = useRef(0);
    useEffect(() => {
        const deadlines = runs.flatMap((run) => (run.dueAt === null ? [] : [run.dueAt]));
        if (!deadlines.length) return;
        const timer = window.setTimeout(
            () => {
                const now = Date.now();
                setRuns((current) => current.map((run) => advanceRun(run, now)));
            },
            Math.max(0, Math.min(...deadlines) - Date.now()),
        );
        return () => window.clearTimeout(timer);
    }, [runs]);
    function startRun(configuration: RunConfiguration) {
        if (Object.keys(validateConfiguration(configuration, project.datasets)).length) return;
        const now = Date.now();
        const id = `sim-${project.id}-${now}-${++sequence.current}`;
        const run = createSimulatedRun(project, id, configuration, now);
        setRuns((current) => [...current, run]);
        return id;
    }
    function openPreview(id: string) {
        const preview = createPreviewRun(project, id, Date.now());
        if (preview)
            setRuns((current) =>
                current.some((run) => run.id === id) ? current : [...current, preview],
            );
    }
    function cancelRun(id: string) {
        setRuns((current) =>
            current.map((run) =>
                run.id === id && run.dueAt !== null
                    ? { ...run, status: "Cancelled", dueAt: null }
                    : run,
            ),
        );
    }
    function finishRun(id: string) {
        setRuns((current) =>
            current.map((run) => (run.id === id && run.dueAt !== null ? completeRun(run) : run)),
        );
    }
    function retryRun(id: string) {
        setRuns((current) =>
            current.map((run) => (run.id === id ? retrySimulatedRun(run, Date.now()) : run)),
        );
    }
    return (
        <Context value={{ runs, startRun, openPreview, cancelRun, finishRun, retryRun }}>
            {children}
        </Context>
    );
}
export function useProjectRuns() {
    const context = useContext(Context);
    if (!context) throw new Error("useProjectRuns requires ProjectRunProvider");
    return context;
}
