export type ProjectSummary = {
    id: string;
    name: string;
    description: string;
    created: string;
    lastOpened: string;
};

export type Dataset = {
    id: string;
    name: string;
    format: "CSV" | "JSON";
    columns: string[];
    textColumns: string[];
    rowCount: number;
    sampleRows: Record<string, string>[];
};

export type ProjectRun = {
    id: string;
    name: string;
    datasetId: string;
    created: string;
} & (
    | { status: "Draft"; configuration: Record<string, unknown> }
    | { status: "Completed"; concepts: number }
    | { status: "Pending" | "Running" | "Failed" | "Cancelled"; temporary: true }
);

export type ProjectDetail = ProjectSummary & { datasets: Dataset[]; runs: ProjectRun[] };
