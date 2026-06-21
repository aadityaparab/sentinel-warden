import type { Artifact, Finding, Rule, ScanResult, Severity } from "./types.js";
import { allRules, RULESET_VERSION } from "./rules/index.js";
import { discover } from "./discovery.js";
import { lineAt, snippet } from "./util.js";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 40,
  high: 20,
  medium: 8,
  low: 3,
  info: 0,
};

const MAX_HITS_PER_PATTERN = 3; // avoid flooding output from one noisy pattern

export interface ScanOptions {
  rules?: Rule[];
  version?: string;
}

/** Run a rule set across already-discovered artifacts. Pure — no I/O. */
export function scanArtifacts(artifacts: Artifact[], rules: Rule[] = allRules): Finding[] {
  const findings: Finding[] = [];
  for (const artifact of artifacts) {
    for (const rule of rules) {
      if (rule.appliesTo && rule.appliesTo.length && !rule.appliesTo.includes(artifact.type)) {
        continue;
      }
      for (const pattern of rule.patterns) {
        const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
        const re = new RegExp(pattern.source, flags);
        let m: RegExpExecArray | null;
        let count = 0;
        while ((m = re.exec(artifact.content)) !== null && count < MAX_HITS_PER_PATTERN) {
          findings.push(toFinding(rule, artifact, m.index, snippet(artifact.content, m.index)));
          count++;
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      }
      if (rule.match) {
        for (const hit of rule.match(artifact)) {
          findings.push(toFinding(rule, artifact, hit.index, hit.evidence));
        }
      }
    }
  }
  return findings;
}

function toFinding(rule: Rule, a: Artifact, index: number, evidence: string): Finding {
  return {
    ruleId: rule.id,
    category: rule.category,
    severity: rule.severity,
    title: rule.title,
    message: `${rule.title} in ${a.name}`,
    artifactPath: a.path,
    line: lineAt(a.content, index),
    evidence,
    remediation: rule.remediation,
  };
}

/** Discover + scan a path, returning a complete result. */
export function scan(root: string, opts: ScanOptions = {}): ScanResult {
  const artifacts = discover(root);
  const rules = opts.rules ?? allRules;
  const findings = scanArtifacts(artifacts, rules);
  return buildResult(root, artifacts, findings, opts.version);
}

export function buildResult(
  root: string,
  artifacts: Artifact[],
  findings: Finding[],
  version = "0.1.0",
): ScanResult {
  const bySeverity: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  let risk = 0;
  for (const f of findings) {
    bySeverity[f.severity]++;
    risk += SEVERITY_WEIGHT[f.severity];
  }
  return {
    scannedAt: new Date().toISOString(),
    tool: { name: "sentinel-warden", version },
    rulesetVersion: RULESET_VERSION,
    root,
    artifacts,
    findings,
    summary: {
      artifacts: artifacts.length,
      findings: findings.length,
      bySeverity,
      riskScore: Math.min(100, risk),
    },
  };
}
