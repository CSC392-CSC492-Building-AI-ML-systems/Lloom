import type { DatasetFixture } from "@/fixtures/projects";
import type { RunConfiguration } from "./run-configuration";
import type { ModelSettings } from "@/fixtures/models";

// Display-only metadata; these are not configured credentials or model access.
export const fixtureModelSettings: ModelSettings = { provider: "openai", model: "default" };

export function createDefaultConfiguration(datasets: DatasetFixture[]): RunConfiguration {
    const dataset = datasets[0];
    return {
        datasetId: dataset?.id ?? "",
        textColumn: dataset?.textColumns[0] ?? "",
        documentIdColumn: "",
        targetConcepts: "20",
        seedPhrase: "",
        synthesisRounds: 1,
        automaticReview: true,
    };
}
