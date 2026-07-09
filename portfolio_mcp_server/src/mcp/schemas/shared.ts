import { text } from "./builders.js";
import type { JsonSchema } from "./builders.js";

export const fileReferenceSchema: JsonSchema = {
  type: "object",
  description: "Uploaded file reference.",
  properties: {
    file_uuid: text("Upload file UUID."),
  },
  required: ["file_uuid"],
  additionalProperties: false,
};

export const linkSchema: JsonSchema = {
  type: "object",
  properties: {
    name: text("Link label."),
    url: text("Link URL."),
    backgroundColor: text("Optional background color hex."),
    textColor: text("Optional text color hex."),
    icon: text("Optional icon name."),
  },
  required: ["name", "url"],
  additionalProperties: false,
};

export const screenshotSchema: JsonSchema = {
  type: "object",
  properties: {
    file_uuid: text("Uploaded screenshot file UUID."),
    caption: text("Optional screenshot caption."),
  },
  required: ["file_uuid"],
  additionalProperties: false,
};
