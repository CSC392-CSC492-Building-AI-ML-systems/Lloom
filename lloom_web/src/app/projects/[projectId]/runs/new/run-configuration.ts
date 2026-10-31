export const synthesisRoundOptions = [1, 2, 3] as const;

// Frontend draft state, not a backend request contract.
export type RunConfiguration = {
    datasetId: string;
    textColumn: string;
    documentIdColumn: string;
    targetConcepts: string;
    seedPhrase: string;
    synthesisRounds: number;
    automaticReview: boolean;
};

export type ConfigurationErrors = Partial<Record<keyof RunConfiguration, string>>;

export type DatasetFixture = {
    id: string;
    name: string;
    columns: string[];
    textColumns: string[];
    rowCount: number;
    sampleRows: Record<string, string>[];
};

export function validateConfiguration(
    configuration: RunConfiguration,
    datasets: DatasetFixture[],
): ConfigurationErrors {
    const errors: ConfigurationErrors = {};
    const dataset = datasets.find((item) => item.id === configuration.datasetId);
    if (!dataset) errors.datasetId = "Select a dataset.";
    if (!dataset?.textColumns.includes(configuration.textColumn))
        errors.textColumn = "Select a text column from this dataset.";
    if (
        configuration.documentIdColumn &&
        !dataset?.columns.includes(configuration.documentIdColumn)
    )
        errors.documentIdColumn = "Select an ID column from this dataset.";
    const count = Number(configuration.targetConcepts);
    if (!configuration.targetConcepts.trim() || !Number.isSafeInteger(count) || count < 1)
        errors.targetConcepts = "Enter a positive whole number.";
    if (!synthesisRoundOptions.some((round) => round === configuration.synthesisRounds))
        errors.synthesisRounds = "Select an available number of rounds.";
    return errors;
}
