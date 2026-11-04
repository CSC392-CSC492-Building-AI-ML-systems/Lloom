export type ThemePreference = "system" | "light" | "dark";
export const themeStorageKey = "lloom-appearance";

export function isThemePreference(value: unknown): value is ThemePreference {
    return value === "system" || value === "light" || value === "dark";
}

// Runs in <head> before page content is painted. Storage access may be blocked.
export const themeBootstrap = `(()=>{let p="system";try{const v=localStorage.getItem("${themeStorageKey}");if(v==="light"||v==="dark"||v==="system")p=v;}catch{}document.documentElement.classList.toggle("dark",p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches));document.documentElement.dataset.themeReady="true";})();`;

let memoryPreference: ThemePreference | undefined;
const listeners = new Set<() => void>();

function preference(): ThemePreference {
    if (memoryPreference) return memoryPreference;
    try {
        const saved = localStorage.getItem(themeStorageKey);
        if (isThemePreference(saved)) return saved;
    } catch {
        /* Theme switching still works when storage is unavailable. */
    }
    return "system";
}

function resolvedTheme(value: ThemePreference) {
    return value === "dark" ||
        (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
}

function notify() {
    const selected = preference();
    document.documentElement.classList.toggle("dark", resolvedTheme(selected) === "dark");
    document.documentElement.dataset.themeReady = "true";
    listeners.forEach((listener) => listener());
}

export function setThemePreference(value: ThemePreference) {
    memoryPreference = value;
    try {
        localStorage.setItem(themeStorageKey, value);
    } catch {
        /* Use memory only. */
    }
    notify();
}

export function themeSnapshot() {
    const selected = preference();
    return `${selected}:${resolvedTheme(selected)}`;
}

export function subscribeTheme(listener: () => void) {
    listeners.add(listener);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onStorage = (event: StorageEvent) => {
        if (event.key === themeStorageKey || event.key === null) {
            memoryPreference = undefined;
            notify();
        }
    };
    media.addEventListener("change", notify);
    window.addEventListener("storage", onStorage);
    notify();
    return () => {
        listeners.delete(listener);
        media.removeEventListener("change", notify);
        window.removeEventListener("storage", onStorage);
    };
}
