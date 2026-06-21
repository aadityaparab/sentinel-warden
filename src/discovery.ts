import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, relative, sep } from "node:path";
import type { Artifact, ArtifactType } from "./types.js";
import { sha256 } from "./util.js";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".warden",
  "vendor",
]);

const MAX_BYTES = 1_000_000; // skip files larger than 1 MB

/** Walk a directory (or single file) and return every scannable agent artifact. */
export function discover(root: string): Artifact[] {
  const files: string[] = [];
  let rootIsFile = false;
  try {
    rootIsFile = statSync(root).isFile();
  } catch {
    return [];
  }
  if (rootIsFile) {
    files.push(root);
  } else {
    walk(root, files);
  }

  const base = rootIsFile ? join(root, "..") : root;
  const artifacts: Artifact[] = [];
  for (const file of files) {
    let content: string;
    try {
      if (statSync(file).size > MAX_BYTES) continue;
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const type = classify(file, content);
    if (!type) continue;
    const rel = relative(base, file) || basename(file);
    artifacts.push(buildArtifact(rel, type, content));
  }
  return artifacts;
}

function walk(dir: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      walk(join(dir, e.name), out);
    } else if (e.isFile()) {
      out.push(join(dir, e.name));
    }
  }
}

/** Classify a file into an artifact type, or null if Warden should ignore it. */
export function classify(file: string, content = ""): ArtifactType | null {
  const b = basename(file).toLowerCase();
  const lower = file.toLowerCase();

  if (b === "skill.md") return "claude-skill";
  if (b === ".cursorrules") return "cursor-rule";
  if (b.endsWith(".mdc") && lower.includes(`${sep}.cursor${sep}`.toLowerCase())) return "cursor-rule";
  if (
    b === "agents.md" ||
    b === "copilot-instructions.md" ||
    b === "claude.md" ||
    b === ".clauderc"
  ) {
    return "agent-instructions";
  }

  // MCP configs: by name, or any JSON that declares MCP servers/tools.
  if (b === "mcp.json" || b === ".mcp.json" || b.endsWith(".mcp.json") || b === "claude_desktop_config.json") {
    return "mcp-config";
  }
  if (b.endsWith(".json") && /"mcpServers"\s*:|"servers"\s*:|"tools"\s*:\s*\[/.test(content)) {
    return "mcp-config";
  }

  return null; // generic markdown is intentionally not scanned in v1 (low signal, high noise)
}

function buildArtifact(rel: string, type: ArtifactType, content: string): Artifact {
  let name = basename(rel);
  let capabilities: string[] = [];

  if (type === "claude-skill") {
    const fm = parseFrontmatter(content);
    if (fm.name) name = fm.name;
    if (fm["allowed-tools"]) capabilities = splitList(fm["allowed-tools"]);
  } else if (type === "mcp-config") {
    capabilities = mcpCapabilities(content);
  }

  return { path: rel, type, name, content, sha256: sha256(content), capabilities };
}

/** Minimal YAML frontmatter reader — only flat `key: value` pairs. */
export function parseFrontmatter(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (mm) out[mm[1].toLowerCase()] = mm[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

function splitList(v: string): string[] {
  return v
    .replace(/[[\]]/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mcpCapabilities(content: string): string[] {
  const caps: string[] = [];
  try {
    const j = JSON.parse(content) as Record<string, unknown>;
    const servers = (j.mcpServers ?? j.servers ?? {}) as Record<string, { command?: string; args?: unknown }>;
    for (const [name, def] of Object.entries(servers)) {
      caps.push(`server:${name}`);
      if (def && def.command) {
        const args = Array.isArray(def.args) ? def.args.join(" ") : "";
        caps.push(`cmd:${def.command}${args ? " " + args : ""}`.trim());
      }
    }
    const tools = j.tools;
    if (Array.isArray(tools)) {
      for (const t of tools) {
        if (t && typeof t === "object" && "name" in t) caps.push(`tool:${(t as { name: string }).name}`);
      }
    }
  } catch {
    /* not valid JSON — leave capabilities empty, content still gets scanned */
  }
  return caps;
}
