import type { ScanResult, Severity } from "../types.js";

const ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

function worst(severities: Severity[]): Severity | "none" {
  for (const s of ORDER) {
    if (severities.includes(s)) return s;
  }
  return "none";
}

/**
 * Agent Bill of Materials — the discovery/inventory slice.
 * Lists every agent artifact, its hash, declared capabilities, and risk tier.
 * (This is the part of idea #4 that the firewall covers for free.)
 */
export function toAgentBom(r: ScanResult): unknown {
  return {
    bomFormat: "sentinel-agent-bom",
    specVersion: "0.1",
    generatedAt: r.scannedAt,
    tool: r.tool,
    components: r.artifacts.map((a) => {
      const fs = r.findings.filter((f) => f.artifactPath === a.path);
      return {
        type: a.type,
        name: a.name,
        path: a.path,
        sha256: a.sha256,
        capabilities: a.capabilities,
        riskTier: worst(fs.map((f) => f.severity)),
        findings: fs.length,
      };
    }),
    summary: {
      components: r.artifacts.length,
      flagged: r.artifacts.filter((a) => r.findings.some((f) => f.artifactPath === a.path)).length,
    },
  };
}
