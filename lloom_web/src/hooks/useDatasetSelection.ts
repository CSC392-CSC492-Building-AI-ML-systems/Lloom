"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DatasetSelection } from "@/lib/datasets/selection";

export default function useDatasetSelection() {
    const [selection] = useState(
        () =>
            new DatasetSelection(
                () =>
                    new Worker(new URL("../lib/datasets/validation.worker.ts", import.meta.url), {
                        type: "module",
                    }),
            ),
    );
    const entries = useSyncExternalStore(
        selection.subscribe,
        selection.getSnapshot,
        selection.getSnapshot,
    );
    useEffect(() => {
        selection.start();
        return () => selection.stop();
    }, [selection]);
    return {
        entries,
        addFiles: selection.add,
        removeFile: selection.remove,
        clear: selection.clear,
        associateBackendError: selection.associateBackendError,
        getFiles: selection.getSnapshot,
        ready: entries.length > 0 && entries.every((entry) => entry.status === "Valid"),
    };
}
