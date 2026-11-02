/******************************************************************************/
/* Global Incarceration Rates — Automated Test Suite (Node Built-in Runner)   */
/* Run with: node --test tests/incarceration_map.test.js                      */
/******************************************************************************/

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(PROJECT_ROOT, "data", "prison_pop_rate.csv");
const MAPPING_PATH = path.join(PROJECT_ROOT, "data", "jurisdiction_mapping.json");
const SHARED_JS_PATH = path.join(PROJECT_ROOT, "js", "shared-constants.js");
const MAP_JS_PATH = path.join(PROJECT_ROOT, "js", "map.js");
const INTERACTIONS_JS_PATH = path.join(PROJECT_ROOT, "js", "interactions.js");

const mappingJson = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));
const csvRaw = fs.readFileSync(CSV_PATH, "utf8");

/**
 * Parse the project's CSV file into raw row objects.
 */
function parseProjectCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        let country, rate, continent;
        if (line.startsWith('"')) {
            const endQuote = line.indexOf('",');
            country = line.slice(1, endQuote);
            const rest = line.slice(endQuote + 2).split(",");
            rate = rest[0];
            continent = rest[1];
        } else {
            const parts = line.split(",");
            country = parts[0];
            rate = parts[1];
            continent = parts[2];
        }
        rows.push({
            Country: country.trim(),
            "Prison population rate": rate.trim(),
            Continent: continent.trim()
        });
    }
    return rows;
}

/**
 * Lightweight DOM + D3 v7 test harness capable of executing shared-constants.js,
 * map.js, and interactions.js and inspecting rendered SVG/HTML nodes and events.
 */
