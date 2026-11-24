import { modelOptions } from "@/fixtures/models";

// Selectable providers match D1.2; tests and saving remain page-local simulations.
export const providerFixtures = [{ id: "openai", name: "OpenAI", models: modelOptions }];

// Intentionally invalid credentials for demonstrating masking and simulated outcomes.
export const initialDemoCredential = "demo-not-a-real-api-key";
export const failureDemoCredential = "demo-fail-not-a-real-api-key";
export const mockConnectionDelayMs = 700;

export function mockConnectionFails(providerId: string, credential: string) {
    return providerId !== "openai" || credential.trim() === failureDemoCredential;
}
