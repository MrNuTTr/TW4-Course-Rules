import { describe, expect, it } from 'vitest';
import { GRAPH, getNode } from '../routePlanner.js';
import { findWikiPage, flattenWiki } from '../wiki/structure.js';
import { parseFocus } from '../wiki/focus.js';
import { resolveRoute } from '../wiki/routes.js';
import { buildBank, chairFlyLegs, choicesFor } from './bank.js';
import { CURATED } from './curated.js';
import { EXPLANATIONS, explanationKey } from './explanations.js';
import { answerCoverage } from './locate.js';
import { SOURCE_HINTS, hintFor } from './sources.js';

describe('quiz bank', () => {
  const bank = buildBank();

  it('only quizzes sourced content and always blanks something', () => {
    expect(bank.length).toBeGreaterThan(100);
    for (const item of bank) {
      if (!item.kind && !item.curated) expect(item.text).toContain('_____');
      expect(item.answers.length).toBeGreaterThan(0);
    }
  });

  it('does not expand compound source lines into a large batch of generated questions', () => {
    expect(bank.length).toBeLessThan(300);
  });

  it('includes the correct answer among multiple-choice options', () => {
    for (const item of bank) {
      const choices = choicesFor(item, bank);
      if (choices) {
        expect(choices).toContain(item.answers[0]);
        expect(new Set(choices).size).toBe(choices.length);
      }
    }
  });

  it('files every curated question under an existing topic', () => {
    const topics = new Set([...chairFlyLegs().map((l) => `${l.fromNode} → ${l.toNode}`), ...GRAPH.nodes.values().map((n) => n.name)]);
    for (const item of bank.filter((i) => i.curated)) {
      expect(topics.has(item.topic), item.topic).toBe(true);
      expect(item.choices).toContain(item.answers[0]);
      expect(new Set(item.choices).size).toBe(item.choices.length);
    }
  });

  it('links every question to the wiki card that holds its answer', () => {
    const paths = new Set(flattenWiki().map((p) => p.path));
    for (const item of bank) {
      expect(item.wiki, item.text).toBeTruthy();
      expect(paths.has(item.wiki.path), item.wiki.path).toBe(true);
      const page = findWikiPage(item.wiki.path);
      const focus = parseFocus(`?${item.wiki.query}`);
      const card =
        focus.info !== undefined
          ? getNode(page.node).info[focus.info]
          : resolveRoute(page.routes[focus.route], focus.picks).leg?.cards[focus.card];
      expect(card?.title, item.text).toBe(item.wiki.cardTitle);
      // Generated answers are copied from the card; hand-written ones may paraphrase it.
      expect(answerCoverage(item.answers[0], card).hit, item.text).toBeGreaterThanOrEqual(item.curated ? 0.5 : 1);
    }
  });

  it('keeps every source hint attached to a question', () => {
    for (const hint of SOURCE_HINTS) expect(CURATED.some((item) => hintFor(item) === hint), hint.q).toBe(true);
  });

  it('keeps every explanation attached to a current question', () => {
    const keys = new Set(bank.map(explanationKey));
    for (const key of Object.keys(EXPLANATIONS)) expect(keys.has(key), key).toBe(true);
    for (const why of Object.values(EXPLANATIONS)) {
      expect(why.length).toBeGreaterThan(10);
      expect(why.length).toBeLessThanOrEqual(320);
    }
  });

  it('offers chair-fly legs with cards', () => {
    const legs = chairFlyLegs();
    expect(legs.length).toBeGreaterThan(0);
    expect(legs.every((leg) => leg.cards.length > 0)).toBe(true);
  });
});

