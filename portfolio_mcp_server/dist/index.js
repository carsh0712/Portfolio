#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { PortfolioApiClient } from "./api/client.js";
import { requireEnv, loadLocalEnv } from "./env.js";
import { callTool } from "./mcp/handlers/router.js";
import { jsonResult, normalizeError } from "./mcp/handlers/response.js";
import { tools } from "./mcp/tools/index.js";
loadLocalEnv();
const client = new PortfolioApiClient({
    baseUrl: requireEnv("PORTFOLIO_API_BASE_URL"),
    email: requireEnv("PORTFOLIO_API_EMAIL"),
    password: requireEnv("PORTFOLIO_API_PASSWORD"),
});
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
    const args = request.params.arguments ?? {};
    try {
        const result = await callTool(client, request.params.name, args);
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
const transport = new StdioServerTransport();
await server.connect(transport);
