/******************************************************************************/
/* Global Incarceration Rates — Choropleth Map, Focus Layer & Territory Nodes */
/******************************************************************************/

/**
 * Define or update the diagonal hatch SVG pattern (#pattern-no-data) for No Data records.
 * Light mode base: #E2E8F0; Dark mode base: #2D3748.
 */
const defineMapPatterns = svg => {
    if (!svg || svg.empty()) return;
    const isDark = typeof document !== "undefined" && document.body.classList.contains("dark-mode");
    const baseFill = isDark ? NO_DATA_COLORS.darkBase : NO_DATA_COLORS.lightBase;
    const hatchStroke = isDark ? NO_DATA_COLORS.darkStroke : NO_DATA_COLORS.lightStroke;

    const defs = svg.selectAll("defs").data([null]).join("defs");
    defs.selectAll("*").remove();

    const noDataPattern = defs.append("pattern")
        .attr("id", "pattern-no-data")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 8)
        .attr("height", 8)
        .attr("patternTransform", "rotate(45)");

    noDataPattern.append("rect")
        .attr("class", "no-data-pattern-base")
        .attr("width", 8)
        .attr("height", 8)
        .attr("fill", baseFill);

    noDataPattern.append("line")
        .attr("class", "no-data-pattern-hatch")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 8)
        .attr("stroke", hatchStroke)
        .attr("stroke-width", 2.2);
};

/**
 * Return the SVG fill value for a rate bucket.
 * No Data records always return "url(#pattern-no-data)".
 */
const getSvgFillForBucket = bucket => {
    if (!bucket || bucket.key === "no-data" || bucket.colorIndex === null || bucket.colorIndex === undefined) {
        return "url(#pattern-no-data)";
    }
    const paletteObj = PALETTES[appState.palette] || PALETTES.default;
    return paletteObj.colors[bucket.colorIndex] || paletteObj.colors[0];
};

/**
 * Return a solid color for a rate bucket (used for non-SVG contexts).
 */
const getSolidColorForBucket = bucket => {
    if (!bucket || bucket.key === "no-data" || bucket.colorIndex === null || bucket.colorIndex === undefined) {
        const isDark = typeof document !== "undefined" && document.body.classList.contains("dark-mode");
        return isDark ? NO_DATA_COLORS.darkBase : NO_DATA_COLORS.lightBase;
    }
    const paletteObj = PALETTES[appState.palette] || PALETTES.default;
    return paletteObj.colors[bucket.colorIndex] || paletteObj.colors[0];
};

/**
 * Look up the canonical jurisdiction record for a geographic feature.
 */
const getRowForFeature = feature => {
    if (!feature) return null;
    const iso = resolveFeatureIso(feature, appState.mappingConfig);
    if (iso && appState.dataByIso.has(iso)) {
        return appState.dataByIso.get(iso);
    }
    if (feature.properties?.csvRow) return feature.properties.csvRow;
    const rawName = feature.properties?.name || "";
    return appState.dataByExactName.get(rawName)
        || appState.dataByNormalisedName.get(normaliseJurisdictionName(rawName).toLowerCase())
        || null;
};

/**
 * Build canonical marker descriptors from mappingConfig.markerCoordinatesByIso.
 * Centers square markers on the primary land centroid for large territories (e.g., GRL, GUF, PRI, NCL).
 */
