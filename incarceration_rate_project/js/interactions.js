/******************************************************************************/
/* Global Incarceration Rates — State Synchronization, Filters & Bar Chart    */
/******************************************************************************/

/**
 * Escape text safely before inserting into HTML templates.
 */
const escapeHtml = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Human-readable taxonomy label. Constituent jurisdictions (Scotland, Northern Ireland,
 * England & Wales, Bosnia entities) are never described as overseas dependencies.
 */
const getJurisdictionCategoryLabel = row => {
    if (!row) return "Jurisdiction";
    switch (row.jurisdiction_type) {
        case "overseas_autonomous":
            return "Overseas / autonomous territory";
        case "constituent":
            return "Constituent jurisdiction";
        case "sovereign":
        default:
            return "Sovereign state";
    }
};

/**
 * Sync CSS custom properties with the active palette and light/dark theme.
 */
const applyPaletteThemeVariables = () => {
    if (typeof document === "undefined") return;
    const paletteObj = PALETTES[appState.palette] || PALETTES.default;
    const isDark = document.body.classList.contains("dark-mode");
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--accent", isDark ? paletteObj.accentDark : paletteObj.accent);
    rootStyle.setProperty("--bar", isDark ? paletteObj.accentDark : paletteObj.barDefault);
    rootStyle.setProperty("--bar-hover", paletteObj.barHover);
    rootStyle.setProperty("--bar-selected", paletteObj.barSelected);
    rootStyle.setProperty("--no-data-base", isDark ? NO_DATA_COLORS.darkBase : NO_DATA_COLORS.lightBase);
    rootStyle.setProperty("--no-data-stroke", isDark ? NO_DATA_COLORS.darkStroke : NO_DATA_COLORS.lightStroke);
};

/**
 * Non-blocking hover/focus tooltip for glossary terms ("incarceration", "jurisdiction").
 */
const setupGlossaryTooltips = () => {
    if (typeof document === "undefined") return;
    let popover = document.getElementById("glossary-popover");
    if (!popover) {
        popover = document.createElement("div");
        popover.id = "glossary-popover";
        popover.className = "glossary-popover";
        popover.setAttribute("role", "tooltip");
        popover.hidden = true;
        document.body.appendChild(popover);
    }

    const showGlossary = trigger => {
        const key = trigger.dataset.glossary;
        const entry = GLOSSARY_DEFINITIONS[key];
        if (!entry) return;

        popover.innerHTML = `<strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.text)}</span>`;
        popover.hidden = false;

        const rect = trigger.getBoundingClientRect();
        const popRect = popover.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;

        let left = rect.left + scrollX + rect.width / 2 - popRect.width / 2;
        left = Math.max(12, Math.min((window.innerWidth || 1024) - popRect.width - 12, left));

        let top = rect.bottom + scrollY + 8;
        if (rect.bottom + popRect.height + 16 > (window.innerHeight || 768)) {
            top = rect.top + scrollY - popRect.height - 8;
        }

        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
    };

    const hideGlossary = () => {
        popover.hidden = true;
    };

    document.querySelectorAll(".glossary-trigger").forEach(trigger => {
        if (trigger.dataset.boundGlossary === "true") return;
        trigger.dataset.boundGlossary = "true";
        trigger.setAttribute("aria-describedby", "glossary-popover");
        trigger.addEventListener("mouseenter", () => showGlossary(trigger));
        trigger.addEventListener("mouseleave", hideGlossary);
        trigger.addEventListener("focus", () => showGlossary(trigger));
        trigger.addEventListener("blur", hideGlossary);
        trigger.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                hideGlossary();
                trigger.blur();
            }
        });
    });
};

/**
 * Shared floating tooltip for map polygons, markers, and bar chart rows.
 */
const getOrCreateFloatingTooltip = () => {
    let tooltipEl = document.getElementById("shared-floating-tooltip");
    if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.id = "shared-floating-tooltip";
        tooltipEl.className = "map-tooltip";
        tooltipEl.setAttribute("role", "tooltip");
        tooltipEl.hidden = true;
        document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
};

const showFloatingTooltip = (event, row, feature) => {
    if (typeof document === "undefined") return;
    const tooltipEl = getOrCreateFloatingTooltip();
    const displayName = row?.country || feature?.properties?.name || "Unknown jurisdiction";
    const isoCode = row?.iso || resolveFeatureIso(feature, appState.mappingConfig) || "—";
    const hasRate = row && Number.isFinite(row.rate);
    const rankIndex = hasRate
        ? appState.rankedData.findIndex(item => item.iso === row.iso)
        : -1;
    const rankLabel = rankIndex >= 0 ? `#${rankIndex + 1} of ${appState.rankedData.length}` : "Unranked";
    const regionLabel = row ? regionForJurisdiction(row) : (feature?.properties?.name === "Antarctica" ? "Antarctica" : "—");
    const categoryLabel = getJurisdictionCategoryLabel(row);

    if (hasRate) {
        tooltipEl.innerHTML = `
            <div class="tooltip-title">${escapeHtml(displayName)} <span class="tooltip-iso">(${escapeHtml(isoCode)})</span></div>
            <div class="tooltip-rate"><strong>${d3.format(",")(row.rate)}</strong> per 100,000</div>
            <div class="tooltip-meta">Rank ${escapeHtml(rankLabel)} · ${escapeHtml(regionLabel)} · ${escapeHtml(categoryLabel)}</div>
        `;
    } else {
        tooltipEl.innerHTML = `
            <div class="tooltip-title">${escapeHtml(displayName)} <span class="tooltip-iso">(${escapeHtml(isoCode)})</span></div>
            <div class="tooltip-rate">No data</div>
            <div class="tooltip-meta">${escapeHtml(regionLabel)} · ${escapeHtml(categoryLabel)}</div>
        `;
    }

    tooltipEl.hidden = false;
    moveFloatingTooltip(event);
};