function createVisualizationHarness() {
    class MockElement {
        constructor(tagName) {
            this.tagName = String(tagName).toUpperCase();
            this.attributes = new Map();
            this.styles = new Map();
            this.style = {};
            this.classes = new Set();
            this.children = [];
            this.parentNode = null;
            this.listeners = new Map();
            this.__data__ = undefined;
            this.textContent = "";
            this._innerHTML = "";
            this.hidden = false;
            this.disabled = false;
            this.value = "";
            this.dataset = {};
            this.clientWidth = 800;
        }
        get id() {
            return this.attributes.get("id") || "";
        }
        set id(val) {
            this.attributes.set("id", String(val));
        }
        get className() {
            return Array.from(this.classes).join(" ");
        }
        set className(val) {
            this.classes = new Set(String(val).split(/\s+/).filter(Boolean));
            this.attributes.set("class", this.className);
        }
        get innerHTML() {
            return this._innerHTML || this.textContent;
        }
        set innerHTML(val) {
            this._innerHTML = String(val);
            this.textContent = String(val).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            this.children = [];
            // Support #clear-selection-btn inside #details-panel
            if (this._innerHTML.includes('id="clear-selection-btn"')) {
                const btn = new MockElement("button");
                btn.id = "clear-selection-btn";
                btn.parentNode = this;
                this.children.push(btn);
            }
        }
        setAttribute(name, value) {
            const strVal = String(value);
            this.attributes.set(name, strVal);
            if (name === "class") {
                this.classes = new Set(strVal.split(/\s+/).filter(Boolean));
            }
            if (name.startsWith("data-")) {
                const camel = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                this.dataset[camel] = strVal;
            }
        }
        getAttribute(name) {
            if (name === "class") return this.className;
            return this.attributes.has(name) ? this.attributes.get(name) : null;
        }
        appendChild(child) {
            child.parentNode = this;
            this.children.push(child);
            return child;
        }
        removeChild(child) {
            const idx = this.children.indexOf(child);
            if (idx >= 0) this.children.splice(idx, 1);
            child.parentNode = null;
        }
        addEventListener(type, fn) {
            if (!this.listeners.has(type)) this.listeners.set(type, []);
            this.listeners.get(type).push(fn);
        }
        dispatchEvent(type, eventInit = {}) {
            const event = {
                type,
                target: this,
                clientX: 120,
                clientY: 140,
                stopPropagation() {},
                preventDefault() {},
                ...eventInit
            };
            const handlers = this.listeners.get(type) || [];
            handlers.forEach(fn => fn.call(this, event, this.__data__));
        }
        getBoundingClientRect() {
            return { left: 100, top: 100, right: 220, bottom: 130, width: 120, height: 30 };
        }
        matches(selector) {
            if (!selector) return false;
            const parts = selector.split(",").map(s => s.trim());
            if (parts.length > 1) return parts.some(p => this.matches(p));

            const s = parts[0];
            if (s.includes(" ")) {
                const tokens = s.split(/\s+/).filter(Boolean);
                const lastToken = tokens[tokens.length - 1];
                if (!this.matches(lastToken)) return false;
                let ancestor = this.parentNode;
                for (let i = tokens.length - 2; i >= 0; i--) {
                    while (ancestor && !ancestor.matches(tokens[i])) {
                        ancestor = ancestor.parentNode;
                    }
                    if (!ancestor) return false;
                    ancestor = ancestor.parentNode;
                }
                return true;
            }
            if (s === "*") return true;
            if (s.startsWith("#")) return this.id === s.slice(1);
            if (s.startsWith(".")) return this.classes.has(s.slice(1));

            const dotIdx = s.indexOf(".");
            if (dotIdx > 0) {
                const tag = s.slice(0, dotIdx).toUpperCase();
                const cls = s.slice(dotIdx + 1);
                return this.tagName === tag && this.classes.has(cls);
            }
            return this.tagName === s.toUpperCase();
        }
        querySelectorAll(selector) {
            const results = [];
            const visit = node => {
                for (const child of node.children) {
                    if (child.matches(selector)) results.push(child);
                    visit(child);
                }
            };
            visit(this);
            return results;
        }
        querySelector(selector) {
            return this.querySelectorAll(selector)[0] || null;
        }
    }

    const rootDoc = new MockElement("document");
    const body = new MockElement("body");
    body.classList = {
        contains: cls => body.classes.has(cls),
        add: cls => body.classes.add(cls),
        remove: cls => body.classes.delete(cls),
        toggle: cls => {
            if (body.classes.has(cls)) body.classes.delete(cls);
            else body.classes.add(cls);
        }
    };
    rootDoc.appendChild(body);

    const mountIds = [
        ["map", "div"],
        ["legend", "div"],
        ["details-panel", "aside"],
        ["selection-announcer", "div"],
        ["leaderboard-summary", "p"],
        ["jurisdiction-bar-chart", "div"],
        ["chart-empty-state", "div"],
        ["chart-scroll-region", "div"],
        ["continent-filters", "div"],
        ["top-bloc-select", "select"],
        ["filter-continent", "select"],
        ["filter-bloc", "select"],
        ["filter-jurisdiction-type", "select"],
        ["filter-rate-range", "select"],
        ["filter-sort", "select"],
        ["palette-select", "select"],
        ["reset-filter", "button"],
        ["empty-state-reset", "button"],
        ["reset-map", "button"],
        ["theme-toggle", "button"],
        ["view-top-15", "button"],
        ["view-show-all", "button"],
        ["country-search", "input"],
        ["search-suggestions", "div"],
        ["explorer-heading-title", "h2"]
    ];

    mountIds.forEach(([id, tag]) => {
        const el = new MockElement(tag);
        el.id = id;
        body.appendChild(el);
    });

    class D3Selection {
        constructor(nodes, parentEl = null) {
            this._nodes = nodes.filter(Boolean);
            this._parent = parentEl;
        }
        empty() {
            return this._nodes.length === 0;
        }
        nodes() {
            return this._nodes;
        }
        node() {
            return this._nodes[0] || null;
        }
        select(selector) {
            const found = [];
            this._nodes.forEach(n => {
                const match = n.querySelector(selector);
                if (match) found.push(match);
            });
            return new D3Selection(found, this._nodes[0] || this._parent);
        }
        selectAll(selector) {
            const found = [];
            this._nodes.forEach(n => {
                found.push(...n.querySelectorAll(selector));
            });
            return new D3Selection(found, this._nodes[0] || this._parent);
        }
        append(tagName) {
            const created = [];
            const targets = this._nodes.length ? this._nodes : (this._parent ? [this._parent] : []);
            targets.forEach(parent => {
                const child = new MockElement(tagName);
                child.__data__ = parent.__data__;
                parent.appendChild(child);
                created.push(child);
            });
            return new D3Selection(created, this._parent);
        }
        datum(val) {
            if (val === undefined) return this._nodes[0]?.__data__;
            this._nodes.forEach(n => { n.__data__ = val; });
            return this;
        }
        data(arr, keyFn) {
            const parent = this._parent || body;
            const existingByKey = new Map();
            this._nodes.forEach((node, idx) => {
                const k = keyFn ? keyFn(node.__data__, idx) : idx;
                existingByKey.set(k, node);
            });

            const enterItems = [];
            const updateNodes = [];
            const usedKeys = new Set();

            arr.forEach((datum, idx) => {
                const k = keyFn ? keyFn(datum, idx) : idx;
                usedKeys.add(k);
                if (existingByKey.has(k)) {
                    const node = existingByKey.get(k);
                    node.__data__ = datum;
                    updateNodes.push(node);
                } else {
                    enterItems.push({ datum, idx });
                }
            });

            const exitNodes = [];
            existingByKey.forEach((node, k) => {
                if (!usedKeys.has(k)) exitNodes.push(node);
            });

            return {
                join: (enterArg, updateArg, exitArg) => {
                    // Remove exited nodes
                    exitNodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));

                    const enteredNodes = [];
                    const enterApi = {
                        append: tagName => {
                            const created = enterItems.map(item => {
                                const el = new MockElement(tagName);
                                el.__data__ = item.datum;
                                parent.appendChild(el);
                                enteredNodes.push(el);
                                return el;
                            });
                            return new D3Selection(created, parent);
                        }
                    };

                    if (typeof enterArg === "string") {
                        enterApi.append(enterArg);
                    } else if (typeof enterArg === "function") {
                        enterArg(enterApi);
                    }

                    const merged = [...updateNodes, ...enteredNodes];
                    return new D3Selection(merged, parent);
                }
            };
        }
        attr(name, val) {
            if (val === undefined) {
                return this._nodes[0]?.getAttribute(name) ?? null;
            }
            this._nodes.forEach((n, i) => {
                const v = typeof val === "function" ? val.call(n, n.__data__, i) : val;
                if (v !== null && v !== undefined) n.setAttribute(name, v);
            });
            return this;
        }
        style(name, val) {
            if (val === undefined) {
                return this._nodes[0]?.styles.get(name) ?? "";
            }
            this._nodes.forEach((n, i) => {
                const v = typeof val === "function" ? val.call(n, n.__data__, i) : val;
                n.styles.set(name, String(v));
            });
            return this;
        }
        classed(clsName, flag) {
            if (flag === undefined) {
                return Boolean(this._nodes[0]?.classes.has(clsName));
            }
            this._nodes.forEach((n, i) => {
                const cond = typeof flag === "function" ? flag.call(n, n.__data__, i) : Boolean(flag);
                clsName.split(/\s+/).filter(Boolean).forEach(c => {
                    if (cond) n.classes.add(c);
                    else n.classes.delete(c);
                });
                n.attributes.set("class", n.className);
            });
            return this;
        }
        property(name, val) {
            if (val === undefined) return this._nodes[0]?.[name];
            this._nodes.forEach((n, i) => {
                const v = typeof val === "function" ? val.call(n, n.__data__, i) : val;
                n[name] = v;
            });
            return this;
        }
        text(val) {
            if (val === undefined) return this._nodes[0]?.textContent ?? "";
            this._nodes.forEach((n, i) => {
                const v = typeof val === "function" ? val.call(n, n.__data__, i) : val;
                n.textContent = String(v ?? "");
            });
            return this;
        }
        html(val) {
            if (val === undefined) return this._nodes[0]?.innerHTML ?? "";
            this._nodes.forEach((n, i) => {
                const v = typeof val === "function" ? val.call(n, n.__data__, i) : val;
                n.innerHTML = String(v ?? "");
            });
            return this;
        }
        on(type, handler) {
            const cleanType = type.split(".")[0];
            this._nodes.forEach(n => {
                if (handler === null) {
                    n.listeners.delete(cleanType);
                } else {
                    n.listeners.set(cleanType, [handler]);
                }
            });
            return this;
        }
        each(fn) {
            this._nodes.forEach((n, i) => fn.call(n, n.__data__, i));
            return this;
        }
        call(fn, ...args) {
            if (typeof fn === "function") fn(this, ...args);
            return this;
        }
        interrupt() {
            return this;
        }
        transition() {
            return this;
        }
        delay() {
            return this;
        }
        duration() {
            return this;
        }
        ease() {
            return this;
        }
        selection() {
            return this;
        }
        remove() {
            this._nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
            return this;
        }
    }

    let lastRecordedScaleExtent = null;
    const d3Mock = {
        select: target => {
            if (typeof target === "string") {
                const el = rootDoc.querySelector(target);
                return new D3Selection(el ? [el] : [], body);
            }
            return new D3Selection(target ? [target] : [], target?.parentNode || body);
        },
        selectAll: target => {
            if (typeof target === "string") {
                return new D3Selection(rootDoc.querySelectorAll(target), body);
            }
            return new D3Selection(Array.isArray(target) ? target : [], body);
        },
        scaleLinear: () => {
            let domain = [0, 100];
            let range = [0, 500];
            const scale = val => {
                const span = (domain[1] - domain[0]) || 1;
                return range[0] + ((val - domain[0]) / span) * (range[1] - range[0]);
            };
            scale.domain = d => { if (!d) return domain; domain = d; return scale; };
            scale.range = r => { if (!r) return range; range = r; return scale; };
            scale.nice = () => scale;
            return scale;
        },
        geoNaturalEarth1: () => {
            const proj = coords => {
                if (!Array.isArray(coords)) return [500, 280];
                return [500 + coords[0] * 2.5, 280 - coords[1] * 2.5];
            };
            proj.fitExtent = () => proj;
            return proj;
        },
        geoPath: proj => {
            const pathFn = feature => {
                const iso = feature?.properties?.iso || feature?.id || "path";
                return `M0,0L10,10#${iso}`;
            };
            pathFn.centroid = feature => {
                if (feature?.geometry?.type === "Polygon") {
                    const ring = feature.geometry.coordinates[0] || [[0, 0]];
                    const lon = ring.reduce((s, c) => s + c[0], 0) / ring.length;
                    const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
                    return proj([lon, lat]);
                }
                return [500, 280];
            };
            pathFn.bounds = () => [[460, 240], [540, 320]];
            return pathFn;
        },
        geoCentroid: () => [0, 0],
        zoom: () => {
            let zoomHandler = null;
            const z = sel => sel;
            z.scaleExtent = ext => {
                if (!ext) return lastRecordedScaleExtent;
                lastRecordedScaleExtent = ext;
                return z;
            };
            z.translateExtent = () => z;
            z.on = (type, fn) => {
                if (type === "zoom") zoomHandler = fn;
                return z;
            };
            z.transform = (sel, transform) => {
                if (zoomHandler) zoomHandler({ transform });
            };
            return z;
        },
        zoomIdentity: {
            k: 1,
            x: 0,
            y: 0,
            translate(x, y) {
                return {
                    k: 1,
                    x,
                    y,
                    scale(k) {
                        return { k, x, y };
                    }
                };
            }
        },
        axisTop: () => {
            const ax = () => {};
            ax.ticks = () => ax;
            ax.tickSize = () => ax;
            ax.tickSizeOuter = () => ax;
            ax.tickFormat = () => ax;
            return ax;
        },
        axisBottom: () => {
            const ax = () => {};
            ax.ticks = () => ax;
            ax.tickSizeOuter = () => ax;
            ax.tickFormat = () => ax;
            return ax;
        },
        easeCubicOut: v => v,
        format: () => val => Number(val).toLocaleString("en-US", { maximumFractionDigits: 0 }),
        mean: (arr, fn) => arr.reduce((s, x) => s + fn(x), 0) / (arr.length || 1),
        median: (arr, fn) => {
            const vals = arr.map(fn).filter(Number.isFinite).sort((a, b) => a - b);
            if (!vals.length) return undefined;
            const mid = Math.floor(vals.length / 2);
            return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
        },
        max: (arr, fn) => Math.max(...arr.map(fn)),
        ascending: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
        descending: (a, b) => (b < a ? -1 : b > a ? 1 : 0)
    };

    const documentMock = {
        body,
        documentElement: {
            style: {
                props: new Map(),
                setProperty(k, v) { this.props.set(k, v); },
                getPropertyValue(k) { return this.props.get(k) || ""; }
            }
        },
        getElementById: id => rootDoc.querySelector(`#${id}`),
        querySelector: sel => rootDoc.querySelector(sel),
        querySelectorAll: sel => rootDoc.querySelectorAll(sel),
        createElement: tag => new MockElement(tag),
        activeElement: null
    };

    const context = {
        console,
        d3: d3Mock,
        document: documentMock,
        window: {
            innerWidth: 1280,
            innerHeight: 800,
            scrollX: 0,
            scrollY: 0
        },
        sessionStorage: {
            store: new Map(),
            getItem(k) { return this.store.get(k) || null; },
            setItem(k, v) { this.store.set(k, String(v)); }
        },
        setTimeout: fn => fn(),
        getLastRecordedScaleExtent: () => lastRecordedScaleExtent,
        module: { exports: {} }
    };

    vm.createContext(context);
    for (const filePath of [SHARED_JS_PATH, MAP_JS_PATH, INTERACTIONS_JS_PATH]) {
        context.module = { exports: {} };
        vm.runInContext(fs.readFileSync(filePath, "utf8"), context);
        Object.assign(context, context.module.exports);
    }

    return { context, document: documentMock, d3: d3Mock };
}

