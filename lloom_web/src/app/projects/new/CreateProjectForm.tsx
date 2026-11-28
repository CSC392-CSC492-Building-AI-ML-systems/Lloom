"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import DatasetUpload from "@/components/DatasetUpload";
import { errorDetail } from "@/lib/api/errors";
import useDatasetSelection from "@/hooks/useDatasetSelection";

export default function CreateProjectForm() {
    const router = useRouter();
    const inFlight = useRef(false);
    const [uploading, setUploading] = useState(false);
    const [navigating, startNavigation] = useTransition();
    const pending = uploading || navigating;
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const {
        entries: files,
        addFiles,
        removeFile,
        ready,
        getFiles,
        associateBackendError,
    } = useDatasetSelection();
    const [submitted, setSubmitted] = useState(false);
    const [notice, setNotice] = useState("");
    const nameInput = useRef<HTMLInputElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const nameError = submitted && !name.trim();
    const filesError = submitted && files.length === 0;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (inFlight.current || navigating) return;
        const selectedFiles = getFiles();
        setSubmitted(true);
        setNotice("");
        setSubmissionError(null);
        if (!name.trim()) {
            nameInput.current?.focus();
            return;
        }
        if (selectedFiles.length === 0) {
            fileInput.current?.focus();
            return;
        }
        if (!selectedFiles.every((file) => file.status === "Valid")) return;
        inFlight.current = true;
        setUploading(true);
        const form = new FormData();
        form.append("name", name.trim());
        form.append("description", description.trim());
        selectedFiles.forEach(({ file }) => form.append("files", file));
        try {
            const response = await fetch("/api/projects", { method: "POST", body: form });
            const body: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                const detail =
                    errorDetail(body) || `Project creation failed (HTTP ${response.status}).`;
                if (
                    (response.status === 422 || response.status === 415) &&
                    associateBackendError(detail)
                )
                    return;
                setSubmissionError(
                    response.status >= 500
                        ? `${detail} The project may have been created. Check Recent Projects before retrying.`
                        : detail,
                );
                return;
            }
            if (
                typeof body !== "object" ||
                body === null ||
                !("id" in body) ||
                typeof body.id !== "string" ||
                !body.id
            ) {
                setSubmissionError(
                    "The upload response was invalid. Check Recent Projects before retrying; the project may have been created.",
                );
                return;
            }
            setNotice("Project created. Opening workspace…");
            const id = body.id;
            startNavigation(() => router.push(`/projects/${encodeURIComponent(id)}`));
            return;
        } catch {
            setSubmissionError(
                "Unable to complete the upload. Check your connection and Recent Projects before retrying; the project may have been created.",
            );
        } finally {
            inFlight.current = false;
            setUploading(false);
        }
    }

    return (
        <form noValidate onSubmit={handleSubmit} aria-busy={pending} className="mt-5">
            <fieldset
                disabled={pending}
                className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,482fr)_minmax(0,854fr)] lg:items-stretch"
            >
                <section
                    aria-labelledby="project-details-heading"
                    className="min-w-0 rounded-[14px] border border-outline bg-surface p-5"
                >
                    <h2
                        id="project-details-heading"
                        className="border-l-[5px] border-primary pl-3 text-[23px] font-medium"
                    >
                        Project details
                    </h2>
                    <p className="mt-2 text-[15px] text-content-secondary">
                        Give your analysis a name and some context.
                    </p>
                    <div className="mt-4 border-t border-outline pt-4">
                        <label htmlFor="project-name" className="block text-[15px] font-medium">
                            Project name *
                        </label>
                        <input
                            ref={nameInput}
                            id="project-name"
                            name="projectName"
                            required
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                            }}
                            placeholder="e.g. Customer Feedback Analysis"
                            aria-invalid={nameError || undefined}
                            aria-describedby="project-name-help"
                            className="mt-2.5 min-h-[51px] w-full rounded-[9px] border border-outline bg-surface px-3.5 text-[15px] placeholder:text-content-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                        <p
                            id="project-name-help"
                            aria-live="polite"
                            className={`mt-1.5 min-h-5 text-[13px] ${nameError ? "text-danger" : "text-content-secondary"}`}
                        >
                            {nameError ? "Enter a project name." : "You can change this later."}
                        </p>
                        <label
                            htmlFor="project-description"
                            className="mt-4 block text-[15px] font-medium"
                        >
                            Description (optional)
                        </label>
                        <textarea
                            id="project-description"
                            name="description"
                            value={description}
                            onChange={(event) => {
                                setDescription(event.target.value);
                            }}
                            placeholder="What are you hoping to discover in this dataset?"
                            aria-describedby="project-description-help"
                            className="mt-2.5 min-h-[104px] max-h-60 w-full resize-y overflow-y-auto rounded-[9px] border border-outline bg-surface p-3.5 text-[15px] placeholder:text-content-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                        <p
                            id="project-description-help"
                            className="mt-2 text-[13px] text-content-secondary"
                        >
                            Add a short description to help identify this project.
                        </p>
                    </div>
                </section>
                <DatasetUpload
                    disabled={pending}
                    creation
                    submissionError={submissionError ? { detail: submissionError } : null}
                    idPrefix="create-dataset"
                    files={files}
                    inputRef={fileInput}
                    requiredError={filesError}
                    onFilesAdded={(incoming) => {
                        addFiles(incoming);
                        setNotice("");
                        setSubmissionError(null);
                    }}
                    onFileRemoved={(id) => {
                        removeFile(id);
                        setNotice("");
                        setSubmissionError(null);
                    }}
                />
            </fieldset>
            <p
                role="status"
                aria-live="polite"
                className="mt-4 text-sm text-content-secondary empty:hidden"
            >
                {notice}
            </p>
            <footer
                aria-label="Project actions"
                className="mt-5 flex items-center justify-between gap-4"
            >
                <Link
                    href="/"
                    className="flex min-h-[46px] min-w-[115px] items-center justify-center rounded-[9px] border border-outline bg-surface px-5 text-[15px] font-medium hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={pending || !name.trim() || !ready}
                    className="min-h-[46px] rounded-[9px] bg-primary px-3 text-[15px] font-medium text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    {pending ? "Creating project…" : "Create Project"}
                </button>
            </footer>
        </form>
    );
}
