import { Plus, Folder, Upload } from "lucide-react";

export default function ProjectActions() {
    return (
        <section aria-label="Project actions" className="flex flex-wrap gap-5">
            <button
                type="button"
                className="flex h-10 min-w-[200px] items-center justify-start gap-3 rounded-full bg-primary px-5 text-base font-medium text-on-primary hover:opacity-90"
            >
                <Plus size={24} />
                New project
            </button>

            <button
                type="button"
                className="flex h-10 min-w-[200px] items-center justify-start gap-3 rounded-full border border-primary bg-surface px-5 text-base font-medium text-primary hover:bg-surface-subtle"
            >
                <Folder size={22} />
                Open project
            </button>

            <button
                type="button"
                className="flex h-10 min-w-[200px] items-center justify-start gap-3 rounded-full border border-primary bg-surface px-5 text-base font-medium text-primary hover:bg-surface-subtle"
            >
                <Upload size={22} />
                Import project
            </button>
        </section>
    );
}