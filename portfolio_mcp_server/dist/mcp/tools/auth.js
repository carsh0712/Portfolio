import { boolean, objectSchema, text } from "../schemas/builders.js";
export const authTools = [
    {
        name: "portfolio_login",
        description: "Log in to the configured portfolio API account and keep tokens in memory.",
        inputSchema: objectSchema(),
    },
    {
        name: "portfolio_logout",
        description: "Log out from the portfolio API and clear in-memory tokens.",
        inputSchema: objectSchema({ confirm: boolean("Must be true to log out.", { default: false }) }, ["confirm"]),
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
        description: "Deletion is disabled in MCP. Returns a message explaining that accounts cannot be deleted through MCP.",
        inputSchema: objectSchema({
            password: text("Current account password."),
            confirm: boolean("Ignored. Deletion is disabled in MCP.", { default: false }),
        }, ["password", "confirm"]),
    },
];
