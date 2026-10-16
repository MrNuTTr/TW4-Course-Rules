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

  it('loads source-cited briefing data for the 13L, KINGS 4 Area 3 High, Goliad test case', () => {
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
    expect(route.steps.every((step) => step.briefing?.sources.length > 0)).toBe(true);
    expect(
      route.steps.find((step) => step.id === 'kings-4').briefing.headingAltitude[0],
    ).toContain('15,000–22,000 feet MSL');
    expect(
      route.steps.find((step) => step.id === 'goliad-nolf').briefing.radioCalls[0]
        .script,
    ).toContain('Terminate Goliad');
    expect(route.steps.at(-1).briefing.whatHappens.join(' ')).toContain(
      'runway was not specified',
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
    expect(route.steps.every((step) => !step.briefing)).toBe(true);
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
