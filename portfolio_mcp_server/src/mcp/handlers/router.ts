import type { PortfolioApiClient } from "../../api/client.js";
import {
  handleAuthTool,
  handleFileTool,
  handlePortfolioTool,
  handleProjectTool,
  handlePublicTool,
} from "./index.js";
import type { ToolArgs } from "../schemas/builders.js";

export async function callTool(
  client: PortfolioApiClient,
  name: string,
  args: ToolArgs
): Promise<unknown> {
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
