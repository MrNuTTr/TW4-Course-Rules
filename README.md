# Course Rules Route Planner

This project starts from Microsoft's [Azure Static Web Apps React basic
template](https://github.com/staticwebdev/react-basic), documented in the
[Azure Static Web Apps React quickstart](https://learn.microsoft.com/azure/static-web-apps/getting-started?tabs=react).
The starter was modernized from Create React App to Vite; the original
`staticwebapp.config.json` is retained for Azure Static Web Apps navigation
fallback behavior.

## AI-generated content disclosure

This project was built with generative AI assistance (GitHub Copilot). AI helped write the application code and tooling, and helped transcribe and organise the course-rules content, radio calls and quiz questions from the source material (the binder, the Feb 2026 PowerPoints, and the 3710.14 manual). AI can make mistakes, so this site is an unofficial study aid. It is not an official TW-4 document. Always verify against the current SOP and check with an instructor. Report anything that looks wrong through the Contact page.

## Site layout

A top bar links Home, Chair Fly (`/chair-fly`), Wiki (`/wiki/*`) and Quiz
(`/quiz`), using React Router. The Wiki folder tree lives in
`src/wiki/structure.js`. A page's `node` shows that place's info cards, and its
`routes` become collapsible route explorers (`src/wiki/RouteExplorer.jsx`) that
resolve legs from the same data as Chair Fly, with pickers for runway/area, a
map and every card. A route can fix or restrict options (`fixedTo`,
`filterFrom`...). The KNGP page holds the taxi, run-up and arrival-initial content. The
The Quiz mixes hand-written questions (`src/quiz/curated.js`) with questions generated from the same data (`src/quiz/bank.js`), and a Question Bank button lists every question for the chosen topics: numbers, channels and pattern sides in sourced cards become blanks, and cards with a situation (lead-in) also yield which-frequency questions. Generated questions are filtered hard (single blank, enough context, no per-runway duplicates), plus a chair-fly quiz that hides each card until you reveal it. The `staticwebapp.config.json` fallback makes deep links
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
  transcribed from the profsit binder images; the images are not bundled.- Map features are parsed from `kml/TW-4 Primary Course Rules (with notes).kml`
  in the browser and selected by folder/name references in the route JSON.
  The file is user-provided reference material, not official documentation;
  OpenStreetMap tiles provide the map background and require an internet
  connection. KML tracks are drawn as supplied; the app does not invent
  connecting legs where the KML has no geometry.

## Issue reporting

The Contact page (and the small "Report an issue" links on wiki pages, chair fly cards and quiz questions) posts to the Static Web Apps function in `api/`, which opens a GitHub issue labelled `user-report`. Configure these in the Static Web App's Environment variables: `GITHUB_TOKEN` (fine-grained token, Issues: read/write on this repo only) and `GITHUB_REPO` (`owner/name`). The form doesn't work under plain `npm run dev` since `/api` isn't served; use the SWA CLI to test it locally.

## Saved progress

The chair fly route and any quiz in progress are saved in the browser's `localStorage` (keys `tw4:chairfly` and `tw4:quiz`), so they survive closing the tab. Nothing is sent to a server. "New route", "Quit" and finishing a quiz clear it. Bump `SAVE_VERSION` / `QUIZ_VERSION` when the saved shapes change.

## Analytics

Page views are tracked with Azure Application Insights (cookie-free) when the `VITE_APPINSIGHTS_CONNECTION_STRING` GitHub secret is set. Without it, no analytics code runs.

## License

The code is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE): free for personal and other noncommercial use, with commercial rights reserved by the author. The license covers the code only.

It does not cover the course-rules map data in `kml/` (credited to Francis Chval, with no license of its own) or the SOP material the content is based on. Those remain under their original owners' terms.

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

The production site is generated in `dist/`, ready to configure as the app artifact for Azure Static Web Apps.




