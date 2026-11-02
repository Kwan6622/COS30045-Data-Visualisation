const MAP_WIDTH = 1000;
const MAP_HEIGHT = 560;
const MAP_MARGIN = { top: 16, right: 18, bottom: 18, left: 18 };
const GLOBAL_MEDIAN = 135;
const BUCKETS = [
    { key: "no-data", label: "No data", min: null, max: null },
    { key: "0-99", label: "0–99", min: 0, max: 99 },
    { key: "100-199", label: "100–199", min: 100, max: 199 },
    { key: "200-299", label: "200–299", min: 200, max: 299 },
    { key: "300-399", label: "300–399", min: 300, max: 399 },
    { key: "400-499", label: "400–499", min: 400, max: 499 },
    { key: "500-599", label: "500–599", min: 500, max: 599 },
    { key: "600-plus", label: "600+", min: 600, max: Infinity }
];
const PALETTES = {
    pew: ["#eae8e4", "#f6edd9", "#edd9b3", "#deb982", "#c6934b", "#a86e2d", "#7b4718", "#3d2109"],
    crimson: ["#eae8e4", "#fbe4e6", "#f4bfc5", "#e98e99", "#d65a6a", "#b9344a", "#831f35", "#4a1020"],
    viridis: ["#eae8e4", "#edf8e9", "#c7e9c0", "#7fcdbb", "#41b6c4", "#2c7fb8", "#253494", "#081d58"]
};
const COUNTRY_ALIASES = new Map([
    ["Russian Federation", "Russia"], ["Türkiye/Turkey", "Turkey"],
    ["Czechia/Czech Republic", "Czechia"], ["Eswatini/Swaziland", "Eswatini"],
    ["Moldova (Republic of)", "Moldova"], ["Myanmar (formerly Burma)", "Myanmar"],
    ["United Kingdom: Scotland", "United Kingdom"],
    ["Republic of (South) Korea", "South Korea"],
    ["Ireland, Republic of", "Ireland"]
]);
const CALLOUT_NAMES = ["El Salvador", "United States of America", "Rwanda", "Turkmenistan", "Cuba"];
const LEADERBOARD_CONTINENTS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania", "Antarctica"];

let state;

d3.select("#theme-toggle").on("click", () => document.body.classList.toggle("dark-mode"));

const glossaryDefinitions = {
    incarceration: "The number of people being held in prison or jail.",
    jurisdiction: "A country, territory, or other area that has its own authority and is counted separately."
};

const setupGlossary = () => {
    const overlay = document.getElementById("glossary-overlay");
    const title = document.getElementById("glossary-title");
    const definition = document.getElementById("glossary-definition");
    const close = () => {
        overlay.hidden = true;
    };
    document.querySelectorAll(".glossary-trigger").forEach(trigger => {
        trigger.addEventListener("click", () => {
            const term = trigger.dataset.glossary;
            title.textContent = term;
            definition.textContent = glossaryDefinitions[term];
            overlay.hidden = false;
        });
    });
    document.getElementById("glossary-close").addEventListener("click", close);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) close();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !overlay.hidden) close();
    });
};

setupGlossary();

const normaliseCountry = country => COUNTRY_ALIASES.get(country) || country
    .replace(/\s+\(.+\)$/, "").replace(/\s{2,}/g, " ").trim();

const bucketFor = rate => {
    if (!Number.isFinite(rate)) return BUCKETS[0];
    return BUCKETS.find(bucket => rate >= bucket.min && rate <= bucket.max);
};