const moveFloatingTooltip = event => {
    if (typeof document === "undefined") return;
    const tooltipEl = document.getElementById("shared-floating-tooltip");
    if (!tooltipEl || tooltipEl.hidden || !event) return;

    const tipRect = tooltipEl.getBoundingClientRect();
    const viewportW = window.innerWidth || 1024;
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    let clientX = event.clientX;
    let clientY = event.clientY;

    if (!Number.isFinite(clientX) && event.target?.getBoundingClientRect) {
        const targetRect = event.target.getBoundingClientRect();
        clientX = targetRect.left + targetRect.width / 2;
        clientY = targetRect.top;
    }

    if (!Number.isFinite(clientX)) return;

    let left = clientX + scrollX + 14;
    if (clientX + tipRect.width + 24 > viewportW) {
        left = clientX + scrollX - tipRect.width - 14;
    }
    left = Math.max(scrollX + 8, left);

    let top = clientY + scrollY - tipRect.height - 10;
    if (clientY - tipRect.height - 14 < 0) {
        top = clientY + scrollY + 18;
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
};

const hideFloatingTooltip = () => {
    if (typeof document === "undefined") return;
    const tooltipEl = document.getElementById("shared-floating-tooltip");
    if (tooltipEl) {
        tooltipEl.hidden = true;
    }
};

/**
 * Resolve canonical { iso, row, feature } from any partial input.
 */
const resolveCanonicalEntity = (row, feature, explicitIso = null) => {
    const iso = explicitIso
        || row?.iso
        || resolveFeatureIso(feature, appState.mappingConfig)
        || (row?.country ? resolveCountryIso(row.country, appState.mappingConfig) : null);

    const resolvedRow = (iso && appState.dataByIso.get(iso))
        || row
        || getRowForFeature(feature)
        || null;

    const resolvedFeature = feature
        || (iso && appState.featuresByIso.get(iso))
        || (iso && appState.markersByIso.get(iso))
        || null;

    return { iso, row: resolvedRow, feature: resolvedFeature };
};

/**
 * Unified transient hover / focus handler.
 * When a jurisdiction is pinned (appState.pinnedJurisdictionId !== null), hovering another
 * jurisdiction updates ONLY the floating tooltip and hover highlights; it NEVER mutates sidebar data.
 */
const handleJurisdictionHover = (event, row, feature, explicitIso = null) => {
    const entity = resolveCanonicalEntity(row, feature, explicitIso);
    appState.hoveredJurisdictionId = entity.iso;
    hoveredJurisdiction = entity;
    appState.hoveredJurisdiction = entity;

    updateMapStyles();
    updateBarChartHighlightStates();
    showFloatingTooltip(event, entity.row, entity.feature);

    if (!appState.pinnedJurisdictionId) {
        renderDetailsPanel(entity.feature, entity.row, true);
    }
};

/**
 * Unified pointer exit / blur handler.
 * Clears transient hover state and tooltip without clearing the pinned selection.
 */
const handleJurisdictionLeave = () => {
    appState.hoveredJurisdictionId = null;
    hoveredJurisdiction = null;
    appState.hoveredJurisdiction = null;

    hideFloatingTooltip();
    updateMapStyles();
    updateBarChartHighlightStates();

    if (!appState.pinnedJurisdictionId) {
        renderDetailsPanel(null, null, false);
    }
};

/**
 * Unified persistent click / keyboard / search pinning handler.
 * Pins the jurisdiction by canonical ISO and updates the sidebar, focus layer, and zoom.
 */
const handleJurisdictionSelect = (row, feature, shouldZoom = true, explicitIso = null) => {
    const entity = resolveCanonicalEntity(row, feature, explicitIso);
    if (!entity.iso && !entity.row && !entity.feature) return;

    appState.pinnedJurisdictionId = entity.iso;
    selectedJurisdiction = entity;
    appState.selectedJurisdiction = entity;

    updateMapStyles();
    updateBarChartHighlightStates();
    renderDetailsPanel(entity.feature, entity.row, false);
    renderSelectedJurisdictionLabel(true);
    announceSelectionToScreenReader(entity.row, entity.feature);

    if (shouldZoom) {
        zoomToJurisdiction(entity.row, entity.feature);
    }
};

/**
 * Announce pinned selection changes to screen readers via polite live region.
 */
const announceSelectionToScreenReader = (row, feature) => {
    if (typeof document === "undefined") return;
    const announcer = document.getElementById("selection-announcer");
    if (!announcer) return;
    const name = row?.country || feature?.properties?.name || "Jurisdiction";
    const rateInfo = row && Number.isFinite(row.rate)
        ? `incarceration rate ${d3.format(",")(row.rate)} per 100,000`
        : "no incarceration rate data available";
    announcer.textContent = `Pinned ${name}, ${rateInfo}.`;
};

/**
 * Render the sidebar (#details-panel).
 */
const renderDetailsPanel = (feature, row, isTransientHover = false) => {
    const panel = d3.select("#details-panel");
    if (panel.empty()) return;

    if (!row && !feature) {
        panel.html(`
            <div class="panel-empty">
                <span class="panel-mark" aria-hidden="true">◎</span>
                <h2>Select a jurisdiction</h2>
                <p>Hover over any jurisdiction to preview its details, or click to pin the jurisdiction in this sidebar while continuing to explore the map.</p>
            </div>
        `);
        return;
    }

    const displayName = row?.country || feature?.properties?.name || "Unknown";
    const canonicalIso = row?.iso || resolveFeatureIso(feature, appState.mappingConfig) || "—";
    const isPinned = Boolean(appState.pinnedJurisdictionId && appState.pinnedJurisdictionId === canonicalIso);

    const kickerText = isPinned
        ? "Pinned jurisdiction"
        : (isTransientHover ? "Previewing jurisdiction" : "Selected jurisdiction");

    const clearSelectionBtnHtml = isPinned
        ? `<button type="button" id="clear-selection-btn" class="panel-clear-btn" aria-label="Clear pinned jurisdiction">Unpin ×</button>`
        : "";

    const regionName = row ? regionForJurisdiction(row) : (feature?.properties?.name === "Antarctica" ? "Antarctica" : "Unclassified");
    const jurisdictionCategory = getJurisdictionCategoryLabel(row);
    const blocsList = row && Array.isArray(row.blocs) && row.blocs.length > 0
        ? row.blocs.join(", ")
        : "None configured";

    if (!row || !Number.isFinite(row.rate)) {
        panel.html(`
            <div class="panel-header-row">
                <p class="panel-kicker">${escapeHtml(kickerText)}</p>
                ${clearSelectionBtnHtml}
            </div>
            <p class="panel-continent">${escapeHtml(regionName)} · ${escapeHtml(jurisdictionCategory)}</p>
            <h2 class="panel-title">${escapeHtml(displayName)}</h2>
            <div class="panel-iso">Canonical ISO: <strong>${escapeHtml(canonicalIso)}</strong></div>
            <p class="rate-number rate-missing">No data</p>
            <p class="rate-unit">No prison population rate reported in World Prison Brief dataset</p>
            <dl class="stat-list">
                <div class="stat-row"><dt>Global rank</dt><dd>Excluded (No data)</dd></div>
                <div class="stat-row"><dt>Jurisdiction type</dt><dd>${escapeHtml(jurisdictionCategory)}</dd></div>
                <div class="stat-row"><dt>Geopolitical blocs</dt><dd>${escapeHtml(blocsList)}</dd></div>
            </dl>
        `);
        panel.select("#clear-selection-btn").on("click", () => resetMapView());
        return;
    }

    const rankIndex = appState.rankedData.findIndex(item => item.iso === row.iso);
    const rankText = rankIndex >= 0 ? `#${rankIndex + 1} of ${appState.rankedData.length}` : "N/A";
    const globalMedian = appState.globalMedianRate || GLOBAL_MEDIAN_RATE;
    const continentRows = appState.data.filter(item =>
        item.continent === row.continent && Number.isFinite(item.rate)
    );
    const continentMedian = computeMedianRate(continentRows);
    const continentLabel = row.continent || regionName;

    const ratioToMedian = row.rate >= globalMedian
        ? `${(row.rate / Math.max(globalMedian, 1)).toFixed(1)}× the global median (${Math.round(globalMedian)})`
        : `${(globalMedian / Math.max(row.rate, 1)).toFixed(1)}× below the global median (${Math.round(globalMedian)})`;
    const comparisonClass = row.rate >= globalMedian ? "comparison" : "comparison below";
    const benchmarkMax = Math.max(row.rate, continentMedian || 0, globalMedian, US_BENCHMARK_RATE, 1);

    panel.html(`
        <div class="panel-header-row">
            <p class="panel-kicker">${escapeHtml(kickerText)}</p>
            ${clearSelectionBtnHtml}
        </div>
        <p class="panel-continent">${escapeHtml(regionName)} · ${escapeHtml(jurisdictionCategory)}</p>
        <h2 class="panel-title">${escapeHtml(row.country)}</h2>
        <div class="panel-iso">Canonical ISO: <strong>${escapeHtml(canonicalIso)}</strong></div>
        <p class="rate-number">${d3.format(",")(row.rate)}</p>
        <p class="rate-unit">prisoners per 100,000 general population</p>
        <span class="${comparisonClass}">${escapeHtml(ratioToMedian)}</span>
        <dl class="stat-list">
            <div class="stat-row"><dt>Global rank</dt><dd>${escapeHtml(rankText)}</dd></div>
            <div class="stat-row"><dt>Jurisdiction type</dt><dd>${escapeHtml(jurisdictionCategory)}</dd></div>
            <div class="stat-row"><dt>Geopolitical blocs</dt><dd>${escapeHtml(blocsList)}</dd></div>
        </dl>
        <div class="benchmark">
            <h3>Benchmark comparison (per 100k)</h3>
            ${renderBenchmarkBarHtml(row.country, row.rate, benchmarkMax, true)}
            ${continentMedian !== null
            ? renderBenchmarkBarHtml(`${continentLabel} Median`, continentMedian, benchmarkMax, false)
            : ""}
            ${renderBenchmarkBarHtml("Global Median", globalMedian, benchmarkMax, false)}
            ${renderBenchmarkBarHtml("United States", US_BENCHMARK_RATE, benchmarkMax, false)}
        </div>
    `);

    panel.select("#clear-selection-btn").on("click", () => resetMapView());
};

const renderBenchmarkBarHtml = (label, value, max, isPrimary) => {
    const pct = Math.min(100, Math.max(2, (value / max) * 100));
    return `
        <div class="benchmark-row ${isPrimary ? "benchmark-primary" : ""}">
            <span class="benchmark-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
            <strong>${d3.format(",.0f")(value)}</strong>
        </div>
    `;
};

/**
 * Render the 5-step + No Data legend (#legend) synchronized with the active palette.
 */
const renderSteppedLegend = () => {
    const paletteObj = PALETTES[appState.palette] || PALETTES.default;
    const isDark = typeof document !== "undefined" && document.body.classList.contains("dark-mode");
    const legendContainer = d3.select("#legend");
    if (legendContainer.empty()) return;

    const noDataBg = isDark
        ? `repeating-linear-gradient(135deg, ${NO_DATA_COLORS.darkBase}, ${NO_DATA_COLORS.darkBase} 5px, ${NO_DATA_COLORS.darkStroke} 5px, ${NO_DATA_COLORS.darkStroke} 7px)`
        : `repeating-linear-gradient(135deg, ${NO_DATA_COLORS.lightBase}, ${NO_DATA_COLORS.lightBase} 5px, ${NO_DATA_COLORS.lightStroke} 5px, ${NO_DATA_COLORS.lightStroke} 7px)`;

    const buttons = legendContainer.selectAll("button.legend-item")
        .data(RATE_BUCKETS, bucket => bucket.key)
        .join(
            enter => enter.append("button")
                .attr("type", "button")
                .attr("class", "legend-item"),
            update => update,
            exit => exit.remove()
        );

    buttons
        .classed("active", bucket => appState.selectedBucket === bucket.key)
        .classed("is-preview", bucket => appState.hoveredBucket === bucket.key && appState.selectedBucket !== bucket.key)
        .classed("legend-dark-text", bucket => {
            if (bucket.key === "no-data") return !isDark;
            return bucket.colorIndex <= paletteObj.textDarkUntilStep;
        })
        .classed("legend-light-text", bucket => {
            if (bucket.key === "no-data") return isDark;
            return bucket.colorIndex > paletteObj.textDarkUntilStep;
        })
        .attr("aria-pressed", bucket => appState.selectedBucket === bucket.key ? "true" : "false")
        .attr("aria-label", bucket => `Filter by rate tier ${bucket.label} per 100,000`)
        .style("background", bucket => {
            if (bucket.key === "no-data") return noDataBg;
            return paletteObj.colors[bucket.colorIndex];
        })
        .html(bucket => {
            const subLabel = bucket.key === "no-data" ? "Excluded from rank" : "per 100k";
            return `<span class="legend-range">${escapeHtml(bucket.label)}</span><small class="legend-sub">${escapeHtml(subLabel)}</small>`;
        })
        .on("mouseenter", (event, bucket) => {
            appState.hoveredBucket = bucket.key;
            legendContainer.selectAll("button.legend-item")
                .classed("is-preview", b => b.key === bucket.key && appState.selectedBucket !== b.key);
            updateMapStyles();
        })
        .on("mouseleave", () => {
            appState.hoveredBucket = null;
            legendContainer.selectAll("button.legend-item").classed("is-preview", false);
            updateMapStyles();
        })
        .on("focus", (event, bucket) => {
            appState.hoveredBucket = bucket.key;
            legendContainer.selectAll("button.legend-item")
                .classed("is-preview", b => b.key === bucket.key && appState.selectedBucket !== b.key);
            updateMapStyles();
        })
        .on("blur", () => {
            appState.hoveredBucket = null;
            legendContainer.selectAll("button.legend-item").classed("is-preview", false);
            updateMapStyles();
        })
        .on("click", (event, bucket) => {
            event.stopPropagation();
            appState.selectedBucket = appState.selectedBucket === bucket.key ? null : bucket.key;
            appState.hoveredBucket = null;

            legendContainer.selectAll("button.legend-item")
                .classed("active", b => appState.selectedBucket === b.key)
                .classed("is-preview", false)
                .attr("aria-pressed", b => appState.selectedBucket === b.key ? "true" : "false");

            updateMapStyles();
            renderBarChart();
            updateResetFiltersState();
        });
};

/**
 * Determine whether any filter or non-default sort is currently active.
 */
const hasActiveFilters = () => appState.activeContinentFilter !== "All"
    || (appState.activeBloc && appState.activeBloc !== "all")
    || appState.jurisdictionTypeFilter !== "all"
    || appState.rateRangeFilter !== "all"
    || appState.sortOrder !== "highest"
    || appState.selectedBucket !== null
    || Boolean(appState.searchQuery)
    || appState.showNoData;

const updateResetFiltersState = () => {
    const active = hasActiveFilters();
    d3.selectAll("#reset-filter, #empty-state-reset").property("disabled", !active);
};

/**
 * Synchronize all filter controls across top bar and unified toolbar with appState.
 */
const syncFilterControlsUI = () => {
    d3.select("#continent-filters").selectAll("button.chip")
        .classed("active", value => value === appState.activeContinentFilter)
        .attr("aria-pressed", value => value === appState.activeContinentFilter ? "true" : "false");

    d3.select("#filter-continent").property("value", appState.activeContinentFilter);
    d3.select("#filter-bloc").property("value", appState.activeBloc || "all");
    d3.select("#top-bloc-select").property("value", appState.activeBloc || "all");
    d3.select("#filter-jurisdiction-type").property("value", appState.jurisdictionTypeFilter);
    d3.select("#filter-rate-range").property("value", appState.rateRangeFilter);
    d3.select("#filter-sort").property("value", appState.sortOrder);
    d3.select("#palette-select").property("value", appState.palette);

    d3.select("#view-top-15")
        .classed("active", appState.chartViewLimit === "top15")
        .attr("aria-pressed", appState.chartViewLimit === "top15" ? "true" : "false");
    d3.select("#view-show-all")
        .classed("active", appState.chartViewLimit === "all")
        .attr("aria-pressed", appState.chartViewLimit === "all" ? "true" : "false");
    d3.select("#view-bar-chart")
        .classed("active", appState.chartView === "bar")
        .attr("aria-pressed", appState.chartView === "bar" ? "true" : "false");
    d3.select("#view-pie-chart")
        .classed("active", appState.chartView === "pie")
        .attr("aria-pressed", appState.chartView === "pie" ? "true" : "false");

    const isPieView = appState.chartView === "pie";
    d3.select(".filter-toolbar").classed("is-pie-view", isPieView);
    d3.select("#chart-view-toggle")
        .style("display", appState.showNoData || isPieView ? "none" : null);
    d3.select("#chart-scroll-region")
        .classed("is-scrollable", appState.chartViewLimit === "all" && !isPieView);
    d3.select("#show-no-data-control")
        .style("display", appState.chartViewLimit === "all" && !isPieView ? null : "none");
    d3.select("#show-no-data")
        .property("checked", Boolean(appState.showNoData))
        .property("disabled", appState.chartViewLimit !== "all");
    d3.select("#toolbar-bloc-field")
        .style("display", isPieView ? "none" : null);
    d3.select("#toolbar-rate-field")
        .style("display", isPieView ? "none" : null);
    d3.select("#toolbar-sort-field")
        .style("display", isPieView ? "none" : null);
    d3.select("#filter-rate-range")
        .property("disabled", Boolean(appState.showNoData))
        .classed("is-disabled", Boolean(appState.showNoData));
    d3.select("#filter-sort")
        .property("disabled", Boolean(appState.showNoData))
        .classed("is-disabled", Boolean(appState.showNoData));

    const titleEl = typeof document !== "undefined" ? document.getElementById("explorer-heading-title") : null;
    if (titleEl) {
        titleEl.innerHTML = appState.chartView === "pie"
            ? "Incarcerated population by geopolitical bloc"
            : appState.showNoData
                ? `Jurisdictions with no data`
                : appState.chartViewLimit === "top15"
                    ? `Top 15 <button class="glossary-trigger" type="button" data-glossary="jurisdiction">jurisdictions</button>`
                    : `All matching <button class="glossary-trigger" type="button" data-glossary="jurisdiction">jurisdictions</button>`;
        setupGlossaryTooltips();
    }
    d3.select("#explorer-eyebrow").text(appState.chartView === "pie" ? "Population by bloc" : "Ranked bar-chart explorer");
    d3.select("#chart-subtitle").text(appState.chartView === "pie"
        ? "Absolute prisoner counts, not incarceration rates per 100,000."
        : "Rates show prisoners per 100,000 people; the bar chart ranks incarceration rates.");
    d3.select("#pie-chart-notes").attr("hidden", appState.chartView === "pie" ? null : true);
    d3.select("#pie-table-toggle").attr("hidden", appState.chartView === "pie" ? null : true);
    d3.select("#pie-data-table").attr("hidden", appState.chartView === "pie" && appState.pieTableVisible ? null : true);

    updateResetFiltersState();
};

/**
 * Reset all filters and sorting to their documented global defaults.
 */
const resetAllFilters = () => {
    activeContinentFilter = "All";
    appState.activeContinentFilter = "All";
    appState.activeBloc = "all";
    appState.jurisdictionTypeFilter = "all";
    appState.rateRangeFilter = "all";
    appState.sortOrder = "highest";
    appState.showNoData = false;
    appState.selectedBucket = null;
    appState.hoveredBucket = null;
    appState.searchQuery = "";
    appState.pieSelectedKey = null;

    d3.select("#country-search").property("value", "");
    d3.select("#search-suggestions").classed("visible", false).html("");

    syncFilterControlsUI();
    renderSteppedLegend();
    updateMapStyles();
    renderBarChart();
};

/**
 * Apply a Geopolitical & Historical Bloc filter selection ("all" / "All / Reset" or bloc key).
 */
const applyBlocFilter = blocKey => {
    const normalized = !blocKey || blocKey === "all" || blocKey === "All / Reset" ? "all" : blocKey;
    appState.activeBloc = normalized;
    appState.pieSelectedKey = null;
    syncFilterControlsUI();
    updateMapStyles();
    renderBarChart();
};

/**
 * Set up all UI event listeners.
 */
const setupControls = () => {
    const updateThemeButtonText = () => {
        if (typeof document === "undefined") return;
        const isDark = document.body.classList.contains("dark-mode");
        d3.select("#theme-toggle")
            .attr("aria-pressed", isDark ? "true" : "false")
            .html(isDark ? "☀ <span>Light mode</span>" : "◐ <span>Dark mode</span>");
    };
    updateThemeButtonText();

    d3.select("#theme-toggle").on("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        try {
            sessionStorage.setItem("wpb_dark_mode", String(isDark));
        } catch (_) { }
        updateThemeButtonText();
        applyPaletteThemeVariables();
        defineMapPatterns(appState.svg);
        renderSteppedLegend();
        updateMapStyles();
        renderBarChart(false);
    });

    // Top bar continent chips
    d3.select("#continent-filters")
        .selectAll("button.chip")
        .data(CONTINENT_OPTIONS)
        .join("button")
        .attr("type", "button")
        .attr("class", continent => `chip ${continent === appState.activeContinentFilter ? "active" : ""}`)
        .attr("aria-pressed", continent => continent === appState.activeContinentFilter ? "true" : "false")
        .text(continent => continent)
        .on("click", (event, continent) => {
            const nextContinent = continent === appState.activeContinentFilter ? "All" : continent;
            activeContinentFilter = nextContinent;
            appState.activeContinentFilter = nextContinent;
            syncFilterControlsUI();
            updateMapStyles();
            renderBarChart();
        });

    // Geopolitical & Historical Blocs controls (top bar & unified filter toolbar)
    d3.selectAll("#filter-bloc, #top-bloc-select").on("change", event => {
        applyBlocFilter(event.target.value);
    });

    // Country search input & suggestions
    d3.select("#country-search")
        .on("input", event => {
            appState.searchQuery = event.target.value.trim().toLowerCase();
            renderSearchSuggestions();
            updateMapStyles();
            renderBarChart();
            updateResetFiltersState();
        })
        .on("keydown", handleSearchKeydown)
        .on("focus", renderSearchSuggestions)
        .on("blur", () => {
            setTimeout(() => {
                d3.select("#search-suggestions").classed("visible", false);
            }, 160);
        });

    d3.select("#search-suggestions").on("mousedown", event => event.preventDefault());

    // Accessibility palette selector
    d3.select("#palette-select")
        .property("value", appState.palette)
        .on("change", event => {
            const val = event.target.value;
            if (PALETTES[val]) {
                appState.palette = val;
            }
            try {
                sessionStorage.setItem("wpb_palette", appState.palette);
            } catch (_) { }
            applyPaletteThemeVariables();
            renderSteppedLegend();
            updateMapStyles();
            renderBarChart(false);
        });

    // Map Reset View button
    d3.select("#reset-map").on("click", resetMapView);

    // Unified Filter Toolbar controls
    d3.select("#filter-continent").on("change", event => {
        const nextContinent = event.target.value === appState.activeContinentFilter
            ? "All"
            : event.target.value;
        activeContinentFilter = nextContinent;
        appState.activeContinentFilter = nextContinent;
        syncFilterControlsUI();
        updateMapStyles();
        renderBarChart();
    });

    d3.select("#filter-jurisdiction-type").on("change", event => {
        appState.jurisdictionTypeFilter = event.target.value;
        syncFilterControlsUI();
        updateMapStyles();
        renderBarChart();
    });

    d3.select("#filter-rate-range").on("change", event => {
        appState.rateRangeFilter = event.target.value;
        syncFilterControlsUI();
        updateMapStyles();
        renderBarChart();
    });

    d3.select("#filter-sort").on("change", event => {
        appState.sortOrder = event.target.value;
        syncFilterControlsUI();
        renderBarChart();
    });

    d3.select("#show-no-data").on("change", event => {
        appState.showNoData = appState.chartViewLimit === "all" && event.target.checked;
        updateMapStyles();
        syncFilterControlsUI();
        renderBarChart();
    });

    d3.select("#reset-filter").on("click", resetAllFilters);
    d3.select("#empty-state-reset").on("click", resetAllFilters);

    // Top 15 vs Show All segmented control
    d3.select("#view-top-15").on("click", () => {
        if (appState.chartViewLimit === "top15") return;
        appState.chartViewLimit = "top15";
        appState.showNoData = false;
        const scrollRegion = typeof document !== "undefined" ? document.getElementById("chart-scroll-region") : null;
        if (scrollRegion) scrollRegion.scrollTop = 0;
        syncFilterControlsUI();
        renderBarChart();
    });

    d3.select("#view-show-all").on("click", () => {
        if (appState.chartViewLimit === "all") return;
        appState.chartViewLimit = "all";
        syncFilterControlsUI();
        renderBarChart();
    });

    d3.select("#view-bar-chart").on("click", () => {
        if (appState.chartView === "bar") return;
        appState.chartView = "bar";
        syncFilterControlsUI();
        renderBarChart();
    });

    d3.select("#view-pie-chart").on("click", () => {
        if (appState.chartView === "pie") return;
        appState.chartView = "pie";
        appState.showNoData = false;
        syncFilterControlsUI();
        renderPieChart();
    });

    d3.select("#pie-table-toggle").on("click", event => {
        const table = d3.select("#pie-data-table");
        const expanded = table.attr("hidden") === null;
        appState.pieTableVisible = !expanded;
        table.attr("hidden", expanded ? true : null);
        d3.select(event.currentTarget).attr("aria-expanded", expanded ? "false" : "true")
            .text(expanded ? "View as table" : "Hide table");
    });

    // Responsive resize observer for the horizontal bar chart
    const chartWrapper = typeof document !== "undefined" ? document.getElementById("jurisdiction-bar-chart") : null;
    if (chartWrapper && typeof ResizeObserver !== "undefined") {
        let lastWidth = chartWrapper.clientWidth;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const newWidth = Math.round(entry.contentRect.width);
                if (newWidth > 0 && Math.abs(newWidth - lastWidth) > 8) {
                    lastWidth = newWidth;
                    renderBarChart(false);
                }
            }
        });
        observer.observe(chartWrapper);
    }

    syncFilterControlsUI();
};

