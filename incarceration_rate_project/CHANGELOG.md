# Changelog

All notable changes to the **Global Incarceration Rates** visualization project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-11-03 - Pie Chart Absolute Population Explorer, Dynamic Center Sums & Surface Elevation

### Added
- **Dynamic Incarcerated Population Donut Center**:
  - Added real-time population sum calculation to the donut chart center (`.pie-center`), displaying both the active filter scope (e.g. `Global total`, `Africa`, `Europe`, `Sovereign Nations`, or search query) and exact incarcerated sum (e.g., `11,433,365 incarcerated`).
  - Added interactive slice selection: clicking a slice, callout label, leader line, or data table row pulls the slice out by 7px, applies a contrast border, dims other slices and labels to `0.33` opacity, and updates the center to the individual bloc's population count and percentage share.
  - Added support for clearing selection via center click, chart background click, re-clicking the selected slice, or pressing `Escape`.
- **Pie View Contextual Toolbar & Filter Decoupling**:
  - Automatically hidden controls not applicable to absolute headcounts when switching to Pie Chart view (`Geopolitical Blocs`, `Rate range`, `Sort`, and `Top 15` toggle).
  - Ensured pie chart aggregation operates strictly on the active continent, jurisdiction type, and search query filters without being constrained by rate range or bloc selections.
- **Micro-Slice Callouts & Non-Crossing Radial Leader Lines**:
  - Enforced minimum angular span (`0.036` rad) for tiny slices such as Former Yugoslavia (`0.1%`), ensuring all slices have clickable hit targets.
  - Implemented stepped radial leader lines (`outerRimArc` at `radius * 1.01`) and collision-avoidance layout in `positionPieLabels`, eliminating label/leader-line overlap between Post-Soviet States and Former Yugoslavia.
- **Light-Mode Surface Contrast & Section Elevation**:
  - Elevated page sections (`.site-header`, `.intro`, `.control-bar`, `.legend-section`, `.entity-legend`, `.map-card`, `.details-panel`, `.methodology`, `.site-footer`) with distinct `#FFFFFF` backgrounds, `1px solid #94A3B8` borders, and elevation drop-shadows against a tinted `#E4EBF5` page canvas.
  - Styled filter toolbar and annotation panels with `#EEF2F8` subtle backgrounds and distinct control borders for clear visual boundaries in light mode.

### Fixed
- Fixed runtime `TypeError` in `updatePieSelection` where `.classed()` was called on a D3 Transition instead of Selection, restoring donut center text rendering.
- Fixed table row selection sync in `#pie-data-table` and bound click events to table rows.

## [0.3.0] - 2026-11-02 - Geopolitical Blocs, Sovereignty Types & State Lock

### Added
- **Canonical Jurisdiction Schema & External Mapping (`data/jurisdiction_mapping.json`)**:
  - Assigned unique canonical `iso` codes (ISO-3 or documented fallback codes including `BES`, `COK`, `NIU`, `GBR-SCT`, `GBR-NIR`, `BIH-SRP`, and `XKX`), strict `jurisdiction_type` taxonomy (`"sovereign"`, `"constituent"`, `"overseas_autonomous"`), and `blocs: string[]` memberships to all 256 dataset records.
  - Added MultiPolygon disaggregation rules so French Guiana's South American polygon resolves to `GUF` (not `FRA`) and Svalbard resolves to `SJM` (not `NOR`).
- **Geopolitical & Historical Blocs Filter (`NATO`, `Post-Soviet States`, `Former Yugoslavia`, `OECD`, `ASEAN`, `All / Reset`)**:
  - Added synchronized bloc filter controls in both the top control bar and the lower unified filter toolbar.
  - Dimming non-member map jurisdictions to `opacity: 0.15` while filtering the horizontal bar chart and showing the dataset-wide `Global Median`.
- **Taxonomy-Driven Marker Geometry & Dedicated SVG Border Layers**:
  - Rendered `"sovereign"` and `"constituent"` records (including Scotland and Northern Ireland) as `<circle class="sovereign-marker">` and `"overseas_autonomous"` records as `<rect class="territory-marker">` centered on primary land centroids (including Greenland, French Guiana, Puerto Rico, and New Caledonia).
  - Replaced per-country border strokes and the selected-country outline box with shared global internal/coastline border layers plus `<g id="selected-borders">`. Selected borders use non-scaling strokes and include every split country part.
  - Configured D3 zoom with `scaleExtent([1, 16])` and minimum `4px` CSS hit-target radii across all zoom levels.
- **Five-Step Choropleth Ramp & Color-Vision Accessibility Presets**:
  - Updated default 5-step ramp to `['#FEE6D9', '#FCA289', '#F55B4B', '#C51B7D', '#67001F']` and added `Protanomaly (Red-Weak)`, `Deuteranomaly (Green-Weak)`, and `Tritanomaly (Blue-Weak)` 5-color ramps, plus light (`#E2E8F0`) and dark (`#2D3748`) diagonal hatch treatments for `No Data`.
- **Pinned-Sidebar State Decoupling**:
  - Decoupled `pinnedJurisdictionId` from `hoveredJurisdictionId` so hovering another jurisdiction while one is pinned updates only the floating tooltip without overwriting the pinned sidebar dashboard.
- **Automated Test Suite & Methodology Documentation**:
  - Added `tests/incarceration_map.test.js` (runnable via `node --test`) and `docs/METHODOLOGY.md`.

## [0.2.0] - 2026-11-02 - Interactive Explorer & Accessibility

### Added
- Replaced the static lower leaderboard table with an animated, responsive D3/SVG horizontal bar chart (`#jurisdiction-bar-chart`) with `Show Top 15` and `Show All` segmented view modes.
- Added a compact unified filter toolbar (`Continent`, `Jurisdiction type`, `Rate range`, `Sort`, and `Reset Filters`).
- Added dark-mode contrast refinements, autocomplete country search with keyboard navigation, dynamic zoom country labels, and non-blocking glossary hover popovers.

### Removed
- Removed legacy Week 6 TV hardware boilerplate files (`js/histogram.js`, `js/scatterplot.js`), blocking glossary modal overlays, and CSV export controls.

## [0.1.0] - 2026-11-02 - Initial Prototype

### Added
- Baseline D3.js v7 world choropleth map (`d3.geoNaturalEarth1`) displaying prison population rates per 100,000 people.
- Stepped gold palette, basic hover tooltips, and static summary tables.