const drawMap = data => {
    state = {
        data,
        dataByCountry: new Map(data.map(row => [normaliseCountry(row.country), row])),
        palette: "pew",
        activeBucket: null,
        legendLocked: false,
        activeContinent: "All",
        leaderboardContinent: "All",
        sortDescending: true,
        includeTerritories: true,
        rateRange: "all",
        calloutsVisible: true,
        search: "",
        selected: null,
        features: [],
        projection: d3.geoNaturalEarth1(),
        path: null,
        zoom: null,
        mapGroup: null,
        svg: null
    };
    setupControls();
    renderLegend();

    state.svg = d3.select("#map").append("svg")
        .attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`)
        .attr("role", "img")
        .attr("aria-label", "World map showing incarceration rates per 100,000 population");
    const defs = state.svg.append("defs");
    const hatch = defs.append("pattern").attr("id", "no-data-hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 8).attr("height", 8).attr("patternTransform", "rotate(45)");
    hatch.append("rect").attr("width", 8).attr("height", 8).attr("fill", "#eae8e4");
    hatch.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 8).attr("stroke", "#c7c2bb").attr("stroke-width", 2);
    state.projection.fitExtent([[MAP_MARGIN.left, MAP_MARGIN.top], [MAP_WIDTH - MAP_MARGIN.right, MAP_HEIGHT - MAP_MARGIN.bottom]], { type: "Sphere" });
    state.path = d3.geoPath(state.projection);
    state.zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", event => state.mapGroup.attr("transform", event.transform));
    state.svg.call(state.zoom).on("dblclick.zoom", null).on("dblclick", resetMap);
    state.mapGroup = state.svg.append("g").attr("class", "map-layer");
    state.mapGroup.append("path").datum({ type: "Sphere" }).attr("class", "map-ocean").attr("d", state.path);

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
        state.features = topojson.feature(world, world.objects.countries).features;
        state.mapGroup.selectAll(".country")
            .data(state.features)
            .join("path")
            .attr("class", "country")
            .attr("d", state.path)
            .on("mouseenter", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)
            .on("click", (event, feature) => selectCountry(feature, true));
        renderCallouts();
        renderFilterTerritoryCallouts();
        updateMap();
        renderLeaderboard();
    }).catch(error => {
        d3.select("#map").append("p").attr("class", "load-error").text("Unable to load the world map boundaries.");
        console.error("Error loading world map boundaries:", error);
    });
};

const setupControls = () => {
    const continents = ["All", ...new Set(state.data.map(row => row.continent))];
    d3.select("#continent-filters").selectAll("button").data(continents).join("button")
        .attr("class", (continent, index) => `chip ${index === 0 ? "active" : ""}`)
        .text(continent => continent).on("click", (event, continent) => {
            state.activeContinent = continent;
            d3.select("#continent-filters").selectAll("button").classed("active", value => value === continent);
            renderFilterTerritoryCallouts();
            updateMap();
            updateResetFilterButton();
        });
    d3.select("#country-search")
        .on("input", event => {
            state.search = event.target.value.trim().toLowerCase();
            renderSuggestions();
            updateMap();
        })
        .on("keydown", handleSearchKeydown)
        .on("focus", renderSuggestions);
    d3.select("#search-suggestions").on("mousedown", event => event.preventDefault());
    d3.select("#palette-select").on("change", event => {
        state.palette = event.target.value;
        renderLegend();
        updateMap();
    });
    d3.select("#reset-map").on("click", resetMap);
    d3.select("#reset-filter").on("click", resetFilters);
    d3.select("#toggle-callouts").on("click", toggleCallouts);
    d3.select("#export-csv").on("click", exportCsv);
    setupLeaderboardControls();
};

const regionFor = row => ["North America", "South America"].includes(row.continent) ? "Americas" : row.continent;
const isDependentTerritory = row => /American Samoa|Guam|Virgin Islands|Puerto Rico|Northern Mariana|Greenland|Martinique|French Guiana|Cayman|Gibraltar|Bermuda|Curaçao|Guadeloupe|French Polynesia|Mayotte|New Caledonia|Reunion|Sint Maarten|Aruba|Anguilla|Cook Islands|Isle of Man|Jersey|Hong Kong|Macau|South Georgia|Falkland|Montserrat|Turks and Caicos|British Indian Ocean/i.test(row.country);
const filteredRankedData = () => state.data
    .filter(row => Number.isFinite(row.rate))
    .filter(row => state.leaderboardContinent === "All" || regionFor(row) === state.leaderboardContinent)
    .filter(row => state.includeTerritories || !isDependentTerritory(row))
    .filter(row => {
        if (state.rateRange === "all") return true;
        if (state.rateRange === "500") return row.rate > 500;
        if (state.rateRange === "300-500") return row.rate >= 300 && row.rate <= 500;
        return row.rate < 100;
    })
    .sort((a, b) => state.sortDescending ? d3.descending(a.rate, b.rate) : d3.ascending(a.rate, b.rate));

const setupLeaderboardControls = () => {
    d3.select("#leaderboard-continents").selectAll("button").data(LEADERBOARD_CONTINENTS).join("button")
        .attr("class", item => `chip ${item === state.leaderboardContinent ? "active" : ""}`)
        .text(item => item)
        .on("click", (event, item) => {
            state.leaderboardContinent = item;
            state.activeContinent = item === "Americas" ? "Americas" : item;
            d3.select("#leaderboard-continents").selectAll("button").classed("active", value => value === item);
            d3.select("#continent-filters").selectAll("button").classed("active", value => value === state.activeContinent);
            renderFilterTerritoryCallouts();
            updateMap();
            renderLeaderboard();
        });
    d3.select("#sort-rate").on("click", () => {
        state.sortDescending = !state.sortDescending;
        d3.select("#sort-rate").text(state.sortDescending ? "Highest rate ↓" : "Lowest rate ↑");
        renderLeaderboard();
        updateResetFilterButton();
    });
    d3.select("#include-territories").on("change", event => {
        state.includeTerritories = event.target.checked;
        renderLeaderboard();
        updateResetFilterButton();
    });
    d3.select("#rate-range").on("change", event => {
        state.rateRange = event.target.value;
        renderLeaderboard();
        updateResetFilterButton();
    });
};

const renderLeaderboard = () => {
    const rows = filteredRankedData().slice(0, 15);
    const filteredRows = filteredRankedData();
    const median = filteredRows.length ? d3.median(filteredRows, row => row.rate) : 0;
    const regionText = state.leaderboardContinent === "All" ? "all regions" : state.leaderboardContinent;
    d3.select("#leaderboard-summary").text(`Showing ${rows.length} of ${filteredRankedData().length} in ${regionText} · Median ${d3.format(",.0f")(median)}`);
    updateResetFilterButton();
    d3.select("#leaderboard").selectAll(".leaderboard-row").data(rows, row => row.country).join(
        enter => enter.append("button").attr("class", "leaderboard-row"),
        update => update,
        exit => exit.remove()
    )
        .attr("type", "button")
        .on("mouseenter", (event, row) => highlightRow(row))
        .on("mouseleave", clearRowHighlight)
        .on("click", (event, row) => selectLeaderboardRow(row));
    const rendered = d3.select("#leaderboard").selectAll(".leaderboard-row");
    rendered.html(row => {
        const rank = filteredRows.findIndex(item => item.country === row.country) + 1;
        const marker = isDependentTerritory(row) ? "○" : "●";
        return `<span class="rank-badge">#${rank}</span><span class="leader-country"><span class="country-dot" aria-hidden="true">${marker}</span><strong>${row.country}</strong><small>${regionFor(row)}${isDependentTerritory(row) ? " · territory" : ""}</small></span><span class="leader-rate">${d3.format(",")(row.rate)}</span><span class="leader-bar"><i style="width:${row.rate / d3.max(state.data, item => item.rate) * 100}%"></i></span>`;
    });
};

