import { deletionDisabled, requiredObject, requiredString, withQuery } from "./utils.js";
export async function handleProjectTool(client, name, args) {
    switch (name) {
        case "portfolio_list_projects":
            return client.authJson(withQuery("/api/v1/projects/", args, ["portfolio_code", "page", "page_size", "search"]));
        case "portfolio_get_project":
            return client.authJson(`/api/v1/projects/${encodeURIComponent(requiredString(args, "portfolio_code"))}/${encodeURIComponent(requiredString(args, "project_code"))}`);
        case "portfolio_create_project":
            return client.authJson("/api/v1/projects/", { method: "POST", body: args });
        case "portfolio_update_project":
            return client.authJson(`/api/v1/projects/${encodeURIComponent(requiredString(args, "portfolio_code"))}/${encodeURIComponent(requiredString(args, "project_code"))}`, { method: "PUT", body: requiredObject(args, "data") });
        case "portfolio_delete_project":
            return deletionDisabled("delete project");
        default:
            return undefined;
    }
}
