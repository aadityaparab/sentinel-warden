import type { Rule } from "../types.js";

export const secretRules: Rule[] = [
  {
    id: "WRD-SEC-001",
    category: "exposed-secret",
    severity: "high",
    title: "Hardcoded credential",
    patterns: [
      /\b(sk-[A-Za-z0-9]{20,})\b/, // OpenAI-style key
      /\bAKIA[0-9A-Z]{16}\b/, // AWS access key id
      /\bghp_[A-Za-z0-9]{36}\b/, // GitHub PAT
      /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, // Slack token
      /-----BEGIN\s+(RSA|OPENSSH|EC|DSA|PGP)\s+PRIVATE KEY-----/,
    ],
    remediation: "Remove hardcoded credentials — a published artifact ships its secrets to everyone who installs it.",
  },
];
