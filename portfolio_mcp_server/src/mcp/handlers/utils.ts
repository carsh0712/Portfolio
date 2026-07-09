import type { ToolArgs } from "../schemas/builders.js";

export function withQuery(endpoint: string, args: ToolArgs, keys: string[]): string {
  const query = new URLSearchParams();
  for (const key of keys) {
    if (args[key] !== undefined && args[key] !== null && args[key] !== "") {
      query.set(key, String(args[key]));
    }
  }
  const serialized = query.toString();
  return serialized ? `${endpoint}?${serialized}` : endpoint;
}

export function requireConfirm(args: ToolArgs, action: string): void {
  if (args.confirm !== true) {
    throw new Error(`Set confirm: true to ${action}.`);
  }
}

export function omitConfirm(args: ToolArgs): ToolArgs {
  const { confirm: _confirm, ...rest } = args;
  return rest;
}

export function requiredString(args: ToolArgs, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required string argument: ${key}`);
  }
  return value;
}

export function optionalString(args: ToolArgs, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function requiredObject(args: ToolArgs, key: string): Record<string, unknown> {
  const value = args[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Missing required object argument: ${key}`);
  }
  return value as Record<string, unknown>;
}
