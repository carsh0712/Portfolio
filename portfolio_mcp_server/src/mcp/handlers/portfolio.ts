import type { PortfolioApiClient } from "../../api/client.js";
import type { ToolArgs } from "../schemas/builders.js";
import { requireConfirm, requiredObject, requiredString, withQuery } from "./utils.js";

export async function handlePortfolioTool(
  client: PortfolioApiClient,
  name: string,
  args: ToolArgs
): Promise<unknown> {
  switch (name) {
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
    default:
      return undefined;
  }
}
