"use client";

import { CircleCheck, CircleX, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
    failureDemoCredential,
    initialDemoCredential,
    mockConnectionDelayMs,
    mockConnectionFails,
    providerFixtures,
} from "./model-settings.fixtures";

type ConnectionStatus = "idle" | "testing" | "success" | "failure";
type FieldErrors = { provider?: string; model?: string; key?: string };
const controlClass =
    "min-h-11 min-w-0 w-full rounded-[5px] border border-outline bg-surface-subtle px-3 text-[15px] text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ";
const rowClass = "grid items-center gap-2 sm:grid-cols-[144px_minmax(0,1fr)] sm:gap-4";

export default function ModelSettingsForm() {
    const [activeTab, setActiveTab] = useState<"provider" | "advanced">("provider");
    const [providerId, setProviderId] = useState("openai");
    const [model, setModel] = useState("GPT-4o");
    // The credential exists only in this component. Never include it in saved settings.
    const [apiKey, setApiKey] = useState(initialDemoCredential);
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [savedSettings, setSavedSettings] = useState<{
        providerId: string;
        model: string;
    } | null>(null);
    const [saveNotice, setSaveNotice] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const providerTab = useRef<HTMLButtonElement>(null);
    const advancedTab = useRef<HTMLButtonElement>(null);
    const providerControl = useRef<HTMLSelectElement>(null);
    const modelControl = useRef<HTMLSelectElement>(null);
    const keyControl = useRef<HTMLInputElement>(null);
    const provider = providerFixtures.find((item) => item.id === providerId);
    const dirty =
        !!savedSettings &&
        (savedSettings.providerId !== providerId || savedSettings.model !== model);

    useEffect(
        () => () => {
            if (timer.current !== null) clearTimeout(timer.current);
        },
        [],
    );

    function cancelTest() {
        if (timer.current !== null) clearTimeout(timer.current);
        timer.current = null;
        setStatus("idle");
    }

    function resetFeedback() {
        cancelTest();
        setErrors({});
        setSaveNotice("");
    }

    function validate() {
        const nextErrors: FieldErrors = {};
        if (!provider) nextErrors.provider = "Select a provider.";
        if (!provider?.models.includes(model))
            nextErrors.model = "Select a model for this provider.";
        if (!apiKey.trim()) nextErrors.key = "Enter a demo API key.";
        setErrors(nextErrors);
        if (nextErrors.provider) providerControl.current?.focus();
        else if (nextErrors.model) modelControl.current?.focus();
        else if (nextErrors.key) keyControl.current?.focus();
        return Object.keys(nextErrors).length === 0;
    }

    function testConnection() {
        cancelTest();
        setSaveNotice("");
        if (!validate()) return;
        // Capture only the boolean mock result, never the credential, in the timer.
        const fails = mockConnectionFails(providerId, apiKey);
        setStatus("testing");
        timer.current = setTimeout(() => {
            setStatus(fails ? "failure" : "success");
            timer.current = null;
        }, mockConnectionDelayMs);
    }

    function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) {
            setSaveNotice("");
            return;
        }
        setSavedSettings({ providerId, model });
        setSaveNotice(
            "Provider and model applied temporarily on this page. The API key is not saved. Refreshing or leaving resets these settings.",
        );
    }

    function changeTab(tab: "provider" | "advanced") {
        cancelTest();
        setActiveTab(tab);
    }

    function tabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next =
            event.key === "Home"
                ? "provider"
                : event.key === "End"
                  ? "advanced"
                  : activeTab === "provider"
                    ? "advanced"
                    : "provider";
        changeTab(next);
        (next === "provider" ? providerTab : advancedTab).current?.focus();
    }

    return (
        <section
            aria-labelledby="model-configuration-heading"
            className="mt-6 w-full max-w-[640px] rounded-[14px] border border-outline bg-surface p-5"
        >
            <h2 id="model-configuration-heading" className="text-[23px] font-medium">
                Model Configuration
            </h2>
            <p className="mt-1.5 text-[15px] text-content-secondary">
                Configure the language model used by LLooM.
            </p>
            <div
                role="tablist"
                aria-label="Model configuration categories"
                className="mt-4 flex gap-6 border-t border-outline pt-4"
            >
                <button
                    ref={providerTab}
                    id="provider-tab"
                    role="tab"
                    type="button"
                    aria-selected={activeTab === "provider"}
                    aria-controls="provider-panel"
                    tabIndex={activeTab === "provider" ? 0 : -1}
                    onKeyDown={tabKeyDown}
                    onClick={() => changeTab("provider")}
                    className={`border-b-2 pb-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary  ${activeTab === "provider" ? "border-primary text-primary" : "border-transparent text-content-secondary"}`}
                >
                    LLM Provider
                </button>
                <button
                    ref={advancedTab}
                    id="advanced-tab"
                    role="tab"
                    type="button"
                    aria-selected={activeTab === "advanced"}
                    aria-controls="advanced-panel"
                    tabIndex={activeTab === "advanced" ? 0 : -1}
                    onKeyDown={tabKeyDown}
                    onClick={() => changeTab("advanced")}
                    className={`border-b-2 pb-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary  ${activeTab === "advanced" ? "border-primary text-primary" : "border-transparent text-content-secondary"}`}
                >
                    Advanced
                </button>
            </div>
            <div
                id="provider-panel"
                role="tabpanel"
                aria-labelledby="provider-tab"
                hidden={activeTab !== "provider"}
                className="pt-4"
            >
                <form noValidate onSubmit={save}>
                    <div className="space-y-3">
                        <div className={rowClass}>
                            <label htmlFor="model-provider" className="text-[15px] font-medium ">
                                Provider
                            </label>
                            <div className="min-w-0">
                                <select
                                    ref={providerControl}
                                    id="model-provider"
                                    value={providerId}
                                    onChange={(event) => {
                                        const nextProvider = providerFixtures.find(
                                            (item) => item.id === event.target.value,
                                        );
                                        resetFeedback();
                                        setProviderId(event.target.value);
                                        setModel(nextProvider?.models[0] ?? "");
                                        setShowKey(false);
                                    }}
                                    aria-invalid={!!errors.provider}
                                    aria-describedby={
                                        errors.provider ? "provider-error" : undefined
                                    }
                                    className={controlClass}
                                >
                                    {providerFixtures.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.provider && (
                                    <p id="provider-error" className="mt-1 text-sm text-danger">
                                        {errors.provider}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className={rowClass}>
                            <label htmlFor="default-model" className="text-[15px] font-medium ">
                                Default Model
                            </label>
                            <div className="min-w-0">
                                <select
                                    ref={modelControl}
                                    id="default-model"
                                    value={model}
                                    onChange={(event) => {
                                        resetFeedback();
                                        setModel(event.target.value);
                                    }}
                                    aria-invalid={!!errors.model}
                                    aria-describedby={errors.model ? "model-error" : undefined}
                                    className={controlClass}
                                >
                                    {provider?.models.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                                {errors.model && (
                                    <p id="model-error" className="mt-1 text-sm text-danger">
                                        {errors.model}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className={rowClass}>
                            <label htmlFor="settings-api-key" className="text-[15px] font-medium ">
                                API Key
                            </label>
                            <div className="min-w-0">
                                <div className="relative">
                                    <input
                                        ref={keyControl}
                                        id="settings-api-key"
                                        type={showKey ? "text" : "password"}
                                        value={apiKey}
                                        onChange={(event) => {
                                            resetFeedback();
                                            setApiKey(event.target.value);
                                        }}
                                        autoComplete="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        aria-invalid={!!errors.key}
                                        aria-describedby={`mock-settings-help${errors.key ? " api-key-error" : ""}`}
                                        className={`${controlClass} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        aria-label={showKey ? "Hide API key" : "Show API key"}
                                        aria-pressed={showKey}
                                        onClick={() => setShowKey((current) => !current)}
                                        className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center rounded-[5px] text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    >
                                        {showKey ? (
                                            <EyeOff size={22} aria-hidden="true" />
                                        ) : (
                                            <Eye size={22} aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                {errors.key && (
                                    <p id="api-key-error" className="mt-1 text-sm text-danger">
                                        {errors.key}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <details className="mt-3 text-xs text-content-secondary">
                        <summary className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                            Fixture models and mock connections — use demo credentials only
                        </summary>
                        <p id="mock-settings-help" className="mt-2">
                            This form never sends or persists the API key. Other and the demo key{" "}
                            <span className="break-all">{failureDemoCredential}</span> simulate
                            failure; other nonempty demo values simulate success.
                        </p>
                    </details>
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-outline pt-3">
                        <button
                            type="button"
                            onClick={testConnection}
                            disabled={status === "testing"}
                            className="min-h-11 rounded-[5px] border border-primary bg-surface px-3 text-base font-medium text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 "
                        >
                            Test Connection
                        </button>
                        <div
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                            className={`min-w-0 flex-1 basis-[200px] text-[15px] font-medium ${status === "success" ? "text-success" : status === "failure" ? "text-danger" : "text-content"}`}
                        >
                            {status === "testing" && (
                                <span className="flex items-center gap-2">
                                    <LoaderCircle
                                        size={20}
                                        aria-hidden="true"
                                        className="shrink-0 animate-spin motion-reduce:animate-none"
                                    />
                                    Simulating connection…
                                </span>
                            )}
                            {status === "success" && (
                                <span className="flex items-center gap-2">
                                    <CircleCheck
                                        size={20}
                                        aria-hidden="true"
                                        className="shrink-0"
                                    />
                                    Mock connection successful
                                </span>
                            )}
                            {status === "failure" && (
                                <span className="flex items-center gap-2">
                                    <CircleX size={20} aria-hidden="true" className="shrink-0" />
                                    Mock connection failed
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end border-t border-outline pt-3">
                        <button
                            type="submit"
                            disabled={status === "testing"}
                            className="min-h-11 rounded-[5px] bg-primary px-4 text-base font-medium text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 "
                        >
                            Save Settings
                        </button>
                    </div>
                    <p
                        role="status"
                        aria-live="polite"
                        className="mt-3 text-sm text-content-secondary empty:mt-0"
                    >
                        {saveNotice ||
                            (dirty ? "Provider or model changed since the temporary save." : "")}
                    </p>
                </form>
            </div>
            <div
                id="advanced-panel"
                role="tabpanel"
                aria-labelledby="advanced-tab"
                hidden={activeTab !== "advanced"}
                tabIndex={0}
                className="mt-6 rounded-lg bg-surface-subtle p-4 text-content-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <h3 className="font-medium text-content">Advanced settings</h3>
                <p className="mt-2 text-sm">Advanced settings are not implemented yet.</p>
            </div>
        </section>
    );
}
