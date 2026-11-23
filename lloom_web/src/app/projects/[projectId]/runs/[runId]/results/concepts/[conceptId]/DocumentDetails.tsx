"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { ResultConcept, RunResults } from "@/fixtures/run-results";

export default function DocumentDetails({
    results,
    concept,
    documentValues,
    runName,
    datasetName,
    onClose,
}: {
    results: RunResults;
    concept: ResultConcept;
    documentValues: string[];
    runName: string;
    datasetName: string;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const id = documentValues[0];
    const valid = documentValues.length === 1 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id);
    const document = valid ? results.documents.find((item) => item.id === id) : undefined;
    const record = document
        ? results.scores.find(
              (item) => item.documentId === document.id && item.conceptId === concept.id,
          )
        : undefined;
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const origin = window.document.activeElement;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const body = window.document.body;
        const previousOverflow = body.style.overflow;
        body.style.overflow = "hidden";
        dialog.showModal();
        closeRef.current?.focus({ preventScroll: true });
        window.scrollTo(scrollX, scrollY);
        return () => {
            dialog.close();
            body.style.overflow = previousOverflow;
            const fallback = window.document.querySelector<HTMLElement>(
                '[aria-label="Document scores table"]',
            );
            (origin instanceof HTMLElement && origin !== body && origin.isConnected
                ? origin
                : fallback
            )?.focus({ preventScroll: true });
            window.scrollTo(scrollX, scrollY);
        };
    }, []);
    const metadata = document ? Object.entries(document.metadata) : [];
    const evidence = record?.evidence.filter((excerpt) => excerpt.trim()) ?? [];
    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="document-details-heading"
            className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[460px] overflow-y-auto overscroll-contain rounded-[14px] border border-outline bg-surface p-5 text-content shadow-xl backdrop:bg-content/30 md:p-6"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
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
                    onClose();
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <h2 id="document-details-heading" className="text-xl font-medium">
                    Document Details
                </h2>
                <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close Document Details"
                    onClick={onClose}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-surface-subtle text-content-secondary hover:bg-info-surface focus-visible:outline-2 focus-visible:outline-primary"
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>
            <p className="mt-4 text-[13px] break-words text-content-secondary">
                {runName} · {datasetName}
            </p>
            {!document ? (
                <div className="mt-4 space-y-3">
                    <h3 className="text-base font-medium">Document unavailable</h3>
                    <p role="alert" className="text-content-secondary">
                        {!valid
                            ? "Supply exactly one nonempty document ID using letters, numbers, dots, underscores, or hyphens."
                            : "This document is not available in the current run."}{" "}
                        Close Document Details to return to your table.
                    </p>
                </div>
            ) : (
                <>
                    <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-base">
                        {[
                            ["Document ID", document.id],
                            ...metadata.map(([key, value]) => [
                                results.groupings.find((group) =>
                                    group.slices.some(
                                        (slice) => "columnId" in slice && slice.columnId === key,
                                    ),
                                )?.label ?? key,
                                value ?? "Unavailable",
                            ]),
                            ["Concept", concept.name],
                            [
                                "Concept score",
                                record?.score == null ? "Unavailable" : record.score.toFixed(2),
                            ],
                        ].map(([label, value]) => (
                            <div key={label} className="min-w-0">
                                <dt className="text-[13px] text-content-secondary">{label}</dt>
                                <dd className="mt-1 font-medium whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-4 text-[13px] text-content-secondary">
                        Scores describe ordered agreement with inclusion criteria; they are not
                        probabilities.
                    </p>
                    <div className="my-4 border-t border-outline" />
                    <section aria-labelledby="document-text-heading">
                        <h3 id="document-text-heading" className="text-base font-medium">
                            Full document text
                        </h3>
                        <p className="mt-2 text-base leading-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {document.text || "No document text is available."}
                        </p>
                    </section>
                    <section aria-labelledby="document-evidence-heading" className="mt-5">
                        <h3 id="document-evidence-heading" className="text-base font-medium">
                            Highlighted evidence
                        </h3>
                        {evidence.length ? (
                            evidence.map((excerpt, index) => (
                                <blockquote
                                    key={index}
                                    className="mt-2 rounded-lg bg-info-surface p-3 text-base leading-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                                >
                                    {excerpt}
                                </blockquote>
                            ))
                        ) : (
                            <p className="mt-2 text-content-secondary">
                                No evidence excerpts are available for this document and concept.
                            </p>
                        )}
                    </section>
                    <section aria-labelledby="document-rationale-heading" className="mt-5">
                        <h3 id="document-rationale-heading" className="text-base font-medium">
                            LLM rationale
                        </h3>
                        <p className="mt-2 text-base leading-6 whitespace-pre-wrap break-words text-content-secondary [overflow-wrap:anywhere]">
                            {record?.rationale.trim() ||
                                "No scoring rationale is available for this document and concept."}
                        </p>
                    </section>
                    <p className="mt-8 text-[13px] text-content-secondary">
                        Illustrative document, score, evidence, and rationale. Not actual dataset
                        records or project results.
                    </p>
                </>
            )}
        </dialog>
    );
}
