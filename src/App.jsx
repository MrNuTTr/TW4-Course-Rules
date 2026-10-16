import { useMemo, useState } from 'react';
import {
  DEMO_RUNWAYS,
  STOP_CATEGORIES,
  STOP_CATEGORY_LABELS,
} from './demoData.js';
import {
  buildPlannedRoute,
  getCompatibleSecondStops,
  getStopsByCategory,
  KINGS4_HIGH_AREAS,
} from './routePlanner.js';

function SchematicRoute({ steps, activeStepId }) {
  const positions = steps.map((step, index) => {
    const horizontalRange = 510;
    const x = 85 + (horizontalRange * index) / (steps.length - 1);
    const y = index % 2 === 0 ? 220 : 105;
    return { step, x, y };
  });
  const points = positions.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <div className="schematic-wrap">
      <svg
        className="schematic"
        viewBox="0 0 680 300"
        role="img"
        aria-labelledby="schematic-title schematic-description"
      >
        <title id="schematic-title">Schematic route display</title>
        <desc id="schematic-description">
          An illustrative sequence diagram, not a geographic map. Locations
          have no real positions. The active waypoint is highlighted.
        </desc>
        <path
          className="route-line"
          d={`M ${positions.map(({ x, y }) => `${x} ${y}`).join(' L ')}`}
        />
        {positions.map(({ step, x, y }, index) => {
          const isActive = step.id === activeStepId;
          const labelY = y === 220 ? y + 38 : y - 24;
          return (
            <g
              className={isActive ? 'route-point is-active' : 'route-point'}
              aria-current={isActive ? 'step' : undefined}
              key={step.id}
            >
              <circle className="point-halo" cx={x} cy={y} r="18" />
              <circle className="point-core" cx={x} cy={y} r="11" />
              <text className="point-number" x={x} y={y + 4}>
                {index + 1}
              </text>
              <text className="point-label" x={x} y={labelY}>
                {step.location}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GuideEvent({ event, eventIndex, eventCount, stageIndex, stageCount }) {
  const radio = event.radio;
  const eventLabel = {
    radio: 'Radio call',
    action: 'Action',
    checkpoint: 'Checkpoint',
  }[event.type];

  return (
    <article className="guide-event" aria-live="polite">
      <div className="guide-progress">
        <span>ROUTE POINT {stageIndex + 1} OF {stageCount}</span>
        <span>BRIEFING ITEM {eventIndex + 1} OF {eventCount}</span>
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
            <span className="detail-label">{radio.script ? 'Say' : 'Radio'}</span>
            <span className="channel-label">{radio.channel}</span>
          </div>
          {radio.script && <p>{radio.script}</p>}
        </div>
      )}
      {event.detail && <p className="event-note">{event.detail}</p>}
    </article>
  );
}

export default function App() {
  const [isPracticing, setIsPracticing] = useState(false);
  const [runway, setRunway] = useState(DEMO_RUNWAYS[0]);
  const [firstCategory, setFirstCategory] = useState(STOP_CATEGORIES.WORK_AREA);
  const [firstStopId, setFirstStopId] = useState('kings-4');
  const [secondStopId, setSecondStopId] = useState('goliad-nolf');
  const [kings4Area, setKings4Area] = useState('3');
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  const firstStopOptions = getStopsByCategory(firstCategory);
  const secondStopOptions = getCompatibleSecondStops(firstStopId);
  const kings4Selected =
    firstStopId === 'kings-4' || secondStopId === 'kings-4';
  const plannedRoute = useMemo(
    () => buildPlannedRoute({ runway, firstStopId, secondStopId, kings4Area }),
    [runway, firstStopId, secondStopId, kings4Area],
  );
  const guideEvents = useMemo(
    () =>
      plannedRoute.steps.flatMap((step, stageIndex) => {
        const events = step.events ?? [
          {
            type: 'checkpoint',
            title: step.title,
            prompt:
              'This route selection has no source-cited guided sequence yet. Choose the configured test case or treat this as a route outline only.',
            source: 'No source-reviewed event is loaded for this selection.',
          },
        ];
        return events.map((event) => ({
          ...event,
          stepId: step.id,
          stepTitle: step.title,
          location: step.location,
          stageIndex,
        }));
      }),
    [plannedRoute],
  );
  const currentEventIndex = Math.min(
    activeEventIndex,
    Math.max(guideEvents.length - 1, 0),
  );
  const currentEvent = guideEvents[currentEventIndex];
  const nextEvent = guideEvents[currentEventIndex + 1];

  function changeFirstCategory(event) {
    const nextCategory = event.target.value;
    const nextFirstStop = getStopsByCategory(nextCategory)[0];
    setFirstCategory(nextCategory);
    setFirstStopId(nextFirstStop.id);
    setSecondStopId('');
    setActiveEventIndex(0);
  }

  function changeFirstStop(event) {
    setFirstStopId(event.target.value);
    setSecondStopId('');
    setActiveEventIndex(0);
  }

  function changeSecondStop(event) {
    setSecondStopId(event.target.value);
    setActiveEventIndex(0);
  }

  function startPractice() {
    setActiveEventIndex(0);
    setIsPracticing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function returnToRouteBuilder() {
    setActiveEventIndex(0);
    setIsPracticing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="app-shell">
      <header className={`site-header${isPracticing ? ' site-header-practice' : ''}`}>
        <div>
          <p className="eyebrow">COURSE RULES ROUTE PLANNER</p>
          <h1>{isPracticing ? plannedRoute.title : 'Build a sample sortie'}</h1>
        </div>
        {isPracticing ? (
          <button
            type="button"
            className="home-button"
            onClick={returnToRouteBuilder}
          >
            Home · New route
          </button>
        ) : (
          <span className="prototype-badge">PROTOTYPE · NOT FOR FLIGHT</span>
        )}
      </header>

      <div className="planner-layout">
        {!isPracticing ? (
          <section className="planner-panel" aria-labelledby="planner-heading">
            <div className="section-heading">
              <p className="eyebrow">ROUTE BUILDER</p>
              <h2 id="planner-heading">Choose your sequence</h2>
              <p>Set the route before starting the guided practice.</p>
            </div>

            <div className="form-field">
              <label htmlFor="departure">Departure</label>
              <input id="departure" value="KNGP" readOnly />
            </div>

            <div className="form-field">
              <label htmlFor="runway">Departure runway <span>Demo choice</span></label>
              <select
                id="runway"
                value={runway}
                onChange={(event) => {
                  setRunway(event.target.value);
                  setActiveEventIndex(0);
                }}
              >
                {DEMO_RUNWAYS.map((option) => (
                  <option key={option} value={option}>
                    Runway {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="first-category">First stop type</label>
              <select
                id="first-category"
                value={firstCategory}
                onChange={changeFirstCategory}
              >
                {Object.values(STOP_CATEGORIES).map((category) => (
                  <option key={category} value={category}>
                    {STOP_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="first-stop">First stop</label>
              <select
                id="first-stop"
                value={firstStopId}
                onChange={changeFirstStop}
              >
                {firstStopOptions.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="second-stop">
                Optional second stop <span>Only the other stop type is offered</span>
              </label>
              <select
                id="second-stop"
                value={secondStopId}
                onChange={changeSecondStop}
              >
                <option value="">No second stop — return to KNGP</option>
                {secondStopOptions.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
              <p className="field-help">
                This demo filters to the opposite stop type. It does not encode
                source-reviewed compatibility for other routes.
              </p>
            </div>

            {kings4Selected && (
              <div className="form-field">
                <label htmlFor="kings4-area">KINGS 4 high working area</label>
                <select
                  id="kings4-area"
                  value={kings4Area}
                  onChange={(event) => {
                    setKings4Area(event.target.value);
                    setActiveEventIndex(0);
                  }}
                >
                  {KINGS4_HIGH_AREAS.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.label}
                    </option>
                  ))}
                </select>
                <p className="field-help">
                  Area 3 High is selected for this source-extract test. Other areas
                  do not have route-specific detail in this prototype.
                </p>
              </div>
            )}

            <div className="generated-route" aria-live="polite">
              <span className="detail-label">Generated route</span>
              <p>{plannedRoute.title}</p>
              <span className="arrival-note">
                KNGP recovery step generated from {plannedRoute.arrivalFrom}.
              </span>
            </div>
            <button
              type="button"
              className="primary-button generate-button"
              onClick={startPractice}
            >
              Generate route
            </button>
          </section>
        ) : (
          <section className="route-panel" aria-labelledby="route-heading">
            <div className="route-panel-heading">
              <div>
                <p className="eyebrow">GUIDED PRACTICE</p>
                <h2 id="route-heading">Your route</h2>
              </div>
              <span className="step-count">{guideEvents.length} briefing items</span>
            </div>

            <div className="map-card map-card-active">
              <div className="map-card-heading">
                <div>
                  <h3>Route waypoints</h3>
                  <p>Active waypoint highlights as you advance · schematic only</p>
                </div>
              </div>
              <SchematicRoute
                steps={plannedRoute.steps}
                activeStepId={currentEvent.stepId}
              />
              <div className="map-legend">
                <span>
                  <i className="legend-dot legend-dot-active" /> Current waypoint
                </span>
                <span><i className="legend-line" /> Route sequence</span>
              </div>
            </div>

            <GuideEvent
              event={currentEvent}
              eventIndex={currentEventIndex}
              eventCount={guideEvents.length}
              stageIndex={currentEvent.stageIndex}
              stageCount={plannedRoute.steps.length}
            />

            <nav className="guide-controls" aria-label="Briefing navigation">
              <button
                type="button"
                className="secondary-button"
                disabled={currentEventIndex === 0}
                onClick={() => setActiveEventIndex(currentEventIndex - 1)}
              >
                Previous
              </button>
              <span className="next-preview">
                {nextEvent ? `Next: ${nextEvent.title}` : 'End of preview'}
              </span>
              <button
                type="button"
                className="primary-button"
                disabled={!nextEvent}
                onClick={() => setActiveEventIndex(currentEventIndex + 1)}
              >
                {nextEvent ? 'Next item' : 'Finished'}
              </button>
            </nav>
          </section>
        )}
      </div>
    </main>
  );
}
