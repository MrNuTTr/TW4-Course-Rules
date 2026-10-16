// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getCourseRulesMapFeatures } from './courseRulesMap.js';
import { GRAPH, buildGraph, expandLegs, findLeg, getDestinations, getOriginInputs, resolveLeg } from './routePlanner.js';

describe('course rules graph data', () => {
  it('has every leg endpoint defined as a node', () => {
    for (const leg of GRAPH.legs) {
      expect(GRAPH.nodes.has(leg.from)).toBe(true);
      expect(GRAPH.nodes.has(leg.to)).toBe(true);
    }
  });

  it('rejects dangling leg references', () => {
    expect(() =>
      buildGraph([{ id: 'a' }], [{ id: 'x', from: 'a', to: 'missing', cards: [] }]),
    ).toThrow('unknown node');
  });

  it('resolves every KML feature id used by legs and cards', () => {
    const legs = expandLegs(GRAPH).map(({ leg }) => leg);
    expect(legs.length).toBeGreaterThan(0);
    for (const leg of legs) {
      expect(() => getCourseRulesMapFeatures(leg.featureIds)).not.toThrow();
      expect(() => getCourseRulesMapFeatures(leg.arrivalFeatureIds)).not.toThrow();
      for (const card of leg.cards) {
        for (const id of [card.mapFocus ?? []].flat()) expect(leg.featureIds).toContain(id);
      }
      expect(JSON.stringify(leg)).not.toMatch(/\{(from|to)\./);
    }
  });

  it('throws on a missing token detail', () => {
    const result = () => resolveLeg({ id: 'x', from: 'goliad', to: 'goliad', title: '{to.runway.nope}' }, {}, { runway: '17' });
    expect(result).toThrow();
  });

  it('gives every card a source and every radio card a channel', () => {
    const legCards = expandLegs(GRAPH).flatMap(({ leg }) => leg.cards);
    const nodeCards = [...GRAPH.nodes.values()].flatMap((node) => node.info ?? []);
    for (const card of [...legCards, ...nodeCards]) {
      expect(card.source).toMatch(/^(Binder, pp?\.|Feb 2026 PPT, Part \d, slides? )/);
      if (card.radio) expect(card.radio.channel).toBeTruthy();
    }
  });
});

describe('leg planning', () => {
  it('offers only loaded runways at KNGP', () => {
    const [runway] = getOriginInputs('kngp');
    expect(runway.options).toEqual(['13L']);
  });

  it('offers KINGS 4 from KNGP 13L with only loaded areas', () => {
    const destinations = getDestinations('kngp', { runway: '13L' });
    expect(destinations.map(({ node }) => node.id)).toEqual(['kings4']);
    expect(destinations[0].inputs[0].options).toEqual(['3']);
    expect(getDestinations('kngp', { runway: '31R' })).toEqual([]);
  });

  it('finds the KNGP to KINGS 4 leg with 5,500 ft up to Rusty then 14,500 at Rusty', () => {
    const leg = findLeg('kngp', { runway: '13L' }, 'kings4', { area: '3' });
    const text = JSON.stringify(leg.cards);
    expect(leg.cards[0].title).toMatch(/ZOMBIE 1/);
    expect(text).toMatch(/5,500/);
    expect(text).toMatch(/14,500/);
    expect(text).not.toMatch(/Class D/);
    expect(findLeg('kngp', { runway: '13L' }, 'kings4', { area: '4' })).toBeUndefined();
  });

  it('chains KINGS 4 → Goliad → KNGP and ends there', () => {
    expect(getDestinations('kings4', { area: '3' }).map(({ node }) => node.id)).toEqual([
      'goliad',
    ]);
    const arrival = findLeg('goliad', { runway: '17' }, 'kngp', {});
    expect(arrival.cards.at(-1).title).toMatch(/Tower handoff/);
    expect(getDestinations('kngp', {})).toEqual([]);
  });
});
