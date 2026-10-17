import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  describeChoices,
  findLeg,
  getDestinations,
  getNode,
  getOriginInputs,
  optionLabel,
} from './routePlanner.js';
import CardView from './components/CardView.jsx';
import ReportLink from './components/ReportLink.jsx';
import { clearSaved, loadSaved, save } from './storage.js';
const RouteMap = lazy(() => import('./RouteMap.jsx'));

const START_NODE_ID = 'kngp';
const SAVE_KEY = 'chairfly';
const SAVE_VERSION = 1;

// Rebuilds the full state from the compact saved form; returns null if the route no longer resolves.
function restoreRoute() {
  const saved = loadSaved(SAVE_KEY, SAVE_VERSION);
  if (!saved) return null;
  try {
    const trail = saved.trail.map(({ from, to }) => {
      const leg = findLeg(from.nodeId, from.choices, to.nodeId, to.choices);
      if (!leg) throw new Error('Leg no longer exists');
      return { leg, from, to };
    });
    let activeLeg = null;
    if (saved.phase === 'leg') {
      const { to, destChoices, atEnd } = saved.activeLeg;
      const leg = findLeg(saved.place.nodeId, saved.place.choices, to, destChoices);
      if (!leg) throw new Error('Leg no longer exists');
      activeLeg = { leg, destChoices, atEnd };
    }
    getNode(saved.place.nodeId);
    return { place: saved.place, trail, phase: saved.phase, activeLeg, cardIndex: saved.cardIndex ?? 0 };
  } catch {
    clearSaved(SAVE_KEY);
    return null;
  }
}

// A node flagged endsRoute finishes the route when you arrive there.
function canContinueFrom(nodeId, choices) {
  return !getNode(nodeId).endsRoute && getDestinations(nodeId, choices).length > 0;
}

function GuideEvent({ event, eventIndex, eventCount, label }) {
  return (
    <article className="guide-event" aria-live="polite">
      <div className="guide-progress">
        <span>{label}</span>
        <span>
          ITEM {eventIndex + 1} OF {eventCount}
        </span>
      </div>
      <CardView event={event} />
      <ReportLink context={`Chair fly: ${label} – ${event.title}`} />
    </article>
  );
}

// Map + one-card-at-a-time stepper, used for both legs and destination info pages.
function CardPlayer({
  cards,
  featureIds,
  defaultFocus,
  label,
  completeLabel,
  onComplete,
  onPreviousFromFirst,
  startAtEnd = false,
  initialIndex = null,
  onIndexChange,
}) {
  const [index, setIndex] = useState(initialIndex ?? (startAtEnd ? cards.length - 1 : 0));
  const card = cards[index];
  const isLast = index === cards.length - 1;

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  return (
    <>
      <div className="map-card map-card-active">
        <Suspense
          fallback={
            <p className="map-unavailable" role="status">
              Loading map…
            </p>
          }
        >
          <RouteMap
            mapData={{ featureIds }}
            focusFeatureId={card.mapFocus ?? defaultFocus}
          />
        </Suspense>
      </div>

      <GuideEvent event={card} eventIndex={index} eventCount={cards.length} label={label} />

      <nav className="guide-controls" aria-label="Card navigation">
        <button
          type="button"
          className="secondary-button"
          disabled={index === 0 && !onPreviousFromFirst}
          onClick={() => (index === 0 ? onPreviousFromFirst() : setIndex(index - 1))}
        >
          Previous
        </button>
        <span className="next-preview">
          {isLast ? '' : `Next: ${cards[index + 1].title}`}
        </span>
        <button
          type="button"
          className="primary-button"
          onClick={() => (isLast ? onComplete() : setIndex(index + 1))}
        >
          {isLast ? completeLabel : 'Next'}
        </button>
      </nav>
    </>
  );
}

