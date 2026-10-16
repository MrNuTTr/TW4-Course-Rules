import { describe, expect, it } from 'vitest';
import { DEMO_STOPS, STOP_CATEGORIES } from './demoData.js';
import {
  buildPlannedRoute,
  getCompatibleSecondStops,
  getStopsByCategory,
} from './routePlanner.js';

describe('prototype route builder', () => {
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

    expect(route.title).toBe('KNGP → Kings 4 → Goliad NOLF → KNGP');
    expect(route.steps.at(-1).title).toBe('Return to KNGP from Goliad NOLF');
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
});
