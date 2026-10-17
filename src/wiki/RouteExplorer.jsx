import { Suspense, lazy, useState } from 'react';
import CardView from '../components/CardView.jsx';
import { getNode, optionLabel } from '../routePlanner.js';
import { resolveRoute } from './routes.js';
const RouteMap = lazy(() => import('../RouteMap.jsx'));

function Picker({ node, input, value, onChange, prefix }) {
  return (
    <label className="wiki-picker">
      <span>
        {node.name} {input.label.toLowerCase()}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {input.options.map((option) => (
          <option key={`${prefix}-${option}`} value={option}>
            {optionLabel(input, option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function RouteExplorer({ route, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [picks, setPicks] = useState({ from: {}, to: {} });
  const [focus, setFocus] = useState(null);
  const fromNode = getNode(route.from);
  const toNode = getNode(route.to);
  const { fromInputs, fromChoices, toInputs, toChoices, leg } = resolveRoute(route, picks);
  const visibleTo = toInputs.filter(
    (input) =>
      input.options.length > 1 &&
      !Object.entries(input.hideWhen ?? {}).some(([key, values]) =>
        [values].flat().includes(toChoices[key]),
      ),
  );

  return (
    <details className="wiki-route" open={defaultOpen} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{route.label ?? `${fromNode.name} → ${toNode.name}`}</summary>
      {open && (
        <div className="wiki-route-body">
          <div className="wiki-pickers">
            {fromInputs
              .filter((input) => input.options.length > 1)
              .map((input) => (
                <Picker
                  key={`from-${input.id}`}
                  prefix="from"
                  node={fromNode}
                  input={input}
                  value={fromChoices[input.id]}
                  onChange={(value) =>
                    setPicks({ to: picks.to, from: { ...picks.from, [input.id]: value } })
                  }
                />
              ))}
            {visibleTo.map((input) => (
              <Picker
                key={`to-${input.id}`}
                prefix="to"
                node={toNode}
                input={input}
                value={toChoices[input.id]}
                onChange={(value) =>
                  setPicks({ from: picks.from, to: { ...picks.to, [input.id]: value } })
                }
              />
            ))}
          </div>
          {leg ? (
            <>
              <h3 className="wiki-leg-title">{leg.title}</h3>
              <div className="map-card">
                <Suspense fallback={<p className="map-unavailable">Loading map…</p>}>
                  <RouteMap key={leg.featureIds.join('|')} mapData={{ featureIds: leg.featureIds }} focusFeatureId={focus} layerToggles />
                </Suspense>
              </div>
              <ol className="wiki-cards">
                {leg.cards.map((card, index) => (
                  <li className="wiki-card" key={`${card.title}-${index}`}>
                    <CardView event={card} />
                    {card.mapFocus && (
                      <button
                        type="button"
                        className="wiki-show-map"
                        onClick={() => setFocus(card.mapFocus)}
                      >
                        Show on map
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="wiki-placeholder">No route is loaded for this combination.</p>
          )}
        </div>
      )}
    </details>
  );
}
