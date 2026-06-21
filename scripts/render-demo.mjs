// Renders assets/demo.svg from a real scan of the malicious example.
// Explicit x per span (monospace advance) -> identical in browsers, GitHub, rasterizers.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scan } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const result = scan(join(root, "examples", "malicious-skill"), { version: "0.1.0" });

const COL = {
  bg: "#0d1117", bar: "#161b22", text: "#c9d1d9", dim: "#8b949e", bold: "#f0f6fc",
  green: "#3fb950", purple: "#bc8cff", red: "#f85149",
  critical: "#ff7b72", high: "#f0883e", medium: "#d29922", low: "#58a6ff", info: "#8b949e",
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const FS = 14, LH = 22, PADX = 22, BAR = 38, CHAR = FS * 0.6;
const S = (text, fill = COL.text, bold = false) => ({ text, fill, bold });

const lines = [];
lines.push([S("$ ", COL.green), S("npx sentinel-warden scan "), S("examples/malicious-skill", COL.purple)]);
lines.push([]);
lines.push([S("sentinel-warden", COL.bold, true), S("  v0.1.0 - ruleset 0.1.0", COL.dim)]);
lines.push([S("scanned 1 agent artifact(s)", COL.dim)]);
lines.push([]);
lines.push([S("SKILL.md", COL.bold, true)]);

const order = ["critical", "high", "medium", "low", "info"];
const sorted = [...result.findings].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
for (const f of sorted.slice(0, 5)) {
  lines.push([
    S("  " + f.severity.toUpperCase().padEnd(9), COL[f.severity], true),
    S(f.ruleId + "  ", COL.dim),
    S(f.title),
    S("  (line " + (f.line || 1) + ")", COL.dim),
  ]);
}
const more = sorted.length - 5;
if (more > 0) lines.push([S("  ... +" + more + " more findings", COL.dim)]);
lines.push([]);
const sev = result.summary.bySeverity;
lines.push([
  S(result.summary.findings + " findings:  ", COL.bold, true),
  S(sev.critical + " critical, " + sev.high + " high", COL.text),
  S("    risk " + result.summary.riskScore + "/100", COL.dim),
]);
lines.push([{ verdict: true }]);

const width = 768;
const height = BAR + 22 + lines.length * LH + 12;

let body = "";
let y = BAR + 34;
for (const spans of lines) {
  if (spans[0] && spans[0].verdict) {
    body += `<text x="${PADX}" y="${y}" fill="${COL.text}">verdict:</text>`;
    const bx = PADX + 9 * CHAR;
    body += `<rect x="${bx}" y="${(y - FS + 1).toFixed(1)}" width="60" height="${FS + 6}" rx="4" fill="${COL.red}"/>`;
    body += `<text x="${(bx + 12).toFixed(1)}" y="${y}" fill="#0d1117" font-weight="700">BLOCK</text>`;
  } else {
    let x = PADX;
    for (const sp of spans) {
      const lead = sp.text.length - sp.text.trimStart().length;
      const drawX = (x + lead * CHAR).toFixed(1);
      const vis = sp.text.trim();
      if (vis) body += `<text x="${drawX}" y="${y}" fill="${sp.fill}"${sp.bold ? ' font-weight="700"' : ""}>${esc(vis)}</text>`;
      x += sp.text.length * CHAR;
    }
  }
  y += LH;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${FS}">
<rect width="${width}" height="${height}" rx="10" fill="${COL.bg}"/>
<rect width="${width}" height="${BAR}" fill="${COL.bar}"/>
<rect y="${BAR - 10}" width="${width}" height="10" fill="${COL.bar}"/>
<circle cx="22" cy="19" r="6" fill="#ff5f56"/><circle cx="42" cy="19" r="6" fill="#ffbd2e"/><circle cx="62" cy="19" r="6" fill="#27c93f"/>
<text x="${width / 2}" y="24" text-anchor="middle" fill="${COL.dim}" font-size="12">warden - agent supply-chain firewall</text>
${body}
</svg>`;

mkdirSync(join(root, "assets"), { recursive: true });
writeFileSync(join(root, "assets", "demo.svg"), svg);
console.log(`Wrote assets/demo.svg (${width}x${height}px, ${result.findings.length} findings)`);
