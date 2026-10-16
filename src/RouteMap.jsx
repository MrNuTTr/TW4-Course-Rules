import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getCourseRulesMapFeatures } from './courseRulesMap.js';

function MapViewport({ features, focusFeatureId: focusIds }) {
  const focusFeatureId = focusIds.join('|');
  const map = useMap();
  const hasFittedRoute = useRef(false);
  const lastFocusFeatureId = useRef(focusFeatureId);

  useEffect(() => {
    const bounds = L.geoJSON({
      type: 'FeatureCollection',
      features,
    }).getBounds();
    if (!bounds.isValid()) {
      throw new Error('The selected KML map features do not have valid coordinates.');
    }

    if (!hasFittedRoute.current) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9, animate: false });
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

export default function RouteMap({ mapData, focusFeatureId }) {
  const focusKey = [focusFeatureId].flat().filter(Boolean).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const focusIds = useMemo(() => focusKey.split('|').filter(Boolean), [focusKey]);
  const mapFeatures = useMemo(
    () =>
      getCourseRulesMapFeatures(mapData.featureIds).map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          isActive: focusIds.includes(feature.id),
        },
      })),
    [mapData, focusIds],
  );

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
    layer.bindTooltip(feature.properties.mapLabel, {
      permanent: feature.properties.isActive,
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={focusKey}
          data={{ type: 'FeatureCollection', features: mapFeatures }}
          style={featureStyle}
          pointToLayer={pointToLayer}
          onEachFeature={onEachFeature}
        />
        <MapViewport features={mapFeatures} focusFeatureId={focusIds} />
      </MapContainer>
    </div>
  );
}
