import { Suspense, lazy, useState } from 'react';
import {
  describeChoices,
  findLeg,
  getDestinations,
  getNode,
  getOriginInputs,
  optionLabel,
} from './routePlanner.js';
const RouteMap = lazy(() => import('./RouteMap.jsx'));

const START_NODE_ID = 'kngp';

// A node flagged endsRoute finishes the route when you arrive there.
function canContinueFrom(nodeId, choices) {
  return !getNode(nodeId).endsRoute && getDestinations(nodeId, choices).length > 0;
}

function GuideEvent({ event, eventIndex, eventCount, label }) {
  const radio = event.radio;
  const eventLabel = {
    radio: 'Radio call',
    action: 'Action',
    checkpoint: 'Checkpoint',
  }[event.type];

  return (
    <article className="guide-event" aria-live="polite">
      <div className="guide-progress">
        <span>{label}</span>
        <span>
          ITEM {eventIndex + 1} OF {eventCount}
        </span>
      </div>
      <div className={`event-type event-type-${event.type}`}>{eventLabel}</div>
      <h2 className="guide-title">{event.title}</h2>
      {(event.leadIn || event.instructions?.length > 0 || event.prompt) && (
        <div className="event-instructions">
          {event.leadIn && <p className="instruction-lead-in">{event.leadIn}</p>}
          {event.instructions?.length > 0 && (
            <ul className="instruction-list">
              {event.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          )}
          {!event.instructions?.length && event.prompt && (
            <p className="guide-prompt">{event.prompt}</p>
          )}
        </div>
      )}
      {radio && (
        <div className="script-panel">
          <div className="script-heading">
            <span className="detail-label">
              {radio.exchange ? 'Exchange' : radio.script ? 'Say' : 'Radio'}
            </span>
            <span className="channel-label">{radio.channel}</span>
          </div>
          {radio.exchange ? (
            <div className="script-exchange">
              {radio.exchange.map(({ speaker, text }, index) => (
                <div
                  className={`script-exchange-line ${
                    speaker === 'Pilot' ? 'exchange-pilot' : 'exchange-other'
                  }`}
                  key={`${speaker}-${index}`}
                >
                  <span className="exchange-speaker">{speaker}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          ) : (
            radio.script && <p>{radio.script}</p>
          )}
        </div>
      )}
      {event.detail && <p className="event-note">{event.detail}</p>}
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
}) {
  const [index, setIndex] = useState(startAtEnd ? cards.length - 1 : 0);
  const card = cards[index];
  const isLast = index === cards.length - 1;

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
  const categoryOf = (entry) => (entry.node.kind === 'work-area' ? 'working' : 'outlying');
  const categories = [
    { id: 'outlying', label: 'Outlying Fields' },
    { id: 'working', label: 'Working Areas' },
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

export default function App() {
  const [place, setPlace] = useState({ nodeId: START_NODE_ID, choices: {} });
  const [trail, setTrail] = useState([]);
  const [phase, setPhase] = useState('plan'); // plan | leg | arrived | done
  const [activeLeg, setActiveLeg] = useState(null);

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
          <p className="eyebrow">COURSE RULES · CHAIR FLY</p>
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
