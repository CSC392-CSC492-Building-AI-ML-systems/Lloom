// Run metadata, separate from document/concept results. Null means unmeasured/unavailable.
export type RunCosts = {
    estimatedCost: number | null;
    actualCost: number | null;
};

export function formatUsdCost(value: number | null, estimated = false) {
    if (value === null || !Number.isFinite(value) || value < 0) return "Not available";
    const amount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
    return estimated ? `~${amount}` : amount;
}
