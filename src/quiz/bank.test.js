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

  it('has hand-written questions with answers and options', () => {
    expect(bank.length).toBeGreaterThan(100);
    for (const item of bank) {
      expect(item.answers.length).toBeGreaterThan(0);
      expect(item.scenario, item.text).toBeTruthy();
    }
  });

  it('includes the correct answer among multiple-choice options', () => {
    for (const item of bank) {
      const choices = choicesFor(item);
      expect(choices).toContain(item.answers[0]);
      expect(new Set(choices).size).toBe(choices.length);
    }
  });

  it('files every question under an existing topic', () => {
    const topics = new Set([...chairFlyLegs().map((l) => `${l.fromNode} → ${l.toNode}`), ...GRAPH.nodes.values().map((n) => n.name)]);
    for (const item of CURATED) expect(topics.has(item.topic), item.topic).toBe(true);
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
      // Answers may paraphrase the card, but most of their numbers and key words must be on it.
      expect(answerCoverage(item.answers[0], card).hit, item.text).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('keeps every source hint attached to a question', () => {
    for (const hint of SOURCE_HINTS) expect(CURATED.some((item) => hintFor(item) === hint), hint.q).toBe(true);
  });

  it('explains every question and keeps every keyed explanation attached to one', () => {
    const keys = new Set(bank.map(explanationKey));
    for (const key of Object.keys(EXPLANATIONS)) expect(keys.has(key), key).toBe(true);
    for (const item of bank) {
      expect(item.why, item.text).toBeTruthy();
      expect(item.why.length).toBeGreaterThan(10);
      expect(item.why.length).toBeLessThanOrEqual(320);
    }
  });

  it('offers chair-fly legs with cards', () => {
    const legs = chairFlyLegs();
    expect(legs.length).toBeGreaterThan(0);
    expect(legs.every((leg) => leg.cards.length > 0)).toBe(true);
  });
});

