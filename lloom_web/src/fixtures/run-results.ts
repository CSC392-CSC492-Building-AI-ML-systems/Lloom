// Frontend result fixtures, not a backend response contract.
export type AgreementScore = 0 | 0.25 | 0.5 | 0.75 | 1;
export type ResultConcept = {
    id: string;
    name: string;
    description: string;
    inclusionCriteria: string;
    exampleDocumentIds: string[];
};
export type ResultDocument = {
    id: string;
    text: string;
    metadata: Record<string, string | number | null>;
};
export type ConceptScore = {
    conceptId: string;
    documentId: string;
    score: AgreementScore | null;
    rationale: string;
    evidence: string[];
};
export type DatasetSlice =
    | { id: string; label: string; kind: "all" }
    | {
          id: string;
          label: string;
          kind: "numeric";
          columnId: string;
          lowerExclusive: number;
          upperInclusive: number;
      }
    | { id: string; label: string; kind: "category"; columnId: string; value: string }
    | { id: string; label: string; kind: "missing"; columnId: string };
export type ResultGrouping = {
    id: string;
    label: string;
    provenance: "synthetic" | "dataset-fixture";
    slices: DatasetSlice[];
};
export type RunResults = {
    projectId: string;
    runId: string;
    datasetId: string;
    textColumn: string;
    provenance: "illustrative-fixture";
    matchThreshold: 1;
    concepts: ResultConcept[];
    documents: ResultDocument[];
    scores: ConceptScore[];
    groupings: ResultGrouping[];
};
export type ConceptCounts = {
    id: string;
    name: string;
    kind: "concept" | "outlier";
    documentIds: string[];
};
export const allDocumentsSlice: DatasetSlice = { id: "all", label: "All", kind: "all" };

export function documentInSlice(document: ResultDocument, slice: DatasetSlice) {
    if (slice.kind === "all") return true;
    const value = document.metadata[slice.columnId];
    if (slice.kind === "missing") return value === null || value === undefined;
    if (slice.kind === "category") return value === slice.value;
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > slice.lowerExclusive &&
        value <= slice.upperInclusive
    );
}

// Shared by the overview, matrix, and future detail pages. Null is not a zero score.
export function getConceptCounts(results: RunResults): ConceptCounts[] {
    const knownDocuments = new Set(results.documents.map((document) => document.id));
    const conceptIds = new Set(results.concepts.map((concept) => concept.id));
    const matches = new Map(results.concepts.map((concept) => [concept.id, new Set<string>()]));
    const scored = new Map<string, Set<string>>();
    for (const record of results.scores) {
        if (
            !knownDocuments.has(record.documentId) ||
            !conceptIds.has(record.conceptId) ||
            record.score === null
        )
            continue;
        const evaluated = scored.get(record.documentId) ?? new Set<string>();
        evaluated.add(record.conceptId);
        scored.set(record.documentId, evaluated);
        if (record.score >= results.matchThreshold)
            matches.get(record.conceptId)?.add(record.documentId);
    }
    const matchedDocuments = new Set([...matches.values()].flatMap((ids) => [...ids]));
    return [
        ...results.concepts.map((concept) => ({
            id: concept.id,
            name: concept.name,
            kind: "concept" as const,
            documentIds: [...(matches.get(concept.id) ?? [])],
        })),
        {
            id: "outlier",
            name: "Outlier",
            kind: "outlier",
            documentIds: results.documents
                .filter(
                    (document) =>
                        !matchedDocuments.has(document.id) &&
                        (scored.get(document.id)?.size ?? 0) === results.concepts.length,
                )
                .map((document) => document.id),
        },
    ];
}

export function getMatrixCounts(
    results: RunResults,
    rows: ConceptCounts[],
    slices: DatasetSlice[],
) {
    const sliceDocuments = slices.map(
        (slice) =>
            new Set(
                results.documents
                    .filter((document) => documentInSlice(document, slice))
                    .map((document) => document.id),
            ),
    );
    return rows.map((row) =>
        sliceDocuments.map((ids) => row.documentIds.filter((id) => ids.has(id)).length),
    );
}
