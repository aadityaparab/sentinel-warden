import type { Artifact, Rule } from "../types.js";

// Zero-width + bidirectional control characters frequently used to smuggle
// hidden instructions past human review of a SKILL.md / tool description.
// Listed as numeric code points so there are no literal invisible chars in source.
const INVISIBLE_CODE_POINTS = new Set<number>([
  0x200b, 0x200c, 0x200d, 0x200e, 0x200f, // ZWSP, ZWNJ, ZWJ, LRM, RLM
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, // bidi embedding / override
  0x2060, 0x2061, 0x2062, 0x2063, 0x2064, // word joiner, invisible operators
  0xfeff, // zero-width no-break space / BOM
]);

export const toolPoisoningRules: Rule[] = [
  {
    id: "WRD-TP-001",
    category: "tool-poisoning",
    severity: "critical",
    title: "Hidden instructions inside a comment",
    patterns: [
      /<!--[\s\S]*?\b(ignore|instead|always|secret|do not tell|exfiltrate|send|run|execute|read\s+\.env)\b[\s\S]*?-->/i,
    ],
    remediation: "Remove imperative instructions hidden inside HTML/markdown comments — a classic tool-poisoning vector.",
  },
  {
    id: "WRD-TP-002",
    category: "tool-poisoning",
    severity: "high",
    title: "Invisible or bidirectional control characters",
    patterns: [],
    match: (a: Artifact) => {
      const out: { index: number; evidence: string }[] = [];
      for (let i = 0; i < a.content.length; i++) {
        const code = a.content.charCodeAt(i);
        if (INVISIBLE_CODE_POINTS.has(code)) {
          out.push({
            index: i,
            evidence: `hidden character U+${code.toString(16).toUpperCase().padStart(4, "0")}`,
          });
          if (out.length >= 5) break;
        }
      }
      return out;
    },
    remediation: "Strip zero-width and bidirectional control characters often used to smuggle hidden instructions past human review.",
  },
];
