# Course Rules Route Planner prototype

This project starts from Microsoft's [Azure Static Web Apps React basic
template](https://github.com/staticwebdev/react-basic), documented in the
[Azure Static Web Apps React quickstart](https://learn.microsoft.com/azure/static-web-apps/getting-started?tabs=react).
The starter was modernized from Create React App to Vite; the original
`staticwebapp.config.json` is retained for Azure Static Web Apps navigation
fallback behavior.

## Prototype scope

- Chunked, leg-by-leg flow: pick a departure runway and first destination,
  fly that leg one card at a time, read a short destination info page on
  arrival, then pick the next destination (and its runway/area) until the
  route ends at KNGP. The map shows only the active leg's KML features.
  Channel labels and compact instructions are shown prominently.
- Data is a small graph of human-editable JSON files, loaded by
  `src/routePlanner.js` (separate from the UI):
  - `src/data/nodes/*.json`: places (KNGP, KINGS 4, Goliad...) with the
    `inputs` to ask (runway, area), generic `info` cards shown on arrival, and
    `endsRoute` for the final node.
  - `src/data/legs/*.json`: one file per leg: `from`, `to`, a `when` condition
    (`from`/`to` choices such as runway or area; the most specific match wins),
    the leg's `cards`, `featureIds` for the map and `arrivalFeatureIds` for the
    arrival map. Destinations and input options are derived from the legs that
    exist, so adding a leg file adds it to the UI. No code change is needed.
  - `src/data/parts/*.json`: reusable card blocks (`{id, cards}`). A leg's
    `cards` can contain `{"use": "part-id"}` entries; the id may use tokens
    (e.g. `kngp-ground-{from.runway.flow}`). Parts can nest other `use`
    entries. Shared parts hold text that is the
    same for every runway/area, using `{from.runway}`, `{to.area}`, `{to.node}`
    and `{to.area.limits}`-style tokens; per-option facts live in the node's
    input `details`. To add a runway, add it to the KNGP node's `options` and
    `details`. To add a KINGS 4 area, add it to the node's
    `options` and `details` (the tests fail until every token resolves).
- Cards store concise instructions, optional radio channel/script or
  exchange, and per-card source provenance (hidden in the UI). Tests validate
  graph references, KML ids, sources and channels for all data files, plus
  integrity rules to run after every import: unique map ids, `when` values
  that match real options, exactly one leg per choice combination (an ambiguous
  match throws), no stranded routes, and well-formed cards.
- Currently loaded (from the binder and Feb 2026 PowerPoints): the Rusty
  departure from all 7 runways (13L/13R/18/04/31L/31R/36) → KINGS 4 (any
  high/low area) or Goliad via Bayside → KNGP; plus the Beach Line departure
  → Mustang (Areas 1–8, Central) or Foxtrot (Fox 1/2, High/Middle/Low); these
  working areas end the route until their exits are added. Outlying fields
  Aransas County, Waldron and Ingleside are reachable from KNGP (Goliad and
  KINGS 4 also reach Aransas County, Goliad also reaches Ingleside) and return
  to KNGP via the Northern/Southern Arrivals. Legs use `{from.X}`, `{to.X}` and `{to.X.detail}` tokens, resolved from the
  chosen inputs and the per-option `details` in the node file, so one leg file
  covers every runway. A missing detail fails the tests.
- `src/data/map-extras.json` holds derived map points and lines not in the KML (Goliad
  4 NM initials, Berclair avoid area, Bayside, Padre Balli Park (approximate)). Extras with `coordinates` are lines
  (`kind: line`); the rest are points, drawn as ★ and a
  dashed red circle, and `mapFocus` may be a list of ids to frame several
  features at once.
- Some radio cards store a turn-by-turn exchange so the pilot call,
  controller response, and readback stay legible on narrow screens. Cards are
  transcribed from the user's binder images; the images are not bundled.- Map features are parsed from `kml/TW-4 Primary Course Rules (with notes).kml`
  in the browser and selected by folder/name references in the route JSON.
  The file is user-provided reference material, not official documentation;
  OpenStreetMap tiles provide the map background and require an internet
  connection. KML tracks are drawn as supplied; the app does not invent
  connecting legs where the KML has no geometry.
- Binder details that do not specify a transition or timing are not inferred.
  The guide marks the CH 12 transfer timing and the altitude change between
  the Goliad Arrival and Northern Arrival for instructor confirmation.
- Private source PDFs are not bundled with the application. Extracted text is
  a draft for UI evaluation, not approved flight guidance, and must be checked
  by a qualified reviewer against current authorized material before
  operational use.

Specific route compatibility and all unpopulated procedure branches require
reviewed, authoritative data.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

## Verify and build

```sh
npm test
npm run build
```

The production site is generated in `dist/`, ready to configure as the app
artifact for Azure Static Web Apps. No Azure Functions API is needed for this
static prototype.