const buildTerritoryFeatures = () => {
    const cfg = appState.mappingConfig || DEFAULT_MAPPING_CONFIG;
    const coordsMap = cfg.markerCoordinatesByIso || {};
    const results = [];
    appState.markersByIso.clear();

    Object.entries(coordsMap).forEach(([iso, coordInfo]) => {
        const row = appState.dataByIso.get(iso) || {
            iso,
            country: iso,
            rate: null,
            continent: "Unknown",
            jurisdiction_type: classifyJurisdictionType(iso, cfg),
            blocs: getBlocsForIso(iso, cfg)
        };

        const atlasFeature = appState.featuresByIso.get(iso) || null;
        let projectedX = null;
        let projectedY = null;

        // Center marker on the primary land centroid when a polygon exists for large territories
        if (atlasFeature && geoPathGenerator && row.jurisdiction_type === "overseas_autonomous") {
            const centroid = geoPathGenerator.centroid(atlasFeature);
            if (centroid && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
                projectedX = centroid[0];
                projectedY = centroid[1];
            }
        }

        if (projectedX === null || projectedY === null) {
            const projected = appState.projection ? appState.projection([coordInfo.lon, coordInfo.lat]) : [0, 0];
            if (projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])) {
                projectedX = projected[0];
                projectedY = projected[1];
            }
        }

        const markerFeature = {
            type: "Feature",
            id: `marker-${iso}`,
            geometry: {
                type: "Point",
                coordinates: [coordInfo.lon, coordInfo.lat]
            },
            properties: {
                iso,
                name: row.country,
                jurisdiction_type: row.jurisdiction_type,
                csvRow: row,
                isTerritoryTarget: true,
                hitRadius: Math.max(MIN_HIT_RADIUS_PX, coordInfo.hitRadius || 6),
                lon: coordInfo.lon,
                lat: coordInfo.lat,
                projectedX: projectedX ?? -999,
                projectedY: projectedY ?? -999,
                atlasFeature
            }
        };

        results.push(markerFeature);
        appState.markersByIso.set(iso, markerFeature);
    });

    return results;
};

/**
 * Render the top-most SVG focus layer (<g id="focus-layer">) so every edge of pinned or hovered
 * jurisdictions (including enclaves and landlocked states like Mongolia and Lesotho) is rendered
 * cleanly above neighboring polygons without mutating the permanent country layer order.
 */
const renderFocusLayer = () => {
    if (!appState.focusLayer || !geoPathGenerator) return;

    const focusIsos = [];
    if (appState.pinnedJurisdictionId) {
        focusIsos.push({ iso: appState.pinnedJurisdictionId, role: "pinned" });
    }
    if (appState.hoveredJurisdictionId && appState.hoveredJurisdictionId !== appState.pinnedJurisdictionId) {
        focusIsos.push({ iso: appState.hoveredJurisdictionId, role: "hovered" });
    }

    const focusItems = focusIsos
        .map(item => {
            const feature = appState.featuresByIso.get(item.iso);
            return feature ? { ...item, feature } : null;
        })
        .filter(Boolean);

    appState.focusLayer
        .selectAll("path.focus-outline")
        .data(focusItems, d => `${d.iso}-${d.role}`)
        .join("path")
        .attr("class", d => `focus-outline focus-outline-${d.role}`)
        .attr("data-iso", d => d.iso)
        .attr("d", d => geoPathGenerator(d.feature))
        .attr("fill", "none")
        .attr("vector-effect", "non-scaling-stroke")
        .style("pointer-events", "none");
};

/**
 * Compute pixel coordinates [x, y] for placing the pinned jurisdiction's label on the map.
 */
const computeJurisdictionLabelPosition = (row, feature) => {
    const iso = row?.iso || resolveFeatureIso(feature, appState.mappingConfig);
    const cfg = appState.mappingConfig || DEFAULT_MAPPING_CONFIG;

    // 1. Check curated multipolygon anchor override by ISO
    if (iso && cfg.labelAnchorByIso && cfg.labelAnchorByIso[iso] && appState.projection) {
        const projected = appState.projection(cfg.labelAnchorByIso[iso]);
        if (projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])) {
            return { x: projected[0], y: projected[1], isPointTarget: !appState.featuresByIso.has(iso) };
        }
    }

    // 2. Use polygon centroid if a polygon feature exists
    const polyFeature = iso === "FJI"
        ? null
        : ((iso && appState.featuresByIso.get(iso)) || (feature?.geometry?.type !== "Point" ? feature : null));
    if (polyFeature && geoPathGenerator) {
        const centroid = geoPathGenerator.centroid(polyFeature);
        if (centroid && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
            return { x: centroid[0], y: centroid[1], isPointTarget: false };
        }
    }

    // 3. Check marker coordinates
    const markerCoord = iso && cfg.markerCoordinatesByIso ? cfg.markerCoordinatesByIso[iso] : null;
    if (markerCoord && appState.projection) {
        const projected = appState.projection([markerCoord.lon, markerCoord.lat]);
        if (projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])) {
            return { x: projected[0], y: projected[1], isPointTarget: true };
        }
    }

    // 4. Fallback to d3.geoCentroid
    if (feature && typeof d3 !== "undefined" && d3.geoCentroid && appState.projection) {
        const geoCenter = d3.geoCentroid(feature);
        const projected = appState.projection(geoCenter);
        if (projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])) {
            return { x: projected[0], y: projected[1], isPointTarget: feature.geometry?.type === "Point" };
        }
    }

    return null;
};

