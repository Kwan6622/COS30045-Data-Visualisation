# Global Incarceration Rates — Interactive Choropleth & Bar-Chart Explorer

An interactive vanilla HTML/CSS/JavaScript data visualization built with **D3.js v7** and **TopoJSON** that explores global incarceration rates per `100,000` people across sovereign nations, constituent administrations, and overseas territories.

---

## Overview and Core Capabilities

This project visualizes prison population rates per `100,000` inhabitants compiled by the **World Prison Brief (WPB)** / **Institute for Crime & Justice Policy Research (ICPR)**. Every geographic polygon, marker, search suggestion, bar-chart row, tooltip, and sidebar detail view binds to a single canonical jurisdiction identifier (`iso`):

- **Disaggregated Choropleth Cartography (`d3.geoNaturalEarth1`)**:
  - Splits composite `MultiPolygon` features where overseas territories are merged with parent states in Natural Earth (for example, French Guiana `GUF` in South America is disaggregated from mainland France `FRA`, and Svalbard `SJM` is disaggregated from mainland Norway `NOR`).
  - Uses a dedicated top-most SVG `<g id="focus-layer">` with `1.1px` `non-scaling-stroke` outlines so every edge of selected enclaves or bordered nations (such as Mongolia `MNG` and Lesotho `LSO`) renders cleanly above neighboring polygons.
  - Supports smooth pan/zoom with `scaleExtent([1, 16])` and dynamic zoom-compensated SVG labels.
- **Three-Tier Jurisdiction Taxonomy & Distinct Marker Geometry**:
  - `"sovereign"` and `"constituent"` records (including `United Kingdom: Scotland (GBR-SCT)`, `United Kingdom: Northern Ireland (GBR-NIR)`, and `United Kingdom: England and Wales (GBR)`) render circular markers (`<circle class="sovereign-marker">`).
  - `"overseas_autonomous"` records (including French, UK, US, Dutch, Danish, Chinese SAR, and Associated State territories) render square markers (`<rect class="territory-marker">`) centered on their primary land centroids (including Greenland `GRL`, French Guiana `GUF`, Puerto Rico `PRI`, and New Caledonia `NCL`), paired with transparent hit targets of at least `4px` effective radius across all zoom levels.
- **Pinned-Sidebar State Lock & Decoupled Hover Tooltip**:
  - Clicking or keyboard-activating any jurisdiction pins it (`pinnedJurisdictionId`), zooms the map, and locks the right-hand sidebar (`#details-panel`) to that jurisdiction.
  - While a jurisdiction is pinned, hovering over other jurisdictions updates only the floating tooltip (`#shared-floating-tooltip`) and hover outline without overwriting the pinned sidebar dashboard.
  - Clicking the ocean background, `Unpin ×`, or `Reset view` clears the pin.
- **Geopolitical & Historical Blocs & Unified Filter Toolbar**:
  - Filter by **Geopolitical & Historical Blocs** (`All / Reset`, `NATO`, `Post-Soviet States`, `Former Yugoslavia`, `OECD`, `ASEAN`) intersected with **Continent**, **Jurisdiction type**, **Rate range** (`< 100`, `100–300`, `300–600`, `600+`), and **Sort** (`Highest Rate`, `Lowest Rate`, `Alphabetical (A–Z)`).
  - Active filters dim non-matching map geometry to `opacity: 0.15`, filter the responsive D3 horizontal bar chart (`Show Top 15` / `Show All`), and update telemetry in the format `Showing X jurisdictions in [Bloc] — Median Rate: Y per 100k` (Where `X` counts matched jurisdictions with finite numeric rates).
- **Five-Step Choropleth Ramp, No Data Hatching & Color-Vision Accessibility Presets**:
  - **Default (Orange–Red–Purple)**: `['#FEE6D9', '#FCA289', '#F55B4B', '#C51B7D', '#67001F']`
  - **Protanomaly (Red-Weak)**: `['#F0F0F0', '#E69F00', '#D55E00', '#CC79A7', '#004949']`
  - **Deuteranomaly (Green-Weak)**: `['#56B4E9', '#F0E442', '#E69F00', '#D55E00', '#111111']`
  - **Tritanomaly (Blue-Weak)**: `['#FFFFFF', '#E5323B', '#B50D5F', '#4B0082', '#2E4052']`
  - **No Data (`N/A`)**: Rendered with a diagonal SVG hatch pattern (`#pattern-no-data`) over `#E2E8F0` in light mode and `#2D3748` in dark mode across both polygons and markers, and excluded from all numeric rankings and medians.

