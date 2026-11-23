import type { ConfigurationErrors, DatasetFixture, RunConfiguration } from "./run-configuration";

type DataConfigurationProps = {
    configuration: RunConfiguration;
    datasets: DatasetFixture[];
    errors: ConfigurationErrors;
    onDatasetChange: (id: string) => void;
    onChange: (patch: Partial<RunConfiguration>) => void;
};

const selectClass =
    "mt-2 min-h-[46px] w-full rounded-[9px] border border-outline bg-surface px-3.5 text-[15px] text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function DataConfiguration({
    configuration,
    datasets,
    errors,
    onDatasetChange,
    onChange,
}: DataConfigurationProps) {
    const dataset = datasets.find((item) => item.id === configuration.datasetId);
    return (
        <section
            aria-labelledby="data-configuration-heading"
            className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
        >
            <h2
                id="data-configuration-heading"
                className="border-l-[5px] border-primary pl-3 text-[23px] font-medium"
            >
                Data configuration
            </h2>
            <p className="mt-2 text-[15px] text-content-secondary">
                Select the source and text column to analyze.
            </p>
            <div className="mt-4 space-y-3 border-t border-outline pt-4">
                <div>
                    <label htmlFor="datasetId" className="block text-sm font-medium uppercase">
                        Dataset
                    </label>
                    <select
                        id="datasetId"
                        required
                        value={configuration.datasetId}
                        onChange={(event) => onDatasetChange(event.target.value)}
                        aria-invalid={!!errors.datasetId}
                        aria-describedby={errors.datasetId ? "dataset-error" : undefined}
                        className={selectClass}
                    >
                        <option value="">Select a dataset</option>
                        {datasets.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    {errors.datasetId && (
                        <p id="dataset-error" className="mt-1 text-sm text-danger">
                            {errors.datasetId}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="textColumn" className="block text-sm font-medium uppercase">
                        Text column
                    </label>
                    <select
                        id="textColumn"
                        required
                        disabled={!dataset}
                        value={configuration.textColumn}
                        onChange={(event) => onChange({ textColumn: event.target.value })}
                        aria-invalid={!!errors.textColumn}
                        aria-describedby="text-column-help"
                        className={selectClass}
                    >
                        <option value="">Select a text column</option>
                        {dataset?.textColumns.map((column) => (
                            <option key={column}>{column}</option>
                        ))}
                    </select>
                    <p
                        id="text-column-help"
                        className={`mt-1 text-xs ${errors.textColumn ? "text-danger" : "text-content-secondary"}`}
                    >
                        {errors.textColumn || "The text in this column will be analyzed."}
                    </p>
                </div>
                <div>
                    <label
                        htmlFor="documentIdColumn"
                        className="block text-sm font-medium uppercase"
                    >
                        Document ID (optional)
                    </label>
                    <select
                        id="documentIdColumn"
                        disabled={!dataset}
                        value={configuration.documentIdColumn}
                        onChange={(event) => onChange({ documentIdColumn: event.target.value })}
                        aria-invalid={!!errors.documentIdColumn}
                        aria-describedby="document-id-help"
                        className={selectClass}
                    >
                        <option value="">Auto-generate IDs</option>
                        {dataset?.columns.map((column) => (
                            <option key={column}>{column}</option>
                        ))}
                    </select>
                    <p
                        id="document-id-help"
                        className={`mt-1 text-xs ${errors.documentIdColumn ? "text-danger" : "text-content-secondary"}`}
                    >
                        {errors.documentIdColumn ||
                            "Or select a unique ID column from your dataset. Uniqueness is not checked in this preview."}
                    </p>
                </div>
                <div className="overflow-hidden rounded-[9px] border border-outline bg-surface-subtle">
                    <div className="flex justify-between gap-3 border-b border-outline px-3 py-2 text-xs text-content-secondary">
                        <h3 className="font-medium uppercase">Data preview</h3>
                        <span>Fixture sample rows</span>
                    </div>
                    {dataset && configuration.textColumn ? (
                        <>
                            <ul>
                                {dataset.sampleRows.map((row, index) => (
                                    <li
                                        key={index}
                                        className="flex min-w-0 gap-3 border-b border-outline px-3 py-2 text-[13px]"
                                    >
                                        <span className="shrink-0 text-content-secondary">
                                            {configuration.documentIdColumn
                                                ? row[configuration.documentIdColumn]
                                                : String(index + 1).padStart(3, "0")}
                                        </span>
                                        <span className="min-w-0 break-words">
                                            {row[configuration.textColumn]}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className="px-3 py-1 text-[11px] text-content-secondary">
                                {dataset.rowCount.toLocaleString("en-US")} rows ·{" "}
                                {dataset.textColumns.length} text{" "}
                                {dataset.textColumns.length === 1 ? "column" : "columns"} · fixture
                                data
                            </p>
                        </>
                    ) : (
                        <p className="p-3 text-sm text-content-secondary">
                            Select a dataset and text column to preview sample rows.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
