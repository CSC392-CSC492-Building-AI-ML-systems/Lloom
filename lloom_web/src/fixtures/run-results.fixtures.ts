import type { DatasetFixture, ProjectFixture } from "./projects";
import type { AgreementScore, ResultConcept, ResultDocument, RunResults } from "./run-results";

// Curated fictional themes and excerpts. No text is read, parsed, classified, or sent to a model.
const politicalThemes = [
    ["Fighting Injustice", "People should receive equal treatment under the law."],
    ["Economic Strategies", "Investment in local businesses can support stable employment."],
    [
        "Security and Defense",
        "Public safety requires accountable institutions and careful planning.",
    ],
    ["Healthcare Issues", "Access to affordable treatment should improve in every community."],
    [
        "Educational and Social Initiatives",
        "Schools and community programs need sustained support.",
    ],
    ["Environmental Policy", "Protecting clean air requires practical environmental safeguards."],
    ["Transport Access", "Reliable public transport connects residents to essential services."],
    [
        "Housing Affordability",
        "More affordable homes would help families remain in their neighborhoods.",
    ],
    [
        "Public Accountability",
        "Officials should explain decisions and publish public spending records.",
    ],
];
const surveyThemes = [
    ["Customer Support", "Helpful support staff resolved the question with clear advice."],
    ["Product Reliability", "The product worked consistently during everyday use."],
    ["Delivery Experience", "Delivery arrived on time with useful tracking updates."],
    ["Ease of Setup", "The setup instructions made the first steps straightforward."],
    ["Value for Money", "The features offered good value for the price."],
    ["Product Quality", "The materials felt durable and well finished."],
    ["Response Times", "A faster response to questions would improve the experience."],
    ["Website Usability", "The website made it easy to find the information needed."],
    ["Payment Experience", "Payment was straightforward and the receipt was clear."],
    ["Returns Process", "The return instructions were easy to follow."],
    ["Feature Requests", "Additional customization would make the product more useful."],
    ["Accessibility", "Larger controls would make the interface easier to use."],
    ["Communication", "Regular updates helped explain what would happen next."],
    ["Packaging", "The packaging protected the contents during transport."],
    ["Account Management", "Managing account preferences should take fewer steps."],
    ["Documentation", "Examples in the documentation answered common questions."],
    ["Service Availability", "Service should remain available when customers need it."],
    ["Overall Satisfaction", "The overall experience met the customer's expectations."],
];

function catalogue(datasetId: string, textColumn: string) {
    if (datasetId === "political-posts" && textColumn === "message") return politicalThemes;
    if (
        (datasetId === "survey-2025" || datasetId === "survey-2026") &&
        textColumn === "response_text"
    )
        return surveyThemes;
    return undefined;
}

export function previewConceptCount(datasetId: string, textColumn: string, requested: number) {
    const themes = catalogue(datasetId, textColumn);
    return themes && Number.isSafeInteger(requested) && requested >= 0
        ? Math.min(requested, themes.length)
        : 0;
}

