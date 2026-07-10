import { boolean, number, objectSchema, text } from "../schemas/builders.js";
import { portfolioCreateSchema, portfolioUpdateSchema } from "../schemas/portfolio.js";
export const portfolioTools = [
    {
        name: "portfolio_list_portfolios",
        description: "List authenticated user's portfolios.",
        inputSchema: objectSchema({
            page: number("Page number.", { default: 1 }),
            page_size: number("Page size, 1-100.", { default: 10 }),
        }),
    },
    {
        name: "portfolio_get_portfolio",
        description: "Get one portfolio by code.",
        inputSchema: objectSchema({ code: text("Portfolio code.") }, ["code"]),
    },
    {
        name: "portfolio_create_portfolio",
        description: "Create a portfolio.",
        inputSchema: portfolioCreateSchema,
    },
    {
        name: "portfolio_update_portfolio",
        description: "Update a portfolio by current code.",
        inputSchema: objectSchema({
            code: text("Current portfolio code."),
            data: portfolioUpdateSchema,
        }, ["code", "data"]),
    },
    {
        name: "portfolio_delete_portfolio",
        description: "Deletion is disabled in MCP. Returns a message explaining that portfolios cannot be deleted through MCP.",
        inputSchema: objectSchema({
            code: text("Portfolio code."),
            confirm: boolean("Ignored. Deletion is disabled in MCP.", { default: false }),
        }, ["code", "confirm"]),
    },
];
