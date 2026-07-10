import { PortfolioApiError } from "./error.js";
const JSON_CONTENT_TYPE = "application/json";
export async function requestJson(baseUrl, endpoint, options = {}, authMode, accessToken) {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body !== undefined) {
        headers.set("Content-Type", JSON_CONTENT_TYPE);
    }
    if (authMode.authenticated && accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const response = await safeFetch(buildApiUrl(baseUrl, endpoint), {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (!response.ok) {
        throw await buildError(response);
    }
    if (response.status === 204)
        return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
export async function fetchAuthed(baseUrl, endpoint, accessToken, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    return safeFetch(buildApiUrl(baseUrl, endpoint), { ...init, headers });
}
export function buildApiUrl(baseUrl, endpoint) {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        return endpoint;
    }
    return `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}
export async function safeFetch(url, init) {
    try {
        return await fetch(url, init);
    }
    catch (cause) {
        const error = new PortfolioApiError(`Network request failed for ${url}`);
        const typedCause = cause;
        const nestedCause = typedCause.cause;
        error.cause = cause;
        error.detail = {
            message: typedCause.message ?? String(cause),
            code: nestedCause?.code ?? typedCause.code ?? null,
            hostname: nestedCause?.hostname ?? typedCause.hostname ?? null,
        };
        throw error;
    }
}
export async function buildError(response) {
    const text = await response.text().catch(() => "");
    let detail = text;
    try {
        const parsed = JSON.parse(text);
        detail = parsed.detail ?? parsed.message ?? parsed;
    }
    catch {
        // Keep raw response text.
    }
    const error = new PortfolioApiError(`Portfolio API request failed: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.detail = detail;
    return error;
}
