import type { ScanResult } from "../types.js";
import { sha256 } from "../util.js";
import { RULESET_VERSION } from "../rules/index.js";

/**
 * Compliance evidence — emitted as a byproduct of a normal scan.
 * Maps the "AI agent supply-chain scanning" control to common frameworks.
 * (This is the part of idea #3 that the firewall covers for free.)
 */
export function toEvidence(r: ScanResult): unknown {
  const passed = r.summary.bySeverity.critical === 0 && r.summary.bySeverity.high === 0;

  const body = {
    evidenceType: "control-execution",
    control: {
      id: "AI-SCM-01",
      name: "AI agent supply-chain scanning",
      description:
        "Every agent skill, MCP server, and rules file is statically scanned for prompt injection, data exfiltration, tool poisoning, and unsafe actions before use.",
      frameworks: [
        { framework: "SOC 2", reference: "CC7.1 / CC8.1" },
        { framework: "ISO/IEC 27001:2022", reference: "A.8.28 secure coding / A.5.23 cloud services" },
        { framework: "NIST CSF 2.0", reference: "ID.RA / PR.PS" },
        { framework: "NIST AI RMF", reference: "MEASURE 2.7" },
        { framework: "EU AI Act", reference: "Art.15 accuracy, robustness & cybersecurity" },
      ],
    },
    execution: {
      executedAt: r.scannedAt,
      tool: r.tool,
      rulesetVersion: RULESET_VERSION,
      scope: { artifactsScanned: r.summary.artifacts },
      outcome: passed ? "pass" : "fail",
      findings: r.summary.bySeverity,
      riskScore: r.summary.riskScore,
    },
  };

  return {
    ...body,
    integrity: { algorithm: "sha256", digest: sha256(JSON.stringify(body)) },
  };
}
