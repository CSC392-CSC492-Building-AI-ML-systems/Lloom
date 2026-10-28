import { FileText } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
});

type RecentProjectItemProps = {
    name: string;
    lastOpened: Date;
}

export default function RecentProjectItem({
    name,
    lastOpened,
}: RecentProjectItemProps) {
    const formattedDate = dateFormatter.format(lastOpened);

    return (
        <div className="flex min-h-[80px] items-center gap-4 border-b border-outline px-5 py-3 transition-colors duration-150 hover:bg-surface-subtle last:border-b-0">
            <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-placeholder-surface"
                aria-hidden="true"
            >
                <FileText
                    size={24}
                    strokeWidth={1.5}
                    className="text-content-secondary"
                />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-lg font-medium text-content">
                    {name}
                </span>

                <span className="text-sm text-content-secondary">
                    Last opened: {formattedDate}
                </span>
            </div>
        </div>
    );
}