/**
 * Search autocomplete helpers.
 */
const getMatchingSearchRows = () => {
    const query = appState.searchQuery;
    if (!query) return [];
    return appState.data
        .filter(row => row.country.toLowerCase().includes(query)
            || row.iso.toLowerCase().includes(query)
            || normaliseJurisdictionName(row.country).toLowerCase().includes(query))
        .sort((a, b) => {
            const aStarts = a.country.toLowerCase().startsWith(query) || a.iso.toLowerCase() === query;
            const bStarts = b.country.toLowerCase().startsWith(query) || b.iso.toLowerCase() === query;
            return Number(bStarts) - Number(aStarts) || a.country.localeCompare(b.country);
        })
        .slice(0, 8);
};

const renderSearchSuggestions = () => {
    const suggestions = getMatchingSearchRows();
    const container = d3.select("#search-suggestions");
    container.classed("visible", Boolean(appState.searchQuery));

    if (!appState.searchQuery) {
        container.html("");
        return;
    }
    if (!suggestions.length) {
        container.html('<div class="suggestion-empty">No matching jurisdiction found</div>');
        return;
    }

    container.selectAll("button.suggestion")
        .data(suggestions, row => row.iso)
        .join("button")
        .attr("type", "button")
        .attr("class", "suggestion")
        .attr("role", "option")
        .html(row => {
            const rateLabel = Number.isFinite(row.rate) ? `${d3.format(",")(row.rate)} per 100k` : "No data";
            return `<span>${escapeHtml(row.country)} <strong>(${escapeHtml(row.iso)})</strong></span><small>${escapeHtml(regionForJurisdiction(row))} · ${escapeHtml(rateLabel)}</small>`;
        })
        .on("click", (event, row) => chooseSearchSuggestion(row));
};

