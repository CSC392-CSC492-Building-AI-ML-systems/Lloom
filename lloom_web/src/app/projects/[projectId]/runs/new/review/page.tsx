import type { Metadata } from "next";
import Header from "@/components/Header";
import { fixtureProject } from "../configure-run.fixtures";
import ReviewRun from "./ReviewRun";

export const metadata: Metadata = { title: "Review Run | LLooM Web" };

export default async function ReviewRunPage({
    params,
}: {
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = await params;
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
                            2
                        </span>
                        Review Run
                    </h1>
                    <p className="text-base text-content-secondary">
                        Project: {fixtureProject.name} <span className="text-sm">(fixture)</span>
                    </p>
                </div>
                <p className="mt-3 text-base text-content-secondary">
                    Review your dataset and concept generation settings before starting LLooM.
                </p>
                <p className="mt-1 text-[13px] text-content-secondary">
                    Fixture preview — project, dataset, provider, and model data is illustrative.
                    Refreshing resets your settings. Nothing is saved or uploaded.
                </p>
                <ReviewRun configureHref={`/projects/${encodeURIComponent(projectId)}/runs/new`} />
            </main>
        </div>
    );
}
