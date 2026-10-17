import { describe, expect, it } from 'vitest';
import { GRAPH } from '../routePlanner.js';
import { buildBank, chairFlyLegs, choicesFor } from './bank.js';

describe('quiz bank', () => {
  const bank = buildBank();

  it('only quizzes sourced content and always blanks something', () => {
    expect(bank.length).toBeGreaterThan(100);
    for (const item of bank) {
      if (!item.kind && !item.curated) expect(item.text).toContain('_____');
      expect(item.answers.length).toBeGreaterThan(0);
    }
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

  it('offers chair-fly legs with cards', () => {
    const legs = chairFlyLegs();
    expect(legs.length).toBeGreaterThan(0);
    expect(legs.every((leg) => leg.cards.length > 0)).toBe(true);
  });
});


