import type { RunConfiguration } from "@/app/projects/[projectId]/runs/new/run-configuration";

// Illustrative frontend fixtures, not uploaded files or backend records.
export type DatasetFixture = {
    id: string;
    name: string;
    format: "CSV" | "JSON";
    columns: string[];
    textColumns: string[];
    rowCount: number;
    sampleRows: Record<string, string>[];
};

export type RunFixture = {
    id: string;
    name: string;
    datasetId: string;
    created: string;
    temporary?: boolean;
} & (
    | { status: "Draft"; configuration: RunConfiguration }
    | { status: "Completed"; concepts: number }
    | { status: "Pending" | "Running" | "Failed" | "Cancelled"; temporary: true }
);

export type ProjectFixture = {
    id: string;
    name: string;
    description: string;
    lastOpened: string;
    datasets: DatasetFixture[];
    runs: RunFixture[];
};

const surveySample = {
    columns: ["response_id", "response_text", "follow_up"],
    textColumns: ["response_text", "follow_up"],
    sampleRows: [
        {
            response_id: "001",
            response_text: "The product works well, but customer support was slow...",
            follow_up: "A faster response would help.",
        },
        {
            response_id: "002",
            response_text: "Setup was straightforward and delivery was on time...",
            follow_up: "Keep the setup instructions clear.",
        },
    ],
};

const politicalDataset: DatasetFixture = {
    id: "political-posts",
    name: "political_posts.csv",
    format: "CSV",
    rowCount: 1200,
    columns: ["post_id", "message"],
    textColumns: ["message"],
    sampleRows: [
        { post_id: "P-001", message: "Public transport should be more accessible." },
        { post_id: "P-002", message: "The community discussed changes to local services." },
    ],
};

export const projectFixtures: ProjectFixture[] = [
    {
        id: "1",
        name: "Customer Feedback Analysis",
        description: "Analyzing customer feedback to identify recurring themes.",
        lastOpened: "2026-10-27T14:30:00",
        datasets: [
            {
                ...surveySample,
                id: "survey-2025",
                name: "survey_2025.csv",
                format: "CSV",
                rowCount: 1000,
            },
            {
                ...surveySample,
                id: "survey-2026",
                name: "survey_2026.csv",
                format: "CSV",
                rowCount: 1200,
            },
            politicalDataset,
        ],
        runs: [
            {
                id: "run-3",
                name: "Run 3 — New experiment",
                datasetId: "survey-2025",
                status: "Draft",
                created: "2026-10-18",
                configuration: {
                    datasetId: "survey-2025",
                    textColumn: "response_text",
                    documentIdColumn: "response_id",
                    targetConcepts: "12",
                    seedPhrase: "Customer experience",
                    synthesisRounds: 2,
                    automaticReview: true,
                },
            },
            {
                id: "run-2",
                name: "Run 2 — Political posts analysis",
                datasetId: "political-posts",
                status: "Completed",
                concepts: 6,
                created: "2026-10-15",
            },
            {
                id: "run-1",
                name: "Run 1 — 2025 survey",
                datasetId: "survey-2025",
                status: "Completed",
                concepts: 18,
                created: "2026-10-10",
            },
        ],
    },
    {
        id: "2",
        name: "Reddit Discussion Analysis",
        description: "Exploring themes in community discussions.",
        lastOpened: "2026-10-25T10:15:00",
        datasets: [politicalDataset],
        runs: [
            {
                id: "reddit-run-1",
                name: "Run 1 — Community themes",
                datasetId: "political-posts",
                status: "Completed",
                concepts: 9,
                created: "2026-10-20",
            },
        ],
    },
    {
        id: "3",
        name: "Survey Responses",
        description: "A workspace for exploring survey responses.",
        lastOpened: "2026-10-20T16:45:00",
        datasets: [],
        runs: [],
    },
];

export function getProjectFixture(id: string) {
    return projectFixtures.find((project) => project.id === (id === "fixture-project" ? "1" : id));
}
