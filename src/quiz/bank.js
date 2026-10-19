import { GRAPH, getNode } from '../routePlanner.js';
import { EXPLANATIONS, explanationKey } from './explanations.js';
import { CURATED } from './curated.js';
import { allLegs, findCuratedSource, locateSource } from './locate.js';
import { hintFor } from './sources.js';

// Route questions are filed under the field or area they are about; KNGP-only routes go under KNGP.
const KNGP_SIDE = new Set(['KNGP', 'Shamrock Re-entry', 'Corpus Christi Intl']);

function foldRoutes(items) {
  const refs = new Set(items.filter((i) => i.group === 'Reference').map((i) => i.topic));
  const refTopic = (route) => {
    const [a, b] = route.split(' → ');
    if (KNGP_SIDE.has(a) && refs.has(b)) return b;
    if (KNGP_SIDE.has(b) && refs.has(a)) return a;
    if (refs.has(b)) return b;
    if (refs.has(a)) return a;
    return 'KNGP';
  };
  return items.map((i) => (i.group === 'Routes' ? { ...i, group: 'Reference', topic: refTopic(i.topic) } : i));
}

// Every question is hand-written (see curated*.js). Each gets an explanation and a link to the
// exact wiki card it came from.
export function buildBank() {
  const items = CURATED.map((item, i) => ({
    ...item,
    id: `q/${i}`,
    source: findCuratedSource(item, hintFor(item))?.source,
  }));
  const nodeIdByName = new Map([...GRAPH.nodes.values()].map((node) => [node.name, node.id]));
  return foldRoutes(items).map(({ source, ...item }) => {
    const why = item.why ?? EXPLANATIONS[explanationKey(item)];
    const wiki = source && locateSource(source, nodeIdByName.get(item.topic));
    return { ...item, ...(why ? { why } : {}), ...(wiki ? { wiki } : {}) };
  });
}

export const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const mcEligible = (item) => Boolean(item.choices);
export const choicesFor = (item) => (mcEligible(item) ? shuffle(item.choices) : null);

// Every distinct chair-fly leg. `fromPicks`/`toPicks` are the runway, area or entry choices.
export function chairFlyLegs() {
  const seen = new Map();
  for (const { leg, fromChoices, toChoices } of allLegs()) {
    if (getNode(leg.from).hidden || getNode(leg.to).hidden) continue;
    const fromPicks = Object.values(fromChoices);
    const toPicks = Object.values(toChoices);
    const key = `${leg.from}|${fromPicks}|${leg.to}|${toPicks}`;
    if (!seen.has(key) && leg.cards.length) {
      seen.set(key, {
        key,
        fromNode: getNode(leg.from).name,
        toNode: getNode(leg.to).name,
        fromPicks,
        toPicks,
        cards: leg.cards,
        featureIds: leg.featureIds,
      });
    }
  }
  return [...seen.values()];
}
