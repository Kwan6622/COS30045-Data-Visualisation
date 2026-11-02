# Changelog

All notable changes to the **Global Incarceration Rates** visualization project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-11-02 - Geopolitical Blocs, Sovereignty Types & State Lock

### Added
- **Canonical Jurisdiction Schema & External Mapping (`data/jurisdiction_mapping.json`)**:
  - Assigned unique canonical `iso` codes (ISO-3 or documented fallback codes including `BES`, `COK`, `NIU`, `GBR-SCT`, `GBR-NIR`, `BIH-SRP`, and `XKX`), strict `jurisdiction_type` taxonomy (`"sovereign"`, `"constituent"`, `"overseas_autonomous"`), and `blocs: string[]` memberships to all 256 dataset records.
  - Added MultiPolygon disaggregation rules so French Guiana's South American polygon resolves to `GUF` (not `FRA`) and Svalbard resolves to `SJM` (not `NOR`).
- **Geopolitical & Historical Blocs Filter (`NATO`, `Post-Soviet States`, `Former Yugoslavia`, `OECD`, `ASEAN`, `All / Reset`)**:
  - Added synchronized bloc filter controls in both the top control bar and the lower unified filter toolbar.
  - Dimming non-member map jurisdictions to `opacity: 0.15` while filtering the horizontal bar chart and showing the dataset-wide `Global Median`.
- **Taxonomy-Driven Marker Geometry & Dedicated SVG Focus Layer (`<g id="focus-layer">`)**:
  - Rendered `"sovereign"` and `"constituent"` records (including Scotland and Northern Ireland) as `<circle class="sovereign-marker">` and `"overseas_autonomous"` records as `<rect class="territory-marker">` centered on primary land centroids (including Greenland, French Guiana, Puerto Rico, and New Caledonia).
  - Added `<g id="focus-layer">` above `.countries-layer` with `1.1px` `non-scaling-stroke` outlines so enclaves and bordered nations (such as Mongolia and Lesotho) are never partially occluded by neighboring polygons.
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
