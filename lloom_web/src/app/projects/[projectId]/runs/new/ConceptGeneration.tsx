import { Info, SlidersHorizontal } from "lucide-react";
import { synthesisRoundOptions } from "./run-configuration";
import type { ConfigurationErrors, RunConfiguration } from "./run-configuration";

type ConceptGenerationProps = {
    configuration: RunConfiguration;
    errors: ConfigurationErrors;
    onChange: (patch: Partial<RunConfiguration>) => void;
};

export default function ConceptGeneration({
    configuration,
    errors,
    onChange,
}: ConceptGenerationProps) {
    return (
        <section
            aria-labelledby="concept-generation-heading"
            className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
        >
            <h2
                id="concept-generation-heading"
                className="border-l-[5px] border-primary pl-3 text-[23px] font-medium"
            >
                Concept generation
            </h2>
            <p className="mt-2 text-[15px] text-content-secondary">
                Control how LLooM identifies themes in your data.
            </p>
            <div className="mt-4 space-y-4 border-t border-outline pt-4">
                <div>
                    <label htmlFor="targetConcepts" className="block text-sm font-medium uppercase">
                        Target number of concepts
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <input
                            id="targetConcepts"
                            type="number"
                            min={1}
                            step={1}
                            required
                            value={configuration.targetConcepts}
                            onChange={(event) => onChange({ targetConcepts: event.target.value })}
                            aria-invalid={!!errors.targetConcepts}
                            aria-describedby="target-concepts-help"
                            className="min-h-[46px] w-[106px] rounded-[9px] border border-outline bg-surface px-3.5 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                        <p
                            id="target-concepts-help"
                            className={`text-xs ${errors.targetConcepts ? "text-danger" : "text-content-secondary"}`}
                        >
                            {errors.targetConcepts ||
                                "Approximate target; the final number may vary."}
                        </p>
                    </div>
                </div>
                <div>
                    <label htmlFor="seedPhrase" className="block text-sm font-medium uppercase">
                        Seed phrase (optional)
                    </label>
                    <input
                        id="seedPhrase"
                        value={configuration.seedPhrase}
                        onChange={(event) => onChange({ seedPhrase: event.target.value })}
                        placeholder="e.g. customer satisfaction, product usability"
                        aria-describedby="seed-phrase-help"
                        className="mt-2 min-h-[46px] w-full rounded-[9px] border border-outline bg-surface px-3.5 text-[15px] placeholder:text-content-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    />
                    <p id="seed-phrase-help" className="mt-1 text-xs text-content-secondary">
                        Direct concept discovery toward a specific theme. Leave blank for open-ended
                        analysis.
                    </p>
                </div>
                <fieldset className="min-w-0 rounded-[10px] bg-surface-subtle p-4">
                    <legend className="sr-only">Generation options</legend>
                    <p aria-hidden="true" className="flex items-center gap-2 text-base font-medium">
                        <SlidersHorizontal size={18} className="text-primary" />
                        Generation options
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <label htmlFor="synthesisRounds" className="text-sm font-medium">
                                Synthesis rounds
                            </label>
                            <p id="rounds-help" className="text-xs text-content-secondary">
                                Repeat concept abstraction (default: 1).
                            </p>
                        </div>
                        <select
                            id="synthesisRounds"
                            value={configuration.synthesisRounds}
                            onChange={(event) =>
                                onChange({ synthesisRounds: Number(event.target.value) })
                            }
                            aria-describedby={`rounds-help${errors.synthesisRounds ? " rounds-error" : ""}`}
                            aria-invalid={!!errors.synthesisRounds}
                            className="min-h-9 rounded-lg border border-outline bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {synthesisRoundOptions.map((round) => (
                                <option key={round} value={round}>
                                    {round} {round === 1 ? "round" : "rounds"}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.synthesisRounds && (
                        <p id="rounds-error" className="mt-1 text-sm text-danger">
                            {errors.synthesisRounds}
                        </p>
                    )}
                    <label className="mt-4 flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={configuration.automaticReview}
                            onChange={(event) =>
                                onChange({ automaticReview: event.target.checked })
                            }
                            aria-describedby="auto-review-help"
                            className="mt-0.5 h-5 w-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                        <span>
                            <span className="block text-sm font-medium">
                                Automatically review generated concepts
                            </span>
                            <span
                                id="auto-review-help"
                                className="block text-xs text-content-secondary"
                            >
                                Remove or merge low-quality concepts.
                            </span>
                        </span>
                    </label>
                </fieldset>
                <div className="flex items-center gap-3 rounded-[10px] bg-info-surface p-3">
                    <Info size={22} className="shrink-0 text-primary" aria-hidden="true" />
                    <div>
                        <p className="text-[13px] font-medium">
                            Models and API keys are configured separately.
                        </p>
                        <p className="mt-0.5 text-xs text-content-secondary">
                            See API &amp; Model Settings to select your provider and models.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
