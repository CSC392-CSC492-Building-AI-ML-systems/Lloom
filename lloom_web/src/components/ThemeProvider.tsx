"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { isThemePreference, setThemePreference, subscribeTheme, themeSnapshot } from "./theme";
import type { ThemePreference } from "./theme";

type ThemeContextValue = {
    preference: ThemePreference;
    resolved: "light" | "dark";
    setPreference: (value: ThemePreference) => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const snapshot = useSyncExternalStore(subscribeTheme, themeSnapshot, () => "system:light");
    const [selected, resolved] = snapshot.split(":");
    return (
        <ThemeContext
            value={{
                preference: isThemePreference(selected) ? selected : "system",
                resolved: resolved === "dark" ? "dark" : "light",
                setPreference: setThemePreference,
            }}
        >
            {children}
        </ThemeContext>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme requires ThemeProvider");
    return context;
}
