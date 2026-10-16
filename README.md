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
  `src/routePlanner.js`, separate from the presentation.
- All values are demonstration inputs. The diagram has no geographic
  coordinates, and no SOP, KML, or other course-rule source documents are
  loaded into this application. Headings, altitudes, procedures, and
  communications are intentionally placeholders—not flight guidance.

The prototype currently filters out a second stop of the same category. It
does not yet encode specific route compatibility or procedure rules; those
must be established from reviewed, authoritative sources before real data is
added.

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
