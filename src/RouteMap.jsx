import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getCourseRulesMapFeatures } from './courseRulesMap.js';

// Hazard circles sit below the tracks so they never block clicks on them.
function HazardPane() {
  const map = useMap();
  if (!map.getPane('hazardPane')) {
    map.createPane('hazardPane').style.zIndex = 350;
  }
  return null;
}

// Short, readable name for the layer toggle buttons.
function layerLabel(feature) {
  const { mapLabel: name, mapFolder } = feature.properties;
  const parent = mapFolder.split('/').pop();
  if (/^\d{2}[LR]?(\/\d{2}[LR]?)?$/.test(name)) {
    return parent.startsWith('(') ? `RWY ${name}` : `${parent} ${name}`;
  }
  return name;
}

const FIELD_ROOT = /^\(K(?!NGP)[A-Z]{3}\)/;
const AIRPORT_RING = /^(\d+ NM Radius|Class D Airspace)$/;

// Runway numbers (e.g. ["11","29"]) a feature belongs to at an outlying field.
// Pattern ovals are drawn per runway pair, so a "11/29" feature belongs to both.
function runwaysOf(feature) {
  const { mapLabel: name, mapFolder } = feature.properties;
  if (!FIELD_ROOT.test(mapFolder)) return [];
  const initial = /^Initial (\d{2}[LR]?)$/.exec(name);
  if (initial) return [initial[1]];
  return /^\d{2}[LR]?(\/\d{2}[LR]?)?$/.test(name) ? name.split('/') : [];
}

// The pattern ovals sit at the airfield root; every deeper per-runway track
// (Arrivals, transitions, departures) is an initial/transition path.
function isPatternTrack(feature) {
  return feature.properties.mapFolder.split('/').length === 1 && feature.properties.customKind !== 'initial';
}

function defaultHidden(features) {
  const hidden = new Set();
  for (const f of features) {
    if (runwaysOf(f).length && !isPatternTrack(f)) hidden.add(f.id);
    if (f.properties.customKind === 'initial') hidden.add(f.id);
    if (/^5 NM/.test(f.properties.mapLabel)) hidden.add(f.id);
  }
  return hidden;
}

function MapViewport({ features, focusFeatureId: focusIds, maxZoom, focusOnField }) {
  const focusFeatureId = focusIds.join('|');
  const map = useMap();
  const hasFittedRoute = useRef(false);
  const lastFocusFeatureId = useRef(focusFeatureId);

  useEffect(() => {
    const fitFeatures = focusOnField
      ? features.filter(
          (f) =>
            f.properties.customKind === 'initial' ||
            /^K[A-Z]{3}$/.test(f.properties.mapLabel) ||
            /^\d{2}[LR]?\/\d{2}[LR]?$/.test(f.properties.mapLabel),
        )
      : features;
    const bounds = L.geoJSON({
      type: 'FeatureCollection',
      features: fitFeatures.length ? fitFeatures : features,
    }).getBounds();
    if (!bounds.isValid()) {
      throw new Error('The selected KML map features do not have valid coordinates.');
    }

    if (!hasFittedRoute.current) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom, animate: false });
      hasFittedRoute.current = true;
      lastFocusFeatureId.current = focusFeatureId;
      return;
    }

    if (focusFeatureId === lastFocusFeatureId.current) {
      return;
    }

    const activeFeatures = features.filter(({ id }) => focusIds.includes(id));
    if (activeFeatures.length === 0) {
      return;
    }
    lastFocusFeatureId.current = focusFeatureId;

    const activeBounds = L.geoJSON({ type: 'FeatureCollection', features: activeFeatures }).getBounds();
    if (activeBounds.getNorthEast().equals(activeBounds.getSouthWest())) {
      map.setView(activeBounds.getCenter(), 12, { animate: false });
    } else {
      map.fitBounds(activeBounds, {
        padding: [36, 36],
        maxZoom: 12,
        animate: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, focusFeatureId, map]);

  return null;
}

