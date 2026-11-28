import { FileText } from "lucide-react";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
});

type RecentProjectItemProps = {
    id: string;
    name: string;
    lastOpened: Date;
};

export default function RecentProjectItem({ id, name, lastOpened }: RecentProjectItemProps) {
    const formattedDate = dateFormatter.format(lastOpened);

    return (
        <Link
            href={`/projects/${encodeURIComponent(id)}`}
            prefetch={false}
            className="flex min-h-[80px] items-center gap-4 border-b border-outline px-5 py-3 last:border-b-0 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        >
            <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-placeholder-surface"
                aria-hidden="true"
            >
                <FileText size={24} strokeWidth={1.5} className="text-content-secondary" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-lg font-medium text-content">{name}</span>

                <span className="text-sm text-content-secondary">Last opened: {formattedDate}</span>
            </div>
        </Link>
    );
}
