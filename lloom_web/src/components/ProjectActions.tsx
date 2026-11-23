import { Plus, Folder, Upload } from "lucide-react";
import Link from "next/link";

export default function ProjectActions() {
    return (
        <section
            aria-label="Project actions"
            className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-5"
        >
            <Link
                href="/projects/new"
                className="col-span-2 flex h-10 w-full items-center justify-center gap-3 rounded-full bg-primary px-4 text-base font-medium text-on-primary hover:opacity-90 md:w-auto md:min-w-[200px] md:justify-start md:px-5"
            >
                <Plus size={24} aria-hidden="true" />
                New project
            </Link>

            <button
                type="button"
                className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-primary bg-surface px-2 text-sm font-medium text-primary hover:bg-surface-subtle md:min-w-[200px] md:justify-start md:gap-3 md:px-5 md:text-base"
            >
                <Folder size={22} />
                Open project
            </button>

            <button
                type="button"
                className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-primary bg-surface px-2 text-sm font-medium text-primary hover:bg-surface-subtle md:min-w-[200px] md:justify-start md:gap-3 md:px-5 md:text-base"
            >
                <Upload size={22} />
                Import project
            </button>
        </section>
    );
}
