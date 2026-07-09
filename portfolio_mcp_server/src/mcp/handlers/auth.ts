import type { PortfolioApiClient } from "../../api/client.js";
import type { ToolArgs } from "../schemas/builders.js";
import { omitConfirm, requireConfirm } from "./utils.js";

export async function handleAuthTool(
  client: PortfolioApiClient,
  name: string,
  args: ToolArgs
): Promise<unknown> {
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
    default:
      return undefined;
  }
}
