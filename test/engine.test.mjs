import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scan } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const examples = join(here, "..", "examples");

test("malicious skill triggers critical findings", () => {
  const r = scan(join(examples, "malicious-skill"));
  const ids = new Set(r.findings.map((f) => f.ruleId));
  assert.ok(r.summary.bySeverity.critical > 0, "expected at least one critical finding");
  assert.ok(ids.has("WRD-PI-002"), "expected conceal-from-user rule (WRD-PI-002)");
  assert.ok(ids.has("WRD-TP-001"), "expected hidden-comment rule (WRD-TP-001)");
});

test("clean skill has no high or critical findings", () => {
  const r = scan(join(examples, "clean-skill"));
  assert.equal(r.summary.bySeverity.critical, 0);
  assert.equal(r.summary.bySeverity.high, 0);
});

test("sketchy mcp config: pipe-to-shell + capabilities surfaced", () => {
  const r = scan(join(examples, "sketchy-mcp"));
  const ids = new Set(r.findings.map((f) => f.ruleId));
  assert.ok(ids.has("WRD-ACT-001"), "expected pipe-to-shell rule (WRD-ACT-001)");
  const mcp = r.artifacts.find((a) => a.type === "mcp-config");
  assert.ok(mcp, "expected an mcp-config artifact");
  assert.ok(
    mcp.capabilities.some((c) => c.startsWith("server:")),
    "expected a server capability in the BOM",
  );
});

test("cursor rules: instruction override is detected", () => {
  const r = scan(join(examples, "cursor-rules"));
  const ids = new Set(r.findings.map((f) => f.ruleId));
  assert.ok(ids.has("WRD-PI-001"), "expected instruction-override rule (WRD-PI-001)");
});
