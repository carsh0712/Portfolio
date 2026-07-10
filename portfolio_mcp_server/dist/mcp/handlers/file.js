import { deletionDisabled, optionalString, requiredString, withQuery } from "./utils.js";
export async function handleFileTool(client, name, args) {
    switch (name) {
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
            return deletionDisabled("delete file");
        default:
            return undefined;
    }
}
