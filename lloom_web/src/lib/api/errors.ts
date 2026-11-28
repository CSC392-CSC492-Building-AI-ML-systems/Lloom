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

export function errorDetail(body: unknown): string | undefined {
    if (typeof body !== "object" || body === null || !("detail" in body)) return;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
        return (
            body.detail
                .flatMap((issue: unknown) =>
                    typeof issue === "object" &&
                    issue !== null &&
                    "msg" in issue &&
                    typeof issue.msg === "string"
                        ? [issue.msg]
                        : [],
                )
                .join("; ") || undefined
        );
    }
}
