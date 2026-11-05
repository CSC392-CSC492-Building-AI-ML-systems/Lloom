import type { ReactNode } from "react";
import RunConfigurationProvider from "./RunConfigurationProvider";

export default async function NewRunLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = await params;
    return <RunConfigurationProvider key={projectId}>{children}</RunConfigurationProvider>;
}
