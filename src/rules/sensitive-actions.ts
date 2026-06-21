import type { Rule } from "../types.js";

export const sensitiveActionRules: Rule[] = [
  {
    id: "WRD-ACT-001",
    category: "destructive-action",
    severity: "critical",
    title: "Pipe remote script straight into a shell",
    patterns: [
      /(curl|wget)[^\n|]*\|\s*(sudo\s+)?(sh|bash|zsh|fish)\b/i,
      /\biwr\b[^\n]*\|\s*iex\b/i,
      /Invoke-WebRequest[^\n]*\|[^\n]*Invoke-Expression/i,
    ],
    remediation: "Never instruct piping a remote script directly into a shell interpreter.",
  },
  {
    id: "WRD-ACT-002",
    category: "destructive-action",
    severity: "high",
    title: "Destructive or privilege-escalating command",
    patterns: [
      /\brm\s+-[rf]{1,2}\s+(\/|~|\$HOME|\*)/,
      /\bchmod\s+777\b/,
      /\bgit\s+push\s+(-f\b|--force)/,
      /\bsudo\s+(rm|chmod|chown|dd|mkfs|curl|wget)\b/,
    ],
    remediation: "Flag destructive or privilege-escalating commands embedded in agent instructions for human review.",
  },
  {
    id: "WRD-RUG-001",
    category: "rug-pull",
    severity: "high",
    title: "Fetches instructions or code at runtime",
    patterns: [
      /\b(fetch|download|pull|load|grab)\b[^\n]{0,30}\b(latest|updated|remote|newest)\b[^\n]{0,30}\b(instructions|prompt|rules|code|payload)\b/i,
      /\b(curl|wget|fetch|invoke-webrequest)\b[^\n]*https?:\/\/[^\s'"]+\.(sh|ps1|py|js|rb|md|txt)\b/i,
    ],
    remediation: "Skills that fetch remote instructions/code at runtime can silently change behavior (rug pull). Pin and vendor the content instead.",
  },
];