/**
 * Render or update the dynamic country label for the pinned jurisdiction.
 */
const renderSelectedJurisdictionLabel = (fadeTransition = true) => {
    if (!appState.labelGroup) return;

    const pinnedIso = appState.pinnedJurisdictionId;
    if (!pinnedIso) {
        appState.labelGroup
            .interrupt()
            .transition()
            .duration(180)
            .style("opacity", 0)
            .on("end", function() {
                d3.select(this).selectAll("*").remove();
            });
        return;
    }

    const row = appState.dataByIso.get(pinnedIso) || appState.selectedJurisdiction?.row || null;
    const feature = appState.featuresByIso.get(pinnedIso)
        || appState.markersByIso.get(pinnedIso)
        || appState.selectedJurisdiction?.feature
        || null;

    const pos = computeJurisdictionLabelPosition(row, feature);
    if (!pos) return;

    const displayName = row?.country || feature?.properties?.name || pinnedIso;
    const rateSubtext = row && Number.isFinite(row.rate)
        ? `${d3.format(",")(row.rate)} per 100k`
        : "No data";

    const k = appState.currentZoomTransform ? appState.currentZoomTransform.k : 1;
    const yOffset = pos.isPointTarget ? -12 : 0;

    appState.labelGroup.selectAll("*").remove();

    const anchorGroup = appState.labelGroup
        .append("g")
        .attr("class", "selected-label-anchor")
        .attr("transform", `translate(${pos.x}, ${pos.y}) scale(${1 / k})`);

    if (pos.isPointTarget) {
        anchorGroup.append("line")
            .attr("class", "selected-label-leader")
            .attr("x1", 0)
            .attr("y1", -3)
            .attr("x2", 0)
            .attr("y2", yOffset + 3);
    }

    const textEl = anchorGroup.append("text")
        .attr("class", "selected-country-label")
        .attr("text-anchor", "middle")
        .attr("y", yOffset - 4);

    textEl.append("tspan")
        .attr("class", "selected-country-name")
        .attr("x", 0)
        .text(displayName);

    textEl.append("tspan")
        .attr("class", "selected-country-rate")
        .attr("x", 0)
        .attr("dy", "13")
        .text(rateSubtext);

    if (fadeTransition) {
        appState.labelGroup
            .interrupt()
            .style("opacity", 0)
            .transition()
            .delay(100)
            .duration(360)
            .style("opacity", 1);
    } else {
        appState.labelGroup.style("opacity", 1);
    }
};

/**
 * Keep visible marker dimensions consistent under zoom and guarantee that buffered
 * hit targets maintain at least MIN_HIT_RADIUS_PX (4 CSS pixels) effective radius.
 */
const syncElementsWithZoom = transform => {
    appState.currentZoomTransform = transform || { k: 1, x: 0, y: 0 };
    const k = appState.currentZoomTransform.k || 1;
    const inverseSqrt = 1 / Math.pow(k, 0.65);

    if (appState.territoryGroup) {
        const circleRadius = Math.max(1.2, 3.2 * inverseSqrt);
        const squareSide = Math.max(2.4, 6.2 * inverseSqrt);
        const strokeWidth = Math.max(0.35, 1.0 * inverseSqrt);

        appState.territoryGroup.selectAll("circle.sovereign-marker")
            .attr("r", circleRadius)
            .attr("stroke-width", strokeWidth);

        appState.territoryGroup.selectAll("rect.territory-marker")
            .attr("x", -squareSide / 2)
            .attr("y", -squareSide / 2)
            .attr("width", squareSide)
            .attr("height", squareSide)
            .attr("stroke-width", strokeWidth);

        // Effective screen radius is r * k; ensure r * k >= MIN_HIT_RADIUS_PX (4px) at all zoom levels
        appState.territoryGroup.selectAll("circle.jurisdiction-hit-target")
            .attr("r", d => {
                const baseR = d.properties?.hitRadius || 6;
                const scaledR = baseR * inverseSqrt;
                const minUserUnits = MIN_HIT_RADIUS_PX / k;
                return Math.max(minUserUnits, scaledR);
            });
    }

    if (appState.labelGroup) {
        appState.labelGroup.selectAll(".selected-label-anchor")
            .attr("transform", function() {
                const current = d3.select(this).attr("transform") || "";
                const translateMatch = current.match(/translate\(([^)]+)\)/);
                const translatePart = translateMatch ? `translate(${translateMatch[1]})` : "translate(0, 0)";
                return `${translatePart} scale(${1 / k})`;
            });
    }
};

