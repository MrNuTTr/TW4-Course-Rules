// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { COURSE_RULES_MAP_FEATURES, getCourseRulesMapFeatures } from './courseRulesMap.js';
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

describe('graph integrity (run on every data import)', () => {
  const concrete = expandLegs(GRAPH);

  it('has unique map feature ids across KML and map-extras', () => {
    const ids = COURSE_RULES_MAP_FEATURES.map((feature) => feature.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect([...new Set(duplicates)]).toEqual([]);
  });

  it('defines inputs with unique options and complete per-option details', () => {
    for (const node of GRAPH.nodes.values()) {
      for (const input of node.inputs ?? []) {
        expect(new Set(input.options).size).toBe(input.options.length);
        if (input.details) {
          expect(Object.keys(input.details).sort()).toEqual([...input.options].sort());
        }
      }
    }
  });

  it('only uses `when` values that are real input options', () => {
    for (const leg of GRAPH.legs) {
      for (const side of ['from', 'to']) {
        const node = GRAPH.nodes.get(leg[side]);
        for (const [key, value] of Object.entries(leg.when?.[side] ?? {})) {
          const input = node.inputs?.find((i) => i.id === key);
          expect(input, `${leg.id}: ${side}.${key}`).toBeDefined();
          expect(input.options, `${leg.id}: ${side}.${key}`).toContain(value);
        }
      }
    }
  });

  it('resolves exactly one leg for every concrete from/to choice', () => {
    for (const { leg, fromChoices, toChoices } of concrete) {
      const found = findLeg(leg.from, fromChoices, leg.to, toChoices);
      expect(found.id).toBe(leg.id);
    }
  });

  it('never strands a route: every destination ends the route or continues', () => {
    for (const { leg, toChoices } of concrete) {
      const node = GRAPH.nodes.get(leg.to);
      if (node.endsRoute) continue;
      expect(getDestinations(leg.to, toChoices).length, `${leg.id} -> ${leg.to}`).toBeGreaterThan(0);
    }
  });

  it('keeps arrival info-card map focus inside the arrival features', () => {
    for (const { leg } of concrete) {
      for (const card of GRAPH.nodes.get(leg.to).info ?? []) {
        for (const id of [card.mapFocus ?? []].flat()) {
          expect(leg.arrivalFeatureIds, `${leg.id}: ${card.title}`).toContain(id);
        }
      }
    }
  });

  it('uses well-formed cards', () => {
    const nodeCards = [...GRAPH.nodes.values()].flatMap((node) => node.info ?? []);
    const legCards = concrete.flatMap(({ leg }) => leg.cards);
    for (const card of [...legCards, ...nodeCards]) {
      expect(['radio', 'action', 'checkpoint']).toContain(card.type);
      expect(card.title?.trim()).toBeTruthy();
      const lines = card.instructions ?? [];
      expect(new Set(lines).size).toBe(lines.length);
      if (card.radio) {
        const { script, exchange } = card.radio;
        expect(Boolean(script) && Boolean(exchange)).toBe(false);
        for (const line of exchange ?? []) {
          expect(line.speaker && line.text).toBeTruthy();
        }
      }
    }
  });
});

describe('leg planning', () => {
  it('offers only loaded runways at KNGP', () => {
    const [runway] = getOriginInputs('kngp');
    expect(runway.options).toEqual(['13L', '13R', '18', '04', '31L', '31R', '36']);
  });

  it('offers KINGS 4 and Goliad from KNGP, with all high and low areas', () => {
    const destinations = getDestinations('kngp', { runway: '13L' });
    expect(destinations.map(({ node }) => node.id).sort()).toEqual(['acounty', 'foxtrot', 'goliad', 'ingleside', 'kings4', 'mustang', 'waldron']);
    const kings4 = destinations.find(({ node }) => node.id === 'kings4');
    expect(kings4.inputs[0].options).toContain('3 High');
    expect(kings4.inputs[0].options).toContain('9 Low');
    expect(kings4.inputs[0].options).not.toContain('5 Low');
  });

  it('finds the KNGP to KINGS 4 leg with 5,500 ft up to Rusty then 14,500 at Rusty', () => {
    const leg = findLeg('kngp', { runway: '13L' }, 'kings4', { area: '3 High' });
    const text = JSON.stringify(leg.cards);
    expect(leg.cards[0].title).toMatch(/ZOMBIE 1/);
    expect(text).toMatch(/5,500/);
    expect(text).toMatch(/14,500/);
    expect(text).not.toMatch(/Class D/);
  });

  it('uses south-flow ground comms for 13L and north-flow for 31L', () => {
    const south = JSON.stringify(findLeg('kngp', { runway: '13L' }, 'kings4', { area: '3 High' }).cards);
    const north = JSON.stringify(findLeg('kngp', { runway: '31L' }, 'kings4', { area: '3 High' }).cards);
    expect(south).toMatch(/Sierra run-up/);
    expect(north).toMatch(/holding short Compass Rose/);
  });

  it('expands nested parts and tokens, and rejects unknown parts', () => {
    const leg = findLeg('kngp', { runway: '13L' }, 'kings4', { area: '3 High' });
    expect(leg.cards.map((card) => card.title)).toContain('Claim Area 3 High');
    expect(JSON.stringify(leg.cards)).toMatch(/VFR KINGS 4/);
    expect(JSON.stringify(leg.cards)).toMatch(/taxi to Runway 13L/);
    expect(() =>
      resolveLeg({ id: 'x', from: 'kngp', to: 'kings4', cards: [{ use: 'nope' }] }),
    ).toThrow('unknown part');
  });

  it('uses every part from at least one leg, including nested parts', () => {
    const used = new Set();
    const visit = (ref) => {
      const pattern = new RegExp(`^${ref.replace(/\{[^}]+\}/g, '.+')}$`);
      for (const [id, part] of GRAPH.parts) {
        if (!pattern.test(id) || used.has(id)) continue;
        used.add(id);
        for (const card of part.cards) if (card.use) visit(card.use);
      }
    };
    for (const leg of GRAPH.legs) {
      for (const card of leg.cards) if (card.use) visit(card.use);
    }
    expect([...GRAPH.parts.keys()].filter((id) => !used.has(id))).toEqual([]);
  });

  it('builds Beach Line departures to north, south and Central Mustang', () => {
    const north = findLeg('kngp', { runway: '31L' }, 'mustang', { area: 'Area 5' });
    const south = findLeg('kngp', { runway: '13L' }, 'mustang', { area: 'Area 3' });
    const central = findLeg('kngp', { runway: '13R' }, 'mustang', { area: 'Central' });
    const text = (leg) => JSON.stringify(leg.cards);
    expect(text(north)).toMatch(/abeam Mustang Beach/);
    expect(text(north)).toMatch(/extreme caution|Use extreme caution/);
    expect(text(south)).toMatch(/abeam Padre Balli Park/);
    expect(text(south)).toMatch(/Southern Arrival/);
    expect(text(central)).toMatch(/99 Central/);
    expect(text(central)).toMatch(/270°/);
    for (const leg of [north, south, central]) {
      expect(text(leg)).toMatch(/UHF CH 8/);
      expect(text(leg)).not.toMatch(/\{[a-z]+\./);
    }
  });

  it('builds Beach Line departures to Foxtrot with block claims on CH 22', () => {
    const leg = findLeg('kngp', { runway: '04' }, 'foxtrot', { area: 'Fox 2', block: 'Middle' });
    const text = JSON.stringify(leg.cards);
    expect(leg.cards[0].title).toBeTruthy();
    expect(text).toMatch(/Proceed course rules Foxtrot/);
    expect(text).toMatch(/99 Fox, anybody working Fox 2 Middle/);
    expect(text).toMatch(/99 Fox, <callsign> claims Fox 2 Middle/);
    expect(text).toMatch(/7,000–11,999/);
    expect(text).not.toMatch(/\{[a-z]+\./);
  });

  it('chains KINGS 4 → Goliad → KNGP and ends there', () => {
    expect(getDestinations('kings4', { area: '3 High' }).map(({ node }) => node.id)).toEqual([
      'acounty',
      'goliad',
    ]);
    const south = findLeg('goliad', { runway: '17' }, 'kngp', { runway: '13L', entry: 'Standard entry' });
    expect(south.cards.at(-1).title).toMatch(/Numbers call/);
    expect(JSON.stringify(south.cards)).toMatch(/crossing the extended centerline of Runway 18/);
    expect(JSON.stringify(south.cards)).not.toMatch(/9 Mile/);
    const north = findLeg('goliad', { runway: '17' }, 'kngp', { runway: '04', entry: 'Standard entry' });
    expect(JSON.stringify(north.cards)).toMatch(/Point Dimmit/);
    const straightSouth = findLeg('goliad', { runway: '17' }, 'kngp', { runway: '13L', entry: 'Straight-in' });
    expect(JSON.stringify(straightSouth.cards)).toMatch(/left base gear down/);
    const straightNorth = findLeg('goliad', { runway: '17' }, 'kngp', { runway: '36', entry: 'Straight-in' });
    expect(JSON.stringify(straightNorth.cards)).toMatch(/right base gear down/);
    expect(getOriginInputs('kngp').map((input) => input.id)).toEqual(['runway']);
    expect(GRAPH.nodes.get('kngp').endsRoute).toBe(true);
  });

  it('plans outlying field arrivals and returns to KNGP', () => {
    const rkp = findLeg('kngp', { runway: '13L' }, 'acounty', { runway: '32' });
    expect(JSON.stringify(rkp.cards)).toMatch(/Downtown Rockport/);
    expect(JSON.stringify(rkp.cards)).toMatch(/course rules Aransas County/);
    const viaGoliad = findLeg('goliad', { runway: '17' }, 'acounty', { runway: '14' });
    expect(JSON.stringify(viaGoliad.cards)).toMatch(/Copano Bay/);
    const rkpHome = findLeg('acounty', { runway: '36' }, 'kngp', { runway: '13L', entry: 'Standard entry' });
    expect(JSON.stringify(rkpHome.cards)).toMatch(/LBJ Causeway/);
    expect(JSON.stringify(rkpHome.cards)).toMatch(/Shamrock, terminate/);
    const nwl = findLeg('kngp', { runway: '31L' }, 'waldron', { runway: '36' });
    expect(JSON.stringify(nwl.cards)).toMatch(/west of the Power Plant/);
    const nwlHome = findLeg('waldron', { runway: '13' }, 'kngp', { runway: '04', entry: 'Straight-in' });
    expect(JSON.stringify(nwlHome.cards)).toMatch(/Southern Arrival/);
    expect(getDestinations('ingleside', { runway: '13' }).map(({ node }) => node.id)).toEqual(['kngp']);
    for (const dest of [rkp, nwl]) expect(JSON.stringify(dest.cards)).not.toMatch(/ZOMBIE/);
    expect(JSON.stringify(rkp.cards)).toMatch(/Boomer\/Ranger Base/);
    for (const leg of [rkp, viaGoliad, rkpHome, nwl, nwlHome]) {
      expect(JSON.stringify(leg.cards)).not.toMatch(/\{[a-z]+\./);
    }
  });
});
