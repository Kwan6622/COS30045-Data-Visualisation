# Data Methodology, Cartographic Disaggregation & Taxonomy

## 1. Data Source: ICPR / World Prison Brief

All incarceration rate figures in this project are sourced from the **World Prison Brief (WPB)**, compiled and maintained by the **Institute for Crime & Justice Policy Research (ICPR)** at Birkbeck, University of London:

- **Primary Source**: [World Prison Brief — Highest to Lowest Prison Population Rate](https://www.prisonstudies.org/world-prison-data/highest-lowest/highest-lowest-prison-population-rate)
- **Dataset File**: `data/prison_pop_rate.csv`
- **Metric Definition**: Prison population rate per `100,000` of the general national or territorial population (`Prison population rate`). Because national populations vary across several orders of magnitude, standardizing per `100,000` inhabitants provides a comparable indicator of incarceration intensity across jurisdictions.

---

## 2. Territory-Disaggregation Policy

The World Prison Brief reports autonomous territories, crown dependencies, insular areas, and overseas departments separately from their administering sovereign states because they operate distinct judicial and correctional administrations with markedly different incarceration rates.

Standard low-resolution global boundary files (`world-atlas@2/countries-110m.json`) often merge overseas territories into the `MultiPolygon` geometry of their parent sovereign state. Without explicit disaggregation, clicking or hovering an overseas landmass would erroneously report the parent state's incarceration rate:

- **French Guiana (`GUF`) vs. France (`FRA`)**: In `countries-110m.json`, feature `250` (`France`) is a `MultiPolygon` that includes both European mainland France (rate `131` per 100k) and French Guiana in South America (rate `284` per 100k). Using the bounding-box disaggregation rules in `data/jurisdiction_mapping.json`, French Guiana's South American polygon ring (`lon: [-56, -50], lat: [1, 7]`) is extracted at runtime into an independent GeoJSON Polygon feature bound to canonical ID `GUF`, while mainland France and Corsica remain bound to `FRA`.
- **Svalbard and Jan Mayen (`SJM`) vs. Norway (`NOR`)**: Arctic polygon rings (`lon: [10, 35], lat: [74, 82]`) are similarly disaggregated from mainland Norway (`NOR`) to `SJM`.
- **Independently Coded Atlas Polygons**: Large territories that already carry distinct numeric feature IDs in Natural Earth—such as **Greenland (`GRL`, ID `304`, rate `294`)**, **Puerto Rico (`PRI`, ID `630`, rate `177`)**, **New Caledonia (`NCL`, ID `540`, rate `188`)**, **Falkland Islands (`FLK`, ID `238`)**, **French Southern and Antarctic Lands (`ATF`, ID `260`)**, and **Western Sahara (`ESH`, ID `732`)**—are mapped directly to their own canonical territory IDs rather than Denmark, the United States, France, the United Kingdom, or Morocco.

---

## 3. Canonical IDs and External Geographic Mapping (`data/jurisdiction_mapping.json`)

Every jurisdiction record and every interactive DOM/SVG element (`.country` paths, `.sovereign-marker` circles, `.territory-marker` squares, `.jurisdiction-hit-target` buffers, `.chart-bar-group` bars, search results, tooltips, and the pinned sidebar) binds to one unique **canonical `iso` identifier**.

All exceptional geographic-feature-to-jurisdiction mappings and metadata are centralized in `data/jurisdiction_mapping.json` (with an identical synchronous fallback in `js/shared-constants.js`):

- **ISO-3 Standard Codes**: Used wherever an official ISO 3166-1 alpha-3 code exists (`USA`, `FRA`, `GUF`, `GRL`, `PRI`, `NCL`, `MNG`, `LSO`, `SSD`, `PRK`, etc.).
- **Documented Fallback Codes**: Used where an entity is reported separately by the World Prison Brief or lacks a standard sovereign ISO-3 assignment:
  - `BES`: Bonaire, Sint Eustatius and Saba (Caribbean Netherlands)
  - `COK`: Cook Islands (Associated State)
  - `NIU`: Niue (Associated State)
  - `GBR`: United Kingdom: England and Wales
  - `GBR-SCT`: United Kingdom: Scotland
  - `GBR-NIR`: United Kingdom: Northern Ireland
  - `BIH`: Bosnia and Herzegovina: Federation
  - `BIH-SRP`: Bosnia and Herzegovina: Republika Srpska
  - `XKX`: Kosovo/Kosova
  - `XAD`, `XNC`, `XSO`, `XTR`, `XAB`, `XOS`: Akrotiri and Dhekelia, Northern Cyprus, Somaliland, Transnistria, Abkhazia, and South Ossetia.

---

## 4. Jurisdiction Taxonomy and Marker Geometry

Every record in the enriched dataset is assigned strictly one `jurisdiction_type`:

1. **`"sovereign"`**:
   - Sovereign UN member and observer states (`USA`, `FRA`, `DEU`, `JPN`, `MNG`, `LSO`, `SSD`, `PSE`, `VAT`, etc.).
   - Rendered on the map using circular markers (`<circle class="sovereign-marker">`) when point targets apply.
2. **`"constituent"`**:
   - Distinct constituent judicial/correctional administrations within a sovereign state reported separately by the World Prison Brief: **England & Wales (`GBR`)**, **Scotland (`GBR-SCT`)**, **Northern Ireland (`GBR-NIR`)**, **Bosnia and Herzegovina: Federation (`BIH`)**, and **Republika Srpska (`BIH-SRP`)**.
   - Rendered using sovereign-equivalent circular markers (`<circle class="sovereign-marker">`) and never described or styled as overseas dependencies.
3. **`"overseas_autonomous"`**:
   - Non-sovereign overseas departments, crown dependencies, insular areas, special administrative regions, and associated states:
     - **France**: `GUF`, `GLP`, `MTQ`, `MYT`, `REU`, `PYF`, `NCL`, `MAF`, `BLM`, `SPM`, `WLF`, `ATF`
     - **United Kingdom**: `BMU`, `CYM`, `VGB`, `GIB`, `AIA`, `MSR`, `TCA`, `FLK`, `SHN`, `JEY`, `GGY`, `IMN`, `PCN`, `IOT`, `SGS`, `XAD`
     - **United States**: `PRI`, `GUM`, `VIR`, `ASM`, `MNP`, `UMI`
     - **Kingdom of the Netherlands**: `ABW`, `CUW`, `SXM`, `BES`
     - **Kingdom of Denmark**: `GRL`, `FRO`
     - **China SARs**: `HKG`, `MAC`
     - **Associated States & External Territories**: `COK`, `NIU`, `TKL`, `NFK`, `CXR`, `CCK`, `ALA`, `SJM`, `ESH`
   - Rendered on the map using square markers (`<rect class="territory-marker">`) centered on the primary land centroid (including large territories such as Greenland, French Guiana, Puerto Rico, and New Caledonia) and denoted with a matching SVG square in the horizontal bar chart.

---

## 5. No Data Policy

Thirty-two jurisdictions in `data/prison_pop_rate.csv` (such as `North Korea (PRK)`, `Eritrea (ERI)`, `Vatican City (VAT)`, `Western Sahara (ESH)`, and several small overseas territories) carry `N/A` in the source dataset because verified prison population rates are unavailable. Note that where a jurisdiction has a valid numeric rate in the CSV (for example, `South Sudan (SSD)` with a reported rate of `58` per 100,000), its numeric rate is rendered; whenever a record has `N/A` or missing rate data, it is normalized to `rate: null`. Zero (`0`), if present in a source update, is treated as a valid numeric rate rather than missing.

- **Cartographic Retention**: `No Data` jurisdictions remain in `appState.data` and remain interactive on the map so landmass geometry is never dropped.
- **Visual Encoding**: Both polygons and markers with `rate === null` are filled with `url(#pattern-no-data)`—a diagonal SVG hatch pattern over `#E2E8F0` in light mode and `#2D3748` in dark mode.
- **Statistical Exclusion**: `No Data` records (`!Number.isFinite(record.rate)`) are strictly excluded from ordinal rankings (`appState.rankedData`), the horizontal bar chart (`getFilteredJurisdictions()`), and the dataset-wide `Global Median` (`computeMedianRate()`).

---

## 6. Geopolitical & Historical Bloc Memberships

Each jurisdiction record includes a `blocs: string[]` array populated from `blocMemberships` in `data/jurisdiction_mapping.json`. A jurisdiction may belong to multiple blocs simultaneously (e.g., `FRA` and `USA` belong to both `NATO` and `OECD`; `EST`, `LVA`, and `LTU` belong to `NATO`, `OECD`, and `Post-Soviet States`; `HRV`, `MNE`, `MKD`, and `SVN` belong to both `NATO` and `Former Yugoslavia`):

- **NATO (32 members)**: `ALB`, `BEL`, `BGR`, `CAN`, `HRV`, `CZE`, `DNK`, `EST`, `FIN`, `FRA`, `DEU`, `GRC`, `HUN`, `ISL`, `ITA`, `LVA`, `LTU`, `LUX`, `MNE`, `NLD`, `MKD`, `NOR`, `POL`, `PRT`, `ROU`, `SVK`, `SVN`, `ESP`, `SWE`, `TUR`, `GBR`, `USA`
- **Post-Soviet States (15 members)**: `ARM`, `AZE`, `BLR`, `EST`, `GEO`, `KAZ`, `KGZ`, `LVA`, `LTU`, `MDA`, `RUS`, `TJK`, `TKM`, `UKR`, `UZB`
- **Former Yugoslavia (7 members)**: `BIH`, `HRV`, `XKX`, `MNE`, `MKD`, `SRB`, `SVN`
- **OECD (38 members)**: `AUS`, `AUT`, `BEL`, `CAN`, `CHL`, `COL`, `CRI`, `CZE`, `DNK`, `EST`, `FIN`, `FRA`, `DEU`, `GRC`, `HUN`, `ISL`, `IRL`, `ISR`, `ITA`, `JPN`, `KOR`, `LVA`, `LTU`, `LUX`, `MEX`, `NLD`, `NZL`, `NOR`, `POL`, `PRT`, `SVK`, `SVN`, `ESP`, `SWE`, `CHE`, `TUR`, `GBR`, `USA`
- **ASEAN (10 members)**: `BRN`, `KHM`, `IDN`, `LAO`, `MYS`, `MMR`, `PHL`, `SGP`, `THA`, `VNM`

To add a new bloc (such as `EU` or `Mercosur`), add its key and array of canonical ISO-3 codes to `blocMemberships` in `data/jurisdiction_mapping.json` and `BLOC_OPTIONS` in `js/shared-constants.js`.
