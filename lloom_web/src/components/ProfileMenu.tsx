"use client";

import {
    BookText,
    Info,
    LogIn,
    LogOut,
    Monitor,
    Moon,
    Settings,
    Sun,
    UserRound,
    UserRoundCog,
    X,
} from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { ProfilePresentation } from "./profile.fixtures";
import { useTheme } from "./ThemeProvider";

export default function ProfileMenu({ profile }: { profile: ProfilePresentation }) {
    const [openPath, setOpenPath] = useState<string | null>(null);
    const [notice, setNotice] = useState("");
    const [position, setPosition] = useState({ top: 0, left: 16, width: 340, maxHeight: 0 });
    const trigger = useRef<HTMLButtonElement>(null);
    const popup = useRef<HTMLDivElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();
    const id = useId();
    const theme = useTheme();
    const visible = openPath === pathname;
    const loggedIn = profile.status === "logged-in";

    function close(restoreFocus: boolean) {
        setOpenPath(null);
        if (restoreFocus) trigger.current?.focus();
    }

    useLayoutEffect(() => {
        if (!visible) return;
        function reposition() {
            const rect = trigger.current?.getBoundingClientRect();
            if (!rect) return;
            const top = Math.min(rect.bottom + 12, window.innerHeight - 48);
            const viewportWidth = document.documentElement.clientWidth;
            const width = Math.min(340, viewportWidth - 32);
            setPosition({
                top,
                left: Math.max(16, Math.min(rect.right - width, viewportWidth - width - 16)),
                width,
                maxHeight: Math.max(0, window.innerHeight - top - 16),
            });
        }
        reposition();
        closeButton.current?.focus();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        return () => {
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [visible]);

    useEffect(() => {
        if (!visible) return;
        function isInside(target: EventTarget | null) {
            return (
                target instanceof Node &&
                (popup.current?.contains(target) || trigger.current?.contains(target))
            );
        }
        function onPointer(event: PointerEvent) {
            if (!isInside(event.target)) setOpenPath(null);
        }
        function onFocus(event: FocusEvent) {
            if (!isInside(event.target)) setOpenPath(null);
        }
        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                setOpenPath(null);
                trigger.current?.focus();
            }
        }
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("focusin", onFocus);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("focusin", onFocus);
            document.removeEventListener("keydown", onKey);
        };
    }, [visible]);

    const actions = [
        ...(loggedIn ? [{ label: "Account Settings", icon: UserRoundCog }] : []),
        { label: "API & Model Settings", icon: Settings },
        { label: "Documentation", icon: BookText },
        { label: "About LLooM Web", icon: Info },
        { label: loggedIn ? "Sign Out" : "Sign In", icon: loggedIn ? LogOut : LogIn },
    ];

    return (
        <>
            <button
                ref={trigger}
                type="button"
                aria-label="Profile"
                aria-haspopup="dialog"
                aria-expanded={visible}
                aria-controls={visible ? id : undefined}
                onClick={() => {
                    if (visible) close(true);
                    else {
                        setNotice("");
                        setOpenPath(pathname);
                    }
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-placeholder-surface text-content transition-colors hover:bg-outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                {loggedIn ? (
                    <span className="text-sm font-medium">{profile.initials}</span>
                ) : (
                    <UserRound size={23} aria-hidden="true" />
                )}
            </button>
            {visible &&
                createPortal(
                    <div
                        ref={popup}
                        id={id}
                        role="dialog"
                        aria-modal="false"
                        aria-labelledby={`${id}-title`}
                        style={{
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            maxHeight: position.maxHeight,
                        }}
                        className="fixed z-[100] w-[340px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain rounded-[14px] border border-outline bg-surface text-content shadow-xl"
                    >
                        <div className="relative flex items-center gap-3 bg-page px-4 py-3 pr-12">
                            {loggedIn && (
                                <div
                                    aria-hidden="true"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-content text-lg font-medium text-surface"
                                >
                                    {profile.initials}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h2 id={`${id}-title`} className="text-lg font-medium break-words">
                                    {loggedIn ? profile.name : "Not signed in"}
                                </h2>
                                <p className="mt-0.5 text-sm break-words">
                                    {loggedIn ? profile.email : "Using LLooM locally"}
                                </p>
                                {loggedIn && (
                                    <p className="mt-1 text-xs text-content-secondary">
                                        Fixture profile · not authenticated
                                    </p>
                                )}
                            </div>
                            <button
                                ref={closeButton}
                                type="button"
                                aria-label="Close profile popup"
                                onClick={() => close(true)}
                                className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="px-4 pb-3">
                            <div className="py-2">
                                {actions.map(({ label, icon: Icon }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() =>
                                            setNotice(
                                                `${label} is not yet implemented.${label === "Sign In" || label === "Sign Out" ? " No authentication state has changed." : ""}`,
                                            )
                                        }
                                        className="flex min-h-11 w-full items-center gap-3 rounded-lg py-2 text-left text-base hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    >
                                        <Icon size={20} aria-hidden="true" className="shrink-0" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <fieldset className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-outline pt-3">
                                <legend className="sr-only">Appearance</legend>
                                <span aria-hidden="true" className="text-base font-medium">
                                    Appearance
                                </span>
                                <div className="min-w-0 flex-1 basis-[164px] max-w-[164px]">
                                    <div className="flex justify-between rounded-full bg-placeholder-surface">
                                        {(
                                            [
                                                { value: "system", label: "System", icon: Monitor },
                                                { value: "light", label: "Light", icon: Sun },
                                                { value: "dark", label: "Dark", icon: Moon },
                                            ] as const
                                        ).map(({ value, label, icon: Icon }) => (
                                            <label
                                                key={value}
                                                className="relative cursor-pointer rounded-full"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`${id}-appearance`}
                                                    value={value}
                                                    checked={theme.preference === value}
                                                    onChange={() => theme.setPreference(value)}
                                                    aria-label={label}
                                                    className="peer sr-only"
                                                />
                                                <span className="flex h-9 w-12 items-center justify-center rounded-full text-content peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                                                    <Icon size={20} aria-hidden="true" />
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-center text-sm">
                                        {theme.preference === "system"
                                            ? "System"
                                            : theme.preference === "dark"
                                              ? "Dark"
                                              : "Light"}
                                    </p>
                                </div>
                            </fieldset>
                            <p
                                role="status"
                                aria-live="polite"
                                className="mt-3 text-sm text-content-secondary"
                            >
                                {notice}
                            </p>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
