import fs from "node:fs/promises";
import path from "node:path";

import { buildError } from "./http.js";
import type { FileOptions, JsonObject } from "./types.js";

export async function uploadLocalFile(
  filePath: string,
  fetchWithAuth: (endpoint: string, init?: RequestInit) => Promise<Response>
): Promise<unknown> {
  const absolutePath = path.resolve(filePath);
  const buffer = await fs.readFile(absolutePath);
  const formData = new FormData();
  formData.set("file", new Blob([new Uint8Array(buffer)]), path.basename(absolutePath));

  const response = await fetchWithAuth("/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await buildError(response);
  }
  return response.json();
}

export async function buildFileResult(
  response: Response,
  { asBase64 }: Required<Pick<FileOptions, "asBase64">>
): Promise<JsonObject> {
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const disposition = response.headers.get("content-disposition") ?? "";
  const result: JsonObject = {
    content_type: contentType,
    content_disposition: disposition || null,
    note: asBase64
      ? "base64 contains the downloaded file content."
      : "Set as_base64 to true to include file content in the MCP response.",
  };

  if (asBase64) {
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    result.base64 = base64;
    result.byte_length = Buffer.byteLength(base64, "base64");
  }

  return result;
}
