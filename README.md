# Course Rules Route Planner

This project starts from Microsoft's [Azure Static Web Apps React basic
template](https://github.com/staticwebdev/react-basic), documented in the
[Azure Static Web Apps React quickstart](https://learn.microsoft.com/azure/static-web-apps/getting-started?tabs=react).
The starter was modernized from Create React App to Vite; the original
`staticwebapp.config.json` is retained for Azure Static Web Apps navigation
fallback behavior.

## Site layout

A top bar links Home, Chair Fly (`/chair-fly`), Wiki (`/wiki/*`) and Quiz
(`/quiz`), using React Router. The Wiki folder tree lives in
`src/wiki/structure.js`. A page's `node` shows that place's info cards, and its
`routes` become collapsible route explorers (`src/wiki/RouteExplorer.jsx`) that
resolve legs from the same data as Chair Fly, with pickers for runway/area, a
map and every card. A route can fix or restrict options (`fixedTo`,
`filterFrom`...). The KNGP page holds the taxi, run-up and arrival-initial content. The
The Quiz is generated from the same data (`src/quiz/bank.js`): numbers, channels and pattern sides in sourced cards become blanks, and each card also yields a which-frequency question, a what-do-you-do recall question (reveal only) and a what-comes-next sequence question, for multiple choice or reveal-style play, plus a chair-fly quiz that hides each card until you reveal it. The `staticwebapp.config.json` fallback makes deep links
work on Azure.

## Features

- Chunked, leg-by-leg flow: pick a departure runway, then a destination type
  (Outlying Fields or Working Areas, with Shamrock Re-entry counted as
  outlying) and a destination. Fly that leg one card at a time, read a short
  destination info page on arrival, then pick the next destination (and its
  runway/area) until the route ends at KNGP. The map shows only the active leg's KML features.
  Channel labels and compact instructions are shown prominently.
- Data is a small graph of human-editable JSON files, loaded by
  `src/routePlanner.js` (separate from the UI):
  - `src/data/nodes/*.json`: places (KNGP, KINGS 4, Goliad...) with the
    `inputs` to ask (runway, area), generic `info` cards shown on arrival, and
    `endsRoute` for the final node. `hidden: true` keeps a node's legs in the
    data but removes it from the destination list (used for Portland Low).
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
  → Mustang (Areas 1–8, Central) or Foxtrot (Fox 1/2, High/Middle/Low). Working
  area exits lead to KNGP (Northern, Southern or Eastern Arrival), Aransas
  County, Waldron (Southern or North-to-South Transition) and Ingleside. Outlying fields
  Aransas County, Waldron and Ingleside are reachable from KNGP (Goliad and
  KINGS 4 also reach Aransas County, Goliad also reaches Ingleside and KINGS 4) and return
  to KNGP via the Northern/Southern Arrivals. A `when` value may be an array
  of options so one leg covers several areas. A node's own top-level fields
  (`intent`, `foxtrotCall`) are available as `{to.node.intent}` tokens. Legs use `{from.X}`, `{to.X}` and `{to.X.detail}` tokens, resolved from the
  chosen inputs and the per-option `details` in the node file, so one leg file
  covers every runway. A missing detail fails the tests.
- Transitions and special exits: an input with `explicitOnly: true` (the
  `route` input on KNGP and Waldron) is offered only where a leg names it in
  `when`, and `hideWhen` hides another input for chosen values (tower-directed
  transition arrivals have no Shamrock entry to pick). `inputsFrom` lets a node
  borrow another node's inputs (Shamrock Re-entry lands on the KNGP runways).
  Loaded: Shamrock Re-entry, Oso Transition (KNGP ↔ Waldron), Sunrise
  Transition (Waldron → KNGP), Nueces Transition (KNGP ↔ KCRP) and Portland Low
  (hidden from the destination list; see `hidden`). KINGS 4 also returns to KNGP via Woodsboro and the Goliad/Northern
  Arrival. Not loaded because the sources don't tie them to a route or
  destination: the Western and Lex Arrivals, Cabaniss as a destination, and
  KINGS 4 → Ingleside.
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
  operational use. Items assumed rather than sourced are marked "Check with an
  instructor."

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
static site.


