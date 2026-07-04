// Duplikat-Prüfung: Identität eines Eintrags ist system + code.
// Derselbe Code-String darf in verschiedenen Systemen vorkommen
// (Bosch "504" und ein anderes System "504" sind verschiedene Fehler).

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

const seen = new Map();
const errors = [];

for (const file of walk(join(root, "data/codes"))) {
  for (const item of loadArray(file)) {
    if (!item.system || !item.code) continue;
    const uid = `${item.system}:${item.code}`;
    if (seen.has(uid)) {
      errors.push(`Duplicate ${uid}: ${seen.get(uid)} and ${file}`);
    } else {
      seen.set(uid, file);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log(`OK: ${seen.size} unique system:code entries`);
