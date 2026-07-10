import { boolean, number, objectSchema, text } from "../schemas/builders.js";
import { projectCreateSchema, projectUpdateSchema } from "../schemas/project.js";

export const projectTools = [
  {
    name: "portfolio_list_projects",
    description: "List projects in a portfolio.",
    inputSchema: objectSchema(
      {
        portfolio_code: text("Portfolio code."),
        page: number("Page number.", { default: 1 }),
        page_size: number("Page size, 1-100.", { default: 10 }),
        search: text("Optional tag or tech stack search term."),
      },
      ["portfolio_code"]
    ),
  },
  {
    name: "portfolio_get_project",
    description: "Get one project by portfolio code and project code.",
    inputSchema: objectSchema(
      {
        portfolio_code: text("Portfolio code."),
        project_code: text("Project code."),
      },
      ["portfolio_code", "project_code"]
    ),
  },
  {
    name: "portfolio_create_project",
    description: "Create a project.",
    inputSchema: projectCreateSchema,
  },
  {
    name: "portfolio_update_project",
    description: "Update a project by portfolio code and project code.",
    inputSchema: objectSchema(
      {
        portfolio_code: text("Portfolio code."),
        project_code: text("Current project code."),
        data: projectUpdateSchema,
      },
      ["portfolio_code", "project_code", "data"]
    ),
  },
  {
    name: "portfolio_delete_project",
    description:
      "Deletion is disabled in MCP. Returns a message explaining that projects cannot be deleted through MCP.",
    inputSchema: objectSchema(
      {
        portfolio_code: text("Portfolio code."),
        project_code: text("Project code."),
        confirm: boolean("Ignored. Deletion is disabled in MCP.", { default: false }),
      },
      ["portfolio_code", "project_code", "confirm"]
    ),
  },
] as const;