/**
 * Sample synthetic world atlas features covering representative test cases:
 * - France ("250") as a MultiPolygon containing BOTH Mainland France and French Guiana in South America
 * - United States ("840")
 * - United Kingdom ("826")
 * - Greenland ("304"), Puerto Rico ("630"), New Caledonia ("540")
 * - Mongolia ("496"), China ("156"), Lesotho ("426"), South Africa ("710")
 * - North Korea ("408" - No Data), South Sudan ("728")
 */
function buildRepresentativeAtlasFeatures() {
    return [
        {
            type: "Feature",
            id: "250",
            properties: { name: "France" },
            geometry: {
                type: "MultiPolygon",
                coordinates: [
                    // Ring 1: Mainland France (Europe)
                    [[[1.5, 44.0], [3.5, 44.0], [3.5, 48.0], [1.5, 48.0], [1.5, 44.0]]],
                    // Ring 2: French Guiana (South America: lon -54 to -52, lat 2 to 5)
                    [[[-54.0, 2.5], [-52.0, 2.5], [-52.0, 5.2], [-54.0, 5.2], [-54.0, 2.5]]]
                ]
            }
        },
        {
            type: "Feature",
            id: "840",
            properties: { name: "United States of America" },
            geometry: {
                type: "Polygon",
                coordinates: [[[-105, 35], [-90, 35], [-90, 42], [-105, 42], [-105, 35]]]
            }
        },
        {
            type: "Feature",
            id: "826",
            properties: { name: "United Kingdom" },
            geometry: {
                type: "Polygon",
                coordinates: [[[-3, 51], [0, 51], [0, 55], [-3, 55], [-3, 51]]]
            }
        },
        {
            type: "Feature",
            id: "304",
            properties: { name: "Greenland" },
            geometry: {
                type: "Polygon",
                coordinates: [[[-50, 65], [-35, 65], [-35, 76], [-50, 76], [-50, 65]]]
            }
        },
        {
            type: "Feature",
            id: "630",
            properties: { name: "Puerto Rico" },
            geometry: {
                type: "Polygon",
                coordinates: [[[-67.2, 18.0], [-65.8, 18.0], [-65.8, 18.5], [-67.2, 18.5], [-67.2, 18.0]]]
            }
        },
        {
            type: "Feature",
            id: "540",
            properties: { name: "New Caledonia" },
            geometry: {
                type: "Polygon",
                coordinates: [[[164.5, -21.5], [166.5, -21.5], [166.5, -20.2], [164.5, -20.2], [164.5, -21.5]]]
            }
        },
        {
            type: "Feature",
            id: "496",
            properties: { name: "Mongolia" },
            geometry: {
                type: "Polygon",
                coordinates: [[[95, 44], [112, 44], [112, 50], [95, 50], [95, 44]]]
            }
        },
        {
            type: "Feature",
            id: "156",
            properties: { name: "China" },
            geometry: {
                type: "Polygon",
                coordinates: [[[90, 25], [120, 25], [120, 45], [90, 45], [90, 25]]]
            }
        },
        {
            type: "Feature",
            id: "426",
            properties: { name: "Lesotho" },
            geometry: {
                type: "Polygon",
                coordinates: [[[27.5, -30.2], [29.2, -30.2], [29.2, -28.8], [27.5, -28.8], [27.5, -30.2]]]
            }
        },
        {
            type: "Feature",
            id: "710",
            properties: { name: "South Africa" },
            geometry: {
                type: "Polygon",
                coordinates: [[[18, -34], [32, -34], [32, -22], [18, -22], [18, -34]]]
            }
        },
        {
            type: "Feature",
            id: "408",
            properties: { name: "North Korea" },
            geometry: {
                type: "Polygon",
                coordinates: [[[125, 38], [129, 38], [129, 41], [125, 41], [125, 38]]]
            }
        }
    ];
}