export function createResultFixture(
    projectId: string,
    runId: string,
    dataset: DatasetFixture,
    textColumn: string,
    requested: number,
): RunResults | undefined {
    const themes = catalogue(dataset.id, textColumn);
    if (!themes || !Number.isSafeInteger(requested) || requested < 0 || requested > themes.length)
        return undefined;
    const concepts: ResultConcept[] = themes.slice(0, requested).map(([name], index) => ({
        id: `${dataset.id}-concept-${index + 1}`,
        name,
        description: `Fictional discussions about ${name.toLowerCase()}.`,
        inclusionCriteria: `The document explicitly discusses ${name.toLowerCase()}, rather than mentioning it incidentally.`,
        exampleDocumentIds: [],
    }));
    const buckets: AgreementScore[] = [0, 0.25, 0.5, 0.75];
    // A shared record for every document/concept pair, including overlapping matches.
    // The last concept has zero matches to exercise a real zero-height chart/matrix row.
    const scores = Array.from({ length: dataset.rowCount }, (_, index) =>
        concepts.map((concept, conceptIndex) => {
            const match =
                index % 11 !== 0 &&
                (concepts.length === 1 || conceptIndex !== concepts.length - 1) &&
                (index + conceptIndex * 3) % 17 < Math.max(1, 8 - conceptIndex);
            const score = match ? 1 : buckets[(index + conceptIndex) % buckets.length];
            const example = themes[conceptIndex][1];
            return {
                documentId: String(index + 1).padStart(4, "0"),
                conceptId: concept.id,
                score,
                rationale: match
                    ? `Fictional rationale: this example explicitly supports ${concept.name.toLowerCase()}.`
                    : `Fictional rationale: the example does not fully satisfy the criteria for ${concept.name.toLowerCase()}.`,
                evidence: match ? [example] : [],
            };
        }),
    ).flat();
    const matchedByDocument = new Map<string, string[]>();
    for (const score of scores)
        if (score.score === 1) {
            const excerpts = matchedByDocument.get(score.documentId) ?? [];
            excerpts.push(
                themes[concepts.findIndex((concept) => concept.id === score.conceptId)][1],
            );
            matchedByDocument.set(score.documentId, excerpts);
            const concept = concepts.find((concept) => concept.id === score.conceptId);
            if (concept && concept.exampleDocumentIds.length < 2)
                concept.exampleDocumentIds.push(score.documentId);
        }
    const documents: ResultDocument[] = Array.from({ length: dataset.rowCount }, (_, index) => {
        const id = String(index + 1).padStart(4, "0");
        const metadata: ResultDocument["metadata"] = {};
        if (dataset.id === "political-posts") metadata.syntheticLikes = (index * 37) % 233;
        return {
            id,
            text: (
                matchedByDocument.get(id) ?? [
                    dataset.id === "political-posts"
                        ? "The meeting agenda listed the date and opening hours."
                        : "The response recorded the date of the customer's visit.",
                ]
            ).join(" "),
            metadata,
        };
    });
    return {
        projectId,
        runId,
        datasetId: dataset.id,
        textColumn,
        provenance: "illustrative-fixture",
        matchThreshold: 1,
        concepts,
        documents,
        scores,
        groupings:
            dataset.id === "political-posts"
                ? [
                      {
                          id: "syntheticLikes",
                          label: "Likes (synthetic)",
                          provenance: "synthetic",
                          slices: [
                              {
                                  id: "likes-0-29",
                                  label: "0–29",
                                  kind: "numeric",
                                  columnId: "syntheticLikes",
                                  lowerExclusive: -1,
                                  upperInclusive: 29,
                              },
                              {
                                  id: "likes-30-69",
                                  label: "30–69",
                                  kind: "numeric",
                                  columnId: "syntheticLikes",
                                  lowerExclusive: 29,
                                  upperInclusive: 69,
                              },
                              {
                                  id: "likes-70-112",
                                  label: "70–112",
                                  kind: "numeric",
                                  columnId: "syntheticLikes",
                                  lowerExclusive: 69,
                                  upperInclusive: 112,
                              },
                              {
                                  id: "likes-113-232",
                                  label: "113–232",
                                  kind: "numeric",
                                  columnId: "syntheticLikes",
                                  lowerExclusive: 112,
                                  upperInclusive: 232,
                              },
                          ],
                      },
                  ]
                : [],
    };
}

export function existingRunResults(project: ProjectFixture, runId: string) {
    const run = project.runs.find((run) => run.id === runId);
    if (!run || run.status !== "Completed") return undefined;
    const dataset = project.datasets.find((dataset) => dataset.id === run.datasetId);
    if (!dataset) return undefined;
    return createResultFixture(
        project.id,
        runId,
        dataset,
        dataset.textColumns[0] ?? "",
        run.concepts,
    );
}
