import type { Metadata } from "next";
import { Settings } from "lucide-react";
import Header from "@/components/Header";
import ModelSettingsForm from "./ModelSettingsForm";

export const metadata: Metadata = { title: "API & Model Settings | LLooM Web" };

export default function ModelSettingsPage() {
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="flex-1 px-4 py-6 md:px-10">
                <h1 className="flex items-center gap-2.5 border-b border-content pb-1 text-2xl font-medium">
                    <Settings size={28} aria-hidden="true" />
                    API &amp; Model Settings
                </h1>
                <ModelSettingsForm />
            </main>
        </div>
    );
}
