import Link from "next/link";
import type { ConceptCounts } from "@/fixtures/run-results";

export default function ConceptOverviewChart({
    rows,
    onSelect,
    getConceptHref,
}: {
    rows: ConceptCounts[];
    onSelect: (row: ConceptCounts) => void;
    getConceptHref: (row: ConceptCounts) => string;
}) {
    const ordered = [...rows].sort((a, b) => b.documentIds.length - a.documentIds.length);
    const maximum = Math.max(6, ...rows.map((row) => row.documentIds.length));
    const step = Math.max(1, Math.ceil(maximum / 6 / 10) * 10);
    const ceiling = Math.ceil(maximum / step) * step;
    const ticks = Array.from({ length: ceiling / step + 1 }, (_, index) => index * step);
    return (
        <>
            <p className="mt-4 text-[13px] text-content-secondary">Number of documents</p>
            <div
                role="region"
                aria-label="Concept overview chart"
                tabIndex={0}
                className="mt-1 overflow-x-auto rounded focus-visible:outline-2 focus-visible:outline-primary"
            >
                <div className="relative flex w-max min-w-full pt-5">
                    <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute top-5 left-0 h-[260px] w-full overflow-visible"
                    >
                        {ticks.map((tick) => {
                            const y = 240 - (tick / ceiling) * 220;
                            return (
                                <g key={tick}>
                                    <line
                                        x1="56"
                                        x2="100%"
                                        y1={y}
                                        y2={y}
                                        className="stroke-outline"
                                    />
                                    <text
                                        x="32"
                                        y={y + 4}
                                        textAnchor="end"
                                        className="fill-content-secondary text-[13px]"
                                    >
                                        {tick}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                    <div aria-hidden="true" className="w-14 shrink-0" />
                    {ordered.map((row) => {
                        const count = row.documentIds.length;
                        const height = (count / ceiling) * 220;
                        const content = (
                            <>
                                {" "}
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 80 260"
                                    className="mx-auto h-[260px] w-20 overflow-visible"
                                >
                                    <rect
                                        x="0"
                                        y={240 - height}
                                        width="80"
                                        height={height}
                                        rx="4"
                                        className="fill-brand-light"
                                    />
                                    <text
                                        x="40"
                                        y={230 - height}
                                        textAnchor="middle"
                                        className="fill-content text-[13px]"
                                    >
                                        {count}
                                    </text>
                                </svg>
                                <span
                                    aria-hidden="true"
                                    className="mx-auto block min-h-16 max-w-[150px] text-[13px] leading-5 text-content"
                                >
                                    {row.name}
                                </span>
                            </>
                        );
                        const className =
                            "relative min-w-[150px] flex-1 rounded px-3 text-center hover:bg-info-surface/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary";
                        return row.kind === "concept" ? (
                            <Link
                                key={row.id}
                                href={getConceptHref(row)}
                                aria-label={`${row.name}: ${count} matching documents. Open concept details.`}
                                className={className}
                            >
                                {content}
                            </Link>
                        ) : (
                            <button
                                key={row.id}
                                type="button"
                                aria-label={`Outlier: ${count} documents. Outlier Details placeholder.`}
                                onClick={() => onSelect(row)}
                                className={className}
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="sr-only">
                <table>
                    <caption>Concept match counts, including the derived Outlier category</caption>
                    <thead>
                        <tr>
                            <th scope="col">Concept</th>
                            <th scope="col">Matching documents</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <th scope="row">{row.name}</th>
                                <td>{row.documentIds.length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
