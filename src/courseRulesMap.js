import { kmlWithFolders } from '@tmcw/togeojson';
import courseRulesKml from '../kml/TW-4 Primary Course Rules (with notes).kml?raw';
import mapExtras from './data/map-extras.json';

function removeAltitude(coordinates) {
  if (typeof coordinates[0] === 'number') {
    return coordinates.slice(0, 2);
  }

  return coordinates.map(removeAltitude);
}

function flattenKmlTree(node, folderPath = [], features = []) {
  for (const child of node.children ?? []) {
    if (child.type === 'folder') {
      const folderName = String(child.meta.name ?? '').trim();
      flattenKmlTree(child, [...folderPath, folderName], features);
      continue;
    }

    if (child.type !== 'Feature' || !child.geometry) {
      continue;
    }

    const name = String(child.properties?.name ?? 'Unnamed feature').trim();
    features.push({
      ...child,
      id: [...folderPath, name].join('/'),
      geometry: {
        ...child.geometry,
        coordinates: removeAltitude(child.geometry.coordinates),
      },
      properties: {
        ...child.properties,
        mapId: [...folderPath, name].join('/'),
        mapLabel: name,
        mapFolder: folderPath.join('/'),
      },
    });
  }

  return features;
}

function parseCourseRulesKml() {
  const document = new DOMParser().parseFromString(courseRulesKml, 'application/xml');
  const parserError = document.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Could not parse course-rules KML: ${parserError.textContent}`);
  }

  return flattenKmlTree(kmlWithFolders(document));
}

// Waypoints that are not in the KML, kept in a separate data file.
function buildExtraFeatures() {
  return mapExtras.map((extra) => {
    const id = `${extra.folder}/${extra.name}`;
    return {
      type: 'Feature',
      id,
      geometry: extra.coordinates
        ? { type: 'LineString', coordinates: extra.coordinates }
        : { type: 'Point', coordinates: [extra.lon, extra.lat] },
      properties: {
        mapId: id,
        mapLabel: extra.name,
        mapFolder: extra.folder,
        description: extra.description,
        customKind: extra.kind,
        radiusNm: extra.radiusNm,
      },
    };
  });
}

export const COURSE_RULES_MAP_FEATURES = [
  ...parseCourseRulesKml(),
  ...buildExtraFeatures(),
];

const featuresById = new Map(
  COURSE_RULES_MAP_FEATURES.map((feature) => [feature.id, feature]),
);

export function getCourseRulesMapFeatures(featureIds) {
  return [...new Set(featureIds)].map((featureId) => {
    const feature = featuresById.get(featureId);
    if (!feature) {
      throw new Error(`KML map feature not found: ${featureId}`);
    }
    return feature;
  });
}
