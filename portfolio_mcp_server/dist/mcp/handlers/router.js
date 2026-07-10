import { handleAuthTool, handleFileTool, handlePortfolioTool, handleProjectTool, handlePublicTool, } from "./index.js";
export async function callTool(client, name, args) {
    for (const handler of [
        handleAuthTool,
        handlePortfolioTool,
        handleProjectTool,
        handleFileTool,
        handlePublicTool,
    ]) {
        const result = await handler(client, name, args);
        if (result !== undefined) {
            return result;
        }
    }
    throw new Error(`Unknown tool: ${name}`);
}