/**
 * Smoothly zoom the map to a jurisdiction identified by row/feature.
 */
const zoomToJurisdiction = (row, feature) => {
    if (!appState.svg || !appState.zoomBehavior || !appState.projection) return;

    const iso = row?.iso || resolveFeatureIso(feature, appState.mappingConfig);
    const cfg = appState.mappingConfig || DEFAULT_MAPPING_CONFIG;
    const polyFeature = (iso && appState.featuresByIso.get(iso)) || (feature?.geometry?.type !== "Point" ? feature : null);
    const markerCoord = iso && cfg.markerCoordinatesByIso ? cfg.markerCoordinatesByIso[iso] : null;
    const anchorOverride = iso && cfg.labelAnchorByIso ? cfg.labelAnchorByIso[iso] : null;

    let scale = 4.5;
    let centerX = MAP_WIDTH / 2;
    let centerY = MAP_HEIGHT / 2;

    if (polyFeature && geoPathGenerator) {
        const bounds = geoPathGenerator.bounds(polyFeature);
        if (bounds && Number.isFinite(bounds[0][0]) && Number.isFinite(bounds[1][0])) {
            const [[x0, y0], [x1, y1]] = bounds;
            const dx = Math.max(x1 - x0, 5);
            const dy = Math.max(y1 - y0, 5);
            centerX = (x0 + x1) / 2;
            centerY = (y0 + y1) / 2;
            scale = Math.max(1.8, Math.min(ZOOM_SCALE_EXTENT[1], 0.78 / Math.max(dx / MAP_WIDTH, dy / MAP_HEIGHT)));
        }
    } else if (markerCoord) {
        const projected = appState.projection([markerCoord.lon, markerCoord.lat]);
        if (projected) {
            [centerX, centerY] = projected;
            scale = Math.min(ZOOM_SCALE_EXTENT[1], 10);
        }
    }

    if (anchorOverride) {
        const projected = appState.projection(anchorOverride);
        if (projected) {
            [centerX, centerY] = projected;
            if (!polyFeature) {
                scale = Math.min(ZOOM_SCALE_EXTENT[1], 8);
            } else {
                scale = Math.max(scale, 3.8);
            }
        }
    }

    const translate = [
        MAP_WIDTH / 2 - scale * centerX,
        MAP_HEIGHT / 2 - scale * centerY
    ];

    appState.svg
        .interrupt()
        .transition()
        .duration(650)
        .ease(d3.easeCubicOut)
        .call(
            appState.zoomBehavior.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
};

/**
 * Clear the pinned selection and reset the map view.
 */
const resetMapView = () => {
    appState.pinnedJurisdictionId = null;
    appState.hoveredJurisdictionId = null;
    selectedJurisdiction = null;
    hoveredJurisdiction = null;
    appState.selectedJurisdiction = null;
    appState.hoveredJurisdiction = null;

    renderSelectedJurisdictionLabel(false);
    renderFocusLayer();

    if (appState.svg && appState.zoomBehavior) {
        appState.svg
            .interrupt()
            .transition()
            .duration(520)
            .ease(d3.easeCubicOut)
            .call(appState.zoomBehavior.transform, d3.zoomIdentity);
    }

    updateMapStyles();
    if (typeof updateBarChartHighlightStates === "function") {
        updateBarChartHighlightStates();
    }
    if (typeof renderDetailsPanel === "function") {
        renderDetailsPanel(null, null, false);
    }
};

/**
 * Synchronize map polygon fills, marker fills, dimming (opacity: 0.15 for non-members),
 * focus layer outlines, and ARIA pressed attributes using canonical ISO IDs.
 */
const updateMapStyles = () => {
    if (!appState.mapGroup) return;

    const pinnedIso = appState.pinnedJurisdictionId;
    const hoveredIso = appState.hoveredJurisdictionId;

    appState.mapGroup.selectAll("path.country")
        .attr("fill", feature => {
            const row = getRowForFeature(feature);
            const bucket = bucketForRate(row?.rate);
            return getSvgFillForBucket(bucket);
        })
        .classed("no-data-geometry", feature => {
            const row = getRowForFeature(feature);
            return !row || !Number.isFinite(row.rate);
        })
        .classed("dimmed", feature => {
            const row = getRowForFeature(feature);
            const match = doesRowMatchActiveFilters(row, feature.properties?.name);
            return !match.matchesAll;
        })
        .classed("is-selected", feature => {
            const iso = resolveFeatureIso(feature, appState.mappingConfig);
            return Boolean(pinnedIso && iso === pinnedIso);
        })
        .classed("is-hovered", feature => {
            const iso = resolveFeatureIso(feature, appState.mappingConfig);
            return Boolean(hoveredIso && iso === hoveredIso);
        })
        .classed("search-match", feature => {
            if (!appState.searchQuery) return false;
            const row = getRowForFeature(feature);
            return doesRowMatchActiveFilters(row, feature.properties?.name).searchMatch;
        })
        .attr("aria-pressed", feature => {
            const iso = resolveFeatureIso(feature, appState.mappingConfig);
            return Boolean(pinnedIso && iso === pinnedIso) ? "true" : "false";
        });

    if (appState.territoryGroup) {
        appState.territoryGroup.selectAll("g.territory-target")
            .classed("dimmed", d => {
                const row = d.properties.csvRow;
                const match = doesRowMatchActiveFilters(row, d.properties.name);
                return !match.matchesAll;
            })
            .classed("is-selected", d => Boolean(pinnedIso && d.properties.iso === pinnedIso))
            .classed("is-hovered", d => Boolean(hoveredIso && d.properties.iso === hoveredIso))
            .classed("search-match", d => {
                if (!appState.searchQuery) return false;
                return doesRowMatchActiveFilters(d.properties.csvRow, d.properties.name).searchMatch;
            })
            .attr("aria-pressed", d => Boolean(pinnedIso && d.properties.iso === pinnedIso) ? "true" : "false");

        appState.territoryGroup.selectAll(".sovereign-marker, .territory-marker")
            .attr("fill", d => {
                const bucket = bucketForRate(d.properties.csvRow?.rate);
                return getSvgFillForBucket(bucket);
            })
            .classed("no-data-geometry", d => {
                const rate = d.properties.csvRow?.rate;
                return !Number.isFinite(rate);
            });
    }

    renderFocusLayer();
};

/**
 * Render map polygons, focus layer, and canonical marker geometry from a list of features.
 *Separated from network fetching so automated DOM tests can render synchronously.
 */
const renderMapGeography = rawAtlasFeatures => {
    if (!appState.mapGroup) return;

    appState.features = disaggregateAtlasFeatures(rawAtlasFeatures, appState.mappingConfig);
    appState.featuresByIso.clear();

    appState.features.forEach(feature => {
        const iso = resolveFeatureIso(feature, appState.mappingConfig);
        if (iso) {
            // Fiji straddles the antimeridian. Keep its western islands in the
            // eastern map copy so the country and its click target stay together.
            if (iso === "FJI" && feature.geometry?.coordinates) {
                const shiftLongitude = coordinates => {
                    if (Array.isArray(coordinates) && typeof coordinates[0] === "number") {
                        if (coordinates[0] < 0) coordinates[0] += 360;
                        return;
                    }
                    if (Array.isArray(coordinates)) coordinates.forEach(shiftLongitude);
                };
                shiftLongitude(feature.geometry.coordinates);
            }
            feature.properties.iso = iso;
            const row = appState.dataByIso.get(iso);
            if (row) {
                feature.properties.csvRow = row;
            }
            appState.featuresByIso.set(iso, feature);
        }
    });

    appState.territoryFeatures = buildTerritoryFeatures();

    // 1. Render country & territory polygons
    appState.countriesLayer.selectAll("path.country")
        .data(appState.features, feature => feature.properties?.iso || feature.id || feature.properties?.name)
        .join("path")
        .attr("class", "country")
        .attr("data-iso", feature => feature.properties?.iso || "")
        .attr("d", geoPathGenerator)
        .attr("tabindex", "0")
        .attr("role", "button")
        .attr("aria-label", feature => {
            const row = getRowForFeature(feature);
            const name = row?.country || feature.properties?.name || "Jurisdiction";
            const iso = row?.iso || feature.properties?.iso || "";
            const rateText = row && Number.isFinite(row.rate) ? `${d3.format(",")(row.rate)} per 100,000` : "No data";
            return `${name} (${iso}): ${rateText}`;
        })
        .on("mouseenter", (event, feature) => {
            const iso = resolveFeatureIso(feature, appState.mappingConfig);
            handleJurisdictionHover(event, getRowForFeature(feature), feature, iso);
        })
        .on("mousemove", event => moveFloatingTooltip(event))
        .on("mouseleave", () => handleJurisdictionLeave())
        .on("focus", (event, feature) => {
            const iso = resolveFeatureIso(feature, appState.mappingConfig);
            handleJurisdictionHover(event, getRowForFeature(feature), feature, iso);
        })
        .on("blur", () => handleJurisdictionLeave())
        .on("click", (event, feature) => {
            event.stopPropagation();
            const iso = resolveFeatureIso(feature, appState.mappingConfig);
            handleJurisdictionSelect(getRowForFeature(feature), feature, true, iso);
        })
        .on("keydown", (event, feature) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                const iso = resolveFeatureIso(feature, appState.mappingConfig);
                handleJurisdictionSelect(getRowForFeature(feature), feature, true, iso);
            } else if (event.key === "Escape") {
                handleJurisdictionLeave();
            }
        });

    // 2. Render marker nodes:
    // - "sovereign" and "constituent" -> <circle class="sovereign-marker">
    // - "overseas_autonomous" -> <rect class="territory-marker">
    const markerGroups = appState.territoryGroup.selectAll("g.territory-target")
        .data(appState.territoryFeatures, d => d.properties.iso)
        .join("g")
        .attr("class", d => `territory-target marker-type-${d.properties.jurisdiction_type}`)
        .attr("data-iso", d => d.properties.iso)
        .attr("transform", d => `translate(${d.properties.projectedX}, ${d.properties.projectedY})`)
        .attr("tabindex", "0")
        .attr("role", "button")
        .attr("aria-label", d => {
            const row = d.properties.csvRow;
            const rateText = row && Number.isFinite(row.rate) ? `${d3.format(",")(row.rate)} per 100,000` : "No data";
            return `${d.properties.name} (${d.properties.iso}): ${rateText}`;
        })
        .on("mouseenter", (event, d) => {
            handleJurisdictionHover(event, d.properties.csvRow, d.properties.atlasFeature || d, d.properties.iso);
        })
        .on("mousemove", event => moveFloatingTooltip(event))
        .on("mouseleave", () => handleJurisdictionLeave())
        .on("focus", (event, d) => {
            handleJurisdictionHover(event, d.properties.csvRow, d.properties.atlasFeature || d, d.properties.iso);
        })
        .on("blur", () => handleJurisdictionLeave())
        .on("click", (event, d) => {
            event.stopPropagation();
            handleJurisdictionSelect(d.properties.csvRow, d.properties.atlasFeature || d, true, d.properties.iso);
        })
        .on("keydown", (event, d) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleJurisdictionSelect(d.properties.csvRow, d.properties.atlasFeature || d, true, d.properties.iso);
            } else if (event.key === "Escape") {
                handleJurisdictionLeave();
            }
        });

    markerGroups.selectAll("*").remove();

    // Transparent buffered hit target with minimum 4px effective radius
    markerGroups.append("circle")
        .attr("class", "jurisdiction-hit-target territory-hit-target")
        .attr("data-iso", d => d.properties.iso)
        .attr("r", d => Math.max(MIN_HIT_RADIUS_PX, d.properties.hitRadius || 6))
        .attr("fill", "transparent")
        .style("pointer-events", "all");

    // Distinct marker geometry by taxonomy
    markerGroups.each(function(d) {
        const group = d3.select(this);
        if (d.properties.jurisdiction_type === "overseas_autonomous") {
            const side = 6.2;
            group.append("rect")
                .attr("class", "territory-marker")
                .attr("data-iso", d.properties.iso)
                .attr("x", -side / 2)
                .attr("y", -side / 2)
                .attr("width", side)
                .attr("height", side)
                .attr("stroke-width", 1.0);
        } else {
            group.append("circle")
                .attr("class", "sovereign-marker")
                .attr("data-iso", d.properties.iso)
                .attr("r", 3.2)
                .attr("stroke-width", 1.0);
        }
    });

    updateMapStyles();
    if (typeof renderBarChart === "function") {
        renderBarChart();
    }
};

