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

function snippet(line, term) {
  const at = line.toLowerCase().indexOf(term);
  if (at < 0 || line.length <= 110) return line;
  const start = Math.max(0, at - 40);
  return `${start > 0 ? '…' : ''}${line.slice(start, start + 110)}…`;
}

// Every word must match, in the title or in any line of the page. Title matches rank first.
export function searchWiki(query, records = buildIndex()) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return records
    .map((page) => {
      const title = `${page.trail.join(' ')} ${page.title}`.toLowerCase();
      const lower = page.lines.map((line) => line.toLowerCase());
      const matched = terms.every((t) => title.includes(t) || lower.some((line) => line.includes(t)));
      if (!matched) return null;
      const titleHits = terms.filter((t) => title.includes(t)).length;
      const lineIndex = lower.findIndex((line) => terms.some((t) => line.includes(t)));
      const term = terms.find((t) => lineIndex >= 0 && lower[lineIndex].includes(t));
      return {
        page,
        score: titleHits * 100 + lower.filter((line) => terms.some((t) => line.includes(t))).length,
        snippet: lineIndex >= 0 ? snippet(page.lines[lineIndex], term) : '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}
