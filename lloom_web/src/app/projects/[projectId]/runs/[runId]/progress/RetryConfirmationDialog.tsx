"use client";

import { useEffect, useRef } from "react";
import { formatUsdCost } from "@/fixtures/run-costs";

export default function RetryConfirmationDialog({
    estimatedCost,
    onConfirm,
    onCancel,
}: {
    estimatedCost: number | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const confirmed = useRef(false);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const origin = document.activeElement;
        const { scrollX, scrollY } = window;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialog.showModal();
        cancelRef.current?.focus({ preventScroll: true });
        window.scrollTo(scrollX, scrollY);
        return () => {
            dialog.close();
            document.body.style.overflow = overflow;
            const target =
                origin instanceof HTMLButtonElement && origin.isConnected && !origin.disabled
                    ? origin
                    : document.getElementById("run-progress-status");
            target?.focus({ preventScroll: true });
            window.scrollTo(scrollX, scrollY);
        };
    }, []);
    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="retry-heading"
            aria-describedby="retry-description retry-charges retry-simulation"
            className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto overscroll-contain rounded-[14px] border border-outline bg-surface p-5 text-content shadow-xl backdrop:bg-content/30 md:p-6"
            onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const buttons =
                    event.currentTarget.querySelectorAll<HTMLButtonElement>(
                        "button:not(:disabled)",
                    );
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }}
            onCancel={(event) => {
                event.preventDefault();
                onCancel();
            }}
            onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (
                    event.clientX < bounds.left ||
                    event.clientX > bounds.right ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom
                )
                    onCancel();
            }}
        >
            <h2 id="retry-heading" className="text-xl font-medium">
                Confirm retry
            </h2>
            <p id="retry-description" className="mt-4 text-base leading-6">
                The entire pipeline will restart from Distill using the same run configuration.
                Previous progress will be cleared; the run will not resume from the stage where it
                stopped.
            </p>
            <p id="retry-charges" className="mt-4 text-sm leading-6 text-content-secondary">
                Restarting a real run may incur additional API charges. Work already completed may
                also have incurred charges; those costs are not undone by restarting.
            </p>
            <dl className="mt-4 rounded-lg border border-outline p-3">
                <dt className="text-sm text-content-secondary">
                    Estimated cost for this retry (USD)
                </dt>
                <dd className="mt-1 text-lg font-medium">{formatUsdCost(estimatedCost, true)}</dd>
            </dl>
            <p
                id="retry-simulation"
                className="mt-4 rounded-lg bg-info-surface p-3 text-sm leading-6"
            >
                This frontend execution is simulated and does not incur API charges. The estimate is
                an illustrative fixture, not a measurement of actual expenditure.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                    ref={cancelRef}
                    type="button"
                    onClick={onCancel}
                    className="min-h-11 rounded-lg border border-outline bg-surface px-4 text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-primary"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                        if (confirmed.current) return;
                        confirmed.current = true;
                        event.currentTarget.disabled = true;
                        onConfirm();
                    }}
                    className="min-h-11 rounded-lg bg-primary px-4 text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Confirm Retry
                </button>
            </div>
        </dialog>
    );
}