const chooseSearchSuggestion = row => {
    const feature = appState.featuresByIso.get(row.iso) || appState.markersByIso.get(row.iso) || null;
    d3.select("#country-search").property("value", row.country);
    appState.searchQuery = "";
    d3.select("#search-suggestions").classed("visible", false).html("");

    activeContinentFilter = "All";
    appState.activeContinentFilter = "All";
    appState.activeBloc = "all";
    appState.jurisdictionTypeFilter = "all";
    appState.rateRangeFilter = "all";
    appState.sortOrder = "highest";
    appState.selectedBucket = null;
    appState.hoveredBucket = null;
    appState.chartViewLimit = "all";
    syncFilterControlsUI();

    handleJurisdictionSelect(row, feature, true, row.iso);
    updateMapStyles();
    renderBarChart();
    updateResetFiltersState();
    scrollToChartEntity(row.iso);
};

const scrollToChartEntity = iso => {
    const scrollRegion = document.getElementById("chart-scroll-region");
    if (!scrollRegion || !appState.barChartSvg) return;

    const group = appState.barChartSvg.selectAll("g.chart-bar-group")
        .filter(d => d.iso === iso)
        .node();
    if (!group) return;

    const transform = group.getAttribute("transform") || "";
    const match = transform.match(/translate\([^,]+,\s*([^)]+)\)/);
    const rowTop = match ? Number(match[1]) : 0;
    const targetTop = Math.max(0, rowTop - (scrollRegion.clientHeight - group.getBoundingClientRect().height) / 2);

    if (typeof scrollRegion.scrollTo === "function") {
        try {
            scrollRegion.scrollTo({ top: targetTop, behavior: "smooth" });
            return;
        } catch (_) {
            // Older browsers may reject the options object.
        }
    }
    scrollRegion.scrollTop = targetTop;
};

