import { authTools, fileTools, portfolioTools, projectTools, publicTools } from "./groups.js";

export const tools = [...authTools, ...portfolioTools, ...projectTools, ...fileTools, ...publicTools] as const;
