import { boolean, number, objectSchema, text } from "./builders.js";
import { fileReferenceSchema } from "./shared.js";
export const portfolioCreateSchema = objectSchema({
    code: text("Portfolio code. Minimum 5 characters."),
    name: text("Portfolio name."),
    description: text("Portfolio description."),
    screenshot: fileReferenceSchema,
    order: number("Sort order.", { default: 0 }),
    is_public: boolean("Whether this portfolio is public.", { default: true }),
}, ["code", "name", "description"]);
export const portfolioUpdateSchema = objectSchema({
    code: text("New portfolio code. Minimum 5 characters."),
    name: text("Portfolio name."),
    description: text("Portfolio description."),
    screenshot: fileReferenceSchema,
    order: number("Sort order."),
    is_public: boolean("Whether this portfolio is public."),
});
