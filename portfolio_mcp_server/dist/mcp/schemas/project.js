import { boolean, number, objectSchema, stringArray, text } from "./builders.js";
import { fileReferenceSchema, linkSchema, screenshotSchema } from "./shared.js";
export const projectCreateSchema = objectSchema({
    portfolio_code: text("Parent portfolio code."),
    code: text("Project code. Minimum 5 characters."),
    title: text("Project title."),
    summary: text("Project summary."),
    thumbnail: fileReferenceSchema,
    tags: stringArray("Project tags."),
    order: number("Sort order.", { default: 0 }),
    is_public: boolean("Whether this project is public.", { default: true }),
    description: text("Project detail description."),
    tech_stack: stringArray("Tech stack names."),
    screenshots: {
        type: "array",
        items: screenshotSchema,
        description: "Screenshot file references.",
    },
    links: {
        type: "array",
        items: linkSchema,
        description: "Project links.",
    },
    start_date: text("Start date, usually YYYY-MM-DD."),
    end_date: text("End date, usually YYYY-MM-DD."),
    features: stringArray("Feature list."),
}, ["portfolio_code", "code", "title", "summary"]);
export const projectUpdateSchema = objectSchema({
    portfolio_id: number("Move to portfolio id."),
    code: text("New project code. Minimum 5 characters."),
    title: text("Project title."),
    summary: text("Project summary."),
    thumbnail: fileReferenceSchema,
    tags: stringArray("Project tags."),
    order: number("Sort order."),
    is_public: boolean("Whether this project is public."),
    description: text("Project detail description."),
    tech_stack: stringArray("Tech stack names."),
    screenshots: {
        type: "array",
        items: screenshotSchema,
        description: "Screenshot file references.",
    },
    links: {
        type: "array",
        items: linkSchema,
        description: "Project links.",
    },
    start_date: text("Start date, usually YYYY-MM-DD."),
    end_date: text("End date, usually YYYY-MM-DD."),
    features: stringArray("Feature list."),
});
