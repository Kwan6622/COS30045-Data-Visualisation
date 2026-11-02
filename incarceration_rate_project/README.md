# Global Incarceration Rates — Interactive Choropleth, Bar & Population Explorer

An interactive vanilla HTML/CSS/JavaScript data visualization built with **D3.js v7** and **TopoJSON** that explores global incarceration rates per `100,000` people across sovereign nations, constituent administrations, and overseas territories.

The explorer also provides a geopolitical population donut using absolute prisoner counts from `data/prison_population_total.csv`; it does not derive counts from rates.

---

## Overview and Core Capabilities

This project visualizes prison population rates per `100,000` inhabitants compiled by the **World Prison Brief (WPB)** / **Institute for Crime & Justice Policy Research (ICPR)**. Every geographic polygon, marker, search suggestion, bar-chart row, tooltip, and sidebar detail view binds to a single canonical jurisdiction identifier (`iso`):

- **Disaggregated Choropleth Cartography (`d3.geoNaturalEarth1`)**:
  - Splits composite `MultiPolygon` features where overseas territories are merged with parent states in Natural Earth (for example, French Guiana `GUF` in South America is disaggregated from mainland France `FRA`, and Svalbard `SJM` is disaggregated from mainland Norway `NOR`).
  - Uses fixed SVG layers for country fills, shared global borders, markers, selected borders, and labels. Selected enclaves and bordered nations (such as Mongolia `MNG` and Lesotho `LSO`) use `2px` non-scaling selected-border segments above the shared border layer.
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
  - Active filters dim non-matching map geometry to `opacity: 0.15`, filter the responsive D3 horizontal bar chart (`Show Top 15` / `Show All`), and show the dataset-wide `Global Median` benchmark (where `X` counts matched jurisdictions with finite numeric rates).
  - **Dual Chart Modes (Bar vs Pie)**:
    - In **Bar Chart** mode: Explore ranked rates per 100,000 across jurisdictions, with rate-tier swatches, scrollable list, top 15 toggle, and dedicated No Data review mode.
    - In **Pie / Donut Chart** mode: Explores absolute incarcerated prisoner counts by geopolitical bloc (`NATO`, `OECD`, `ASEAN`, `Post-Soviet States`, `Former Yugoslavia`, `Other / Rest of the World`).
    - The donut center dynamically displays the total sum of incarcerated persons for the active filter scope (e.g. `Global total`, `Africa`, `Europe`, `Sovereign Nations Only`) and updates immediately when changing continent or jurisdiction type filters.
    - Slices, callout labels, leader lines, and table rows are fully interactive: clicking any slice pulls it out with a contrast outline, dims other slices, updates the center to the slice's individual count and share of total, and highlights the corresponding row in the accompanying data table.
    - When viewing the Pie Chart, controls irrelevant to absolute population counts (Geopolitical Bloc filter, Rate Range, Sort, and Top 15 toggle) are automatically hidden to avoid confusing rate vs headcount metrics.
- **Five-Step Choropleth Ramp, No Data Hatching & Color-Vision Accessibility Presets**:
  - **Default (Sequential Warm Red/Orange)**: `['#f8c3ab', '#fcaa8d', '#FB6A4A', '#DE2D26', '#A50F15']`
  - **Colorblind Mode (High-Contrast Viridis/Cividis Light-to-Dark)**: `['#FEE838', '#BCAF6F', '#7C7B78', '#35456C', '#00224E']`
  - **No Data (`N/A`)**: Rendered with a diagonal SVG hatch pattern (`#pattern-no-data`) over `#E2E8F0` in light mode and `#2D3748` in dark mode across both polygons and markers, and excluded from all numeric rankings and medians.
  - **Show N/A Data**: In `Show All`, switches the explorer to a filtered list containing only jurisdictions without numeric data; rate range and sort controls are disabled, and unchecking restores the numeric chart and prior filter values.
- **High-Contrast Surface Hierarchy & Light/Dark Theme Support**:
  - Designed with distinct card surfaces (`#FFFFFF` in light mode, `#131c2e` in dark mode) and borders (`1px solid #94A3B8`) on a tinted canvas (`#E4EBF5` in light mode, `#0b1120` in dark mode) ensuring every section (header, intro, controls, legend, map card, sidebar, methodology, footer) stands out clearly against the page background.

---

## Tech Stack

- **D3.js v7** (`d3.geoNaturalEarth1`, `d3.geoPath`, `d3.zoom`, `d3.scaleLinear`, keyed data joins, transitions)
- **TopoJSON Client v3** & **World Atlas 110m** (`world-atlas@2/countries-110m.json`)
- **Layered SVG Architecture** (`.countries-layer`, `#global-borders`, `.territories-layer`, `#selected-borders`, `.selected-jurisdiction-label`)
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
│   ├── map.js                      # Projection, MultiPolygon disaggregation, shared borders, markers, and zoom
│   ├── interactions.js             # Pinned/hover state machine, legend, bloc/toolbar filters, and D3 bar chart
│   └── load-data.js                # CSV + mapping JSON loader and initialization bootstrap
└── tests/
    └── incarceration_map.test.js   # Automated test suite for data integrity, SVG binding, and state lock
```

- **`data/prison_pop_rate.csv`**: Contains the 256 World Prison Brief jurisdiction rows (`Country`, `Prison population rate`, `Continent`).
- **`data/prison_population_total.csv`**: Contains country-keyed absolute incarcerated-person counts (`Country / Jurisdiction`, `Prison population total`) used only by the geopolitical pie chart. Rows without a valid count are excluded from its global denominator.
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
