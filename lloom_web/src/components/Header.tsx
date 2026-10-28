
import Image from "next/image";
import { CircleHelp } from "lucide-react";
import SearchIcon from "@/components/icons/SearchIcon";

export default function Header() {
    return (
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 bg-surface px-4 lg:grid lg:h-[92px] lg:grid-cols-[minmax(0,1fr)_minmax(0,644px)_minmax(0,1fr)] lg:gap-4 lg:px-10">

            {/* Logo */}
            <div className="flex min-w-0 shrink-0 items-center lg:shrink">
                <Image
                    src="/lloom-logo.svg"
                    alt="LLooM Web"
                    width={225}
                    height={44}
                    className="h-auto w-[140px] sm:w-[180px] lg:w-[225px]"
                    preload
                />
            </div>

            {/* Desktop / tablet search bar */}
            <div className="hidden h-12 min-w-0 items-center gap-3 rounded-full bg-page px-5 sm:flex">
                <SearchIcon
                    className="shrink-0 text-content"
                    aria-hidden="true"
                />

                <input
                    type="search"
                    placeholder="Search projects"
                    aria-label="Search projects"
                    className="min-w-0 w-full bg-transparent text-base text-content outline-none placeholder:text-content-placeholder"
                />
            </div>

            {/* Header actions */}
            <nav
                aria-label="Header actions"
                className="flex shrink-0 items-center justify-end gap-3 lg:gap-8"
            >
                {/* Mobile search button */}
                <button
                    type="button"
                    aria-label="Search projects"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-page text-content transition-colors duration-150 hover:bg-gray-300 sm:hidden"
                >
                    <SearchIcon
                        className="h-7 w-7"
                        aria-hidden="true"
                    />
                </button>

                {/* Help */}
                <button
                    type="button"
                    aria-label="Help"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-content transition-colors duration-150 hover:bg-gray-300"
                >
                    <CircleHelp size={40} strokeWidth={2.5} />
                </button>

                {/* Profile */}
                <button
                    type="button"
                    aria-label="Profile"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 transition-colors duration-150 hover:bg-gray-300"
                >
                    <span className="text-sm">P</span>
                </button>
            </nav>
        </header>
    );
}
