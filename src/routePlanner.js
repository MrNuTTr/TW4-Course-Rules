import {
  DEMO_STOPS,
  STOP_CATEGORIES,
  STOP_CATEGORY_LABELS,
} from './demoData.js';
import {
  KINGS4_HIGH_AREAS,
  TEST_ROUTE_BRIEFING,
  TEST_ROUTE_SCOPE,
} from './testRouteData.js';

export { KINGS4_HIGH_AREAS };

export function getStopsByCategory(category) {
  return DEMO_STOPS.filter((stop) => stop.category === category);
}

export function getCompatibleSecondStops(firstStopId) {
  const firstStop = DEMO_STOPS.find((stop) => stop.id === firstStopId);
  if (!firstStop) {
    throw new Error(`Unknown first stop: ${firstStopId}`);
  }

  const otherCategory =
    firstStop.category === STOP_CATEGORIES.WORK_AREA
      ? STOP_CATEGORIES.OLF
      : STOP_CATEGORIES.WORK_AREA;

  return DEMO_STOPS.filter((stop) => stop.category === otherCategory);
}

export function buildPlannedRoute({
  runway,
  firstStopId,
  secondStopId = '',
  kings4Area = '3',
}) {
  if (!runway) {
    throw new Error('Select a departure runway.');
  }

  const firstStop = DEMO_STOPS.find((stop) => stop.id === firstStopId);
  if (!firstStop) {
    throw new Error(`Unknown first stop: ${firstStopId}`);
  }

  const compatibleStops = getCompatibleSecondStops(firstStopId);
  const secondStop = secondStopId
    ? compatibleStops.find((stop) => stop.id === secondStopId)
    : undefined;
  if (secondStopId && !secondStop) {
    throw new Error('The selected second stop is not compatible with the first stop.');
  }
  if (!KINGS4_HIGH_AREAS.some((area) => area.id === kings4Area)) {
    throw new Error(`Unknown KINGS 4 high area: ${kings4Area}`);
  }

  const stops = secondStop ? [firstStop, secondStop] : [firstStop];
  const routeIncludesKings4 = stops.some((stop) => stop.id === 'kings-4');
  const sourceBackedTestCase =
    runway === '13L' &&
    firstStop.id === 'kings-4' &&
    secondStop?.id === 'goliad-nolf' &&
    kings4Area === '3';
  const routeNames = [
    'KNGP',
    ...stops.map((stop) =>
      stop.id === 'kings-4'
        ? `KINGS 4 Area ${kings4Area} High`
        : stop.name,
    ),
    'KNGP',
  ];
  const steps = [
    {
      id: 'departure',
      kind: 'departure',
      title: `Depart KNGP — Runway ${runway}`,
      location: 'KNGP',
      detail: sourceBackedTestCase
        ? 'Draft source extract: KNGP RUSTY Departure to the selected KINGS 4 test area.'
        : `Illustrative departure using runway ${runway}. No departure procedure is included.`,
    },
    ...stops.map((stop, index) => ({
      id: stop.id,
      kind: stop.category,
      title:
        stop.id === 'kings-4'
          ? `Work KINGS 4 — Area ${kings4Area} High`
          : `Proceed to ${stop.name}`,
      location:
        stop.id === 'kings-4'
          ? `Area ${kings4Area} High`
          : stop.name,
      detail: sourceBackedTestCase
        ? stop.id === 'kings-4'
          ? `Source-derived example for KINGS 4 Area ${kings4Area} High.`
          : 'Source-derived example for NOLF Goliad (KNGT).'
        : `Illustrative ${STOP_CATEGORY_LABELS[stop.category].toLowerCase()} stop in the selected sequence.`,
      sequence: index + 1,
    })),
    {
      id: 'arrival',
      kind: 'arrival',
      title: `Return to KNGP from ${stops.at(-1).name}`,
      location: 'KNGP',
      detail: sourceBackedTestCase
        ? 'Draft source extract: Goliad arrival toward Point Shamrock. KNGP runway/flow recovery is not selected.'
        : 'Arrival is generated from the final selected stop. The applicable procedure is not included.',
    },
  ];

  if (sourceBackedTestCase) {
    steps[0].briefing = TEST_ROUTE_BRIEFING.departure;
    steps.find((step) => step.id === 'kings-4').briefing =
      TEST_ROUTE_BRIEFING['kings-4']({ area: kings4Area });
    steps.find((step) => step.id === 'goliad-nolf').briefing =
      TEST_ROUTE_BRIEFING['goliad-nolf'];
    steps.at(-1).briefing = TEST_ROUTE_BRIEFING.arrival;
  }

  return {
    title: routeNames.join(' → '),
    runway,
    arrivalFrom: stops.at(-1).name,
    kings4Area: routeIncludesKings4 ? kings4Area : undefined,
    sourceBackedTestCase,
    scope: sourceBackedTestCase ? TEST_ROUTE_SCOPE : undefined,
    steps,
  };
}
