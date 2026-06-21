import type { ScanResult, Severity } from "../types.js";
import { allRules } from "../rules/index.js";

function level(s: Severity): "error" | "warning" | "note" {
  if (s === "critical" || s === "high") return "error";
  if (s === "medium") return "warning";
  return "note";
}

function securitySeverity(s: Severity): string {
  return s === "critical" ? "9.0" : s === "high" ? "7.5" : s === "medium" ? "5.0" : s === "low" ? "3.0" : "0.0";
}

/** SARIF 2.1.0 — uploadable to GitHub code scanning. */
export function toSarif(r: ScanResult): unknown {
  const usedIds = new Set(r.findings.map((f) => f.ruleId));
  const rulesMeta = allRules
    .filter((rl) => usedIds.has(rl.id))
    .map((rl) => ({
      id: rl.id,
      name: rl.title,
      shortDescription: { text: rl.title },
      fullDescription: { text: rl.remediation ?? rl.title },
      defaultConfiguration: { level: level(rl.severity) },
      properties: {
        category: rl.category,
        "security-severity": securitySeverity(rl.severity),
        tags: ["security", "ai", rl.category],
      },
    }));

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "sentinel-warden",
            version: r.tool.version,
            informationUri: "https://github.com/aadityaparab/sentinel-warden",
            rules: rulesMeta,
          },
        },
        results: r.findings.map((f) => ({
          ruleId: f.ruleId,
          level: level(f.severity),
          message: { text: `${f.message}${f.remediation ? ` — ${f.remediation}` : ""}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.artifactPath },
                region: { startLine: f.line ?? 1, snippet: { text: f.evidence ?? "" } },
              },
            },
          ],
          properties: { category: f.category, severity: f.severity },
        })),
      },
    ],
  };
}
