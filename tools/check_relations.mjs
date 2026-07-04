// Konsistenzprüfung: zeigen alle related_codes-Verweise (Format "system:CODE")
// auf existierende Einträge? Das Schema validiert nur das Format, nicht die
// Existenz. Verweise dürfen auch systemübergreifend sein.
//
// Exit 0 = alles ok. Exit 1 = mindestens ein dangling Verweis oder Selbstverweis.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith(".yaml")) out.push(p);
  }
  return out;
}

function loadArray(file) {
  const parsed = parse(readFileSync(file, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

const allUids = new Set();
const entriesWithRelations = [];

for (const file of walk(join(root, "data/codes"))) {
  for (const item of loadArray(file)) {
    if (!item.system || !item.code) continue;
    const uid = `${item.system}:${item.code}`;
    allUids.add(uid);
    if (Array.isArray(item.related_codes) && item.related_codes.length) {
      entriesWithRelations.push({ uid, related: item.related_codes, file });
    }
  }
}

const dangling = [];
const selfRefs = [];
let totalRelations = 0;

for (const { uid, related, file } of entriesWithRelations) {
  for (const ref of related) {
    totalRelations++;
    if (ref === uid) {
      selfRefs.push({ uid, file });
      continue;
    }
    if (!allUids.has(ref)) {
      dangling.push({ uid, ref, file });
    }
  }
}

console.log(`Entries total:               ${allUids.size}`);
console.log(`Entries with related_codes:  ${entriesWithRelations.length}`);
console.log(`Total related_codes refs:    ${totalRelations}`);
console.log(`Self-references:             ${selfRefs.length}`);
console.log(`Dangling references:         ${dangling.length}`);

if (selfRefs.length) {
  console.log(`\nSelf-references:`);
  for (const { uid, file } of selfRefs.slice(0, 20)) {
    console.log(`  ${uid} -> ${uid}  (${file})`);
  }
  if (selfRefs.length > 20) console.log(`  ... and ${selfRefs.length - 20} more`);
}

if (dangling.length) {
  console.log(`\nDangling references:`);
  for (const { uid, ref, file } of dangling.slice(0, 30)) {
    console.log(`  ${uid} -> ${ref}  (not found, ${file})`);
  }
  if (dangling.length > 30) console.log(`  ... and ${dangling.length - 30} more`);
  process.exit(1);
}

if (selfRefs.length) process.exit(1);

console.log(`\nOK: all related_codes resolve to existing entries`);
