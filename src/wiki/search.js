import MiniSearch from 'minisearch';
import { getNode } from '../routePlanner.js';
import { resolveRoute } from './routes.js';
import { flattenWiki } from './structure.js';

function cardText(card) {
  const radio = card.radio;
  return [
    card.title,
    card.leadIn,
    ...(card.instructions ?? []),
    card.prompt,
    radio?.channel,
    radio?.script,
    ...(radio?.exchange ?? []).map((line) => line.text),
    card.detail,
  ].filter(Boolean);
}

let index;

// One searchable record per wiki page: its own cards plus the cards of each route it lists.
export function buildIndex() {
  if (index) return index;
  index = flattenWiki().map((page) => {
    const node = page.node ? getNode(page.node) : null;
    const lines = (node?.info ?? []).flatMap(cardText);
    (page.routes ?? []).forEach((route) => {
      const leg = resolveRoute(route).leg;
      if (leg) lines.push(leg.title, ...leg.cards.flatMap(cardText));
    });
    const trail = page.trail.map((_, i) => flattenWiki().find((p) => p.path === page.trail.slice(0, i + 1).join('/'))?.title);
    return { path: page.path, title: page.title, trail: trail.filter(Boolean), lines: lines.filter(Boolean) };
  });
  return index;
}

const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'is', 'in', 'on', 'at', 'for', 'do', 'you', 'i']);

// Course shorthand and airport codes, matched in addition to the typed word.
const ALIASES = {
  rwy: ['runway'],
  runway: ['rwy'],
  hdg: ['heading'],
  heading: ['hdg'],
  alt: ['altitude'],
  altitude: ['alt'],
  freq: ['frequency'],
  frequency: ['freq', 'channel'],
  ch: ['channel'],
  channel: ['ch'],
  speed: ['airspeed', 'kias'],
  airspeed: ['kias'],
  kings4: ['kings 4'],
  krkp: ['aransas'],
  kngt: ['goliad'],
  ktfp: ['ingleside'],
  kcrp: ['corpus christi intl'],
  knwl: ['waldron'],
};

// Words and numbers; "2,500'" stays one token and "125°" loses its symbol.
const tokenize = (text) => text.match(/[\p{L}\p{N}]+(?:[,.'’][\p{L}\p{N}]+)*/gu) ?? [];

function processTerm(term) {
  const t = term.toLowerCase().replace(/[,'’]/g, '');
  if (STOP_WORDS.has(t)) return null;
  return t.length > 4 && /[^su]s$/.test(t) ? t.slice(0, -1) : t;
}

// Typos are only tolerated in longer plain words so runways like 13L never match 13R.
const fuzzy = (term) => (term.length >= 5 && !/\d/.test(term) ? 0.2 : false);
const prefix = (term) => term.length >= 3;

const engines = new WeakMap();

function engineFor(records) {
  if (!engines.has(records)) {
    const engine = new MiniSearch({
      fields: ['title', 'body'],
      idField: 'path',
      tokenize,
      processTerm,
      searchOptions: { boost: { title: 4 }, prefix, fuzzy, combineWith: 'AND' },
    });
    engine.addAll(
      records.map((page) => ({ path: page.path, title: `${page.trail.join(' ')} ${page.title}`, body: page.lines.join('\n') })),
    );
    engines.set(records, engine);
  }
  return engines.get(records);
}

// Each typed word must match (or one of its aliases); different words may match different lines.
function buildQuery(text) {
  const queries = [];
  for (const raw of tokenize(text)) {
    const key = processTerm(raw);
    if (!key) continue;
    const alternatives = [raw, ...(ALIASES[key] ?? [])].map((alt) => {
      const words = tokenize(alt);
      return words.length > 1 ? { combineWith: 'AND', queries: words } : alt;
    });
    queries.push(alternatives.length === 1 ? alternatives[0] : { combineWith: 'OR', queries: alternatives });
  }
  return queries.length ? { combineWith: 'AND', queries } : null;
}

const matchesTerm = (token, term) => token === term || (term.length >= 3 && token.startsWith(term));

function snippet(line, tokens) {
  const lower = line.toLowerCase();
  const first = tokens.map((t) => lower.indexOf(t.replace(/s$/, ''))).filter((i) => i >= 0);
  const at = first.length ? Math.min(...first) : -1;
  if (at < 0 || line.length <= 110) return line;
  const start = Math.max(0, at - 40);
  return `${start > 0 ? '…' : ''}${line.slice(start, start + 110)}…`;
}

// Ranked, typo-tolerant search. Title matches count most; the snippet is the line that matches the most terms.
export function searchWiki(query, records = buildIndex()) {
  const parsed = buildQuery(query);
  if (!parsed) return [];
  const byPath = new Map(records.map((page) => [page.path, page]));
  return engineFor(records)
    .search(parsed)
    .slice(0, 30)
    .map((hit) => {
      const page = byPath.get(hit.id);
      let best = { line: '', count: 0 };
      for (const line of page.lines) {
        const tokens = tokenize(line).map((t) => processTerm(t) ?? '');
        const count = hit.terms.filter((term) => tokens.some((t) => matchesTerm(t, term))).length;
        if (count > best.count) best = { line, count };
      }
      return { page, score: hit.score, snippet: best.count ? snippet(best.line, hit.terms) : '' };
    });
}