// ============================================================================
// 1. DATA INTEGRITY TESTS
// ============================================================================

test("Phase 1 & 5 — Data integrity: canonical schema, unique ISO codes, taxonomy, and blocs", () => {
    const { context } = createVisualizationHarness();
    const rawRows = parseProjectCsv(csvRaw);
    const enriched = context.enrichDataset(rawRows, mappingJson);

    assert.equal(enriched.length, 256, "All 256 CSV jurisdictions should be preserved");

    const validTypes = new Set(["sovereign", "constituent", "overseas_autonomous"]);
    const seenIsos = new Set();

    for (const record of enriched) {
        assert.ok(typeof record.iso === "string" && record.iso.length >= 3, `Invalid iso for ${record.country}`);
        assert.ok(!seenIsos.has(record.iso), `Duplicate canonical ISO: ${record.iso}`);
        seenIsos.add(record.iso);

        assert.ok(
            validTypes.has(record.jurisdiction_type),
            `Invalid jurisdiction_type "${record.jurisdiction_type}" for ${record.country} (${record.iso})`
        );

        assert.ok(Array.isArray(record.blocs), `blocs must be an array for ${record.iso}`);
        record.blocs.forEach(bloc => {
            assert.equal(typeof bloc, "string", `Each bloc entry must be a string for ${record.iso}`);
        });
    }

    // Verify every configured bloc member resolves to a dataset record
    for (const [blocName, memberIsos] of Object.entries(mappingJson.blocMemberships)) {
        for (const iso of memberIsos) {
            const match = context.appState.dataByIso.get(iso);
            assert.ok(match, `Configured ${blocName} member ${iso} must resolve to a dataset record`);
            assert.ok(match.blocs.includes(blocName), `Record ${iso} must include "${blocName}" in its blocs array`);
        }
    }

    // Verify GUF is separate from FRA, is "overseas_autonomous", and binds to its own rate (284 vs 131)
    const fra = context.appState.dataByIso.get("FRA");
    const guf = context.appState.dataByIso.get("GUF");
    assert.ok(fra && guf, "Both FRA and GUF must exist as distinct canonical records");
    assert.notEqual(fra.iso, guf.iso);
    assert.equal(fra.jurisdiction_type, "sovereign");
    assert.equal(guf.jurisdiction_type, "overseas_autonomous");
    assert.equal(fra.rate, 131);
    assert.equal(guf.rate, 284);

    // Verify Scotland, Northern Ireland, and England & Wales are "constituent"
    const sct = context.appState.dataByIso.get("GBR-SCT");
    const nir = context.appState.dataByIso.get("GBR-NIR");
    const gbr = context.appState.dataByIso.get("GBR");
    assert.equal(sct.jurisdiction_type, "constituent");
    assert.equal(nir.jurisdiction_type, "constituent");
    assert.equal(gbr.jurisdiction_type, "constituent");

    // Verify fallback codes BES, COK, NIU are present and classified as "overseas_autonomous"
    for (const fallbackIso of ["BES", "COK", "NIU"]) {
        const rec = context.appState.dataByIso.get(fallbackIso);
        assert.ok(rec, `Fallback code ${fallbackIso} must exist in dataset`);
        assert.equal(rec.jurisdiction_type, "overseas_autonomous");
    }

    // Verify No Data records remain present in appState.data but are excluded from rankings and medians
    const prk = context.appState.dataByIso.get("PRK");
    assert.ok(prk, "North Korea (PRK) must remain in dataset");
    assert.equal(prk.rate, null, "North Korea rate must be normalized to null");
    assert.ok(!context.appState.rankedData.some(r => r.iso === "PRK"), "No Data record must be excluded from rankedData");
});