/**
 * Initialize the map SVG, zoom behavior, and controls from loaded dataset and mapping config.
 */
const drawMap = (rawData, mappingConfig = DEFAULT_MAPPING_CONFIG, preloadedWorldTopology = null) => {
    enrichDataset(rawData, mappingConfig);

    // Restore persisted palette and theme if available
    try {
        const savedPalette = sessionStorage.getItem("wpb_palette");
        if (savedPalette && PALETTES[savedPalette]) {
            appState.palette = savedPalette;
        }
        const savedTheme = sessionStorage.getItem("wpb_dark_mode");
        if (savedTheme === "true") {
            document.body.classList.add("dark-mode");
        }
    } catch (_) {}

    if (typeof applyPaletteThemeVariables === "function") applyPaletteThemeVariables();
    if (typeof setupGlossaryTooltips === "function") setupGlossaryTooltips();
    if (typeof setupControls === "function") setupControls();
    if (typeof renderSteppedLegend === "function") renderSteppedLegend();
    if (typeof renderDetailsPanel === "function") renderDetailsPanel(null, null, false);

    const mapContainer = d3.select("#map");
    mapContainer.selectAll("svg").remove();

    appState.svg = mapContainer.append("svg")
        .attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`)
        .attr("role", "region")
        .attr("aria-label", "Interactive world choropleth map showing incarceration rates per 100,000 population");

    defineMapPatterns(appState.svg);

    appState.projection = d3.geoNaturalEarth1()
        .fitExtent(
            [[MAP_MARGIN.left, MAP_MARGIN.top], [MAP_WIDTH - MAP_MARGIN.right, MAP_HEIGHT - MAP_MARGIN.bottom]],
            { type: "Sphere" }
        );

    geoPathGenerator = d3.geoPath(appState.projection);
    appState.geoPathGenerator = geoPathGenerator;

    appState.zoomBehavior = d3.zoom()
        .scaleExtent(ZOOM_SCALE_EXTENT)
        .translateExtent([[-80, -60], [MAP_WIDTH + 80, MAP_HEIGHT + 60]])
        .on("zoom", event => {
            appState.mapGroup.attr("transform", event.transform);
            syncElementsWithZoom(event.transform);
        });

    appState.svg
        .call(appState.zoomBehavior)
        .on("dblclick.zoom", null)
        .on("dblclick", resetMapView);

    appState.mapGroup = appState.svg.append("g").attr("class", "map-layer");
    appState.mapGroup.append("path")
        .datum({ type: "Sphere" })
        .attr("class", "map-ocean")
        .attr("d", geoPathGenerator)
        .on("click", event => {
            if (event.target.classList.contains("map-ocean")) {
                resetMapView();
            }
        });

    appState.countriesLayer = appState.mapGroup.append("g").attr("class", "countries-layer");
    appState.focusLayer = appState.mapGroup.append("g").attr("id", "focus-layer");
    appState.territoryGroup = appState.mapGroup.append("g").attr("class", "territories-layer");
    appState.labelGroup = appState.mapGroup.append("g")
        .attr("class", "selected-jurisdiction-label")
        .style("pointer-events", "none")
        .style("opacity", 0);

    if (preloadedWorldTopology) {
        const rawFeatures = Array.isArray(preloadedWorldTopology)
            ? preloadedWorldTopology
            : topojson.feature(preloadedWorldTopology, preloadedWorldTopology.objects.countries).features;
        renderMapGeography(rawFeatures);
        return Promise.resolve();
    }

    return d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
        const rawFeatures = topojson.feature(world, world.objects.countries).features;
        renderMapGeography(rawFeatures);
    }).catch(error => {
        d3.select("#map")
            .append("p")
            .attr("class", "load-error")
            .text("Unable to load the world map boundaries.");
        console.error("Error loading world map boundaries:", error);
    });
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        defineMapPatterns,
        getSvgFillForBucket,
        getSolidColorForBucket,
        getRowForFeature,
        buildTerritoryFeatures,
        renderFocusLayer,
        computeJurisdictionLabelPosition,
        renderSelectedJurisdictionLabel,
        syncElementsWithZoom,
        zoomToJurisdiction,
        resetMapView,
        updateMapStyles,
        renderMapGeography,
        drawMap
    };
}
