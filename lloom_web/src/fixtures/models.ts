export const modelOptions = [
    { value: "default", label: "LLooM default (recommended)" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
] as const;

export type ModelSettings = { provider: "openai"; model: (typeof modelOptions)[number]["value"] };
export function modelLabel(model: string) {
    return model === "default"
        ? "LLooM default"
        : (modelOptions.find((option) => option.value === model)?.label ?? model);
}
export function providerLabel(provider: string) {
    return provider === "openai" ? "OpenAI" : provider;
}
