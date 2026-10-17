import { GRAPH, expandLegs, getNode } from '../routePlanner.js';

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

function addCard(items, seen, topic, group, card) {
  if (!card.source) return;
  addRecall(items, seen, topic, group, card);
  for (const line of cardLines(card)) {
    const q = lineQuestions(line);
    if (!q) continue;
    const key = `${topic}|${q.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: `${topic}/${items.length}`,
      topic,
      group,
      context: card.title,
      text: q.text,
      answers: q.answers,
    });
  }
}

// Non-numeric questions: which frequency, what to do, and what comes next.
function addRecall(items, seen, topic, group, card) {
  const push = (kind, text, answers, extra = {}) => {
    const key = `${kind}|${topic}|${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ id: `${topic}/${items.length}`, kind, topic, group, context: card.title, text, answers, ...extra });
  };
  if (card.radio?.channel) {
    push('channel', `Which frequency do you use for “${card.title}”?`, [card.radio.channel]);
  }
  const steps = (card.instructions ?? []).filter((line) => !/check with an instructor/i.test(line));
  if (card.type !== 'radio' && steps.length) {
    push('recall', `What do you do at “${card.title}”?`, steps);
  }
}

function addSequence(items, seen, topic, cards) {
  const titled = cards.filter((card) => card.source && card.title);
  const pairs = new Map();
  for (let i = 0; i < titled.length - 1; i += 1) {
    const set = pairs.get(titled[i].title) ?? new Set();
    set.add(titled[i + 1].title);
    pairs.set(titled[i].title, set);
  }
  for (let i = 0; i < titled.length - 1; i += 1) {
    const { title } = titled[i];
    const nextTitle = titled[i + 1].title;
    const key = `next|${topic}|${title}`;
    if (seen.has(key) || pairs.get(title).size !== 1 || title === nextTitle) continue;
    seen.add(key);
    items.push({
      id: `${topic}/${items.length}`,
      kind: 'next',
      topic,
      group: 'Routes',
      context: 'Sequence',
      text: `What comes right after “${title}”?`,
      answers: [nextTitle],
      distractors: [...new Set(titled.map((card) => card.title))].filter((t) => t !== nextTitle && t !== title),
    });
  }
}

export const mcEligible = (item) =>
  item.kind === 'channel' || item.kind === 'next' || (!item.kind && item.answers.length === 1);

export function buildBank() {
  const items = [];
  const seen = new Set();
  for (const node of GRAPH.nodes.values()) {
    for (const card of node.info ?? []) addCard(items, seen, node.name, 'Reference', card);
  }
  for (const { leg } of expandLegs(GRAPH)) {
    if (getNode(leg.from).hidden || getNode(leg.to).hidden) continue;
    const topic = `${getNode(leg.from).name} → ${getNode(leg.to).name}`;
    for (const card of leg.cards) addCard(items, seen, topic, 'Routes', card);
    addSequence(items, seen, topic, leg.cards);
  }
  return items;
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
  const answer = item.answers[0];
  if (item.kind === 'next') {
    const options = shuffle(item.distractors).slice(0, 3);
    return options.length < 2 ? null : shuffle([answer, ...options]);
  }
  if (item.kind === 'channel') {
    const others = [...new Set(bank.filter((o) => o.kind === 'channel').map((o) => o.answers[0]))].filter((c) => c !== answer);
    return others.length < 2 ? null : shuffle([answer, ...shuffle(others).slice(0, 3)]);
  }
  const kind = kindOf(answer);
  if (kind === 'side') return shuffle(['left', 'right']);
  const pool = new Set();
  for (const other of bank.filter((o) => !o.kind)) {
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




