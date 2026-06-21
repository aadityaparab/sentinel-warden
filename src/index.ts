/**
 * sentinel-warden — public library API.
 *
 * The engine (rules + evidence emitter) is exported so other Sentinel Stack
 * tools (runtime MCP gateway, AI-BOM, etc.) can import the same detection core.
 */
export * from "./types.js";
export { scan, scanArtifacts, buildResult } from "./engine.js";
export type { ScanOptions } from "./engine.js";
export { discover, classify, parseFrontmatter } from "./discovery.js";
export { allRules, RULESET_VERSION } from "./rules/index.js";
export { pretty } from "./reporters/pretty.js";
export { toSarif } from "./reporters/sarif.js";
export { toAgentBom } from "./reporters/agentbom.js";
export { toEvidence } from "./reporters/evidence.js";
export { approve, verify } from "./manifest.js";
export type { Manifest, VerifyResult } from "./manifest.js";