const handleSearchKeydown = event => {
    const suggestionNodes = d3.selectAll("#search-suggestions .suggestion").nodes();
    const activeIndex = suggestionNodes.indexOf(document.activeElement);

    if (event.key === "ArrowDown" && suggestionNodes.length) {
        event.preventDefault();
        suggestionNodes[(activeIndex + 1) % suggestionNodes.length].focus();
    } else if (event.key === "ArrowUp" && suggestionNodes.length) {
        event.preventDefault();
        suggestionNodes[(activeIndex - 1 + suggestionNodes.length) % suggestionNodes.length].focus();
    } else if (event.key === "Enter") {
        event.preventDefault();
        const topMatch = getMatchingSearchRows()[0];
        if (topMatch) chooseSearchSuggestion(topMatch);
    } else if (event.key === "Escape") {
        d3.select("#search-suggestions").classed("visible", false);
    }
};

const renderChartAnnotation = () => {
    const container = d3.select("#chart-annotation");
    if (container.empty()) return;
    const paletteObj = PALETTES[appState.palette] || PALETTES.default;
    const tierItems = RATE_BUCKETS
        .filter(bucket => bucket.colorIndex !== null)
        .map(bucket => `
            <span class="chart-annotation-section">
                <span class="chart-annotation-swatch" style="background:${paletteObj.colors[bucket.colorIndex]}" aria-hidden="true"></span>
                <span>${escapeHtml(bucket.label)}</span>
            </span>
        `)
        .join("");

    container.html(`
        <span class="chart-annotation-section">
            <span class="chart-annotation-title">Bar colors = rate tier</span>
            ${tierItems}
        </span>
        <span class="chart-annotation-section">
            <span class="chart-annotation-title">Entity type</span>
            <span class="chart-annotation-square" aria-hidden="true"></span>
            <span>Overseas / Autonomous Territory</span>
        </span>
    `);
};

/**
 * Render and animate the responsive D3/SVG Horizontal Bar Chart (#jurisdiction-bar-chart).
 * Bound by canonical ISO code (d => d.iso). Excludes No Data records from rankings.
 */
const renderNoDataList = () => {
    const containerNode = typeof document !== "undefined" ? document.getElementById("jurisdiction-bar-chart") : null;
    if (!containerNode) return;

    const rows = getNoDataJurisdictions();
    const emptyStateEl = document.getElementById("chart-empty-state");
    const summary = `Showing ${rows.length} jurisdictions with no data`;
    d3.select("#leaderboard-summary").text(summary);
    d3.select("#chart-annotation").style("display", "none");
    d3.select(containerNode).selectAll("svg").remove();

    if (emptyStateEl) {
        emptyStateEl.hidden = rows.length > 0;
        emptyStateEl.querySelector(".empty-state-title").textContent = "No jurisdictions with missing data match the active filters.";
        emptyStateEl.querySelector(".empty-state-subtitle").textContent = "Try broadening the continent, geopolitical bloc, or jurisdiction type filter.";
    }

    if (!rows.length) {
        d3.select(containerNode).selectAll(".no-data-list").remove();
        updateResetFiltersState();
        return;
    }

    const list = d3.select(containerNode)
        .selectAll("div.no-data-list")
        .data([rows])
        .join("div")
        .attr("class", "no-data-list")
        .attr("role", "list")
        .attr("aria-label", "Jurisdictions with no data");

    list.selectAll("button.no-data-row")
        .data(rows, d => d.iso)
        .join(
            enter => enter.append("button")
                .attr("type", "button")
                .attr("class", "no-data-row")
                .attr("role", "listitem"),
            update => update,
            exit => exit.remove()
        )
        .html(row => `
            <span class="no-data-name">${escapeHtml(row.country)}</span>
            <span class="no-data-meta">${escapeHtml(row.continent || "Unknown")}</span>
            <span class="no-data-meta">${escapeHtml(getJurisdictionCategoryLabel(row))}</span>
            <span class="no-data-meta">${escapeHtml(row.blocs?.length ? row.blocs.join(", ") : "No bloc")}</span>
            <span class="no-data-label">No data</span>
        `)
        .on("click", (event, row) => handleJurisdictionSelect(row, null, true, row.iso));

    updateResetFiltersState();
};

const getGeopoliticalPopulationData = () => {
    const filteredRows = appState.data.filter(row => doesRowMatchActiveFilters(
        row,
        row?.country,
        { ignoreShowNoData: true, ignoreRateFilters: true, ignoreBlocFilter: true }
    ).matchesAll);
    const uniqueRows = new Map();
    filteredRows.forEach(row => {
        if (row?.iso && !uniqueRows.has(row.iso)) uniqueRows.set(row.iso, row);
    });

    const rows = Array.from(uniqueRows.values());
    const validRows = rows.filter(row => Number.isFinite(row.incarceratedPopulation) && row.incarceratedPopulation >= 0);
    const globalTotal = validRows.reduce((sum, row) => sum + row.incarceratedPopulation, 0);
    const missingCount = rows.length - validRows.length;
    if (!(globalTotal > 0)) {
        return { globalTotal: 0, missingCount, filteredCount: rows.length, slices: [] };
    }

    const configuredGroups = BLOC_OPTIONS
        .filter(group => group.key !== "all")
        .sort((a, b) => BLOC_PRIORITY.indexOf(a.key) - BLOC_PRIORITY.indexOf(b.key));
    const totals = new Map(configuredGroups.map(group => [group.key, { value: 0, count: 0 }]));
    let representedTotal = 0;

    validRows.forEach(row => {
        const membership = BLOC_PRIORITY.find(groupKey => (
            Array.isArray(row.blocs) && row.blocs.includes(groupKey)
        ));
        if (membership && totals.has(membership)) {
            const groupTotal = totals.get(membership);
            groupTotal.value += row.incarceratedPopulation;
            groupTotal.count += 1;
            representedTotal += row.incarceratedPopulation;
        }
    });

    const slices = configuredGroups
        .map(group => ({
            key: group.key,
            label: group.label,
            value: totals.get(group.key).value,
            count: totals.get(group.key).count
        }))
        .filter(slice => slice.value > 0)
        .sort((a, b) => b.value - a.value);
    const otherValue = Math.max(0, globalTotal - representedTotal);
    const otherCount = validRows.filter(row => !BLOC_PRIORITY.some(groupKey => (
        Array.isArray(row.blocs) && row.blocs.includes(groupKey)
    ))).length;
    if (otherValue > 0) {
        slices.push({
            key: "other",
            label: "Other / Rest of the World",
            value: otherValue,
            count: otherCount
        });
    }

    const sliceTotal = slices.reduce((sum, slice) => sum + slice.value, 0);
    if (Math.abs(sliceTotal - globalTotal) > 0.000001) {
        console.error("Pie chart aggregation does not reconcile to its denominator.", {
            globalTotal,
            sliceTotal
        });
    }

    return {
        globalTotal,
        missingCount,
        filteredCount: rows.length,
        slices: slices.map(slice => ({
            ...slice,
            percentage: (slice.value / globalTotal) * 100
        }))
    };
};

const pieColor = (slice, index) => {
    if (slice.key === "other") return "#64748B";
    const palette = PALETTES[appState.palette] || PALETTES.default;
    return palette.categorical[index % palette.categorical.length];
};

const formatPopulationShort = value => {
    if (value >= 1000000) return `${d3.format(".2f")(value / 1000000)}M`;
    if (value >= 1000) return `${d3.format(".1f")(value / 1000)}k`;
    return d3.format(",")(value);
};

const positionPieLabels = (nodes, height, width, radius) => {
    const minimumGap = height < 430 ? 38 : 40;
    const topLimit = -(height / 2 - 30);
    const bottomLimit = height / 2 - 16;
    const maxOffset = Math.max(radius + 20, width / 2 - 142);
    ["left", "right"].forEach(side => {
        const sideNodes = nodes
            .filter(node => node.side === side)
            .sort((a, b) => a.targetY - b.targetY || a.index - b.index);
        if (!sideNodes.length) return;
        sideNodes.forEach((node, index) => {
            node.y = index === 0
                ? Math.max(topLimit, node.targetY)
                : Math.max(node.targetY, sideNodes[index - 1].y + minimumGap);
        });
        const lastIndex = sideNodes.length - 1;
        if (sideNodes[lastIndex].y > bottomLimit) {
            sideNodes[lastIndex].y = bottomLimit;
            for (let index = lastIndex - 1; index >= 0; index -= 1) {
                sideNodes[index].y = Math.min(sideNodes[index].y, sideNodes[index + 1].y - minimumGap);
            }
            sideNodes[0].y = Math.max(topLimit, sideNodes[0].y);
            for (let index = 1; index <= lastIndex; index += 1) {
                sideNodes[index].y = Math.max(sideNodes[index].y, sideNodes[index - 1].y + minimumGap);
            }
        }
        sideNodes.forEach((node, index) => {
            const nextNode = sideNodes[index + 1];
            const needsRadialStep = Boolean(
                nextNode
                && node.y > radius * 0.45
                && (nextNode.y - node.y) <= minimumGap + 6
            );
            const radialExtra = needsRadialStep ? 14 : 0;
            const labelDist = Math.min(radius + 18 + radialExtra, maxOffset);
            const elbowDist = Math.min(radius + 8 + radialExtra, labelDist - 8);
            node.x = side === "right" ? labelDist : -labelDist;
            node.elbowX = side === "right" ? elbowDist : -elbowDist;
        });
    });
};

