import { Circle, CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import { stages, stageStatus } from "../../run-simulation";
import type { SimulatedRun } from "../../run-simulation";

export default function AnalysisProgress({ run }: { run: SimulatedRun }) {
    return (
        <section
            aria-labelledby="analysis-progress-heading"
            className="min-w-0 rounded-[14px] border border-outline bg-surface p-5 md:p-6"
        >
            <h2
                id="analysis-progress-heading"
                className="border-l-[3px] border-primary pl-2.5 text-xl font-medium"
            >
                Analysis Progress
            </h2>
            <p className="mt-3 text-[15px] text-content-secondary">
                Track LLooM&apos;s concept discovery and scoring stages.
            </p>
            <ol className="mt-4">
                {stages.map((stage, index) => {
                    const status = stageStatus(run, stage.name);
                    const active = status === "In progress";
                    const done = status === "Completed";
                    const stopped = status === "Failed" || status === "Cancelled";
                    const Icon = done
                        ? CircleCheck
                        : active
                          ? LoaderCircle
                          : stopped
                            ? CircleX
                            : Circle;
                    return (
                        <li
                            key={stage.name}
                            aria-current={active ? "step" : undefined}
                            className={`relative flex min-w-0 gap-4 rounded-[9px] px-3 py-3 ${active ? "bg-info-surface" : ""}`}
                        >
                            {index < stages.length - 1 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-12 bottom-[-12px] left-[31px] w-0.5 bg-outline"
                                />
                            )}
                            <span
                                aria-hidden="true"
                                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-success-surface text-success" : active ? "bg-surface text-primary" : stopped ? "bg-surface-subtle text-danger" : "bg-surface-subtle text-content-secondary"}`}
                            >
                                <Icon
                                    size={20}
                                    className={
                                        active ? "animate-spin motion-reduce:animate-none" : ""
                                    }
                                />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                                    <h3
                                        className={`text-base font-medium ${active ? "text-primary" : done ? "text-content" : "text-content-secondary"}`}
                                    >
                                        Stage {index + 1} — {stage.name}
                                    </h3>
                                    <span
                                        className={`text-[13px] ${done ? "text-success" : active ? "text-primary" : stopped ? "text-danger" : "text-content-secondary"}`}
                                    >
                                        {status}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-content-secondary">
                                    {stage.description}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
