import { optionalString, requiredString } from "./utils.js";
export async function handlePublicTool(client, name, args) {
    switch (name) {
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
            return undefined;
    }
}
