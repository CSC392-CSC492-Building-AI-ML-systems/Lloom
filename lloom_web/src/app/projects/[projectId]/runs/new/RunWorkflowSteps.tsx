import { Check } from "lucide-react";

export default function RunWorkflowSteps({ currentStep }: { currentStep: 1 | 2 }) {
    return (
        <ol
            aria-label="New run steps"
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
            <li
                aria-current={currentStep === 1 ? "step" : undefined}
                className="flex items-center gap-2.5 text-base font-medium sm:text-[22px]"
            >
                <span
                    aria-hidden="true"
                    className={`flex h-[42px] w-[42px] items-center justify-center rounded-full text-[22px] ${currentStep === 1 ? "bg-primary text-on-primary" : "bg-content-secondary text-icon-on-completed-step"}`}
                >
                    {currentStep === 1 ? "1" : <Check size={24} />}
                </span>
                Configure Run{currentStep === 2 && <span className="sr-only"> (completed)</span>}
            </li>
            <li
                aria-hidden="true"
                className="hidden h-0.5 w-16 bg-content-secondary sm:block lg:w-[184px]"
            />
            <li
                aria-current={currentStep === 2 ? "step" : undefined}
                className={`flex items-center gap-2.5 text-base sm:text-[22px] ${currentStep === 2 ? "font-medium text-content" : "text-content-secondary"}`}
            >
                <span
                    aria-hidden="true"
                    className={`flex h-[42px] w-[42px] items-center justify-center rounded-full text-[22px] ${currentStep === 2 ? "bg-primary text-on-primary" : "bg-content-secondary text-surface"}`}
                >
                    2
                </span>
                Review Run
            </li>
        </ol>
    );
}
