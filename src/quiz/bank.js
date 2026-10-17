import { GRAPH, expandLegs, getNode } from '../routePlanner.js';
import { CURATED } from './curated.js';

// A blankable value: a number with a unit, a channel, a count, or a pattern side.
const TOKEN = new RegExp(
  [
    String.raw`CH \d+`,
    String.raw`(?<![A-Za-z0-9/.,])\d[\d,]*(?:\.\d+)?(?:[–-]\d[\d,]*)?(?:'|°| (?:MSL|AGL|KIAS|NM|kts|DME|min)\b)(?: (?:MSL|AGL))?`,
    String.raw`(?<=Max )\d+`,
    String.raw`(?<=RWY \d\d[LR]?: )(?:left|right)`,
  ].join('|'),
  'g',
);

export function kindOf(token) {
  if (/^CH/.test(token)) return 'channel';
  if (/KIAS/.test(token)) return 'airspeed';
  if (/kts/.test(token)) return 'taxi speed';
  if (/NM|DME/.test(token)) return 'distance';
  if (/°/.test(token)) return 'heading';
  if (/MSL|AGL|'/.test(token)) return 'altitude';
  if (/^(left|right)$/.test(token)) return 'side';
  return 'number';
}

function lineQuestions(text) {
  const tokens = [...text.matchAll(TOKEN)].map((m) => ({ value: m[0], index: m.index }));
  if (!tokens.length) return null;
  let blanked = '';
  let cursor = 0;
  for (const { value, index } of tokens) {
    blanked += `${text.slice(cursor, index)}_____`;
    cursor = index + value.length;
  }
  blanked += text.slice(cursor);
  return { text: blanked, answers: tokens.map((t) => t.value) };
}

function cardLines(card) {
  const lines = [];
  if (card.leadIn) lines.push(card.leadIn);
  lines.push(...(card.instructions ?? []));
  if (card.radio?.script) lines.push(card.radio.script);
  for (const { text } of card.radio?.exchange ?? []) lines.push(text);
  return lines.filter((line) => !/check with an instructor/i.test(line));
}

const clean = (text) => text.replace(/:\s*$/, '');
const RESTRICTION = /\b(avoid|do not|don't|remain clear|stay (?:clear|outside|south|north|below|above|\d)|not overfly|never|no turns)\b/i;

// Every question carries a scenario (the route you are flying plus the situation on the card),
// so it tests what to do rather than what a card is called.
function addCard(items, seen, topic, group, card, flight) {
  if (!card.source) return;
  const lead = card.leadIn && !/^do not/i.test(card.leadIn) ? clean(card.leadIn) : '';
  const situation = lead;
  const scenario = [flight, lead || (group === 'Routes' ? card.title : '')].filter(Boolean).join(' · ');
  const push = (kind, text, answers, extra = {}) => {
    const key = `${kind ?? 'blank'}|${topic}|${situation}|${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      id: `${topic}/${items.length}`,
      kind,
      topic,
      group,
      context: group === 'Reference' ? card.title : 'Route',
      scenario,
      text,
      answers,
      ...extra,
    });
  };

  for (const line of cardLines(card)) {
    if (line === card.leadIn) continue;
    const q = lineQuestions(line);
    if (q) push(undefined, q.text, q.answers);
  }

  if (card.radio?.channel && situation) {
    push('channel', 'Which frequency do you use?', [card.radio.channel]);
  }

  const steps = (card.instructions ?? []).filter((line) => !/check with an instructor/i.test(line));
  const limits = steps.filter((line) => RESTRICTION.test(line));
  if (limits.length) push('recall', 'What restriction applies here?', limits);
  if (situation && card.type !== 'radio' && steps.length) {
    push('recall', 'What do you do?', steps);
  }
}

export const mcEligible = (item) => Boolean(item.choices) || item.kind === 'channel' || (!item.kind && item.answers.length === 1);

// Generated questions must stand on their own: one blank, enough surrounding context,
// and no duplicates of the same fact repeated across runway variants.
const words = (text) => text.replace(/_____/g, ' ').split(/[^A-Za-z]+/).filter((w) => w.length > 1).length;

const RADIO_CUE = /\b(contact|call|check in|terminate|switch|monitor|report|announce|when directed|before leaving|crossing|abeam|at point|numbers)\b/i;

function worthKeeping(item) {
  if (item.curated) return true;
  if (item.kind === 'recall') return false;
  if (item.kind === 'channel') return RADIO_CUE.test(item.scenario) && !/then contact|intercept/i.test(item.scenario);
  return item.answers.length === 1 && words(item.text) >= 5 && !/(?:VHF|UHF) _____/.test(item.text);
}

export function buildBank() {
  const items = [];
  const seen = new Set();
  for (const node of GRAPH.nodes.values()) {
    for (const card of node.info ?? []) addCard(items, seen, node.name, 'Reference', card, node.name);
  }
  for (const { leg } of expandLegs(GRAPH)) {
    if (getNode(leg.from).hidden || getNode(leg.to).hidden) continue;
    const topic = `${getNode(leg.from).name} → ${getNode(leg.to).name}`;
    for (const card of leg.cards) addCard(items, seen, topic, 'Routes', card, `Flying ${leg.title}`);
  }
  const curated = CURATED.map((item, i) => ({ ...item, id: `curated/${i}` }));
  const factSeen = new Set();
  const kept = items.filter((item) => {
    if (!worthKeeping(item)) return false;
    const lead = item.scenario.split(' · ').slice(1).join(' · ');
    const key = item.kind === 'channel' ? `channel|${lead}|${item.answers[0]}` : `blank|${item.text}|${item.answers[0]}`;
    if (factSeen.has(key)) return false;
    factSeen.add(key);
    return true;
  });
  return [...curated, ...kept];
}
export const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Multiple choice is only offered for single-blank questions.
export function choicesFor(item, bank) {
  if (!mcEligible(item)) return null;
  if (item.choices) return shuffle(item.choices);
  const answer = item.answers[0];
  if (item.kind === 'channel') {
    const others = [...new Set(bank.filter((o) => o.kind === 'channel').map((o) => o.answers[0]))].filter((c) => c !== answer);
    return others.length < 2 ? null : shuffle([answer, ...shuffle(others).slice(0, 3)]);
  }
  const kind = kindOf(answer);
  if (kind === 'side') return shuffle(['left', 'right']);
  const pool = new Set();
  for (const other of bank.filter((o) => !o.kind && !o.curated)) {
    for (const a of other.answers) if (kindOf(a) === kind && a !== answer) pool.add(a);
  }
  if (pool.size < 2) return null;
  return shuffle([answer, ...shuffle([...pool]).slice(0, 3)]);
}

// Every distinct chair-fly leg. `fromPicks`/`toPicks` are the runway, area or entry choices.
export function chairFlyLegs() {
  const seen = new Map();
  for (const { leg, fromChoices, toChoices } of expandLegs(GRAPH)) {
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










