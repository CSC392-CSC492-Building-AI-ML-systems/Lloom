import Papa from "papaparse";

export type ValidationResult =
    { status: "Valid"; message?: string } | { status: "Error"; message: string };
const valid: ValidationResult = { status: "Valid" };
const error = (message: string): ValidationResult => ({ status: "Error", message });

// Common pandas CSV missing tokens. JSON strings use different inference rules.
const csvMissing = new Set([
    "",
    "#N/A",
    "#N/A N/A",
    "#NA",
    "-1.#IND",
    "-1.#QNAN",
    "-NaN",
    "-nan",
    "1.#IND",
    "1.#QNAN",
    "<NA>",
    "N/A",
    "NA",
    "NULL",
    "NaN",
    "None",
    "n/a",
    "nan",
    "null",
]);
const numeric = /^[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|inf(?:inity)?)$/i;
const NUMBER = 1,
    BOOLEAN = 2,
    MISSING = 4,
    TEXT = 8,
    AMBIGUOUS = 16;

function valueKind(value: unknown, csv: boolean): number {
    if (value === null || value === undefined) return MISSING;
    if (typeof value === "number") return NUMBER;
    if (typeof value === "boolean") return BOOLEAN;
    if (typeof value !== "string") return AMBIGUOUS; // pandas object dtype can include nested values.
    if (csv && csvMissing.has(value)) return MISSING;
    if (numeric.test(value.trim())) {
        // Large integers / overflowing floats may remain object strings in pandas.
        const number = Number(value);
        if (!Number.isFinite(number) && !/^[+-]?inf(?:inity)?$/i.test(value.trim()))
            return AMBIGUOUS;
        if (/^[+-]?\d+$/.test(value.trim()) && !Number.isSafeInteger(number)) return AMBIGUOUS;
        return NUMBER;
    }
    if (csv && /^(true|false)$/i.test(value)) return BOOLEAN;
    return TEXT;
}

function mayBeText(kind: number): boolean {
    // Mixed boolean/numeric or nullable booleans may become pandas object columns.
    return !!(kind & (TEXT | AMBIGUOUS)) || !!(kind & BOOLEAN && kind & (NUMBER | MISSING));
}

function columnResult(kinds: Iterable<number>): ValidationResult {
    return [...kinds].some(mayBeText)
        ? valid
        : error("Dataset must have at least one text column.");
}

export function validateJson(text: string): ValidationResult {
    if (!text.trim()) return error("The file is empty.");
    let records: unknown;
    try {
        records = JSON.parse(text);
    } catch {
        return error("Malformed JSON file.");
    }
    if (
        !Array.isArray(records) ||
        !records.every((row) => typeof row === "object" && row !== null && !Array.isArray(row))
    ) {
        return error("JSON must be an array of objects.");
    }
    const columns = new Map<string, { kind: number; seen: number }>();
    for (const row of records) {
        for (const [name, value] of Object.entries(row)) {
            const column = columns.get(name) ?? { kind: 0, seen: 0 };
            column.kind |= valueKind(value, false);
            column.seen++;
            columns.set(name, column);
        }
    }
    if (!records.length || !columns.size) return error("Dataset has no rows or columns.");
    return columnResult(
        [...columns.values()].map(
            (column) => column.kind | (column.seen < records.length ? MISSING : 0),
        ),
    );
}

export function csvValidator() {
    let headerWidth = 0;
    let rowWidth = 0;
    let rowCount = 0;
    const kinds: number[] = [];
    let failure: ValidationResult | undefined;
    let ambiguousQuotes = false;
    return {
        consume(rows: string[][], errors: Papa.ParseError[]) {
            ambiguousQuotes ||= errors.some((issue) => issue.code === "InvalidQuotes");
            // Papa and pandas disagree on some permissive quote cases. Only block clear failures.
            if (errors.some((issue) => issue.code === "MissingQuotes"))
                failure = error("Malformed CSV file: unclosed quoted field.");
            for (const row of rows) {
                if (headerWidth && row.length === 1 && row[0] === "") continue;
                if (!headerWidth) {
                    headerWidth = row.length;
                    continue;
                }
                if (!rowCount) rowWidth = Math.max(headerWidth, row.length);
                if (row.length > rowWidth)
                    failure = error("Malformed CSV file: unexpected extra fields.");
                // pandas may infer leading index fields from a wider first data row.
                const offset = rowWidth - headerWidth;
                for (let index = 0; index < headerWidth; index++) {
                    kinds[index] = (kinds[index] ?? 0) | valueKind(row[index + offset], true);
                }
                rowCount++;
            }
        },
        finish(): ValidationResult {
            if (ambiguousQuotes)
                return { status: "Valid", message: "CSV quoting needs backend validation." };
            if (failure) return failure;
            if (!rowCount) return error("Dataset has no data rows.");
            return columnResult(kinds);
        },
    };
}

export const csvOptions = {
    delimiter: ",",
    header: false,
    dynamicTyping: false,
    // Preserve quoted empty headers. Skipping parsed empty lines also skips `""`.
    skipEmptyLines: false,
    beforeFirstChunk: (chunk: string) => chunk.replace(/^(?:[\t ]*\r?\n)+/, ""),
} as const;

// Used by tests; worker file parsing uses identical rules with bounded chunks.
export function validateCsv(text: string): ValidationResult {
    const validator = csvValidator();
    const result = Papa.parse<string[]>(text, csvOptions);
    validator.consume(result.data, result.errors);
    return validator.finish();
}
