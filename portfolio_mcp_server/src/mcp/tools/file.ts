import { boolean, number, objectSchema, text } from "../schemas/builders.js";

export const fileTools = [
  {
    name: "portfolio_upload_file",
    description: "Upload a local file to the portfolio API.",
    inputSchema: objectSchema({ file_path: text("Local file path to upload.") }, ["file_path"]),
  },
  {
    name: "portfolio_list_files",
    description: "List uploaded files.",
    inputSchema: objectSchema({
      page: number("Page number.", { default: 1 }),
      page_size: number("Page size, 1-100.", { default: 10 }),
    }),
  },
  {
    name: "portfolio_get_file",
    description: "Get authenticated file metadata and optionally base64 content.",
    inputSchema: objectSchema(
      {
        file_uuid: text("File UUID."),
        variant: text("detail, thumbnail, or original."),
        as_base64: boolean("Include file content as base64.", { default: false }),
      },
      ["file_uuid"]
    ),
  },
  {
    name: "portfolio_delete_file",
    description: "Delete an uploaded file.",
    inputSchema: objectSchema(
      {
        file_uuid: text("File UUID."),
        confirm: boolean("Must be true to delete the file.", { default: false }),
      },
      ["file_uuid", "confirm"]
    ),
  },
] as const;
