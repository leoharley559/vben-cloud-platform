import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 每一段最大为 100，下一次发布进位。例如 1.0.100 → 1.1.0，1.100.100 → 2.0.0 */
const SEGMENT_MAX = 100;

const filePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/app-version.json',
);

function parseVersion(raw) {
  const current = String(raw || '0.0.0').replace(/^v/i, '');
  const parts = current.split('.').map((item) => Number.parseInt(item, 10));
  return {
    current,
    major: Number.isFinite(parts[0]) ? parts[0] : 0,
    minor: Number.isFinite(parts[1]) ? parts[1] : 0,
    patch: Number.isFinite(parts[2]) ? parts[2] : 0,
  };
}

function bumpVersion(major, minor, patch) {
  let nextMajor = major;
  let nextMinor = minor;
  let nextPatch = patch + 1;

  if (nextPatch > SEGMENT_MAX) {
    nextPatch = 0;
    nextMinor += 1;
  }

  if (nextMinor > SEGMENT_MAX) {
    nextMinor = 0;
    nextMajor += 1;
  }

  return `${nextMajor}.${nextMinor}.${nextPatch}`;
}

const meta = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const { current, major, minor, patch } = parseVersion(meta.version);
const next = bumpVersion(major, minor, patch);

if (process.argv.includes('--print')) {
  process.stdout.write(current);
  process.exit(0);
}

fs.writeFileSync(filePath, `${JSON.stringify({ version: next }, null, 2)}\n`);
process.stdout.write(next);
