export const objectSchema = (properties = {}, required = []) => ({
    type: "object",
    properties,
    required,
    additionalProperties: false,
});
export const text = (description) => ({ type: "string", description });
export const number = (description, defaults = {}) => ({
    type: "number",
    description,
    ...defaults,
});
export const boolean = (description, defaults = {}) => ({
    type: "boolean",
    description,
    ...defaults,
});
export const stringArray = (description) => ({
    type: "array",
    description,
    items: { type: "string" },
});
