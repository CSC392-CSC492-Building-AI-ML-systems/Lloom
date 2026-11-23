import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import Header from "@/components/Header";
import CreateProjectForm from "./CreateProjectForm";

export const metadata: Metadata = { title: "Create Project | LLooM Web" };

export default function CreateProjectPage() {
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="flex-1 px-4 py-6 md:px-10">
                <h1 className="flex shrink-0 items-center gap-2 border-b border-content pb-1 text-2xl font-medium">
                    <Wrench size={28} aria-hidden="true" />
                    Create Project
                </h1>
                <p className="mt-3 shrink-0 text-base text-content-secondary">
                    Start with your project details, then add the dataset you want LLooM to analyze.
                </p>
                <CreateProjectForm />
            </main>
        </div>
    );
}