const getActivePieFilterScope = () => {
    const parts = [];
    if (appState.activeContinentFilter && appState.activeContinentFilter !== "All") {
        parts.push(appState.activeContinentFilter);
    }
    if (appState.jurisdictionTypeFilter && appState.jurisdictionTypeFilter !== "all") {
        const typeLabels = {
            sovereign: "Sovereign Nations",
            constituent: "Constituent",
            overseas_autonomous: "Overseas Territories"
        };
        parts.push(typeLabels[appState.jurisdictionTypeFilter] || appState.jurisdictionTypeFilter);
    }
    if (appState.searchQuery) {
        parts.push(`"${appState.searchQuery}"`);
    }
    return parts.length ? parts.join(" · ") : "Global total";
};

const renderPieChart = (animate = true) => {
    const containerNode = typeof document !== "undefined" ? document.getElementById("jurisdiction-bar-chart") : null;
    if (!containerNode || !appState.data.length) return;

    const { globalTotal, missingCount, filteredCount, slices } = getGeopoliticalPopulationData();
    d3.select(containerNode).selectAll(".no-data-list").remove();
    d3.select(containerNode).selectAll("svg.bar-chart-svg").style("display", "none");
    d3.select("#chart-annotation").style("display", "none");
    d3.select("#chart-empty-state").attr("hidden", true);
    const emptyStateEl = document.getElementById("chart-empty-state");
    if (emptyStateEl) emptyStateEl.hidden = true;
    const filtersActive = appState.activeContinentFilter !== "All"
        || appState.jurisdictionTypeFilter !== "all"
        || Boolean(appState.searchQuery);
    d3.select("#leaderboard-summary").text(
        `${filtersActive ? `Total (${getActivePieFilterScope()})` : "Global incarcerated population"}: ${d3.format(",")(globalTotal)}`
    );
    d3.select("#explorer-eyebrow").text("Population by bloc");
    d3.select("#chart-subtitle").text("Absolute prisoner counts, not incarceration rates per 100,000.");
    d3.select("#pie-chart-notes")
        .attr("hidden", null)
        .html(`Source: <a href="https://www.prisonstudies.org/world-prison-data/highest-lowest/highest-lowest-prison-population-total" target="_blank" rel="noopener noreferrer">World Prison Brief population totals</a> · Reference year: 2026. Prisoner definitions differ between countries. ${missingCount} of ${filteredCount} jurisdictions without valid counts are excluded.<br><strong>Jurisdictions belonging to several blocs are counted once, using priority: <br>NATO &gt; OECD &gt; ASEAN &gt; Post-Soviet States &gt; Former Yugoslavia.</strong>`);
    d3.select("#pie-table-toggle").attr("hidden", null);
    renderPieDataTable(slices);

    const width = Math.max(containerNode.clientWidth || 720, 320);
    const height = width < 520 ? 470 : 430;
    const radius = Math.min((width - 210) / 2, height * 0.33);
    const centerX = width / 2;
    const centerY = height / 2 - 8;
    const svg = d3.select(containerNode)
        .selectAll("svg.pie-chart-svg")
        .data([null])
        .join(enter => {
            const next = enter.append("svg")
                .attr("class", "pie-chart-svg")
                .attr("role", "img")
                .attr("aria-label", "Donut chart showing absolute incarcerated population by geopolitical bloc");
            next.append("g").attr("class", "pie-chart-main");
            next.append("g").attr("class", "pie-leaders");
            next.append("g").attr("class", "pie-labels");
            next.append("g").attr("class", "pie-center");
            return next;
        })
        .style("display", null)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height);
    d3.select(containerNode).selectAll("svg.bar-chart-svg").style("display", "none");
    svg.style("display", "block");
    appState.pieChartSvg = svg;
    svg.selectAll(".pie-empty-message").remove();

    const main = svg.select(".pie-chart-main").attr("transform", `translate(${centerX}, ${centerY})`);
    const leaders = svg.select(".pie-leaders").attr("transform", `translate(${centerX}, ${centerY})`);
    const labels = svg.select(".pie-labels").attr("transform", `translate(${centerX}, ${centerY})`);
    const center = svg.select(".pie-center").attr("transform", `translate(${centerX}, ${centerY})`);
    const pie = d3.pie().sort(null).startAngle(0).endAngle(Math.PI * 2).value(slice => slice.value);
    const pieData = pie(slices);
    const arc = d3.arc()
        .innerRadius(radius * 0.57)
        .outerRadius(radius)
        .padAngle(pieData.length > 1 ? 0.008 : 0)
        .padRadius(radius);
    const outerRimArc = d3.arc().innerRadius(radius * 1.01).outerRadius(radius * 1.01);
    const labelArc = d3.arc().innerRadius(radius * 1.12).outerRadius(radius * 1.12);
    main.selectAll("path.pie-empty-ring")
        .data(slices.length ? [] : [{ startAngle: 0, endAngle: Math.PI * 2 }])
        .join("path")
        .attr("class", "pie-empty-ring")
        .attr("fill", "var(--line)")
        .attr("opacity", 0.45)
        .attr("d", arc);
    const minSliceAngle = 0.036;
    if (pieData.length > 1) {
        let extraAngle = 0;
        let largestIndex = 0;
        pieData.forEach((d, idx) => {
            if (d.endAngle - d.startAngle > pieData[largestIndex].endAngle - pieData[largestIndex].startAngle) {
                largestIndex = idx;
            }
        });
        const spans = pieData.map((d, idx) => {
            const raw = d.endAngle - d.startAngle;
            if (idx !== largestIndex && raw > 0 && raw < minSliceAngle) {
                extraAngle += minSliceAngle - raw;
                return minSliceAngle;
            }
            return raw;
        });
        if (extraAngle > 0 && spans[largestIndex] - extraAngle > minSliceAngle) {
            spans[largestIndex] -= extraAngle;
            let cursor = 0;
            pieData.forEach((d, idx) => {
                d.startAngle = cursor;
                cursor += spans[idx];
                d.endAngle = cursor;
            });
        }
    }
    const labelNodes = pieData.map((slice, index) => {
        const anchorSlice = pieData.length === 1
            ? { ...slice, startAngle: 0, endAngle: Math.PI }
            : slice;
        const point = labelArc.centroid(anchorSlice);
        return {
            slice,
            anchorSlice,
            index,
            side: Math.cos((anchorSlice.startAngle + anchorSlice.endAngle) / 2 - Math.PI / 2) >= 0 ? "right" : "left",
            targetY: point[1]
        };
    });
    positionPieLabels(labelNodes, height, width, radius);
    const duration = animate ? 300 : 0;
    const reducedMotion = typeof window !== "undefined"
        && window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionDuration = reducedMotion ? 0 : Math.min(duration, 180);
    const transition = svg.transition().duration(transitionDuration).ease(d3.easeCubicOut);
    const showSliceTooltip = (event, sliceData) => {
        const tooltip = getOrCreateFloatingTooltip();
        tooltip.innerHTML = `<div class="tooltip-title">${escapeHtml(sliceData.label)}</div><div class="tooltip-rate"><strong>${d3.format(",")(sliceData.value)}</strong> incarcerated people</div><div class="tooltip-meta">${sliceData.percentage.toFixed(1)}% of total · ${sliceData.count} jurisdictions</div>`;
        tooltip.hidden = false;
        moveFloatingTooltip(event);
    };
    const toggleSliceSelection = key => {
        appState.pieSelectedKey = appState.pieSelectedKey === key ? null : key;
        updatePieSelection();
    };
    const updatePieSelection = () => {
        const selectedKey = appState.pieSelectedKey;
        slicesSelection
            .classed("is-selected", d => d.data.key === selectedKey)
            .classed("is-dimmed", d => Boolean(selectedKey) && d.data.key !== selectedKey)
            .attr("aria-pressed", d => d.data.key === selectedKey ? "true" : "false")
            .attr("transform", d => {
                if (d.data.key !== selectedKey || pieData.length <= 1) return null;
                const point = arc.centroid(d);
                const length = Math.hypot(point[0], point[1]) || 1;
                return `translate(${point[0] * 7 / length},${point[1] * 7 / length})`;
            });
        slicesSelection.transition().duration(transitionDuration).ease(d3.easeCubicOut)
            .style("opacity", d => selectedKey && d.data.key !== selectedKey ? 0.33 : 1)
            .attr("d", arc);
        labels.selectAll("text.pie-label")
            .classed("is-selected", node => node.slice.data.key === selectedKey)
            .classed("is-dimmed", node => Boolean(selectedKey) && node.slice.data.key !== selectedKey);
        leaders.selectAll("polyline.pie-leader-line")
            .classed("is-selected", node => node.slice.data.key === selectedKey)
            .classed("is-dimmed", node => Boolean(selectedKey) && node.slice.data.key !== selectedKey);
        renderPieCenter(center, selectedKey ? slices.find(slice => slice.key === selectedKey) : null, globalTotal);
        renderPieDataTable(slices, toggleSliceSelection);
    };

    const slicesSelection = main.selectAll("path.pie-slice")
        .data(pieData, d => d.data.key)
        .join(
            enter => enter.append("path")
                .attr("class", "pie-slice")
                .attr("tabindex", "0")
                .attr("role", "button")
                .attr("d", arc)
                .style("opacity", 0)
                .on("mouseenter focus", (event, d) => {
                    d3.select(event.currentTarget).classed("is-active", true);
                    showSliceTooltip(event, d.data);
                })
                .on("mousemove", moveFloatingTooltip)
                .on("mouseleave blur", event => {
                    d3.select(event.currentTarget).classed("is-active", false);
                    hideFloatingTooltip();
                })
                .on("click keydown", (event, d) => {
                    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
                    event.preventDefault();
                    toggleSliceSelection(d.data.key);
                }),
            update => update,
            exit => exit.transition(transition).style("opacity", 0).remove()
        )
        .attr("fill", (d, index) => pieColor(d.data, index))
        .classed("is-selected", d => d.data.key === appState.pieSelectedKey)
        .attr("aria-pressed", d => d.data.key === appState.pieSelectedKey ? "true" : "false")
        .attr("aria-label", d => `${d.data.label}: ${d3.format(",")(d.data.value)} incarcerated people, ${d.data.percentage.toFixed(1)}% of total`);

    leaders.selectAll("polyline")
        .data(labelNodes, d => d.slice.data.key)
        .join("polyline")
        .attr("class", "pie-leader-line")
        .attr("points", node => {
            const start = outerRimArc.centroid(node.anchorSlice || node.slice);
            return `${start[0]},${start[1]} ${node.elbowX},${node.y} ${node.x},${node.y}`;
        })
        .on("click", (event, node) => {
            event.stopPropagation();
            toggleSliceSelection(node.slice.data.key);
        });
    labels.selectAll("text")
        .data(labelNodes, d => d.slice.data.key)
        .join("text")
        .attr("class", "pie-label")
        .attr("x", node => node.x)
        .attr("y", node => node.y - 7)
        .attr("text-anchor", node => node.side === "right" ? "start" : "end")
        .on("mouseenter", (event, node) => {
            slicesSelection.filter(d => d.data.key === node.slice.data.key).classed("is-active", true);
            showSliceTooltip(event, node.slice.data);
        })
        .on("mousemove", moveFloatingTooltip)
        .on("mouseleave", (_event, node) => {
            slicesSelection.filter(d => d.data.key === node.slice.data.key).classed("is-active", false);
            hideFloatingTooltip();
        })
        .on("click", (event, node) => {
            event.stopPropagation();
            toggleSliceSelection(node.slice.data.key);
        })
        .each(function (node) {
            const text = d3.select(this);
            text.selectAll("tspan").remove();
            text.append("tspan").attr("x", node.x).text(node.slice.data.label);
            text.append("tspan").attr("x", node.x).attr("dy", "14").text(`${node.slice.data.percentage.toFixed(1)}% (${formatPopulationShort(node.slice.data.value)})`);
        });
    svg.on("click", event => {
        if (!event.target.closest("path.pie-slice, .pie-label, .pie-leader-line, .pie-center")) {
            appState.pieSelectedKey = null;
            updatePieSelection();
        }
    });
    center.on("click", event => {
        event.stopPropagation();
        appState.pieSelectedKey = null;
        updatePieSelection();
    });
    d3.select(document).on("keydown.pie-selection", event => {
        if (event.key === "Escape" && appState.pieSelectedKey) {
            appState.pieSelectedKey = null;
            updatePieSelection();
        }
    });
    updatePieSelection();
};