// ============================================================================
// 2. RENDERING AND BINDING TESTS
// ============================================================================

test("Phase 2, 3 & 5 — Rendering & binding: marker geometry, FRA/GUF disaggregation, No Data hatch, zoom [1, 16], and focus layer", () => {
    const { context, document } = createVisualizationHarness();
    const rawRows = parseProjectCsv(csvRaw);
    const sampleFeatures = buildRepresentativeAtlasFeatures();

    context.drawMap(rawRows, mappingJson, sampleFeatures);

    // Verify zoom scaleExtent is [1, 16]
    assert.deepEqual(
        Array.from(context.getLastRecordedScaleExtent()),
        [1, 16],
        "D3 zoom scaleExtent must be [1, 16]"
    );

    // Verify France (FRA) and French Guiana (GUF) polygons are disaggregated into separate paths
    const countryPaths = document.querySelectorAll("path.country");
    const fraPath = countryPaths.find(p => p.getAttribute("data-iso") === "FRA");
    const gufPath = countryPaths.find(p => p.getAttribute("data-iso") === "GUF");
    assert.ok(fraPath, "Mainland France path [data-iso=FRA] must be rendered");
    assert.ok(gufPath, "Disaggregated French Guiana polygon path [data-iso=GUF] must be rendered");
    assert.equal(fraPath.__data__.geometry.type, "Polygon", "Mainland France should have its South American polygon split out");
    assert.equal(gufPath.__data__.geometry.type, "Polygon", "French Guiana should be extracted as its own Polygon feature");

    // Verify overseas_autonomous territories render <rect class="territory-marker">
    const territoryRects = document.querySelectorAll("rect.territory-marker");
    assert.ok(territoryRects.length > 0, "Overseas/autonomous territories must render rect.territory-marker");
    const rectIsos = new Set(territoryRects.map(r => r.getAttribute("data-iso")));
    for (const expectedOverseas of ["GUF", "GRL", "PRI", "NCL", "GIB", "REU", "BES", "COK", "NIU"]) {
        assert.ok(rectIsos.has(expectedOverseas), `Expected rect.territory-marker for ${expectedOverseas}`);
    }

    // Verify sovereign and constituent jurisdictions render <circle class="sovereign-marker">
    const sovereignCircles = document.querySelectorAll("circle.sovereign-marker");
    assert.ok(sovereignCircles.length > 0, "Sovereign and constituent records must render circle.sovereign-marker");
    const circleIsos = new Set(sovereignCircles.map(c => c.getAttribute("data-iso")));
    assert.ok(circleIsos.has("GBR-SCT"), "Scotland (constituent) must render circle.sovereign-marker");
    assert.ok(circleIsos.has("GBR-NIR"), "Northern Ireland (constituent) must render circle.sovereign-marker");
    assert.ok(!rectIsos.has("GBR-SCT"), "Scotland must never render rect.territory-marker");

    // Verify polygon and marker interactions for GUF resolve to the same canonical ID ("GUF")
    const gufMarkerGroup = document.querySelectorAll("g.territory-target").find(g => g.getAttribute("data-iso") === "GUF");
    assert.ok(gufMarkerGroup, "GUF marker group must exist");

    gufPath.dispatchEvent("click");
    assert.equal(context.appState.pinnedJurisdictionId, "GUF", "Clicking GUF polygon must pin GUF");

    context.resetMapView();
    assert.equal(context.appState.pinnedJurisdictionId, null);

    gufMarkerGroup.dispatchEvent("click");
    assert.equal(context.appState.pinnedJurisdictionId, "GUF", "Clicking GUF marker must also pin GUF");

    // Verify No Data geometry uses url(#pattern-no-data) and light/dark base colors
    const prkPath = countryPaths.find(p => p.getAttribute("data-iso") === "PRK");
    assert.ok(prkPath, "North Korea (PRK) polygon must be rendered");
    assert.equal(prkPath.getAttribute("fill"), "url(#pattern-no-data)", "No Data polygon must use url(#pattern-no-data)");

    const besRect = territoryRects.find(r => r.getAttribute("data-iso") === "BES");
    assert.equal(besRect.getAttribute("fill"), "url(#pattern-no-data)", "No Data marker must use url(#pattern-no-data)");

    const patternRectLight = document.querySelector(".no-data-pattern-base");
    assert.equal(patternRectLight.getAttribute("fill"), "#E2E8F0", "Light mode No Data base must be #E2E8F0");

    document.body.classList.add("dark-mode");
    context.defineMapPatterns(context.appState.svg);
    const patternRectDark = document.querySelector(".no-data-pattern-base");
    assert.equal(patternRectDark.getAttribute("fill"), "#2D3748", "Dark mode No Data base must be #2D3748");
    document.body.classList.remove("dark-mode");

    // Verify #focus-layer renders Mongolia (MNG) and Lesotho (LSO) outlines on top without mutating country layer order
    const initialCountryOrder = document.querySelectorAll("path.country").map(p => p.getAttribute("data-iso"));
    const mngPath = countryPaths.find(p => p.getAttribute("data-iso") === "MNG");
    mngPath.dispatchEvent("click");
    const focusOutlines = document.querySelectorAll("#focus-layer path.focus-outline");
    assert.equal(focusOutlines.length, 1);
    assert.equal(focusOutlines[0].getAttribute("data-iso"), "MNG");
    assert.equal(focusOutlines[0].getAttribute("vector-effect"), "non-scaling-stroke");
    const afterCountryOrder = document.querySelectorAll("path.country").map(p => p.getAttribute("data-iso"));
    assert.deepEqual(afterCountryOrder, initialCountryOrder, "Permanent country layer ordering must not be mutated");

    // Verify minimum hit target radius >= 4 CSS pixels at max zoom k=16
    context.syncElementsWithZoom({ k: 16, x: 0, y: 0 });
    const hitTargets = document.querySelectorAll("circle.jurisdiction-hit-target");
    for (const ht of hitTargets) {
        const rUserUnits = Number(ht.getAttribute("r"));
        const effectiveCssPx = rUserUnits * 16;
        assert.ok(effectiveCssPx >= 4 - 1e-6, `Effective hit target radius at k=16 must be >= 4px, got ${effectiveCssPx}`);
    }
});

