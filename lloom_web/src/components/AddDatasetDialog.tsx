"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import DatasetUpload from "./DatasetUpload";

// Selection-only preview. No project mutation, file parsing, or upload request occurs.
export default function AddDatasetDialog({
    projectName,
    onClose,
}: {
    projectName: string;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [notice, setNotice] = useState("");
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const origin = document.activeElement;
        const { scrollX, scrollY } = window;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialog.showModal();
        closeRef.current?.focus({ preventScroll: true });
        window.scrollTo(scrollX, scrollY);
        return () => {
            dialog.close();
            document.body.style.overflow = overflow;
            if (origin instanceof HTMLElement && origin.isConnected)
                origin.focus({ preventScroll: true });
            window.scrollTo(scrollX, scrollY);
        };
    }, []);
    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="add-dataset-dialog-heading"
            aria-describedby="add-dataset-help"
            className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[760px] overflow-y-auto overscroll-contain rounded-[14px] border border-outline bg-surface p-5 text-content shadow-xl backdrop:bg-content/30 md:p-6"
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
                <h2 id="add-dataset-dialog-heading" className="text-xl font-medium">
                    Add Dataset
                </h2>
                <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close Add Dataset"
                    onClick={onClose}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-surface-subtle text-content-secondary hover:bg-info-surface focus-visible:outline-2 focus-visible:outline-primary"
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>
            <p id="add-dataset-help" className="mt-3 text-sm break-words text-content-secondary">
                {projectName}: selection preview only. Nothing is uploaded or added to the project.
                Selections are cleared when this dialog closes.
            </p>
            <form
                noValidate
                className="mt-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    setSubmitted(true);
                    if (!files.length) {
                        inputRef.current?.focus();
                        return;
                    }
                    setNotice(
                        "Dataset uploads are not connected. Nothing was uploaded or added to this project. Your selections remain available to correct or retry.",
                    );
                }}
            >
                <DatasetUpload
                    idPrefix="add-dataset"
                    embedded
                    files={files}
                    inputRef={inputRef}
                    requiredError={submitted && files.length === 0}
                    onFilesChange={(next) => {
                        setFiles(next);
                        setNotice("");
                    }}
                />
                <p
                    role="status"
                    aria-live="polite"
                    className="mt-4 text-sm text-content-secondary empty:hidden"
                >
                    {notice}
                </p>
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 rounded-lg border border-outline bg-surface px-4 text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="min-h-11 rounded-lg bg-primary px-4 text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Add Dataset
                    </button>
                </div>
            </form>
        </dialog>
    );
}
