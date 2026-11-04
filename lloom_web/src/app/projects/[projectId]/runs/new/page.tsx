import type { Metadata } from "next";
import Header from "@/components/Header";
import ConfigureRunForm from "./ConfigureRunForm";
import { fixtureProject } from "./configure-run.fixtures";

export const metadata: Metadata = { title: "Configure Run | LLooM Web" };

export default function ConfigureRunPage() {
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="flex-1 px-4 py-6 md:px-10">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-content pb-1">
                    <h1 className="flex items-center gap-2.5 text-2xl font-medium">
                        <span
                            aria-hidden="true"
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-content text-lg"
                        >
                            1
                        </span>
                        Configure Run
                    </h1>
                    <p className="text-base text-content-secondary">
                        Project: {fixtureProject.name} <span className="text-sm">(fixture)</span>
                    </p>
                </div>
                <p className="mt-3 text-base text-content-secondary">
                    Select a dataset and customize how LLooM discovers concepts.
                </p>
                <ConfigureRunForm />
            </main>
        </div>
    );
}
