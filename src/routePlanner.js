import {
  DEMO_STOPS,
  STOP_CATEGORIES,
  STOP_CATEGORY_LABELS,
} from './demoData.js';

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

export function buildPlannedRoute({ runway, firstStopId, secondStopId = '' }) {
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

  const stops = secondStop ? [firstStop, secondStop] : [firstStop];
  const routeNames = ['KNGP', ...stops.map((stop) => stop.name), 'KNGP'];
  const steps = [
    {
      id: 'departure',
      kind: 'departure',
      title: `Depart KNGP — Runway ${runway}`,
      location: 'KNGP',
      detail: `Illustrative departure using runway ${runway}. No departure procedure is included.`,
    },
    ...stops.map((stop, index) => ({
      id: stop.id,
      kind: stop.category,
      title: `Proceed to ${stop.name}`,
      location: stop.name,
      detail: `Illustrative ${STOP_CATEGORY_LABELS[stop.category].toLowerCase()} stop in the selected sequence.`,
      sequence: index + 1,
    })),
    {
      id: 'arrival',
      kind: 'arrival',
      title: `Return to KNGP from ${stops.at(-1).name}`,
      location: 'KNGP',
      detail: 'Arrival is generated from the final selected stop. The applicable procedure is not included.',
    },
  ];

  return {
    title: routeNames.join(' → '),
    runway,
    arrivalFrom: stops.at(-1).name,
    steps,
  };
}
