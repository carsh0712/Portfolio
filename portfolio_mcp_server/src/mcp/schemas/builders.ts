export type JsonSchema = Record<string, unknown>;
export type ToolArgs = Record<string, unknown>;

export const objectSchema = (
  properties: Record<string, JsonSchema> = {},
  required: string[] = []
): JsonSchema => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

export const text = (description: string): JsonSchema => ({ type: "string", description });

export const number = (description: string, defaults: JsonSchema = {}): JsonSchema => ({
  type: "number",
  description,
  ...defaults,
});

export const boolean = (description: string, defaults: JsonSchema = {}): JsonSchema => ({
  type: "boolean",
  description,
  ...defaults,
});

export const stringArray = (description: string): JsonSchema => ({
  type: "array",
  description,
  items: { type: "string" },
});