function PlanScreen({ place, isStart, onStart }) {
  const originInputs = isStart ? getOriginInputs(place.nodeId) : [];
  const [originChoices, setOriginChoices] = useState(() =>
    Object.fromEntries(
      originInputs.map((input) => [
        input.id,
        place.choices[input.id] ?? input.options[0],
      ]),
    ),
  );
  const fromChoices = isStart ? originChoices : place.choices;
  const destinations = getDestinations(place.nodeId, fromChoices);
  const [destId, setDestId] = useState(() =>
    destinations.length === 1 ? destinations[0].node.id : '',
  );
  const [destChoices, setDestChoices] = useState(() =>
    destinations.length === 1
      ? Object.fromEntries(destinations[0].inputs.map((i) => [i.id, i.options[0]]))
      : {},
  );
  const selected = destinations.find(({ node }) => node.id === destId);
  const categoryOf = (entry) =>
    entry.node.id === 'kngp' ? 'return' : entry.node.kind === 'work-area' ? 'working' : 'outlying';
  const categories = [
    { id: 'outlying', label: 'Outlying Fields' },
    { id: 'working', label: 'Working Areas' },
    { id: 'return', label: 'Return to KNGP' },
  ].filter((c) => destinations.some((entry) => categoryOf(entry) === c.id));
  const [category, setCategory] = useState(() =>
    destinations.length === 1 ? categoryOf(destinations[0]) : '',
  );
  const shownDestinations = destinations.filter((entry) => categoryOf(entry) === category);

  function pickDestination(entry) {
    setDestId(entry.node.id);
    setDestChoices(
      Object.fromEntries(entry.inputs.map((input) => [input.id, input.options[0]])),
    );
  }

  const leg = selected
    ? findLeg(place.nodeId, fromChoices, selected.node.id, destChoices)
    : undefined;

  return (
    <section className="planner-panel" aria-labelledby="plan-heading">
      <div className="section-heading">
        <p className="eyebrow">{isStart ? 'START' : 'NEXT LEG'}</p>
        <h2 id="plan-heading">
          {isStart ? 'Where are you departing?' : `Leaving ${getNode(place.nodeId).name}`}
        </h2>
        {!isStart && <p>Choose where to go next.</p>}
      </div>

      {originInputs.map((input) => (
        <div className="form-field" key={input.id}>
          <label htmlFor={`origin-${input.id}`}>
            {getNode(place.nodeId).name} {input.label.toLowerCase()}
          </label>
          <select
            id={`origin-${input.id}`}
            value={originChoices[input.id]}
            onChange={(event) => {
              setOriginChoices({ ...originChoices, [input.id]: event.target.value });
              setDestId('');
            }}
          >
            {input.options.map((option) => (
              <option key={option} value={option}>
                {optionLabel(input, option)}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="form-field destination-category">
        <label htmlFor="destination-category">Choose a destination</label>
        <select
          id="destination-category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setDestId('');
          }}
        >
          <option value="" disabled>
            Select a type…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="destination-list" role="group" aria-label="Destination">
        {shownDestinations.map((entry) => (
          <button
            type="button"
            key={entry.node.id}
            className={`destination-button${
              destId === entry.node.id ? ' destination-button-selected' : ''
            }`}
            aria-pressed={destId === entry.node.id}
            onClick={() => pickDestination(entry)}
          >
            <strong>{entry.node.name}</strong>
            <span>{entry.node.fullName}</span>
          </button>
        ))}
      </div>

      {selected &&
        selected.inputs
          .filter(
            (input) =>
              input.options.length > 0 &&
              !Object.entries(input.hideWhen ?? {}).some(([key, values]) =>
                [values].flat().includes(destChoices[key]),
              ),
          )
          .map((input) => (
            <div className="form-field" key={input.id}>
              <label htmlFor={`dest-${input.id}`}>
                {selected.node.name} {input.label.toLowerCase()}
              </label>
              <select
                id={`dest-${input.id}`}
                value={destChoices[input.id]}
                onChange={(event) =>
                  setDestChoices({ ...destChoices, [input.id]: event.target.value })
                }
              >
                {input.options.map((option) => (
                  <option key={option} value={option}>
                    {optionLabel(input, option)}
                  </option>
                ))}
              </select>
            </div>
          ))}

      <button
        type="button"
        className="primary-button start-button"
        disabled={!leg}
        onClick={() => onStart({ originChoices: fromChoices, leg, destChoices })}
      >
        {leg ? 'Start leg' : 'Start'}
      </button>
    </section>
  );
}

export default function ChairFly() {
  const [restored] = useState(restoreRoute);
  const [place, setPlace] = useState(restored?.place ?? { nodeId: START_NODE_ID, choices: {} });
  const [trail, setTrail] = useState(restored?.trail ?? []);
  const [phase, setPhase] = useState(restored?.phase ?? 'plan'); // plan | leg | arrived | done
  const [activeLeg, setActiveLeg] = useState(restored?.activeLeg ?? null);
  const [cardIndex, setCardIndex] = useState(restored?.cardIndex ?? 0);
  // Only the first card player after a restore opens mid-way; later ones start fresh.
  const resumeIndex = useRef(restored ? restored.cardIndex : null);
  const trackIndex = useCallback((index) => {
    resumeIndex.current = null;
    setCardIndex(index);
  }, []);

  useEffect(() => {
    if (phase === 'plan' && trail.length === 0) {
      clearSaved(SAVE_KEY);
      return;
    }
    save(SAVE_KEY, SAVE_VERSION, {
      place,
      phase,
      cardIndex,
      trail: trail.map(({ from, to }) => ({ from, to })),
      activeLeg: activeLeg && { to: activeLeg.leg.to, destChoices: activeLeg.destChoices, atEnd: activeLeg.atEnd },
    });
  }, [place, trail, phase, activeLeg, cardIndex]);

  const node = getNode(place.nodeId);
  const isStart = trail.length === 0;

  function goHome() {
    setPlace({ nodeId: START_NODE_ID, choices: {} });
    setTrail([]);
    setActiveLeg(null);
    setPhase('plan');
    window.scrollTo({ top: 0 });
  }

  function goPlan() {
    setActiveLeg(null);
    setPhase('plan');
    window.scrollTo({ top: 0 });
  }

  function goLastLeg() {
    const last = trail.at(-1);
    setTrail(trail.slice(0, -1));
    setPlace(last.from);
    setActiveLeg({ leg: last.leg, destChoices: last.to.choices, atEnd: true });
    setPhase('leg');
    window.scrollTo({ top: 0 });
  }

  function startLeg({ originChoices, leg, destChoices }) {
    if (isStart) setPlace({ nodeId: place.nodeId, choices: originChoices });
    setActiveLeg({ leg, destChoices });
    setPhase('leg');
    window.scrollTo({ top: 0 });
  }

  function finishLeg() {
    const { leg, destChoices } = activeLeg;
    const dest = { nodeId: leg.to, choices: destChoices };
    setTrail([...trail, { leg, from: place, to: dest }]);
    setPlace(dest);
    setActiveLeg(null);
    const destNode = getNode(leg.to);
    const hasNext = canContinueFrom(leg.to, destChoices);
    if (destNode.info?.length) setPhase('arrived');
    else setPhase(hasNext ? 'plan' : 'done');
    window.scrollTo({ top: 0 });
  }

  function finishInfo() {
    setPhase(canContinueFrom(place.nodeId, place.choices) ? 'plan' : 'done');
    window.scrollTo({ top: 0 });
  }

  const routeSummary = [
    describeChoices(getNode(trail[0]?.from.nodeId ?? place.nodeId), trail[0]?.from.choices),
    ...trail.map(({ to }) => describeChoices(getNode(to.nodeId), to.choices)),
  ];
  const legNumber = phase === 'leg' ? trail.length + 1 : trail.length;

  return (
    <main className="app-shell">
      <header className={`site-header${phase !== 'plan' || !isStart ? ' site-header-practice' : ''}`}>
        <div>
          <h1>
            {phase === 'leg'
              ? activeLeg.leg.title
              : phase === 'arrived'
                ? `Arrived · ${describeChoices(node, place.choices)}`
                : phase === 'done'
                  ? 'Route complete'
                  : isStart
                    ? 'Plan your first leg'
                    : 'Plan your next leg'}
          </h1>
        </div>
        {phase === 'plan' && isStart ? null : (
          <div className="header-actions">
            {trail.length > 0 && (
              <button type="button" className="home-button" onClick={goLastLeg}>
                ← Last leg
              </button>
            )}
            <button type="button" className="home-button" onClick={goHome}>
              New route
            </button>
          </div>
        )}
      </header>

      <div className="planner-layout">
        {trail.length > 0 && phase !== 'done' && (
          <p className="route-trail" aria-label="Route so far">
            {routeSummary.join(' → ')}
          </p>
        )}

        {phase === 'plan' && (
          <PlanScreen
            key={`${place.nodeId}-${trail.length}`}
            place={place}
            isStart={isStart}
            onStart={startLeg}
          />
        )}

        {phase === 'leg' && (
          <section className="route-panel" aria-label="Leg guide">
            <CardPlayer
              key={`${activeLeg.leg.id}-${trail.length}`}
              cards={activeLeg.leg.cards}
              featureIds={activeLeg.leg.featureIds}
              label={`LEG ${legNumber}`}
              completeLabel={`Arrive ${getNode(activeLeg.leg.to).name}`}
              onComplete={finishLeg}
              onPreviousFromFirst={goPlan}
              startAtEnd={Boolean(activeLeg.atEnd)}
              initialIndex={resumeIndex.current}
              onIndexChange={trackIndex}
            />
          </section>
        )}

        {phase === 'arrived' && (
          <section className="route-panel" aria-label="Destination information">
            <CardPlayer
              key={`arrived-${trail.length}`}
              cards={node.info}
              featureIds={trail.at(-1).leg.arrivalFeatureIds}
              defaultFocus={trail.at(-1).leg.arrivalFeatureIds[0]}
              label={`${node.name.toUpperCase()} INFO`}
              completeLabel={
                canContinueFrom(place.nodeId, place.choices)
                  ? 'Choose next destination'
                  : 'Finish'
              }
              onComplete={finishInfo}
              initialIndex={resumeIndex.current}
              onIndexChange={trackIndex}
            />
          </section>
        )}

        {phase === 'done' && (
          <section className="planner-panel" aria-label="Route complete">
            <div className="section-heading">
              <p className="eyebrow">DONE</p>
              <h2>{routeSummary.join(' → ')}</h2>
              <p>{trail.length} legs completed. Draft practice data only.</p>
            </div>
            <button type="button" className="primary-button start-button" onClick={goHome}>
              Plan a new route
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
