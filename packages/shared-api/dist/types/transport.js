/**
 * Transport Layer Types
 * Abstractions for HTTP and WebSocket communication
 */
export class ContractViolationError extends Error {
    method;
    url;
    zodIssues;
    constructor(method, url, zodIssues) {
        const messages = zodIssues.map((i) => `[${i.path.join(".") || "<root>"}] ${i.message}`).join("; ");
        super(`[ContractViolation] API response validation failed for ${method} ${url}: ${messages}`);
        this.name = "ContractViolationError";
        this.method = method;
        this.url = url;
        this.zodIssues = zodIssues;
    }
}
//# sourceMappingURL=transport.js.map