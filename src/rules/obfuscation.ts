import type { Rule } from "../types.js";

export const obfuscationRules: Rule[] = [
  {
    id: "WRD-OBF-001",
    category: "obfuscation",
    severity: "high",
    title: "Dynamic code execution",
    patterns: [
      /\beval\s*\(/,
      /new\s+Function\s*\(/,
      /\b(child_process|execSync|spawnSync)\b/,
      /\bexec\s*\(\s*['"`]/,
      /\bos\.system\s*\(|subprocess\.(call|run|Popen)/,
    ],
    remediation: "Avoid eval / exec / child_process inside skill payloads; they enable arbitrary code execution on install or run.",
  },
  {
    id: "WRD-OBF-002",
    category: "obfuscation",
    severity: "medium",
    title: "Encoded / obfuscated payload",
    patterns: [
      /\batob\s*\(|Buffer\.from\s*\([^)]*['"]base64['"]/i,
      /\bbase64\s+(-d|--decode|-D)\b/i,
      /[A-Za-z0-9+/]{160,}={0,2}/, // long base64-looking blob (tune in config)
    ],
    remediation: "Decode and review base64/hex blobs; encoded payloads are commonly used to hide instructions or code.",
  },
];
