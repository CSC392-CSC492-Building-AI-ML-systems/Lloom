import type { DatasetFixture, RunConfiguration } from "./run-configuration";

export const fixtureProject = { id: "fixture-project", name: "Customer Feedback Analysis" };

// Display-only examples; these do not represent configured credentials or model access.
export const fixtureModelSettings = { provider: "OpenAI", model: "GPT-4o" };

// Illustrative metadata and sample rows only. No files are parsed or uploaded.
export const datasetFixtures: DatasetFixture[] = [
    {
        id: "survey-responses",
        name: "survey_responses.csv",
        columns: ["response_id", "response_text", "follow_up"],
        textColumns: ["response_text", "follow_up"],
        rowCount: 1248,
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
    },
    {
        id: "support-feedback",
        name: "support_feedback.json",
        columns: ["ticket_id", "message"],
        textColumns: ["message"],
        rowCount: 86,
        sampleRows: [
            { ticket_id: "T-001", message: "The team resolved my issue quickly." },
            { ticket_id: "T-002", message: "I had trouble finding the account settings." },
        ],
    },
];

export const defaultConfiguration: RunConfiguration = {
    datasetId: "survey-responses",
    textColumn: "response_text",
    documentIdColumn: "",
    targetConcepts: "20",
    seedPhrase: "",
    synthesisRounds: 1,
    automaticReview: true,
};
