"use client";

import { FileText, Upload, X } from "lucide-react";
import { useState } from "react";
import type { DragEvent, RefObject } from "react";

type DatasetUploadProps = {
    files: File[];
    onFilesChange: (files: File[]) => void;
    inputRef: RefObject<HTMLInputElement | null>;
    requiredError: boolean;
};

function fileType(file: File) {
    return file.name.split(".").pop()?.toUpperCase() ?? "";
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`;
    return `${(bytes / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

export default function DatasetUpload({
    files,
    onFilesChange,
    inputRef,
    requiredError,
}: DatasetUploadProps) {
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState("");

    function addFiles(incoming: File[]) {
        const accepted = incoming.filter((file) => /\.(csv|json|zip)$/i.test(file.name));
        const rejected = incoming.filter((file) => !/\.(csv|json|zip)$/i.test(file.name));
        setError(
            rejected.length
                ? "Unsupported files were not added. Choose CSV, JSON, or ZIP files."
                : "",
        );
        onFilesChange([...files, ...accepted]);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setDragging(false);
        addFiles(Array.from(event.dataTransfer.files));
    }

    return (
        <section
            aria-labelledby="import-data-heading"
            className="min-w-0 rounded-[14px] border border-outline bg-surface p-5"
        >
            <h2
                id="import-data-heading"
                className="border-l-[5px] border-primary pl-3 text-[23px] font-medium"
            >
                Import data
            </h2>
            <p className="mt-2 text-[15px] text-content-secondary">
                Select the documents LLooM will use to identify concepts.
            </p>
            <div className="mt-4 border-t border-outline pt-4">
                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                            setDragging(false);
                    }}
                    onDrop={handleDrop}
                    className={`relative flex min-h-[176px] flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-primary bg-info-surface p-4 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${dragging ? "ring-2 ring-primary" : ""}`}
                >
                    <input
                        ref={inputRef}
                        id="dataset-files"
                        type="file"
                        multiple
                        accept=".csv,.json,.zip"
                        aria-label="Select dataset files (required)"
                        aria-required="true"
                        aria-invalid={requiredError || undefined}
                        aria-describedby={`dataset-formats${requiredError || error ? " dataset-error" : ""}`}
                        onChange={(event) => {
                            addFiles(Array.from(event.target.files ?? []));
                            event.target.value = "";
                        }}
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-primary">
                        <Upload size={34} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <p className="text-xl font-medium">Drag and drop files here</p>
                    <p className="mt-2 text-[15px] text-content-secondary">
                        or click to browse your device
                    </p>
                    <p id="dataset-formats" className="mt-3 text-[13px] text-content-secondary">
                        CSV · JSON · ZIP
                    </p>
                </div>
                <div aria-live="polite" className="mt-2 min-h-5 text-sm text-danger">
                    <p id="dataset-error">
                        {error || (requiredError ? "Select at least one dataset file." : "")}
                    </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-medium">Selected files</h3>
                    <span aria-live="polite" className="text-[13px] text-content-secondary">
                        {files.length} {files.length === 1 ? "file" : "files"}
                    </span>
                </div>
                <div
                    role="region"
                    aria-label="Selected dataset files"
                    tabIndex={0}
                    className="mt-3 max-h-32 overflow-auto rounded-[9px] border border-outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <table className="w-full text-left text-[13px]">
                        <caption className="sr-only">
                            Selected dataset files; files have not been validated or uploaded.
                        </caption>
                        <thead className="sticky top-0 z-10 bg-surface-subtle text-[11px] text-content-secondary">
                            <tr>
                                {["File name", "Type", "Size", "Status", "Actions"].map(
                                    (heading) => (
                                        <th
                                            key={heading}
                                            scope="col"
                                            className="px-3 py-2.5 font-medium whitespace-nowrap uppercase"
                                        >
                                            {heading}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-5 text-content-secondary">
                                        No files selected.
                                    </td>
                                </tr>
                            ) : (
                                files.map((file, index) => (
                                    <tr
                                        key={`${file.name}-${file.lastModified}-${file.size}-${index}`}
                                        className="border-t border-outline"
                                    >
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <FileText
                                                    size={21}
                                                    className="shrink-0 text-content-secondary"
                                                    aria-hidden="true"
                                                />
                                                <span className="min-w-[100px] break-all text-sm font-medium">
                                                    {file.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-content-secondary">
                                            {fileType(file)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-content-secondary">
                                            {formatSize(file.size)}
                                        </td>
                                        <td className="px-3 py-2 text-content-secondary">
                                            Selected
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                aria-label={`Remove ${file.name}`}
                                                onClick={() =>
                                                    onFilesChange(
                                                        files.filter(
                                                            (_, fileIndex) => fileIndex !== index,
                                                        ),
                                                    )
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                            >
                                                <X size={18} aria-hidden="true" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
