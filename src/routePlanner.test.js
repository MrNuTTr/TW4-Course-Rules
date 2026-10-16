import { describe, expect, it } from 'vitest';
import { DEMO_STOPS, STOP_CATEGORIES } from './demoData.js';
import {
  buildPlannedRoute,
  getCompatibleSecondStops,
  getStopsByCategory,
  KINGS4_HIGH_AREAS,
} from './routePlanner.js';

describe('prototype route builder', () => {
  it('offers KINGS 4 high areas and defaults the test to Area 3', () => {
    expect(KINGS4_HIGH_AREAS.map(({ id }) => id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
    expect(
      KINGS4_HIGH_AREAS.find((area) => area.id === '3').label,
    ).toBe('Area 3 High');
  });

  it('offers the selected stop category for the required first stop', () => {
    expect(getStopsByCategory(STOP_CATEGORIES.WORK_AREA).map(({ id }) => id)).toEqual([
      'kings-4',
      'mustang',
      'waldron',
    ]);
    expect(getStopsByCategory(STOP_CATEGORIES.OLF).map(({ id }) => id)).toEqual([
      'goliad-nolf',
      'chase-nolf',
    ]);
  });

  it('filters the optional stop to the opposite category', () => {
    const afterKings4 = getCompatibleSecondStops('kings-4');
    expect(afterKings4.every((stop) => stop.category === STOP_CATEGORIES.OLF)).toBe(true);
    expect(afterKings4.some((stop) => stop.id === 'waldron')).toBe(false);

    const afterGoliad = getCompatibleSecondStops('goliad-nolf');
    expect(afterGoliad.every((stop) => stop.category === STOP_CATEGORIES.WORK_AREA)).toBe(true);
  });

  it('generates the arrival from whichever stop ends the selected sequence', () => {
    const route = buildPlannedRoute({
      runway: '13L',
      firstStopId: 'kings-4',
      secondStopId: 'goliad-nolf',
    });

    expect(route.title).toBe(
      'KNGP → KINGS 4 Area 3 High → Goliad NOLF → KNGP',
    );
    expect(route.steps.at(-1).title).toBe('Return to KNGP from Goliad NOLF');
  });

  it('loads the JSON card data only for the 13L, KINGS 4 Area 3 High, Goliad test case', () => {
    const route = buildPlannedRoute({
      runway: '13L',
      firstStopId: 'kings-4',
      secondStopId: 'goliad-nolf',
      kings4Area: '3',
    });

    expect(route.sourceBackedTestCase).toBe(true);
    expect(route.title).toBe(
      'KNGP → KINGS 4 Area 3 High → Goliad NOLF → KNGP',
    );
    expect(route.steps).toHaveLength(4);
    expect(route.steps.every((step) => step.events?.length > 0)).toBe(true);
    expect(route.steps.every((step) => !Object.hasOwn(step, 'briefing'))).toBe(true);
    expect(
      route.steps.every((step) =>
        step.events.every(
          (event) =>
            event.source &&
            (event.prompt ||
              event.instructions?.length > 0 ||
              event.radio?.script),
        ),
      ),
    ).toBe(true);
    expect(
      route.steps
        .flatMap((step) => step.events)
        .filter((event) => event.type === 'radio' || event.radio)
        .every((event) => event.radio?.channel),
    ).toBe(true);
    expect(
      route.steps.find((step) => step.id === 'departure').events.map(
        ({ type }) => type,
      ),
    ).toEqual([
      'radio',
      'action',
      'action',
      'action',
      'radio',
      'action',
    ]);
    const departureEvents = route.steps.find(
      (step) => step.id === 'departure',
    ).events;
    expect(departureEvents[1].instructions).toEqual([
      'Climb to 500 ft MSL; begin turn at 300 ft (200 KIAS)',
      'When directed by Tower, check in with Corpus Departure',
    ]);
    expect(departureEvents[1].radio).toEqual({
      channel: 'UHF CH 12',
      script:
        '“Corpus Departure, <callsign>, 500 feet off Navy Corpus, KINGS 4.”',
    });
    expect(departureEvents[3].title).toBe('Abeam the High Bridge');
    expect(departureEvents[2].instructions[0]).toContain('125°');
    expect(departureEvents[3].instructions).toEqual([
      'Turn direct to Point Rusty',
      'Climb to 2,500 ft MSL — 240 KIAS (climb at 180)',
    ]);
    expect(departureEvents[4].leadIn).toMatch(/when instructed/i);
    expect(departureEvents[4].source).toContain('Rusty Departure');
    expect(
      route.steps.find((step) => step.id === 'kings-4').events[3].instructions[2],
    ).toContain('15,000–22,000 ft MSL');
    expect(
      route.steps.find((step) => step.id === 'goliad-nolf').events[0].radio.script,
    ).toContain('Terminate Goliad');
    expect(
      route.steps.find((step) => step.id === 'goliad-nolf').events.map(
        ({ type }) => type,
      ),
    ).toEqual([
      'radio',
      'radio',
      'action',
      'action',
      'action',
      'radio',
      'action',
    ]);
    expect(route.steps.at(-1).events.at(-1).prompt).toContain(
      'the KNGP arrival flow and recovery runway are not selected',
    );
  });

  it('does not reuse the test-case briefing for an unreviewed route variant', () => {
    const route = buildPlannedRoute({
      runway: '31R',
      firstStopId: 'kings-4',
      secondStopId: 'goliad-nolf',
      kings4Area: '3',
    });

    expect(route.sourceBackedTestCase).toBe(false);
    expect(route.steps.every((step) => !step.events)).toBe(true);
  });

  it('returns to KNGP directly when there is no optional second stop', () => {
    const route = buildPlannedRoute({ runway: '31R', firstStopId: 'goliad-nolf' });

    expect(route.title).toBe('KNGP → Goliad NOLF → KNGP');
    expect(route.steps.at(-1).title).toBe('Return to KNGP from Goliad NOLF');
  });

  it('rejects a second stop of the same category', () => {
    expect(() =>
      buildPlannedRoute({
        runway: '13L',
        firstStopId: 'kings-4',
        secondStopId: 'waldron',
      }),
    ).toThrow('The selected second stop is not compatible with the first stop.');
  });

  it('does not silently accept an unknown stop', () => {
    expect(() => getCompatibleSecondStops('unknown-stop')).toThrow('Unknown first stop');
    expect(DEMO_STOPS).toHaveLength(5);
  });

  it('rejects a KINGS 4 area outside the supported choices', () => {
    expect(() =>
      buildPlannedRoute({
        runway: '13L',
        firstStopId: 'kings-4',
        kings4Area: '10',
      }),
    ).toThrow('Unknown KINGS 4 high area');
  });
});
