import type { ValidationResult } from "./validation";

export type SelectedDataset = {
    id: string;
    file: File;
    status: "Validating" | "Valid" | "Error";
    message?: string;
};
type ValidationWorker = Pick<
    Worker,
    "postMessage" | "terminate" | "onmessage" | "onerror" | "onmessageerror"
>;

// Own the queue independently of render timing. Only one file is parsed at a time.
export class DatasetSelection {
    private entries: SelectedDataset[] = [];
    private listeners = new Set<() => void>();
    private active?: { id: string; worker: ValidationWorker };
    private running = false;

    constructor(private createWorker: () => ValidationWorker) {}
    getSnapshot = () => this.entries;
    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    private publish() {
        this.listeners.forEach((listener) => listener());
    }
    start() {
        this.running = true;
        this.pump();
    }
    stop() {
        this.running = false;
        this.active?.worker.terminate();
        this.active = undefined;
    }
    add = (files: File[]) => {
        this.entries = [
            ...this.entries,
            ...files.map((file) => {
                const message = !/\.(csv|json)$/i.test(file.name)
                    ? "Unsupported format. Choose CSV or JSON."
                    : file.size === 0
                      ? "The file is empty."
                      : undefined;
                return {
                    id: crypto.randomUUID(),
                    file,
                    status: message ? ("Error" as const) : ("Validating" as const),
                    message,
                };
            }),
        ];
        this.publish();
        this.pump();
    };
    remove = (id: string) => {
        if (this.active?.id === id) {
            this.active.worker.terminate();
            this.active = undefined;
        }
        this.entries = this.entries.filter((entry) => entry.id !== id);
        this.publish();
        this.pump();
    };
    clear = () => {
        const wasRunning = this.running;
        this.stop();
        this.entries = [];
        this.publish();
        if (wasRunning) this.start();
    };
    associateBackendError = (detail: string): boolean => {
        const matches = this.entries.filter((entry) => detail.startsWith(`${entry.file.name}:`));
        if (matches.length !== 1) return false;
        const matched = matches[0];
        this.entries = this.entries.map((entry) =>
            entry.id === matched.id
                ? {
                      ...entry,
                      status: "Error",
                      message:
                          detail.slice(matched.file.name.length + 1).trim() ||
                          "Backend rejected this file.",
                  }
                : entry,
        );
        this.publish();
        return true;
    };
    private pump() {
        if (!this.running || this.active) return;
        const entry = this.entries.find((file) => file.status === "Validating");
        if (!entry) return;
        let worker: ValidationWorker;
        try {
            worker = this.createWorker();
        } catch {
            this.finish(entry.id, {
                status: "Error",
                message: "Unable to start validation. Try selecting the file again.",
            });
            return;
        }
        this.active = { id: entry.id, worker };
        const finish = (result: ValidationResult) => {
            if (this.active?.worker !== worker) return; // Removed file or cancelled job.
            worker.terminate();
            this.active = undefined;
            this.finish(entry.id, result);
        };
        worker.onmessage = (event: MessageEvent<ValidationResult>) => finish(event.data);
        worker.onerror = worker.onmessageerror = () =>
            finish({
                status: "Error",
                message: "Unable to validate file. Try selecting it again.",
            });
        try {
            worker.postMessage(entry.file);
        } catch {
            finish({ status: "Error", message: "Unable to read file. Try selecting it again." });
        }
    }
    private finish(id: string, result: ValidationResult) {
        this.entries = this.entries.map((entry) =>
            entry.id === id
                ? {
                      ...entry,
                      status: result.status,
                      message: result.message,
                  }
                : entry,
        );
        this.publish();
        this.pump();
    }
}
