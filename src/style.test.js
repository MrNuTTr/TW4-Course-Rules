import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = [
  ...walk('src/data').filter((f) => f.endsWith('.json')),
  ...walk('src/quiz').filter((f) => /curated.*\.js$|explanations\.js$/.test(f)),
];

// Strings only (JSON values / JS literals), line by line, so failures point at the exact text.
const lines = files.flatMap((f) =>
  readFileSync(f, 'utf8')
    .split('\n')
    .map((text, i) => ({ f, n: i + 1, text })),
);

const offenders = (re, allow = () => false) =>
  lines.filter((l) => re.test(l.text) && !allow(l)).map((l) => `${l.f}:${l.n}: ${l.text.trim().slice(0, 100)}`);

describe('style standards', () => {
  it('writes altitudes as 1,500\' MSL, not "ft"', () => {
    expect(offenders(/\d\s?ft\b/)).toEqual([]);
  });

  it('writes headings as NNN° and not "degrees"', () => {
    expect(offenders(/\bHDG\s?\d{3}\b(?!°)/)).toEqual([]);
  });

  it('does not put radio frequencies beside channels', () => {
    expect(offenders(/CH \d+\)?\s?[(\/·-]?\s?\b[123]\d\d\.\d{1,3}\b/)).toEqual([]);
    expect(offenders(/\b[123]\d\d\.\d{1,3}\)?\s?[(\/·-]?\s?(UHF |VHF )?CH \d+/)).toEqual([]);
  });

  it('labels radio channels as Name · UHF/VHF CH nn', () => {
    expect(offenders(/"channel":\s*"[^"]*\bCH \d+/, (l) => /·\s(UHF|VHF)(\/VHF)?\sCH \d+"/.test(l.text))).toEqual([]);
  });
});
