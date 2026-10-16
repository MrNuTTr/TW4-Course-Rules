# Course Rules Route Planner prototype

This project starts from Microsoft's [Azure Static Web Apps React basic
template](https://github.com/staticwebdev/react-basic), documented in the
[Azure Static Web Apps React quickstart](https://learn.microsoft.com/azure/static-web-apps/getting-started?tabs=react).
The starter was modernized from Create React App to Vite; the original
`staticwebapp.config.json` is retained for Azure Static Web Apps navigation
fallback behavior.

## Prototype scope

- Mobile-friendly route builder for KNGP departure, a selected sample runway,
  one required work-area/OLF stop, an optional stop of the opposite type, and
  an automatically generated return step to KNGP.
- A schematic sequence display and selectable step-by-step cards.
- Input options and route generation live in `src/demoData.js` and
  `src/routePlanner.js`, separate from the presentation. The selected
  KNGP Runway 13L → KINGS 4 Area 3 High → NOLF Goliad → KNGP test case has
  source-cited draft extracts in `src/testRouteData.js`.
- Only that exact test case has source-derived briefing text. Other selections
  remain unpopulated and must not inherit its content. KNGP arrival flow/runway
  is intentionally unresolved in the test case.
- The schematic has no geographic coordinates. Private source PDFs are not
  bundled with the application; the on-screen citations name their revisions
  and pages. Extracted text is a draft for UI evaluation, not approved flight
  guidance, and must be checked by a qualified reviewer against current
  authorized material before operational use.

The prototype currently filters out a second stop of the same category. That
is only a UI rule, not an operational route-compatibility determination.
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