---

## Tech Stack

- **D3.js v7** (`d3.geoNaturalEarth1`, `d3.geoPath`, `d3.zoom`, `d3.scaleLinear`, keyed data joins, transitions)
- **TopoJSON Client v3** & **World Atlas 110m** (`world-atlas@2/countries-110m.json`)
- **Layered SVG Architecture** (`.countries-layer`, `#focus-layer`, `.territories-layer`, `.selected-jurisdiction-label`)
- **Vanilla HTML5 / CSS3 / ES6+ JavaScript** (zero framework or build-bundler overhead)
- **Node.js Built-in Test Runner (`node:test`)** for automated data, rendering, and state synchronization verification

---

## Repository Structure and Data Files

```text
incarceration_rate_project/
├── index.html                      # Main application shell, controls, legend, map, bar chart, and sidebar
├── README.md                       # Project documentation, setup, and test instructions
├── CHANGELOG.md                    # Keep a Changelog release history ([0.1.0] - [0.3.0])
├── docs/
│   └── METHODOLOGY.md              # Detailed methodology, territory disaggregation, taxonomy & No Data policy
├── css/
│   ├── base.css                    # Foundational reset, typography, and screen-reader utilities
│   └── visualisation.css           # Theme variables, SVG layers, markers, toolbar, and responsive layout
├── data/
│   ├── prison_pop_rate.csv         # World Prison Brief dataset (256 records: Country, rate, Continent)
│   └── jurisdiction_mapping.json   # Canonical ISO mappings, taxonomy, bloc memberships, and disaggregation rules
├── js/
│   ├── shared-constants.js         # Centralized state, palettes, taxonomy/bloc helpers, and pure filter functions
│   ├── map.js                      # Projection, MultiPolygon disaggregation, focus layer, markers, and zoom
│   ├── interactions.js             # Pinned/hover state machine, legend, bloc/toolbar filters, and D3 bar chart
│   └── load-data.js                # CSV + mapping JSON loader and initialization bootstrap
└── tests/
    └── incarceration_map.test.js   # Automated test suite for data integrity, SVG binding, and state lock
```

- **`data/prison_pop_rate.csv`**: Contains the 256 World Prison Brief jurisdiction rows (`Country`, `Prison population rate`, `Continent`).
- **`data/jurisdiction_mapping.json`**: External mapping configuration that resolves CSV country names and Natural Earth feature IDs/names to canonical `iso` codes, defines the 3-tier `taxonomy` (`sovereign`, `constituent`, `overseas_autonomous`), configures `blocMemberships` (`NATO`, `Post-Soviet States`, `Former Yugoslavia`, `OECD`, `ASEAN`), defines `polygonDisaggregationRules` (`FRA` -> `GUF`, `NOR` -> `SJM`), and stores `markerCoordinatesByIso` and `labelAnchorByIso`.

---

## Prerequisites and Local Execution

Because browsers block `fetch` / `d3.csv` and `d3.json` requests over `file://` URLs, serve the `incarceration_rate_project` directory over a local HTTP server:

### Option 1: Python HTTP Server

```bash
cd incarceration_rate_project
python3 -m http.server 8000
# Or on Windows where Python is aliased as `python`:
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: Node.js `npx serve`

```bash
cd incarceration_rate_project
npx serve . -l 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## Running Automated Tests

The test suite (`tests/incarceration_map.test.js`) uses Node's built-in test runner (`node:test`) and requires no external npm packages:

```bash
cd incarceration_rate_project
node --test tests/incarceration_map.test.js
```

To also run a syntax check across all JavaScript modules:

```bash
node --check js/shared-constants.js
node --check js/map.js
node --check js/interactions.js
node --check js/load-data.js
```

---

## Data Source Attribution

- **Source**: [Institute for Crime & Justice Policy Research (ICPR), World Prison Brief — Highest to Lowest Prison Population Rate](https://www.prisonstudies.org/world-prison-data/highest-lowest/highest-lowest-prison-population-rate).
- See [docs/METHODOLOGY.md](./docs/METHODOLOGY.md) for full details on territory disaggregation, canonical ID resolution, taxonomy rules, and the No Data policy.
