"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import DatasetUpload from "./DatasetUpload";

export default function CreateProjectForm() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const nameInput = useRef<HTMLInputElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const nameError = submitted && !name.trim();
    const filesError = submitted && files.length === 0;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitted(true);
        if (!name.trim()) {
            nameInput.current?.focus();
            return;
        }
        if (files.length === 0) {
            fileInput.current?.focus();
            return;
        }
        window.alert(
            "Backend project creation is not yet implemented. Your project has not been created and your files have not been uploaded.",
        );
    }

    return (
        <form noValidate onSubmit={handleSubmit} className="mt-5">
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,482fr)_minmax(0,854fr)] lg:items-stretch">
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
                    files={files}
                    inputRef={fileInput}
                    requiredError={filesError}
                    onFilesChange={setFiles}
                />
            </div>
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
                    className="min-h-[46px] rounded-[9px] bg-primary px-3 text-[15px] font-medium text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    Create Project
                </button>
            </footer>
        </form>
    );
}