export default function RouteMap({
  mapData,
  focusFeatureId,
  maxZoom = 9,
  labelKeyPoints = false,
  fitToField = false,
  layerToggles = false,
}) {
  const focusKey = [focusFeatureId].flat().filter(Boolean).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const focusIds = useMemo(() => focusKey.split('|').filter(Boolean), [focusKey]);
  const mapFeatures = useMemo(
    () =>
      getCourseRulesMapFeatures(mapData.featureIds)
        .filter((f) => !(layerToggles && AIRPORT_RING.test(f.properties.mapLabel)))
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            isActive: focusIds.includes(feature.id),
          },
        })),
    [mapData, focusIds, layerToggles],
  );
  const [hidden, setHidden] = useState(() => (layerToggles ? defaultHidden(mapFeatures) : new Set()));
  const { runwayGroups, otherItems } = useMemo(() => {
    const groups = new Map();
    const others = [];
    for (const f of mapFeatures) {
      const rwys = runwaysOf(f);
      if (!rwys.length) {
        others.push({ id: f.id, label: layerLabel(f) });
        continue;
      }
      for (const rwy of rwys) {
        const group = groups.get(rwy) ?? { rwy, pattern: [], paths: [] };
        (isPatternTrack(f) ? group.pattern : group.paths).push(f.id);
        groups.set(rwy, group);
      }
    }
    return { runwayGroups: [...groups.values()].sort((a, b) => a.rwy.localeCompare(b.rwy)), otherItems: others };
  }, [mapFeatures]);
  const toggleItems = useMemo(
    () => [...runwayGroups.flatMap((g) => [...g.pattern, ...g.paths]), ...otherItems.map((i) => i.id)].map((id) => ({ id })),
    [runwayGroups, otherItems],
  );
  const visibleFeatures = useMemo(
    () => mapFeatures.filter((f) => !hidden.has(f.id)),
    [mapFeatures, hidden],
  );

  function toggleLayer(id) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(ids) {
    setHidden((prev) => {
      const next = new Set(prev);
      const allVisible = ids.every((id) => !next.has(id));
      ids.forEach((id) => (allVisible ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  function groupButton(ids, label) {
    if (!ids.length) return null;
    const on = ids.every((id) => !hidden.has(id));
    return (
      <button
        type="button"
        className={on ? 'map-layer-on' : 'map-layer-off'}
        aria-pressed={on}
        onClick={() => toggleGroup(ids)}
      >
        {label}
      </button>
    );
  }

  function featureStyle(feature) {
    if (feature.properties.customKind === 'hazard') {
      return {
        color: '#d32f2f',
        weight: 3,
        dashArray: '6 4',
        fillColor: '#d32f2f',
        fillOpacity: 0.3,
      };
    }
    const isActive = feature.properties.isActive;
    const isPolygon = ['Polygon', 'MultiPolygon'].includes(feature.geometry.type);
    return {
      color: isActive ? '#c27a00' : isPolygon ? '#7752a1' : '#1769aa',
      weight: isActive ? 6 : isPolygon ? 2 : 4,
      fillColor: isActive ? '#f0b638' : '#a88cc4',
      fillOpacity: isActive ? 0.24 : 0.12,
    };
  }

  function pointToLayer(feature, latlng) {
    const isActive = feature.properties.isActive;
    if (feature.properties.customKind === 'hazard') {
      return L.circle(latlng, {
        pane: 'hazardPane',
        radius: (feature.properties.radiusNm ?? 0.5) * 1852,
        color: '#c62828',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#c62828',
        fillOpacity: 0.15,
      });
    }
    if (feature.properties.customKind === 'initial') {
      return L.marker(latlng, {
        icon: L.divIcon({
          className: isActive ? 'map-star map-star-active' : 'map-star',
          html: '★',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      });
    }
    return L.circleMarker(latlng, {
      radius: isActive ? 9 : 6,
      color: isActive ? '#9b5e00' : '#104d7f',
      weight: isActive ? 4 : 2,
      fillColor: isActive ? '#ffd467' : '#fff',
      fillOpacity: 1,
    });
  }

  function onEachFeature(feature, layer) {
    const name = feature.properties.mapLabel;
    const isKeyPoint = labelKeyPoints && feature.properties.customKind === 'initial';
    layer.bindTooltip(name, {
      permanent: feature.properties.isActive || isKeyPoint,
      direction: 'top',
      offset: [0, -7],
      className: 'map-waypoint-label',
    });
    const description = String(feature.properties.description ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const popup = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = feature.properties.mapLabel;
    popup.append(title);
    if (description) {
      const note = document.createElement('p');
      note.textContent = description;
      popup.append(note);
    }
    layer.bindPopup(popup);
  }

  return (
    <>
    {layerToggles && toggleItems.length > 1 && (
      <details className="map-layers">
        <summary>Map layers</summary>
        <div className="map-layers-actions">
          <button type="button" onClick={() => setHidden(new Set())}>Show all</button>
          <button type="button" onClick={() => setHidden(defaultHidden(mapFeatures))}>Reset</button>
          <button type="button" onClick={() => setHidden(new Set(toggleItems.map((i) => i.id)))}>
            Hide all
          </button>
        </div>
        {runwayGroups.map((g) => (
          <div className="map-layers-list" key={g.rwy}>
            <strong className="map-layers-rwy">RWY {g.rwy}</strong>
            {groupButton(g.pattern, 'Pattern')}
            {groupButton(g.paths, 'Initial / paths')}
          </div>
        ))}
        {otherItems.length > 0 && (
          <div className="map-layers-list">
            {otherItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={hidden.has(item.id) ? 'map-layer-off' : 'map-layer-on'}
                aria-pressed={!hidden.has(item.id)}
                onClick={() => toggleLayer(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </details>
    )}
    <div
      className="route-map"
      aria-label="Interactive map with KML course-rule waypoints"
    >
      <MapContainer
        center={[27.8, -97.25]}
        zoom={8}
        scrollWheelZoom
        aria-label="Course-rules route map"
      >
        <TileLayer
          attribution='Map data: <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map">USGS The National Map</a>'
          url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        <HazardPane />
        <GeoJSON
          key={`${focusKey}|${[...hidden].join('|')}`}
          data={{ type: 'FeatureCollection', features: visibleFeatures }}
          style={featureStyle}
          pointToLayer={pointToLayer}
          onEachFeature={onEachFeature}
        />
        <MapViewport features={mapFeatures} focusFeatureId={focusIds} maxZoom={maxZoom} focusOnField={fitToField} />
      </MapContainer>
    </div>
    </>
  );
}
