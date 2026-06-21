import type { Rule } from "../types.js";

export const promptInjectionRules: Rule[] = [
  {
    id: "WRD-PI-001",
    category: "prompt-injection",
    severity: "high",
    title: "Instruction override",
    patterns: [
      /ignore\s+(all\s+)?(your\s+)?(the\s+)?(previous|prior|above|preceding)\s+instructions/i,
      /disregard\s+(your\s+)?(system\s+prompt|previous|prior|all\s+previous)/i,
      /forget\s+(everything|all\s+previous|your\s+(instructions|rules|guidelines))/i,
      /\byou\s+are\s+now\b[^.\n]{0,40}\b(dan|developer\s+mode|unrestricted|jailbroken|no\s+restrictions)\b/i,
    ],
    remediation: "Remove instructions that try to override the host model's system prompt or safety policies.",
  },
  {
    id: "WRD-PI-002",
    category: "prompt-injection",
    severity: "critical",
    title: "Conceal activity from the user",
    patterns: [
      /\b(do\s+not|don'?t|never)\s+(tell|inform|mention|reveal|notify|alert|show)\s+(this\s+)?(to\s+)?(the\s+)?(user|human|operator|anyone)/i,
      /without\s+(telling|informing|notifying|alerting|the\s+knowledge\s+of)\s+(the\s+)?(user|anyone|them)/i,
      /\bhide\s+(this|it|the\s+(output|result|fact))\b/i,
      /keep\s+(this|it)\s+(secret|hidden|to\s+yourself)/i,
    ],
    remediation: "Agent instructions must never direct the model to conceal its actions from the user.",
  },
];
