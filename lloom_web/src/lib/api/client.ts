import "server-only";

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly kind: "http" | "connection" | "timeout" | "response",
        public readonly status?: number,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

function errorDetail(body: unknown): string | undefined {
    if (typeof body !== "object" || body === null || !("detail" in body)) return;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
        const messages = body.detail.flatMap((issue: unknown) =>
            typeof issue === "object" &&
            issue !== null &&
            "msg" in issue &&
            typeof issue.msg === "string"
                ? [issue.msg]
                : [],
        );
        return messages.join("; ") || undefined;
    }
}

type ApiRequestOptions = RequestInit & { timeoutMs?: number };

// Return unknown: endpoint functions validate the contract before exposing typed data.
export async function requestJson(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init } = options;
    const timeout = AbortSignal.timeout(timeoutMs);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const baseUrl = process.env.LLOOM_API_BASE_URL || "http://localhost:8000";

    try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`, {
            ...init,
            signal: requestSignal,
        });
        const text = await response.text();
        let body: unknown;
        try {
            body = text ? JSON.parse(text) : undefined;
        } catch {
            if (response.ok)
                throw new ApiError("The backend returned an invalid response.", "response");
        }
        if (!response.ok) {
            throw new ApiError(
                errorDetail(body) || `Backend request failed (HTTP ${response.status}).`,
                "http",
                response.status,
            );
        }
        return body;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (signal?.aborted) throw error;
        if (timeout.aborted)
            throw new ApiError("The backend request timed out. Please try again.", "timeout");
        throw new ApiError(
            "Unable to connect to the backend. Check that it is running and try again.",
            "connection",
        );
    }
}
