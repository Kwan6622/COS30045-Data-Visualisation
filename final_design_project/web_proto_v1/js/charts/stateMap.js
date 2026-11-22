/**
 * stateMap.js — Ch4b: where pedestrians and cyclists are hospitalised most,
 * per 100,000 people (BITRE state counts ÷ ABS population, 2011–2021 pooled).
 * Tile grid: every state gets equal area, so small ACT is as visible as WA
 * (a geographic choropleth would let land area dominate).
 * Click / Enter on a tile → linked line chart of that state's yearly rate
 * against the Australian rate.
 */
/* global d3 */
import { STATE_TILES, STATE_NAMES, groupColor, SHORT } from "../config.js";
import { createSvg, showTooltip, hideTooltip, bindChips, fmt, fmt1 } from "../utils.js";

export class StateMap {
  constructor(selector, detailSel, detailTitleSel, data) {
    this.selector = selector;
    this.detailSel = detailSel;
    this.detailTitleSel = detailTitleSel;
    this.data = data;
    this.group = "Pedestrian";
    this.selected = "NT";
    bindChips("#state-controls", "group", (v) => { this.group = v; this.render(); });
  }

  stats() {
    const rows = this.data.filter((d) => d.road_user === this.group);
    const byState = d3.rollups(rows, (v) => ({
      hosp: d3.sum(v, (d) => d.hosp), pop: d3.sum(v, (d) => d.total),
      years: v.map((d) => ({ year: d.year, rate: d.rate })).sort((a, b) => a.year - b.year),
    }), (d) => d.state).map(([state, s]) => ({ state, ...s, rate: (s.hosp / s.pop) * 1e5 }));
    const aus = d3.rollups(rows, (v) => (d3.sum(v, (d) => d.hosp) / d3.sum(v, (d) => d.total)) * 1e5, (d) => d.year)
      .map(([year, rate]) => ({ year, rate })).sort((a, b) => a.year - b.year);
    const ausRate = (d3.sum(rows, (d) => d.hosp) / d3.sum(rows, (d) => d.total)) * 1e5;
    return { byState, aus, ausRate };
  }

  render() {
    const { byState, aus, ausRate } = this.stats();
    this.cache = { byState, aus };
    const margin = { top: 8, right: 8, bottom: 8, left: 8 };
    const H = 330;
    const { g, width } = createSvg(this.selector, { height: H, margin });
    const size = Math.min(width / 4, (H - 16) / 4);
    const ox = (width - size * 4) / 2;

    // Single-hue sequential ramp from the page background to the group colour,
    // so the map keeps the page-wide meaning of orange/blue.
    const hue = groupColor(this.group);
    const max = d3.max(byState, (d) => d.rate);
    const fill = (v) => d3.interpolateRgb(getComputedStyle(document.body).backgroundColor, hue)(0.15 + 0.85 * (v / max));
    const ink = (v) => (d3.hsl(fill(v)).l > 0.6 ? "#0b0b0b" : "#ffffff");

    const tiles = g.selectAll(".tile").data(byState).join("g").attr("class", "tile")
      .classed("is-selected", (d) => d.state === this.selected)
      .attr("transform", (d) => `translate(${ox + STATE_TILES[d.state][0] * size},${STATE_TILES[d.state][1] * size})`)
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", (d) => `${STATE_NAMES[d.state]}: ${fmt1(d.rate)} ${SHORT[this.group].toLowerCase()} hospitalised per 100,000 people per year`)
      .on("click", (_, d) => this.select(d.state))
      .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.select(d.state); } })
      .on("pointermove", (event, d) => showTooltip(event, STATE_NAMES[d.state], [
        ["Per 100,000 per year", fmt1(d.rate)], ["Australia", fmt1(ausRate)],
        ["Hospitalisations 2011–21", fmt(d.hosp)],
      ]))
      .on("pointerleave", hideTooltip);
    tiles.append("rect").attr("class", "bg").attr("x", 3).attr("y", 3).attr("width", size - 6).attr("height", size - 6)
      .attr("rx", 8).attr("fill", (d) => fill(d.rate));
    tiles.append("text").attr("x", 10).attr("y", 22).attr("font-weight", 700).attr("font-size", 14)
      .attr("fill", (d) => ink(d.rate)).text((d) => d.state);
    tiles.append("text").attr("x", 10).attr("y", 42).attr("font-size", 13).attr("font-variant-numeric", "tabular-nums")
      .attr("fill", (d) => ink(d.rate)).text((d) => fmt1(d.rate));

    const legend = document.querySelector("#state-legend");
    legend.innerHTML = `<span>Lower</span><span class="bar" style="background:linear-gradient(90deg,${fill(0)},${fill(d3.max(byState, (d) => d.rate))})"></span><span>Higher rate per 100,000 · Australia: ${fmt1(ausRate)}</span>`;
    this.renderDetail();
  }

  select(state) { this.selected = state; this.render(); }

  renderDetail() {
    const { byState, aus } = this.cache;
    const s = byState.find((d) => d.state === this.selected);
    document.querySelector(this.detailTitleSel).textContent = `${STATE_NAMES[s.state]} vs Australia, ${SHORT[this.group].toLowerCase()} per 100,000`;
    const margin = { top: 16, right: 70, bottom: 28, left: 40 };
    const { g, width, height } = createSvg(this.detailSel, { height: 300, margin });
    const x = d3.scaleLinear().domain([2011, 2021]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max([...s.years, ...aus], (d) => d.rate)]).nice().range([height, 0]);
    g.append("rect").attr("x", x(2019.5)).attr("width", x(2021) - x(2019.5)).attr("height", height).attr("fill", "var(--covid)");
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4));
    const line = d3.line().x((d) => x(d.year)).y((d) => y(d.rate));
    g.append("path").attr("d", line(aus)).attr("fill", "none").attr("stroke", "var(--car)").attr("stroke-width", 2).attr("stroke-dasharray", "4 3");
    g.append("path").attr("d", line(s.years)).attr("fill", "none").attr("stroke", groupColor(this.group)).attr("stroke-width", 3);
    g.append("text").attr("class", "direct-label").attr("x", width + 6).attr("y", y(s.years.at(-1).rate)).attr("dy", "0.35em")
      .attr("fill", groupColor(this.group)).text(s.state);
    g.append("text").attr("class", "value-label").attr("x", width + 6).attr("y", y(aus.at(-1).rate)).attr("dy", "1.2em").text("Australia");
  }
}
