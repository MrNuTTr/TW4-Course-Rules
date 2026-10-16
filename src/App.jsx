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
          have no real positions.
        </desc>
        <path
          className="route-line"
          d={`M ${positions.map(({ x, y }) => `${x} ${y}`).join(' L ')}`}
        />
        {positions.map(({ step, x, y }, index) => {
          const isActive = step.id === activeStepId;
          const labelY = y === 220 ? y + 38 : y - 24;
          return (
            <g className={isActive ? 'route-point is-active' : 'route-point'} key={step.id}>
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

function RouteStep({ step, index, active, onSelect }) {
  return (
    <button
      className={active ? 'step-card is-active' : 'step-card'}
      type="button"
      aria-pressed={active}
      onClick={onSelect}
    >
      <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="step-content">
        <span className="step-title">{step.title}</span>
        <span className="step-detail">{step.detail}</span>
        <span className="detail-label">What happens</span>
        <span className="placeholder-copy">
          Procedure details will be added after review against approved sources.
        </span>
        <span className="detail-label">Heading / altitude</span>
        <span className="placeholder-copy">Not provided in this prototype.</span>
        <span className="detail-label">Radio calls</span>
        <span className="callout">
          Placeholder only: add an approved call script and its applicable
          conditions.
        </span>
      </span>
    </button>
  );
}

export default function App() {
  const [runway, setRunway] = useState(DEMO_RUNWAYS[0]);
  const [firstCategory, setFirstCategory] = useState(STOP_CATEGORIES.WORK_AREA);
  const [firstStopId, setFirstStopId] = useState('kings-4');
  const [secondStopId, setSecondStopId] = useState('');
  const [activeStepId, setActiveStepId] = useState('departure');

  const firstStopOptions = getStopsByCategory(firstCategory);
  const secondStopOptions = getCompatibleSecondStops(firstStopId);
  const plannedRoute = useMemo(
    () => buildPlannedRoute({ runway, firstStopId, secondStopId }),
    [runway, firstStopId, secondStopId],
  );
  const activeStepIndex = plannedRoute.steps.findIndex(
    (step) => step.id === activeStepId,
  );
  const selectedStepId =
    activeStepIndex >= 0 ? activeStepId : plannedRoute.steps[0].id;

  function changeFirstCategory(event) {
    const nextCategory = event.target.value;
    const nextFirstStop = getStopsByCategory(nextCategory)[0];
    setFirstCategory(nextCategory);
    setFirstStopId(nextFirstStop.id);
    setSecondStopId('');
    setActiveStepId('departure');
  }

  function changeFirstStop(event) {
    setFirstStopId(event.target.value);
    setSecondStopId('');
    setActiveStepId('departure');
  }

  function changeSecondStop(event) {
    setSecondStopId(event.target.value);
    setActiveStepId(event.target.value || 'arrival');
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">COURSE RULES ROUTE PLANNER</p>
          <h1>Build a sample sortie</h1>
        </div>
        <span className="prototype-badge">PROTOTYPE · NOT FOR FLIGHT</span>
      </header>

      <aside className="safety-notice" aria-label="Prototype limitation">
        <strong>Demonstration only.</strong> Stop names and runway choices are
        sample inputs. The diagram is not geographic; routes, headings,
        altitudes, procedures, and radio scripts are intentionally not
        represented as real guidance.
      </aside>

      <div className="planner-layout">
        <section className="planner-panel" aria-labelledby="planner-heading">
          <div className="section-heading">
            <p className="eyebrow">ROUTE BUILDER</p>
            <h2 id="planner-heading">Choose your sequence</h2>
            <p>Pick a departure runway and at least one work-area or OLF stop.</p>
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
              onChange={(event) => setRunway(event.target.value)}
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
              A Work Area cannot be followed by another Work Area in this
              prototype; the same rule applies to two consecutive OLF stops.
              Specific route compatibility still needs reviewed data.
            </p>
          </div>

          <div className="generated-route" aria-live="polite">
            <span className="detail-label">Generated route</span>
            <p>{plannedRoute.title}</p>
            <span className="arrival-note">
              Arrival: KNGP recovery step generated from {plannedRoute.arrivalFrom}.
            </span>
          </div>
        </section>

        <section className="route-panel" aria-labelledby="route-heading">
          <div className="route-panel-heading">
            <div>
              <p className="eyebrow">ROUTE PREVIEW</p>
              <h2 id="route-heading">Your sequence</h2>
            </div>
            <span className="step-count">{plannedRoute.steps.length} steps</span>
          </div>

          <div className="map-card">
            <div className="map-card-heading">
              <div>
                <h3>Schematic route</h3>
                <p>Sequence view only · points have no geographic position</p>
              </div>
              <span aria-hidden="true" className="map-icon">↗</span>
            </div>
            <SchematicRoute
              steps={plannedRoute.steps}
              activeStepId={selectedStepId}
            />
            <div className="map-legend">
              <span><i className="legend-dot" /> Sequence waypoint</span>
              <span><i className="legend-line" /> Planned order</span>
            </div>
          </div>

          <div className="steps-heading">
            <h3>Step-by-step briefing</h3>
            <p>Select a step to highlight it in the schematic.</p>
          </div>
          <div className="step-list">
            {plannedRoute.steps.map((step, index) => (
              <RouteStep
                key={step.id}
                step={step}
                index={index}
                active={step.id === selectedStepId}
                onSelect={() => setActiveStepId(step.id)}
              />
            ))}
          </div>
          <p className="source-note">
            Prototype content only. No course-rule documents have been imported
            into the app.
          </p>
        </section>
      </div>
    </main>
  );
}
