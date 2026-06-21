import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { discover } from "./discovery.js";

export interface Manifest {
  createdAt: string;
  entries: { path: string; sha256: string }[];
}

export interface VerifyResult {
  changed: string[];
  added: string[];
  removed: string[];
  noBaseline: boolean;
}

const REL = join(".warden", "manifest.json");

/** Record an approved baseline of every agent artifact under `root`. */
export function approve(root: string): Manifest {
  const artifacts = discover(root);
  const manifest: Manifest = {
    createdAt: new Date().toISOString(),
    entries: artifacts.map((a) => ({ path: a.path, sha256: a.sha256 })).sort((x, y) => x.path.localeCompare(y.path)),
  };
  mkdirSync(join(root, ".warden"), { recursive: true });
  writeFileSync(join(root, REL), JSON.stringify(manifest, null, 2));
  return manifest;
}

/** Compare current artifacts against the approved baseline (runtime integrity slice). */
export function verify(root: string): VerifyResult {
  const path = join(root, REL);
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  if (!existsSync(path)) return { changed, added, removed, noBaseline: true };

  const base: Manifest = JSON.parse(readFileSync(path, "utf8"));
  const baseMap = new Map(base.entries.map((e) => [e.path, e.sha256]));
  const now = discover(root);
  const nowMap = new Map(now.map((a) => [a.path, a.sha256]));

  for (const a of now) {
    if (!baseMap.has(a.path)) added.push(a.path);
    else if (baseMap.get(a.path) !== a.sha256) changed.push(a.path);
  }
  for (const p of baseMap.keys()) {
    if (!nowMap.has(p)) removed.push(p);
  }
  return { changed, added, removed, noBaseline: false };
}
