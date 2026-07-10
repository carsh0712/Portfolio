import { PortfolioApiError } from "../../api/error.js";
export function jsonResult(value) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(value, null, 2),
            },
        ],
    };
}
export function normalizeError(error) {
    if (error instanceof PortfolioApiError) {
        return {
            error: error.message,
            status: error.status,
            detail: error.detail,
        };
    }
    if (error instanceof Error) {
        return {
            error: error.message,
            status: null,
            detail: null,
        };
    }
    return {
        error: String(error),
        status: null,
        detail: null,
    };
}
