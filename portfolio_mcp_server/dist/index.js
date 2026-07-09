#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { loadLocalEnv, requireEnv } from "./env.js";
import { PortfolioApiClient, PortfolioApiError } from "./portfolio-api.js";
loadLocalEnv();
const client = new PortfolioApiClient({
    baseUrl: requireEnv("PORTFOLIO_API_BASE_URL"),
    email: requireEnv("PORTFOLIO_API_EMAIL"),
    password: requireEnv("PORTFOLIO_API_PASSWORD"),
});
const objectSchema = (properties = {}, required = []) => ({
    type: "object",
    properties,
    required,
    additionalProperties: false,
});
const text = (description) => ({ type: "string", description });
const number = (description, defaults = {}) => ({
    type: "number",
    description,
    ...defaults,
});
const boolean = (description, defaults = {}) => ({
    type: "boolean",
    description,
    ...defaults,
});
const stringArray = (description) => ({
    type: "array",
    description,
    items: { type: "string" },
});
const fileReferenceSchema = {
    type: "object",
    description: "Uploaded file reference.",
    properties: {
        file_uuid: text("Upload file UUID."),
    },
    required: ["file_uuid"],
    additionalProperties: false,
};
const linkSchema = {
    type: "object",
    properties: {
        name: text("Link label."),
        url: text("Link URL."),
        backgroundColor: text("Optional background color hex."),
        textColor: text("Optional text color hex."),
        icon: text("Optional icon name."),
    },
    required: ["name", "url"],
    additionalProperties: false,
};
const screenshotSchema = {
    type: "object",
    properties: {
        file_uuid: text("Uploaded screenshot file UUID."),
        caption: text("Optional screenshot caption."),
    },
    required: ["file_uuid"],
    additionalProperties: false,
};
const portfolioCreateSchema = objectSchema({
    code: text("Portfolio code. Minimum 5 characters."),
    name: text("Portfolio name."),
    description: text("Portfolio description."),
    screenshot: fileReferenceSchema,
    order: number("Sort order.", { default: 0 }),
    is_public: boolean("Whether this portfolio is public.", { default: true }),
}, ["code", "name", "description"]);
const portfolioUpdateSchema = objectSchema({
    code: text("New portfolio code. Minimum 5 characters."),
    name: text("Portfolio name."),
    description: text("Portfolio description."),
    screenshot: fileReferenceSchema,
    order: number("Sort order."),
    is_public: boolean("Whether this portfolio is public."),
});
const projectCreateSchema = objectSchema({
    portfolio_code: text("Parent portfolio code."),
    code: text("Project code. Minimum 5 characters."),
    title: text("Project title."),
    summary: text("Project summary."),
    thumbnail: fileReferenceSchema,
    tags: stringArray("Project tags."),
    order: number("Sort order.", { default: 0 }),
    is_public: boolean("Whether this project is public.", { default: true }),
    description: text("Project detail description."),
    tech_stack: stringArray("Tech stack names."),
    screenshots: {
        type: "array",
        items: screenshotSchema,
        description: "Screenshot file references.",
    },
    links: {
        type: "array",
        items: linkSchema,
        description: "Project links.",
    },
    start_date: text("Start date, usually YYYY-MM-DD."),
    end_date: text("End date, usually YYYY-MM-DD."),
    features: stringArray("Feature list."),
}, ["portfolio_code", "code", "title", "summary"]);
const projectUpdateSchema = objectSchema({
    portfolio_id: number("Move to portfolio id."),
    code: text("New project code. Minimum 5 characters."),
    title: text("Project title."),
    summary: text("Project summary."),
    thumbnail: fileReferenceSchema,
    tags: stringArray("Project tags."),
    order: number("Sort order."),
    is_public: boolean("Whether this project is public."),
    description: text("Project detail description."),
    tech_stack: stringArray("Tech stack names."),
    screenshots: {
        type: "array",
        items: screenshotSchema,
        description: "Screenshot file references.",
    },
    links: {
        type: "array",
        items: linkSchema,
        description: "Project links.",
    },
    start_date: text("Start date, usually YYYY-MM-DD."),
    end_date: text("End date, usually YYYY-MM-DD."),
    features: stringArray("Feature list."),
});
const tools = [
    {
        name: "portfolio_login",
        description: "Log in to the configured portfolio API account and keep tokens in memory.",
        inputSchema: objectSchema(),
    },
    {
        name: "portfolio_logout",
        description: "Log out from the portfolio API and clear in-memory tokens.",
        inputSchema: objectSchema({
            confirm: boolean("Must be true to log out.", { default: false }),
        }, ["confirm"]),
    },
    {
        name: "portfolio_get_current_user",
        description: "Get the authenticated portfolio API user.",
        inputSchema: objectSchema(),
    },
    {
        name: "portfolio_signup",
        description: "Create a portfolio API user account.",
        inputSchema: objectSchema({
            username: text("Username."),
            email: text("Email address."),
            password: text("Password. Minimum 8 characters."),
        }, ["username", "email", "password"]),
    },
    {
        name: "portfolio_update_profile",
        description: "Update the authenticated user's username.",
        inputSchema: objectSchema({ username: text("New username.") }, ["username"]),
    },
    {
        name: "portfolio_change_password",
        description: "Change the authenticated user's password.",
        inputSchema: objectSchema({
            current_password: text("Current password."),
            new_password: text("New password. Minimum 8 characters."),
            confirm: boolean("Must be true to change password.", { default: false }),
        }, ["current_password", "new_password", "confirm"]),
    },
    {
        name: "portfolio_delete_account",
        description: "Delete the authenticated account and all owned data.",
        inputSchema: objectSchema({
            password: text("Current account password."),
            confirm: boolean("Must be true to delete the account.", { default: false }),
        }, ["password", "confirm"]),
    },
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
        description: "Delete a portfolio by code.",
        inputSchema: objectSchema({
            code: text("Portfolio code."),
            confirm: boolean("Must be true to delete the portfolio.", { default: false }),
        }, ["code", "confirm"]),
    },
    {
        name: "portfolio_list_projects",
        description: "List projects in a portfolio.",
        inputSchema: objectSchema({
            portfolio_code: text("Portfolio code."),
            page: number("Page number.", { default: 1 }),
            page_size: number("Page size, 1-100.", { default: 10 }),
            search: text("Optional tag or tech stack search term."),
        }, ["portfolio_code"]),
    },
    {
        name: "portfolio_get_project",
        description: "Get one project by portfolio code and project code.",
        inputSchema: objectSchema({
            portfolio_code: text("Portfolio code."),
            project_code: text("Project code."),
        }, ["portfolio_code", "project_code"]),
    },
    {
        name: "portfolio_create_project",
        description: "Create a project.",
        inputSchema: projectCreateSchema,
    },
    {
        name: "portfolio_update_project",
        description: "Update a project by portfolio code and project code.",
        inputSchema: objectSchema({
            portfolio_code: text("Portfolio code."),
            project_code: text("Current project code."),
            data: projectUpdateSchema,
        }, ["portfolio_code", "project_code", "data"]),
    },
    {
        name: "portfolio_delete_project",
        description: "Delete a project.",
        inputSchema: objectSchema({
            portfolio_code: text("Portfolio code."),
            project_code: text("Project code."),
            confirm: boolean("Must be true to delete the project.", { default: false }),
        }, ["portfolio_code", "project_code", "confirm"]),
    },
    {
        name: "portfolio_upload_file",
        description: "Upload a local file to the portfolio API.",
        inputSchema: objectSchema({ file_path: text("Local file path to upload.") }, ["file_path"]),
    },
    {
        name: "portfolio_list_files",
        description: "List uploaded files.",
        inputSchema: objectSchema({
            page: number("Page number.", { default: 1 }),
            page_size: number("Page size, 1-100.", { default: 10 }),
        }),
    },
    {
        name: "portfolio_get_file",
        description: "Get authenticated file metadata and optionally base64 content.",
        inputSchema: objectSchema({
            file_uuid: text("File UUID."),
            variant: text("detail, thumbnail, or original."),
            as_base64: boolean("Include file content as base64.", { default: false }),
        }, ["file_uuid"]),
    },
    {
        name: "portfolio_delete_file",
        description: "Delete an uploaded file.",
        inputSchema: objectSchema({
            file_uuid: text("File UUID."),
            confirm: boolean("Must be true to delete the file.", { default: false }),
        }, ["file_uuid", "confirm"]),
    },
    {
        name: "portfolio_get_public_projects",
        description: "Get public projects by username and portfolio code.",
        inputSchema: objectSchema({
            username: text("Public username."),
            portfolio_code: text("Portfolio code."),
        }, ["username", "portfolio_code"]),
    },
    {
        name: "portfolio_get_public_project",
        description: "Get public project detail.",
        inputSchema: objectSchema({
            username: text("Public username."),
            portfolio_code: text("Portfolio code."),
            project_code: text("Project code."),
        }, ["username", "portfolio_code", "project_code"]),
    },
    {
        name: "portfolio_get_public_file",
        description: "Get public file metadata and optionally base64 content.",
        inputSchema: objectSchema({
            username: text("Public username."),
            file_uuid: text("File UUID."),
            variant: text("detail, thumbnail, or original."),
            as_base64: boolean("Include file content as base64.", { default: false }),
        }, ["username", "file_uuid"]),
    },
];
const server = new Server({
    name: "portfolio-api-mcp",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = (request.params.arguments ?? {});
    try {
        const result = await callTool(request.params.name, args);
        return jsonResult(result);
    }
    catch (error) {
        const apiError = normalizeError(error);
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: JSON.stringify(apiError, null, 2),
                },
            ],
        };
    }
});
async function callTool(name, args) {
    switch (name) {
        case "portfolio_login":
            return client.login();
        case "portfolio_logout":
            requireConfirm(args, "log out");
            return client.logout();
        case "portfolio_get_current_user":
            return client.authJson("/api/v1/user/me");
        case "portfolio_signup":
            return client.publicJson("/api/v1/auth/signup", { method: "POST", body: args });
        case "portfolio_update_profile":
            return client.authJson("/api/v1/user/profile", { method: "PUT", body: args });
        case "portfolio_change_password":
            requireConfirm(args, "change password");
            return client.authJson("/api/v1/user/password", {
                method: "PUT",
                body: omitConfirm(args),
            });
        case "portfolio_delete_account":
            requireConfirm(args, "delete account");
            return client.authJson("/api/v1/user/account", {
                method: "DELETE",
                body: omitConfirm(args),
            });
        case "portfolio_list_portfolios":
            return client.authJson(withQuery("/api/v1/portfolios/", args, ["page", "page_size"]));
        case "portfolio_get_portfolio":
            return client.authJson(`/api/v1/portfolios/${encodeURIComponent(requiredString(args, "code"))}`);
        case "portfolio_create_portfolio":
            return client.authJson("/api/v1/portfolios/", { method: "POST", body: args });
        case "portfolio_update_portfolio":
            return client.authJson(`/api/v1/portfolios/${encodeURIComponent(requiredString(args, "code"))}`, {
                method: "PUT",
                body: requiredObject(args, "data"),
            });
        case "portfolio_delete_portfolio":
            requireConfirm(args, "delete portfolio");
            return client.authJson(`/api/v1/portfolios/${encodeURIComponent(requiredString(args, "code"))}`, {
                method: "DELETE",
            });
        case "portfolio_list_projects":
            return client.authJson(withQuery("/api/v1/projects/", args, ["portfolio_code", "page", "page_size", "search"]));
        case "portfolio_get_project":
            return client.authJson(`/api/v1/projects/${encodeURIComponent(requiredString(args, "portfolio_code"))}/${encodeURIComponent(requiredString(args, "project_code"))}`);
        case "portfolio_create_project":
            return client.authJson("/api/v1/projects/", { method: "POST", body: args });
        case "portfolio_update_project":
            return client.authJson(`/api/v1/projects/${encodeURIComponent(requiredString(args, "portfolio_code"))}/${encodeURIComponent(requiredString(args, "project_code"))}`, { method: "PUT", body: requiredObject(args, "data") });
        case "portfolio_delete_project":
            requireConfirm(args, "delete project");
            return client.authJson(`/api/v1/projects/${encodeURIComponent(requiredString(args, "portfolio_code"))}/${encodeURIComponent(requiredString(args, "project_code"))}`, { method: "DELETE" });
        case "portfolio_upload_file":
            return client.uploadFile(requiredString(args, "file_path"));
        case "portfolio_list_files":
            return client.authJson(withQuery("/api/v1/files/", args, ["page", "page_size"]));
        case "portfolio_get_file":
            return client.authFile(`/api/v1/files/${encodeURIComponent(requiredString(args, "file_uuid"))}`, {
                variant: optionalString(args, "variant") ?? "detail",
                asBase64: args.as_base64 === true,
            });
        case "portfolio_delete_file":
            requireConfirm(args, "delete file");
            return client.authJson(`/api/v1/files/${encodeURIComponent(requiredString(args, "file_uuid"))}`, {
                method: "DELETE",
            });
        case "portfolio_get_public_projects":
            return client.publicJson(`/api/v1/public/${encodeURIComponent(requiredString(args, "username"))}/${encodeURIComponent(requiredString(args, "portfolio_code"))}/`);
        case "portfolio_get_public_project":
            return client.publicJson(`/api/v1/public/${encodeURIComponent(requiredString(args, "username"))}/${encodeURIComponent(requiredString(args, "portfolio_code"))}/${encodeURIComponent(requiredString(args, "project_code"))}/`);
        case "portfolio_get_public_file":
            return client.publicFile(requiredString(args, "username"), requiredString(args, "file_uuid"), {
                variant: optionalString(args, "variant") ?? "detail",
                asBase64: args.as_base64 === true,
            });
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
function withQuery(endpoint, args, keys) {
    const query = new URLSearchParams();
    for (const key of keys) {
        if (args[key] !== undefined && args[key] !== null && args[key] !== "") {
            query.set(key, String(args[key]));
        }
    }
    const serialized = query.toString();
    return serialized ? `${endpoint}?${serialized}` : endpoint;
}
function requireConfirm(args, action) {
    if (args.confirm !== true) {
        throw new Error(`Set confirm: true to ${action}.`);
    }
}
function omitConfirm(args) {
    const { confirm: _confirm, ...rest } = args;
    return rest;
}
function requiredString(args, key) {
    const value = args[key];
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`Missing required string argument: ${key}`);
    }
    return value;
}
function optionalString(args, key) {
    const value = args[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
function requiredObject(args, key) {
    const value = args[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`Missing required object argument: ${key}`);
    }
    return value;
}
function jsonResult(value) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(value, null, 2),
            },
        ],
    };
}
function normalizeError(error) {
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
const transport = new StdioServerTransport();
await server.connect(transport);
