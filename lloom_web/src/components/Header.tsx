import Image from "next/image";

export default function Header() {
    return (
        <header className="flex h-[92px] items-center justify-between bg-surface px-10">
            {/* Logo */}
            <Image
                src="/lloom-logo.svg"
                alt="LLooM Web"
                width={225}
                height={44}
                className="w-[180px] h-auto"
                preload
            />

            {/* Search bar */}
            <div className="mx-8 flex h-12 w-full max-w-[644px] items-center gap-3 rounded-full bg-page px-5">
                <input
                    type="search"
                    placeholder="Search projects"
                    aria-label="Search projects"
                    className="w-full bg-transparent text-base text-content outline-none placeholder:text-content-placeholder"
                />
            </div>

            {/* Header actions */}
            <nav 
                aria-label="Header actions"
                className="flex items-center gap-8"
            >
                <button 
                    type="button" 
                    aria-label="Help"
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
                >
                    ?
                </button>

                <button 
                    type="button"
                    aria-label="Profile"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                >
                    <span className="text-sm">P</span>
                </button>
            </nav>
        </header>

    )
}