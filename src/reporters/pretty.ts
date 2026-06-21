import type { Finding, ScanResult, Severity } from "../types.js";

const C: Record<string, string> = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[90m",
  red: "\x1b[31m",
  redbg: "\x1b[41m\x1b[97m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
};

const SEV_STYLE: Record<Severity, string> = {
  critical: C.redbg,
  high: C.red,
  medium: C.yellow,
  low: C.cyan,
  info: C.dim,
};

const ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

/** Human-readable console report. */
export function pretty(r: ScanResult, color = true): string {
  const p = (s: string, code: string) => (color ? code + s + C.reset : s);
  const out: string[] = [];

  out.push(
    p("sentinel-warden", C.bold) + p(`  v${r.tool.version}  ·  ruleset ${r.rulesetVersion}`, C.dim),
  );
  out.push(p(`scanned ${r.summary.artifacts} agent artifact(s)`, C.dim));
  out.push("");

  if (r.findings.length === 0) {
    out.push(p("✓ no issues found", C.green));
  } else {
    const byArtifact = new Map<string, Finding[]>();
    for (const f of r.findings) {
      let arr = byArtifact.get(f.artifactPath);
      if (!arr) {
        arr = [];
        byArtifact.set(f.artifactPath, arr);
      }
      arr.push(f);
    }
    for (const [path, fs] of byArtifact) {
      out.push(p(path, C.bold));
      fs.sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
      for (const f of fs) {
        const tag = p(` ${f.severity.toUpperCase()} `, SEV_STYLE[f.severity]);
        const loc = f.line ? p(`  (line ${f.line})`, C.dim) : "";
        out.push(`  ${tag} ${p(f.ruleId, C.dim)} ${f.title}${loc}`);
        if (f.evidence) out.push(p(`        ↳ ${f.evidence}`, C.dim));
        if (f.remediation) out.push(p(`        fix: ${f.remediation}`, C.dim));
      }
      out.push("");
    }
  }

  const s = r.summary.bySeverity;
  out.push(
    p(`${r.summary.findings} finding(s): `, C.bold) +
      `${s.critical} critical, ${s.high} high, ${s.medium} medium, ${s.low} low`,
  );
  out.push(`risk score ${r.summary.riskScore}/100`);
  const verdict =
    s.critical > 0
      ? p(" BLOCK ", C.redbg)
      : s.high > 0
        ? p(" REVIEW ", C.yellow)
        : p(" PASS ", C.green);
  out.push("verdict: " + verdict);
  return out.join("\n");
}
