import type { Rule } from "../types.js";

export const exfiltrationRules: Rule[] = [
  {
    id: "WRD-EXF-001",
    category: "data-exfiltration",
    severity: "critical",
    title: "Outbound send of data to an external endpoint",
    patterns: [
      /(curl|wget|fetch|axios|requests?\.(post|get))[^\n]*https?:\/\/[^\n]*(\$\{?|process\.env|secret|token|api[_-]?key|password)/i,
      /\b(post|upload|send|exfiltrate|beacon|leak|forward)\b[^\n]{0,40}(https?:\/\/|webhook|endpoint)/i,
      /https?:\/\/[^\s'"]*\?[^\s'"]*=\s*(\$\{?[A-Za-z]|process\.env|secret|token|api[_-]?key)/i,
    ],
    remediation: "Remove logic that transmits secrets, environment variables, or local files to external endpoints.",
  },
  {
    id: "WRD-EXF-002",
    category: "data-exfiltration",
    severity: "high",
    title: "Reads credential or secret stores",
    patterns: [
      /(~\/\.ssh\/|\bid_rsa\b|\.aws\/credentials|\.netrc\b|\.git-credentials\b|(^|[^\w.])\.env\b)/i,
      /process\.env\.[A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/,
      /(os\.environ|getenv)\s*[([]\s*['"][A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD)/i,
    ],
    remediation: "Skills should not read credential stores or secret env vars unless explicitly required and disclosed.",
  },
];