const renderPieCenter = (center, slice, total) => {
    center.selectAll("*").remove();
    if (slice) {
        center.append("text").attr("class", "pie-center-label").attr("text-anchor", "middle").attr("y", -24)
            .style("font-size", slice.label.length > 22 ? "8px" : null)
            .text(slice.label);
        center.append("text").attr("class", "pie-center-value").attr("text-anchor", "middle").attr("y", -2)
            .text(d3.format(",")(slice.value));
        center.append("text").attr("class", "pie-center-label").attr("text-anchor", "middle").attr("y", 16)
            .text(`${slice.percentage.toFixed(1)}% of total`);
        return;
    }
    const scopeLabel = getActivePieFilterScope();
    center.append("text").attr("class", "pie-center-label").attr("text-anchor", "middle").attr("y", -24)
        .style("font-size", scopeLabel.length > 22 ? "8px" : null)
        .text(scopeLabel);
    center.append("text").attr("class", "pie-center-value").attr("text-anchor", "middle").attr("y", -2)
        .text(d3.format(",")(total));
    center.append("text").attr("class", "pie-center-label").attr("text-anchor", "middle").attr("y", 16)
        .text("incarcerated");
};

const renderPieDataTable = (slices, onSelectKey) => {
    const table = d3.select("#pie-data-table");
    if (table.empty()) return;
    table.html(`
    <table>
        <caption style="
        font-size: calc(1em + 2px);
        font-weight: bold;
        padding-bottom: 5px;
        ">
        Incarcerated population by geopolitical bloc
        </caption>
        <thead>
        <tr>
            <th scope="col">Bloc</th>
            <th scope="col">Count</th>
            <th scope="col">Share</th>
        </tr>
        </thead>
        <tbody>
        ${slices.map(slice => `
            <tr data-slice-key="${escapeHtml(slice.key)}" class="${appState.pieSelectedKey === slice.key ? "is-selected" : ""}">
            <th scope="row">${escapeHtml(slice.label)}</th>
            <td>${d3.format(",")(slice.value)}</td>
            <td>${slice.percentage.toFixed(1)}%</td>
            </tr>
        `).join("")}
        </tbody>
    </table>
    `);
    if (typeof onSelectKey === "function") {
        table.selectAll("tbody tr[data-slice-key]").on("click", function () {
            const key = this.getAttribute("data-slice-key");
            if (key) onSelectKey(key);
        });
    }
};

