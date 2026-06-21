import { createHash } from "node:crypto";

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** 1-based line number for a character index. */
export function lineAt(text: string, index: number): number {
  let line = 1;
  const end = Math.min(index, text.length);
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

/** A trimmed, single-line snippet of context around an index. */
export function snippet(text: string, index: number, len = 90): string {
  const start = Math.max(0, index - 8);
  return text
    .slice(start, start + len)
    .replace(/\s+/g, " ")
    .trim();
}