// ============================================================================
// 3. STATE AND SYNCHRONIZATION TESTS
// ============================================================================

test("Phase 4 & 5 — State & synchronization: pinned sidebar lock, tooltip decouple, bloc filtering, and median edge cases", () => {
    const { context, document } = createVisualizationHarness();
    const rawRows = parseProjectCsv(csvRaw);
    const sampleFeatures = buildRepresentativeAtlasFeatures();

    context.drawMap(rawRows, mappingJson, sampleFeatures);

    const countryPaths = document.querySelectorAll("path.country");
    const usaPath = countryPaths.find(p => p.getAttribute("data-iso") === "USA");
    const fraPath = countryPaths.find(p => p.getAttribute("data-iso") === "FRA");
    const mngPath = countryPaths.find(p => p.getAttribute("data-iso") === "MNG");

    // 1. Pin USA via click
    usaPath.dispatchEvent("click");
    assert.equal(context.appState.pinnedJurisdictionId, "USA");
    const sidebarHtmlAfterPin = document.getElementById("details-panel").innerHTML;
    assert.ok(sidebarHtmlAfterPin.includes("United States of America"), "Sidebar must display United States of America");
    assert.ok(sidebarHtmlAfterPin.includes("542"), "Sidebar must display USA rate 542");

    // 2. While USA is pinned, hover FRA -> sidebar must stay on USA while tooltip shows France
    fraPath.dispatchEvent("mouseenter");
    assert.equal(context.appState.pinnedJurisdictionId, "USA", "Pinned ID must remain USA during hover");
    assert.equal(context.appState.hoveredJurisdictionId, "FRA", "Hovered ID must update to FRA");

    const sidebarHtmlDuringHover = document.getElementById("details-panel").innerHTML;
    assert.ok(
        sidebarHtmlDuringHover.includes("United States of America"),
        "Sidebar must remain locked on United States of America while hovering France"
    );
    assert.ok(
        !sidebarHtmlDuringHover.includes("131"),
        "Sidebar must NOT switch to France's rate while USA is pinned"
    );

    const tooltipEl = document.getElementById("shared-floating-tooltip");
    assert.equal(tooltipEl.hidden, false, "Floating tooltip must be visible during hover");
    assert.ok(tooltipEl.innerHTML.includes("France"), "Floating tooltip must display France");
    assert.ok(tooltipEl.innerHTML.includes("131"), "Floating tooltip must display France's rate 131");

    // 3. Hover exit hides tooltip without clearing pinned selection
    fraPath.dispatchEvent("mouseleave");
    assert.equal(tooltipEl.hidden, true, "Tooltip must hide on mouseleave");
    assert.equal(context.appState.pinnedJurisdictionId, "USA", "Pinned selection must remain USA after mouseleave");
    assert.ok(document.getElementById("details-panel").innerHTML.includes("United States of America"));

    // 4. Clicking a new jurisdiction (Mongolia) replaces the pin and updates the sidebar
    mngPath.dispatchEvent("click");
    assert.equal(context.appState.pinnedJurisdictionId, "MNG", "Clicking Mongolia must replace pin with MNG");
    assert.ok(document.getElementById("details-panel").innerHTML.includes("Mongolia"), "Sidebar must update to Mongolia");

    // 5. Background / reset clears the pin
    context.resetMapView();
    assert.equal(context.appState.pinnedJurisdictionId, null, "Reset must clear pinnedJurisdictionId");
    assert.ok(
        document.getElementById("details-panel").innerHTML.includes("Select a jurisdiction"),
        "Sidebar must return to default empty state on reset"
    );

    // 6. Test every Geopolitical & Historical Bloc filter
    const blocsToTest = ["NATO", "Post-Soviet States", "Former Yugoslavia", "OECD", "ASEAN"];
    for (const blocName of blocsToTest) {
        context.applyBlocFilter(blocName);
        assert.equal(context.appState.activeBloc, blocName);

        const filteredRows = context.getFilteredJurisdictions();
        assert.ok(filteredRows.length > 0, `Bloc ${blocName} should return matching numeric jurisdictions`);
        filteredRows.forEach(r => {
            assert.ok(r.blocs.includes(blocName), `Filtered bar chart row ${r.iso} must belong to ${blocName}`);
            assert.ok(Number.isFinite(r.rate), `Filtered bar chart row ${r.iso} must have finite numeric rate`);
        });

        // Non-member polygon (e.g. China CHN is not in NATO/OECD/ASEAN/Former Yugoslavia/Post-Soviet) must have .dimmed class
        const chnPath = countryPaths.find(p => p.getAttribute("data-iso") === "CHN");
        assert.ok(chnPath.classes.has("dimmed"), `Non-member CHN must be dimmed when ${blocName} is active`);

        // Telemetry format check: "Showing X jurisdictions in [Bloc] — Median Rate: Y per 100k"
        const summaryText = document.getElementById("leaderboard-summary").textContent;
        assert.match(
            summaryText,
            new RegExp(`^Showing ${filteredRows.length} jurisdictions in ${blocName} — Median Rate: [0-9,]+ per 100k$`),
            `Telemetry mismatch for ${blocName}: ${summaryText}`
        );
    }

    // 7. Selecting "All / Reset" restores global results and removes dimming
    context.applyBlocFilter("All / Reset");
    assert.equal(context.appState.activeBloc, "all");
    const chnPathAfterReset = countryPaths.find(p => p.getAttribute("data-iso") === "CHN");
    assert.ok(!chnPathAfterReset.classes.has("dimmed"), "CHN must not be dimmed after All / Reset");

    // 8. Median calculation ignores missing/non-finite values and returns null when empty
    assert.equal(context.computeMedianRate([{ rate: null }, { rate: NaN }, { rate: undefined }]), null);
    assert.equal(context.computeMedianRate([{ rate: 100 }, { rate: null }, { rate: 200 }, { rate: 300 }]), 200);
    assert.equal(
        context.formatSummaryTelemetry([], "NATO", "All"),
        "Showing 0 jurisdictions in NATO — Median Rate: No data"
    );
});