const isFilterActive = () => state.activeContinent !== "All"
    || state.leaderboardContinent !== "All"
    || state.activeBucket !== null
    || state.rateRange !== "all"
    || !state.includeTerritories
    || !state.sortDescending;

const updateResetFilterButton = () => {
    d3.select("#reset-filter").property("disabled", !isFilterActive());
};

const resetFilters = () => {
    state.activeContinent = "All";
    state.leaderboardContinent = "All";
    state.activeBucket = null;
    state.legendLocked = false;
    state.sortDescending = true;
    state.includeTerritories = true;
    state.rateRange = "all";
    state.search = "";
    d3.select("#leaderboard-continents").selectAll("button").classed("active", value => value === "All");
    d3.select("#continent-filters").selectAll("button").classed("active", value => value === "All");
    d3.select("#sort-rate").text("Highest rate ↓");
    d3.select("#include-territories").property("checked", true);
    d3.select("#rate-range").property("value", "all");
    d3.select("#country-search").property("value", "");
    d3.select("#search-suggestions").classed("visible", false).html("");
    renderLegend();
    renderFilterTerritoryCallouts();
    updateMap();
    renderLeaderboard();
    resetMap();
};

const highlightRow = row => {
    state.mapGroup?.selectAll(".country").classed("row-highlight", feature => rowForFeature(feature)?.country === row.country);
};
const clearRowHighlight = () => state.mapGroup?.selectAll(".country").classed("row-highlight", false);
const selectLeaderboardRow = row => {
    const feature = state.features.find(item => item.properties.name === normaliseCountry(row.country));
    if (!feature) return;

    selectCountry(feature, true);
    document.querySelector(".map-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
};
const toggleCallouts = () => {
    state.calloutsVisible = !state.calloutsVisible;
    d3.select(".callouts").classed("callouts-hidden", !state.calloutsVisible);
    d3.select("#toggle-callouts").attr("aria-pressed", state.calloutsVisible).text(state.calloutsVisible ? "◉ Hide callouts" : "◎ Show callouts");
};

const matchingRows = () => {
    const query = state.search;
    return query
        ? state.data
            .filter(row => row.country.toLowerCase().includes(query) || normaliseCountry(row.country).toLowerCase().includes(query))
            .sort((a, b) => {
                const aExact = normaliseCountry(a.country).toLowerCase() === query;
                const bExact = normaliseCountry(b.country).toLowerCase() === query;
                return Number(bExact) - Number(aExact);
            })
            .slice(0, 8)
        : [];
};

const renderSuggestions = () => {
    const suggestions = matchingRows();
    const container = d3.select("#search-suggestions");
    container.classed("visible", Boolean(state.search));
    if (!state.search) {
        container.html("");
        return;
    }
    if (!suggestions.length) {
        container.html('<div class="suggestion-empty">Country or territory not found</div>');
        return;
    }
    container.selectAll("button").data(suggestions, row => row.country).join("button")
        .attr("class", "suggestion")
        .attr("role", "option")
        .html(row => `<span>${row.country}</span><small>${row.continent}</small>`)
        .on("click", (event, row) => chooseSearchResult(row));
};

const chooseSearchResult = row => {
    const feature = state.features.find(item => item.properties.name === normaliseCountry(row.country));
    if (!feature) return;
    d3.select("#country-search").property("value", row.country);
    state.search = row.country.toLowerCase();
    d3.select("#search-suggestions").classed("visible", false);
    selectCountry(feature, true);
    updateMap();
};

const handleSearchKeydown = event => {
    const suggestions = d3.selectAll("#search-suggestions .suggestion").nodes();
    const current = suggestions.indexOf(document.activeElement);
    if (event.key === "ArrowDown" && suggestions.length) {
        event.preventDefault();
        suggestions[(current + 1) % suggestions.length].focus();
    } else if (event.key === "ArrowUp" && suggestions.length) {
        event.preventDefault();
        suggestions[(current - 1 + suggestions.length) % suggestions.length].focus();
    } else if (event.key === "Enter") {
        event.preventDefault();
        const row = matchingRows()[0];
        if (row) chooseSearchResult(row);
    } else if (event.key === "Escape") {
        d3.select("#search-suggestions").classed("visible", false);
    }
};

const renderLegend = () => {
    const colours = PALETTES[state.palette];
    d3.select("#legend").selectAll("button").data(BUCKETS).join("button")
        .attr("class", bucket => `legend-item ${state.activeBucket === bucket.key ? "active" : ""}`)
        .style("background", (bucket, index) => index === 0
            ? "repeating-linear-gradient(135deg, #eae8e4, #eae8e4 5px, #c7c2bb 5px, #c7c2bb 6px)"
            : colours[index])
        .html(bucket => `<span>${bucket.label}</span>${bucket.key === "no-data" ? "Unavailable" : "rate"}`)
        .on("mouseenter", (event, bucket) => {
            if (!state.legendLocked) state.activeBucket = bucket.key;
            renderLegend();
            updateMap();
        })
        .on("mouseleave", () => {
            if (state.legendLocked) return;
            state.activeBucket = null;
            renderLegend();
            updateMap();
        })
        .on("click", (event, bucket) => {
            state.activeBucket = state.activeBucket === bucket.key ? null : bucket.key;
            state.legendLocked = Boolean(state.activeBucket);
            renderLegend();
            renderFilterTerritoryCallouts();
            updateMap();
            updateResetFilterButton();
        });
};

const rowForFeature = feature => state.dataByCountry.get(feature.properties.name)
    || state.dataByCountry.get(normaliseCountry(feature.properties.name));
const featureMatches = feature => {
    const row = rowForFeature(feature);
    const bucket = bucketFor(row?.rate);
    const featureRegion = feature.properties.name === "Antarctica" ? "Antarctica" : row && regionFor(row);
    const continentMatch = state.activeContinent === "All" || featureRegion === state.activeContinent || row?.continent === state.activeContinent;
    const bucketMatch = !state.activeBucket || bucket.key === state.activeBucket;
    const searchMatch = !state.search || feature.properties.name.toLowerCase().includes(state.search) || row?.country.toLowerCase().includes(state.search);
    return { row, bucket, continentMatch, bucketMatch, searchMatch };
};

const updateMap = () => {
    if (!state.features.length) return;
    const colours = PALETTES[state.palette];
    state.mapGroup.selectAll(".country")
        .attr("fill", feature => {
            const { bucket } = featureMatches(feature);
            return bucket.key === "no-data" ? "url(#no-data-hatch)" : colours[BUCKETS.indexOf(bucket)];
        })
        .classed("dimmed", feature => {
            const match = featureMatches(feature);
            return !match.continentMatch || !match.bucketMatch || !match.searchMatch;
        })
        .classed("search-match", feature => Boolean(state.search) && featureMatches(feature).searchMatch);
    renderFilterTerritoryCallouts();
};

const selectCountry = (feature, zoomToCountry) => {
    const row = rowForFeature(feature);
    state.selected = feature;
    state.mapGroup.selectAll(".country").classed("selected", item => item === feature);
    renderDetails(feature, row);
    if (!zoomToCountry || !row) return;
    const [[x0, y0], [x1, y1]] = state.path.bounds(feature);
    const scale = Math.min(7, 0.85 / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / MAP_HEIGHT));
    const translate = [MAP_WIDTH / 2 - scale * (x0 + x1) / 2, MAP_HEIGHT / 2 - scale * (y0 + y1) / 2];
    state.svg.transition().duration(700).call(state.zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
};

const renderDetails = (feature, row) => {
    const panel = d3.select("#details-panel");
    if (!row || !Number.isFinite(row.rate)) {
        panel.html(`<div class="panel-empty"><span class="panel-mark">—</span><h2>${row?.country || feature.properties.name}</h2><p>No prison population rate is available in the supplied dataset.</p><div class="stat-row"><dt>Global rank</dt><dd>N/A</dd></div></div>`);
        return;
    }
    const rankedData = state.data.filter(item => Number.isFinite(item.rate)).sort((a, b) => d3.descending(a.rate, b.rate));
    const rankIndex = rankedData.findIndex(item => item.country === row.country);
    const rank = rankIndex >= 0 ? `${rankIndex + 1} of ${rankedData.length}` : "N/A";
    const regional = d3.mean(state.data.filter(item => item.continent === row.continent), item => item.rate);
    const comparison = row.rate >= GLOBAL_MEDIAN ? `${Math.round(row.rate / GLOBAL_MEDIAN * 10) / 10}× the global median` : `${Math.round(GLOBAL_MEDIAN / row.rate * 10) / 10}× below the global median`;
    const comparisonClass = row.rate >= GLOBAL_MEDIAN ? "" : " below";
    const benchmarkMax = Math.max(row.rate, GLOBAL_MEDIAN, regional, 542);
    panel.html(`
        <p class="panel-kicker">Selected jurisdiction</p>
        <p class="panel-continent">${regionFor(row)}</p>
        <h2 class="panel-title">${row.country}</h2>
        <div class="panel-iso">ISO 3166 numeric / atlas ID: ${String(feature.id || "—").padStart(3, "0")}</div>
        <p class="rate-number">${d3.format(",")(row.rate)}</p>
        <p class="rate-unit">people per 100,000 population</p>
        <span class="comparison${comparisonClass}">${comparison}</span>
        <dl class="stat-list">
            <div class="stat-row"><dt>Global rank</dt><dd>${rank}</dd></div>
            <div class="stat-row"><dt>Regional average</dt><dd>${d3.format(",.0f")(regional)}</dd></div>
            <div class="stat-row"><dt>Total prison population</dt><dd>Not reported</dd></div>
        </dl>
        <div class="benchmark"><h3>Benchmark comparison</h3>
            ${benchmarkBar("Selected", row.rate, benchmarkMax)}
            ${benchmarkBar("World median", GLOBAL_MEDIAN, benchmarkMax)}
            ${benchmarkBar("Region", regional, benchmarkMax)}
            ${benchmarkBar("United States", 542, benchmarkMax)}
        </div>`);
};

const benchmarkBar = (label, value, max) => `<div class="benchmark-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${value / max * 100}%"></div></div><strong>${d3.format(".0f")(value)}</strong></div>`;

const renderCallouts = () => {
    const group = state.mapGroup.append("g").attr("class", "callouts");
    const points = CALLOUT_NAMES.map(name => state.features.find(feature => feature.properties.name === name)).filter(Boolean);
    const labels = points.map(feature => {
        const [x, y] = state.path.centroid(feature);
        const row = rowForFeature(feature);
        const isUsa = feature.properties.name === "United States of America";
        const [labelX, labelY] = isUsa
            ? state.projection([-100, 38])
            : feature.properties.name === "Turkmenistan"
                ? state.projection([59, 18])
                : [x > MAP_WIDTH / 2 ? x - 75 : x + 75, y];
        return { feature, row, x, y, labelX, labelY, isUsa };
    }).sort((a, b) => a.labelY - b.labelY);
    labels.forEach((label, index) => {
        if (index && label.labelY - labels[index - 1].labelY < 22) label.labelY = labels[index - 1].labelY + 22;
        const anchor = label.isUsa ? "middle" : label.labelX > label.x ? "start" : "end";
        if (!label.isUsa) {
            group.append("line").attr("class", "callout-line")
                .attr("x1", label.x).attr("y1", label.y).attr("x2", label.labelX).attr("y2", label.labelY)
                .on("mouseenter", event => showTooltip(event, label.feature))
                .on("mousemove", moveTooltip).on("mouseleave", hideTooltip)
                .on("click", () => selectCountry(label.feature, true));
        }
        const text = group.append("text").attr("class", `callout-label${label.isUsa ? " callout-usa" : ""}`)
            .attr("x", label.labelX).attr("y", label.labelY - 5).attr("text-anchor", anchor)
            .on("mouseenter", event => showTooltip(event, label.feature))
            .on("mousemove", moveTooltip).on("mouseleave", hideTooltip)
            .on("click", () => selectCountry(label.feature, true));
        text.append("tspan").attr("x", label.labelX).text(label.row.country);
        text.append("tspan").attr("class", "callout-value").attr("x", label.labelX).attr("dy", "14").text(label.row.rate);
    });
};

const renderFilterTerritoryCallouts = () => {
    if (!state?.mapGroup || !state.features.length) return;
    const activeRegion = state.activeContinent !== "All"
        ? state.activeContinent
        : state.leaderboardContinent;
    const group = state.mapGroup.selectAll(".filter-territory-callouts").data([null]).join("g")
        .attr("class", "filter-territory-callouts");
    const visible = Boolean(activeRegion && activeRegion !== "All");
    group.classed("filter-callouts-hidden", !visible);
    if (!visible) {
        group.selectAll("*").remove();
        return;
    }
    const candidates = state.features.filter(feature => {
        const row = rowForFeature(feature);
        const featureRegion = feature.properties.name === "Antarctica" ? "Antarctica" : row && regionFor(row);
        return featureRegion === activeRegion && (!row || !Number.isFinite(row.rate));
    }).slice(0, 24);
    const labels = group.selectAll(".territory-callout").data(candidates, feature => feature.id || feature.properties.name)
        .join(enter => {
            const item = enter.append("g").attr("class", "territory-callout");
            item.append("line").attr("class", "territory-callout-line");
            item.append("text").attr("class", "territory-callout-label");
            return item;
        });
    labels.each(function(feature, index) {
        const [x, y] = state.path.centroid(feature);
        const angle = (index % 2 ? 1 : -1);
        const labelX = Math.max(34, Math.min(MAP_WIDTH - 34, x + angle * (50 + (index % 4) * 18)));
        const labelY = Math.max(22, Math.min(MAP_HEIGHT - 22, y + (index % 3 - 1) * 26));
        const anchor = labelX >= x ? "start" : "end";
        const item = d3.select(this);
        item.select("line").attr("x1", x).attr("y1", y).attr("x2", labelX).attr("y2", labelY);
        const text = item.select("text").attr("x", labelX + (anchor === "start" ? 4 : -4)).attr("y", labelY - 3).attr("text-anchor", anchor);
        text.selectAll("tspan").remove();
        text.append("tspan").attr("x", labelX + (anchor === "start" ? 4 : -4)).text(feature.properties.name);
        text.append("tspan").attr("class", "territory-no-data").attr("x", labelX + (anchor === "start" ? 4 : -4)).attr("dy", "12").text("[No data]");
        item.on("mouseenter", event => showTooltip(event, feature))
            .on("mousemove", moveTooltip).on("mouseleave", hideTooltip)
            .on("click", () => selectCountry(feature, true));
    });
};

const showTooltip = (event, feature) => {
    const row = rowForFeature(feature);
    const rankedData = state.data.filter(item => Number.isFinite(item.rate)).sort((a, b) => d3.descending(a.rate, b.rate));
    const rankIndex = row ? rankedData.findIndex(item => item.country === row.country) : -1;
    const rank = rankIndex >= 0 ? rankIndex + 1 : "N/A";
    d3.select("#map").selectAll(".map-tooltip").remove();
    d3.select("#map").append("div").attr("class", "map-tooltip").html(row ? `<strong>${row.country}</strong><br>${d3.format(",")(row.rate)} per 100k · Rank ${rank}` : `<strong>${feature.properties.name}</strong><br>No data`).style("opacity", 1);
    moveTooltip(event);
};

const moveTooltip = event => {
    d3.select(".map-tooltip").style("left", `${event.offsetX + 14}px`).style("top", `${event.offsetY - 16}px`);
};
const hideTooltip = () => d3.select(".map-tooltip").remove();
const resetMap = () => state?.svg?.transition().duration(600).call(state.zoom.transform, d3.zoomIdentity);
const exportCsv = () => {
    const header = "Country,Prison population rate,Continent\n";
    const rows = state.data.map(row => [row.country, row.rate ?? "N/A", row.continent].map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([header + rows], { type: "text/csv" }));
    link.download = "prison-population-rates.csv";
    link.click();
    URL.revokeObjectURL(link.href);
};
