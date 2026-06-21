/** Severity levels, ordered low -> high in SEVERITY_ORDER below. */
export type Severity = "critical" | "high" | "medium" | "low" | "info";

/** The kinds of agent artifacts Warden knows how to discover and scan. */
export type ArtifactType =
  | "claude-skill" // SKILL.md
  | "mcp-config" // mcp.json / *.mcp.json / claude_desktop_config.json
  | "cursor-rule" // .cursorrules / .cursor/rules/*.mdc
  | "agent-instructions" // AGENTS.md / copilot-instructions.md / CLAUDE.md
  | "markdown";

/** A single discovered artifact, ready to be scanned and listed in the BOM. */
export interface Artifact {
  /** repo-relative path */
  path: string;
  type: ArtifactType;
  /** declared name (skill frontmatter `name`, or file basename) */
  name: string;
  /** raw text content */
  content: string;
  /** sha256 of content — used for the BOM and the integrity manifest */
  sha256: string;
  /** declared capabilities surfaced for the BOM (e.g. mcp server/tool names) */
  capabilities: string[];
}

/** A single problem found in an artifact. */
export interface Finding {
  ruleId: string;
  category: string;
  severity: Severity;
  title: string;
  message: string;
  artifactPath: string;
  /** 1-based line where the match was found, if known */
  line?: number;
  /** the offending snippet (trimmed) */
  evidence?: string;
  /** short remediation guidance */
  remediation?: string;
}

/** A detection rule. Either `patterns` (regex) or `match` (custom) must produce hits. */
export interface Rule {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  /** regex patterns tested against artifact text */
  patterns: RegExp[];
  /** which artifact types this rule applies to; omit/empty = all */
  appliesTo?: ArtifactType[];
  remediation?: string;
  /** optional custom matcher for non-regex logic (e.g. zero-width characters) */
  match?: (artifact: Artifact) => Array<{ index: number; evidence: string }>;
}

export interface ScanResult {
  scannedAt: string; // ISO 8601
  tool: { name: string; version: string };
  rulesetVersion: string;
  root: string;
  artifacts: Artifact[];
  findings: Finding[];
  summary: {
    artifacts: number;
    findings: number;
    bySeverity: Record<Severity, number>;
    /** 0-100 aggregate risk score */
    riskScore: number;
  };
}

export const SEVERITY_ORDER: Severity[] = ["info", "low", "medium", "high", "critical"];