const renderBarChart = (animate = true) => {
    const containerNode = typeof document !== "undefined" ? document.getElementById("jurisdiction-bar-chart") : null;
    if (!containerNode || !appState.data.length) return;
    appState.pieSelectedKey = null;
    if (appState.chartView === "pie") {
        renderPieChart(animate);
        return;
    }
    d3.select(containerNode).selectAll("svg.pie-chart-svg").style("display", "none");
    d3.select(containerNode).style("display", null);

    if (appState.showNoData) {
        renderNoDataList();
        return;
    }

    const allFilteredRows = getFilteredJurisdictions();
    const displayedRows = appState.chartViewLimit === "top15"
        ? allFilteredRows.slice(0, 15)
        : allFilteredRows;

    // Update telemetry with the single global benchmark.
    const telemetryText = formatSummaryTelemetry(
        allFilteredRows,
        appState.activeBloc,
        appState.activeContinentFilter
    );
    d3.select("#leaderboard-summary").text(telemetryText);
    d3.select("#chart-annotation").style("display", null);
    d3.select(containerNode).selectAll(".no-data-list").remove();
    updateResetFiltersState();

    // Handle empty state cleanly
    const emptyStateEl = document.getElementById("chart-empty-state");
    if (!displayedRows.length) {
        d3.select(containerNode).selectAll("svg").style("display", "none");
        if (emptyStateEl) {
            emptyStateEl.hidden = false;
            emptyStateEl.querySelector(".empty-state-title").textContent = "No jurisdictions match the active filters.";
            emptyStateEl.querySelector(".empty-state-subtitle").textContent = "Try broadening the bloc, rate range, continent, or jurisdiction type filter.";
        }
        return;
    }
    if (emptyStateEl) emptyStateEl.hidden = true;
    d3.select(containerNode).selectAll("svg").style("display", "block");

    const containerWidth = Math.max(containerNode.clientWidth || 720, 320);
    const isNarrow = containerWidth < 520;
    const chartMargin = {
        top: 34,
        right: isNarrow ? 58 : 74,
        bottom: 28,
        left: isNarrow ? 148 : 225
    };
    const rowHeight = 32;
    const barHeight = 20;
    const plotWidth = Math.max(120, containerWidth - chartMargin.left - chartMargin.right);
    const plotHeight = displayedRows.length * rowHeight;
    const totalHeight = plotHeight + chartMargin.top + chartMargin.bottom;

    const maxRateInView = d3.max(displayedRows, d => d.rate) || 100;
    const domainMax = Math.max(maxRateInView * 1.04, 100);

    rateScale
        .domain([0, domainMax])
        .range([0, plotWidth])
        .nice();

    const svg = d3.select(containerNode)
        .selectAll("svg.bar-chart-svg")
        .data([null])
        .join(enter => {
            const s = enter.append("svg")
                .attr("class", "bar-chart-svg")
                .attr("role", "region")
                .attr("aria-label", "Horizontal bar chart of incarceration rates per 100,000 population");
            s.append("g").attr("class", "chart-grid-group");
            s.append("g").attr("class", "chart-major-grid-group");
            s.append("g").attr("class", "chart-axis-top");
            s.append("g").attr("class", "chart-bars-layer");
            s.append("g").attr("class", "chart-axis-bottom");
            return s;
        });

    appState.barChartSvg = svg;

    svg
        .attr("viewBox", `0 0 ${containerWidth} ${totalHeight}`)
        .attr("width", containerWidth)
        .attr("height", totalHeight);

    const transitionDuration = animate ? 320 : 0;
    const t = svg.transition().duration(transitionDuration).ease(d3.easeCubicOut);

    const tickCount = isNarrow ? 4 : 6;
    const topAxis = d3.axisTop(rateScale).ticks(tickCount).tickSizeOuter(0).tickFormat(d3.format(","));
    const bottomAxis = d3.axisBottom(rateScale).ticks(tickCount).tickSizeOuter(0).tickFormat(d3.format(","));
    const gridLines = d3.axisTop(rateScale).ticks(tickCount).tickSize(-plotHeight).tickFormat("");
    const majorTickValues = [];
    for (let tick = 200; tick <= Math.floor(domainMax / 200) * 200; tick += 200) {
        majorTickValues.push(tick);
    }
    const majorGridLines = d3.axisTop(rateScale);
    if (typeof majorGridLines.tickValues === "function") {
        majorGridLines
            .tickValues(majorTickValues)
            .tickSize(-plotHeight)
            .tickFormat("");
    }

    svg.select(".chart-grid-group")
        .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`)
        .transition(t)
        .call(gridLines)
        .selection()
        .select(".domain")
        .remove();

    if (typeof majorGridLines.tickValues === "function") {
        svg.select(".chart-major-grid-group")
            .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`)
            .transition(t)
            .call(majorGridLines)
            .selection()
            .select(".domain")
            .remove();
        svg.select(".chart-major-grid-group").selectAll("line").classed("major-gridline", true);
    }

    renderChartAnnotation();

    svg.select(".chart-axis-top")
        .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`)
        .transition(t)
        .call(topAxis);

    svg.select(".chart-axis-bottom")
        .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top + plotHeight})`)
        .transition(t)
        .call(bottomAxis);

    const barsLayer = svg.select(".chart-bars-layer")
        .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);

    const maxLabelChars = isNarrow ? 19 : 30;
    const truncateLabel = text => text.length > maxLabelChars ? `${text.slice(0, maxLabelChars - 1)}…` : text;

    const getBarFill = row => getSolidColorForBucket(bucketForRate(row.rate));

    const barGroups = barsLayer.selectAll("g.chart-bar-group")
        .data(displayedRows, d => d.iso)
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "chart-bar-group")
                    .attr("data-iso", d => d.iso)
                    .attr("transform", (d, i) => `translate(0, ${i * rowHeight})`)
                    .attr("tabindex", "0")
                    .attr("role", "button")
                    .style("opacity", 0);

                g.append("rect")
                    .attr("class", "chart-row-bg")
                    .attr("x", -chartMargin.left + 2)
                    .attr("y", 1)
                    .attr("height", rowHeight - 2)
                    .attr("rx", 4);

                g.append("rect")
                    .attr("class", "chart-selection-pill")
                    .attr("x", -chartMargin.left + 4)
                    .attr("y", 5)
                    .attr("width", 3.5)
                    .attr("height", rowHeight - 10)
                    .attr("rx", 1.5);

                g.append("rect")
                    .attr("class", "chart-bar-track")
                    .attr("x", 0)
                    .attr("y", (rowHeight - barHeight) / 2)
                    .attr("height", barHeight)
                    .attr("rx", 3);

                g.append("rect")
                    .attr("class", "chart-bar-rect")
                    .attr("x", 0)
                    .attr("y", (rowHeight - barHeight) / 2)
                    .attr("width", 0)
                    .attr("height", barHeight)
                    .attr("rx", 3);

                g.append("text")
                    .attr("class", "chart-y-label")
                    .attr("x", -18)
                    .attr("y", rowHeight / 2)
                    .attr("dy", "0.35em")
                    .attr("text-anchor", "end");

                g.append("rect")
                    .attr("class", "chart-label-marker territory")
                    .attr("x", -14)
                    .attr("y", rowHeight / 2 - 4)
                    .attr("width", 8)
                    .attr("height", 8)
                    .style("display", "none");

                g.append("text")
                    .attr("class", "chart-value-label")
                    .attr("y", rowHeight / 2)
                    .attr("dy", "0.35em");

                return g;
            },
            update => update,
            exit => exit
                .transition()
                .duration(180)
                .style("opacity", 0)
                .remove()
        );

    barGroups
        .attr("data-iso", d => d.iso)
        .attr("aria-label", (d, i) => {
            const cat = getJurisdictionCategoryLabel(d);
            const rateLabel = Number.isFinite(d.rate)
                ? `${d3.format(",")(d.rate)} prisoners per 100,000`
                : "No data";
            return `Rank ${i + 1}: ${d.country} (${d.iso}, ${cat}), ${rateLabel}`;
        })
        .on("focus", (event, d) => handleJurisdictionHover(event, d, null, d.iso))
        .on("blur", () => handleJurisdictionLeave())
        .on("click", (event, d) => {
            handleJurisdictionSelect(d, null, true, d.iso);
        })
        .on("keydown", (event, d) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleJurisdictionSelect(d, null, true, d.iso);
            } else if (event.key === "Escape") {
                handleJurisdictionLeave();
            }
        });

    barGroups.select(".chart-row-bg")
        .attr("width", containerWidth - 4);

    barGroups.select(".chart-bar-track")
        .attr("width", plotWidth);

    barGroups.select(".chart-y-label")
        .text((d, i) => {
            const prefix = `${i + 1}. `;
            const maxTextChars = d.jurisdiction_type === "overseas_autonomous"
                ? Math.max(10, maxLabelChars - 2)
                : maxLabelChars;
            const visibleName = d.country.length > maxTextChars
                ? `${d.country.slice(0, maxTextChars - 1)}…`
                : d.country;
            return `${prefix}${visibleName}`;
        });

    barGroups.select(".chart-label-marker")
        .style("display", d => d.jurisdiction_type === "overseas_autonomous" ? null : "none");

    barGroups.transition(t)
        .style("opacity", 1)
        .attr("transform", (d, i) => `translate(0, ${i * rowHeight})`);

    barGroups.select(".chart-bar-rect")
        .attr("fill", d => getBarFill(d))
        .classed("no-data-bar", d => !Number.isFinite(d.rate))
        .transition(t)
        .attr("width", d => Number.isFinite(d.rate) ? Math.max(3, rateScale(d.rate)) : 0);

    barGroups.select(".chart-value-label")
        .text(d => Number.isFinite(d.rate) ? d3.format(",")(d.rate) : "No data")
        .transition(t)
        .attr("x", d => Number.isFinite(d.rate) ? Math.max(3, rateScale(d.rate)) + 7 : 7)
        .attr("text-anchor", "start");

    updateBarChartHighlightStates();
};

/**
 * Synchronize hover and pinned selection classes on the horizontal bar chart by canonical ISO.
 */
const updateBarChartHighlightStates = () => {
    if (!appState.barChartSvg) return;

    const pinnedIso = appState.pinnedJurisdictionId;
    const hoveredIso = appState.hoveredJurisdictionId;

    appState.barChartSvg.selectAll("g.chart-bar-group")
        .classed("is-selected", d => Boolean(pinnedIso && d.iso === pinnedIso))
        .classed("is-hovered", d => Boolean(hoveredIso && d.iso === hoveredIso))
        .attr("aria-pressed", d => Boolean(pinnedIso && d.iso === pinnedIso) ? "true" : "false");
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        escapeHtml,
        getJurisdictionCategoryLabel,
        applyPaletteThemeVariables,
        setupGlossaryTooltips,
        showFloatingTooltip,
        moveFloatingTooltip,
        hideFloatingTooltip,
        resolveCanonicalEntity,
        handleJurisdictionHover,
        handleJurisdictionLeave,
        handleJurisdictionSelect,
        renderDetailsPanel,
        renderSteppedLegend,
        hasActiveFilters,
        syncFilterControlsUI,
        resetAllFilters,
        applyBlocFilter,
        setupControls,
        renderBarChart,
        getGeopoliticalPopulationData,
        renderPieChart,
        updateBarChartHighlightStates
    };
}
