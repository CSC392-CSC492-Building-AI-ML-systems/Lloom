// Illustrative catalogue only; these entries do not imply live provider support.
export const providerFixtures = [
    { id: "openai", name: "OpenAI", models: ["GPT-4o", "GPT-4o mini"] },
    { id: "gemini", name: "Gemini", models: ["Gemini demo model", "Gemini alternate demo model"] },
    {
        id: "deepseek",
        name: "DeepSeek",
        models: ["DeepSeek demo model", "DeepSeek alternate demo model"],
    },
    { id: "other", name: "Other", models: ["Other demo model"] },
];

// Intentionally invalid credentials for demonstrating masking and simulated outcomes.
export const initialDemoCredential = "demo-not-a-real-api-key";
export const failureDemoCredential = "demo-fail-not-a-real-api-key";
export const mockConnectionDelayMs = 700;

export function mockConnectionFails(providerId: string, credential: string) {
    return providerId === "other" || credential.trim() === failureDemoCredential;
}