test("Phase 3 & Validation — Palettes, Lesotho enclave outline, and representative territories", () => {
    const { context, document } = createVisualizationHarness();
    const rawRows = parseProjectCsv(csvRaw);
    const sampleFeatures = buildRepresentativeAtlasFeatures();

    context.drawMap(rawRows, mappingJson, sampleFeatures);

    // Verify exact 5-step color ramps for Default and Accessibility Presets
    assert.deepEqual(Array.from(context.PALETTES.default.colors), ["#FEE6D9", "#FCA289", "#F55B4B", "#C51B7D", "#67001F"]);
    assert.deepEqual(Array.from(context.PALETTES.protanomaly.colors), ["#F0F0F0", "#E69F00", "#D55E00", "#CC79A7", "#004949"]);
    assert.deepEqual(Array.from(context.PALETTES.deuteranomaly.colors), ["#56B4E9", "#F0E442", "#E69F00", "#D55E00", "#111111"]);
    assert.deepEqual(Array.from(context.PALETTES.tritanomaly.colors), ["#FFFFFF", "#E5323B", "#B50D5F", "#4B0082", "#2E4052"]);

    // Verify switching palettes updates fills without breaking No Data hatching or selection outlines
    const countryPaths = document.querySelectorAll("path.country");
    const lsoPath = countryPaths.find(p => p.getAttribute("data-iso") === "LSO");
    const prkPath = countryPaths.find(p => p.getAttribute("data-iso") === "PRK");
    lsoPath.dispatchEvent("click");
    assert.equal(context.appState.pinnedJurisdictionId, "LSO");

    for (const presetKey of ["default", "protanomaly", "deuteranomaly", "tritanomaly"]) {
        context.appState.palette = presetKey;
        context.applyPaletteThemeVariables();
        context.renderSteppedLegend();
        context.updateMapStyles();

        // Lesotho has rate 117 (bucket 100-199 -> colorIndex 1)
        assert.equal(
            lsoPath.getAttribute("fill"),
            context.PALETTES[presetKey].colors[1],
            `Lesotho fill should match step 2 of ${presetKey} palette`
        );
        // North Korea (No Data) must retain url(#pattern-no-data) across all palettes
        assert.equal(prkPath.getAttribute("fill"), "url(#pattern-no-data)");
        // Focus outline for Lesotho must remain intact in #focus-layer
        const focusOutlines = document.querySelectorAll("#focus-layer path.focus-outline");
        assert.equal(focusOutlines.length, 1);
        assert.equal(focusOutlines[0].getAttribute("data-iso"), "LSO");
    }
});

