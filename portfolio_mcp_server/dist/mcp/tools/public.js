import { boolean, objectSchema, text } from "../schemas/builders.js";
export const publicTools = [
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
