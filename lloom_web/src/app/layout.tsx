import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { themeBootstrap } from "@/components/theme";

const roboto = Roboto({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-roboto",
    display: "swap",
});

export const metadata: Metadata = {
    title: "LLooM Web",
    description: "LLooM concept analysis platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={`${roboto.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <head>
                <style>{"html:not([data-theme-ready]) body { visibility: hidden; }"}</style>
                <noscript
                    dangerouslySetInnerHTML={{
                        __html: "<style>html:not([data-theme-ready]) body { visibility: visible; }</style>",
                    }}
                />
                <Script
                    id="lloom-theme-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{ __html: themeBootstrap }}
                />
            </head>
            <body className="flex min-h-full flex-col">
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
