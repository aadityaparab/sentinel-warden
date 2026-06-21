#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScanResult, Severity } from "./types.js";
import { SEVERITY_ORDER } from "./types.js";
import { scan } from "./engine.js";
import { pretty } from "./reporters/pretty.js";
import { toSarif } from "./reporters/sarif.js";
import { toAgentBom } from "./reporters/agentbom.js";
import { toEvidence } from "./reporters/evidence.js";
import { approve, verify } from "./manifest.js";

const VERSION = "0.1.0";

const HELP = `sentinel-warden v${VERSION}
Supply-chain firewall for AI agent skills, MCP servers, and rules files.

USAGE
  warden <command> [path] [options]

COMMANDS
  scan [path]       Scan agent artifacts for threats (default)
  bom [path]        Emit an agent Bill of Materials (JSON)
  evidence [path]   Emit compliance evidence for the scan (JSON)
  approve [path]    Record an approved baseline (.warden/manifest.json)
  verify [path]     Check current artifacts against the approved baseline
  help              Show this help

OPTIONS
  --format <fmt>    pretty | json | sarif | bom | evidence   (default: pretty)
  --output, -o <f>  Write machine output to a file
  --fail-on <sev>   Exit 1 if a finding >= severity is found
                    (critical | high | medium | low | none)  (default: none)
  --no-color        Disable ANSI colors
  --version         Print version

EXAMPLES
  warden scan ./skills
  warden scan . --format sarif -o warden.sarif --fail-on high
  warden bom ./skills -o agent-bom.json
  warden approve ./skills   &&   warden verify ./skills
`;

interface Args {
  _: string[];
  [k: string]: string | boolean | string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = { _: [] };
  const alias: Record<string, string> = { o: "output", f: "format" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (a.startsWith("-") && a.length === 2) {
      const key = alias[a[1]] ?? a[1];
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function gate(result: ScanResult, failOn: string): boolean {
  if (!failOn || failOn === "none") return false;
  const threshold = SEVERITY_ORDER.indexOf(failOn as Severity);
  if (threshold < 0) return false;
  return result.findings.some((f) => SEVERITY_ORDER.indexOf(f.severity) >= threshold);
}

function str(v: string | boolean | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] ?? "scan";

  if (args.version === true || cmd === "version") {
    console.log(VERSION);
    return;
  }
  if (cmd === "help" || args.help === true) {
    console.log(HELP);
    return;
  }

  const target = resolve(args._[1] ?? str(args.path) ?? ".");

  if (cmd === "approve") {
    const m = approve(target);
    console.log(`Approved ${m.entries.length} artifact(s) -> .warden/manifest.json`);
    return;
  }

  if (cmd === "verify") {
    const diff = verify(target);
    if (diff.noBaseline) {
      console.log("No baseline found. Run `warden approve` first.");
      process.exitCode = 2;
      return;
    }
    const lines = [
      diff.changed.length ? `changed: ${diff.changed.join(", ")}` : null,
      diff.added.length ? `added:   ${diff.added.join(", ")}` : null,
      diff.removed.length ? `removed: ${diff.removed.join(", ")}` : null,
    ].filter(Boolean) as string[];
    if (lines.length === 0) {
      console.log("Integrity OK — no drift from approved manifest.");
      return;
    }
    console.log("Integrity drift detected:\n" + lines.join("\n"));
    process.exitCode = 1;
    return;
  }

  // scan / bom / evidence
  const result = scan(target, { version: VERSION });
  const format = str(args.format) ?? (cmd === "bom" ? "bom" : cmd === "evidence" ? "evidence" : "pretty");
  const color = args["no-color"] !== true;

  let out: string;
  switch (format) {
    case "sarif":
      out = JSON.stringify(toSarif(result), null, 2);
      break;
    case "json":
      out = JSON.stringify(result, null, 2);
      break;
    case "bom":
      out = JSON.stringify(toAgentBom(result), null, 2);
      break;
    case "evidence":
      out = JSON.stringify(toEvidence(result), null, 2);
      break;
    default:
      out = pretty(result, color);
  }

  const output = str(args.output);
  if (output) {
    writeFileSync(output, out);
    console.log(pretty(result, color));
    console.log(`\nWrote ${format} -> ${output}`);
  } else {
    console.log(out);
  }

  if (gate(result, str(args["fail-on"]) ?? "none")) process.exitCode = 1;
}

main();
