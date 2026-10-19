import { GRAPH, expandLegs, getNode } from '../routePlanner.js';
import { flattenWiki } from '../wiki/structure.js';
import { resolveRoute } from '../wiki/routes.js';

// Ties quiz questions to the exact wiki card they came from, so the wiki link opens the page
// that really shows that information (route explorer opened, picks applied, card highlighted).

const PAGES = flattenWiki();

// Every resolved version of every leg, built once; the quiz bank and the card index both use it.
let legs;
export const allLegs = () => (legs ??= expandLegs(GRAPH));

export function cardText(card) {
  return [
    card.title,
    card.leadIn,
    ...(card.instructions ?? []),
    card.prompt,
    card.radio?.channel,
    card.radio?.script,
    ...(card.radio?.exchange ?? []).map((line) => line.text),
    card.detail,
    card.note,
  ]
    .filter(Boolean)
    .join(' \n ');
}

const sameCard = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Many questions share a route and picks, so resolve each combination once.
const resolvedRoutes = new Map();
function resolveCached(route, picks) {
  const key = JSON.stringify(picks);
  const byPicks = resolvedRoutes.get(route) ?? resolvedRoutes.set(route, new Map()).get(route);
  if (!byPicks.has(key)) byPicks.set(key, resolveRoute(route, picks));
  return byPicks.get(key);
}

// Where a card shows up in the wiki, or null when no page displays it.
export function locateSource(source, topicNodeId) {
  if (source.kind === 'node') {
    const page = PAGES.find((p) => p.node === source.nodeId);
    if (!page || !sameCard(getNode(source.nodeId).info?.[source.index], source.card)) return null;
    return { path: page.path, query: `card=info.${source.index}`, cardTitle: source.card.title };
  }

  const found = [];
  for (const page of PAGES) {
    (page.routes ?? []).forEach((route, routeIndex) => {
      if (route.from !== source.from || route.to !== source.to) return;
      const resolved = resolveCached(route, { from: source.fromChoices, to: source.toChoices });
      if (!resolved.leg || !sameCard(resolved.leg.cards[source.index], source.card)) return;
      found.push({ page, routeIndex, resolved });
    });
  }
  if (!found.length) return null;

  // The page for the question's own topic first, then the arrival and transition pages.
  const rank = ({ page }) => (page.node === topicNodeId ? 0 : page.path.startsWith('arrivals/') ? 1 : 2);
  const { page, routeIndex, resolved } = [...found].sort((a, b) => rank(a) - rank(b))[0];
  const params = new URLSearchParams({ card: `route.${routeIndex}.${source.index}` });
  for (const input of resolved.fromInputs) {
    if (input.options.length > 1) params.set(`from.${input.id}`, resolved.fromChoices[input.id]);
  }
  for (const input of resolved.toInputs) {
    if (input.options.length > 1) params.set(`to.${input.id}`, resolved.toChoices[input.id]);
  }
  return { path: page.path, query: params.toString(), cardTitle: source.card.title };
}

// --- Finding the source of hand-written questions -------------------------------------------

const norm = (text) =>
  text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”"]/g, '')
    .replace(/[~≈]|\bapproximately\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const NOISE = new Set(['less', 'more']);
const STOP = new Set(
  'about after again all also and are because been before being between both but can could did does each for from have has into its may must not now off once only other over please should some such than that the their then there these they this those through toward until use using want what when where which while who will with would you your'.split(
    ' ',
  ),
);

const words = (text) => norm(text).split(/[^a-z0-9']+/).filter((w) => w.length >= 4 && !STOP.has(w));

// The checkable facts in an answer: numbers (with their unit) and significant words.
const FACT = /\d[\d,]*(?:\.\d+)?(?:'|°|\s?(?:nm|kias|kts|dme|min)\b)?|[a-z]{4,}/g;

function hasFact(text, fact) {
  if (!/^\d/.test(fact)) return text.includes(fact);
  for (let at = text.indexOf(fact); at >= 0; at = text.indexOf(fact, at + 1)) {
    const before = text[at - 1] ?? '';
    const after = text.slice(at + fact.length, at + fact.length + 2);
    if (!/[\d,.]/.test(before) && !/^(\d|[,.]\d)/.test(after)) return true;
  }
  return false;
}

const factsOf = (answer) => (norm(answer).match(FACT) ?? []).filter((f) => !NOISE.has(f) && !STOP.has(f));

function coverageOf(text, facts) {
  if (!facts.length) return { hit: 0.5, missing: [] };
  const missing = facts.filter((f) => !hasFact(text, f));
  return { hit: 1 - missing.length / facts.length, missing };
}

// How much of an answer's numbers and key words a card actually contains (0 to 1).
export const answerCoverage = (answer, card) => coverageOf(norm(cardText(card)), factsOf(answer));

let corpus;
const lazy = (compute) => {
  let value;
  return () => (value ??= compute());
};
const entryOf = (source, ends) => ({ source, ends, title: norm(source.card.title), text: lazy(() => norm(cardText(source.card))) });

function cardCorpus() {
  if (corpus) return corpus;
  corpus = [];
  for (const node of GRAPH.nodes.values()) {
    (node.info ?? []).forEach((card, index) => {
      corpus.push(entryOf({ kind: 'node', nodeId: node.id, index, card }, [node.name]));
    });
  }
  for (const { leg, fromChoices, toChoices } of allLegs()) {
    if (getNode(leg.from).hidden || getNode(leg.to).hidden) continue;
    const ends = [getNode(leg.from).name, getNode(leg.to).name];
    leg.cards.forEach((card, index) => {
      corpus.push(entryOf({ kind: 'leg', from: leg.from, to: leg.to, fromChoices, toChoices, index, card }, ends));
    });
  }
  return corpus;
}

// Best matching card for a hand-written question, restricted to the question's own topic:
// a route topic ("KNGP → Mustang") only looks at that route; a place only looks at its overview
// and the routes in or out of it. A hint (see sources.js) narrows or overrides the match.
export function findCuratedSource(item, hint) {
  const [a, b] = item.topic.split(' → ');
  const title = hint?.title && norm(hint.title);
  const pool = cardCorpus().filter((entry) => {
    if (title && !entry.title.includes(title)) return false;
    if (hint?.node) return entry.source.kind === 'node' && entry.source.nodeId === hint.node;
    if (hint?.ends) return entry.source.kind === 'leg' && entry.ends[0] === hint.ends[0] && entry.ends[1] === hint.ends[1];
    if (b) return entry.source.kind === 'leg' && entry.ends[0] === a && entry.ends[1] === b;
    return entry.ends.includes(a);
  });
  const find = hint?.find && norm(hint.find);
  const facts = factsOf(item.answers[0]);
  const context = [...new Set(words(`${item.scenario} ${item.text}`))];
  let best = null;
  for (const entry of pool) {
    const text = entry.text();
    if (find && !text.includes(find)) continue;
    const hit = find || hint ? 1 : coverageOf(text, facts).hit;
    if (hit < 0.6) continue;
    const overlap = context.filter((w) => text.includes(w)).length / (context.length || 1);
    const titleOverlap = context.filter((w) => entry.title.includes(w)).length / (context.length || 1);
    const ownOverview = !b && entry.source.kind === 'node' ? 0.6 : 0;
    const score = 2 * hit + overlap + 0.5 * titleOverlap + ownOverview;
    if (!best || score > best.score) best = { score, hit, overlap, source: entry.source };
  }
  return best;
}
