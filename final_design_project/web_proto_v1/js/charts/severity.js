/**
 * severity.js — Ch2a: how badly each road user is hurt.
 * Dot plot (Cleveland dot chart) sorted by the selected measure, with a
 * reference line at the all-road-user average. Dots instead of bars because
 * the axis for length of stay does not need to start at zero to be honest —
 * but we start it at zero anyway, so lengths can be compared as ratios.
 */
/* global d3 */
import { FOCUS, groupColor, SHORT } from "../config.js";
import { createSvg, showTooltip, hideTooltip, bindChips, fmt, fmt1 } from "../utils.js";

const MEASURES = {
  los: { label: "Average days in hospital", f: (v) => `${fmt1(v)} days` },
  died_rate: { label: "Died within 30 days of admission", f: d3.format(".1%") },
  ratio: { label: "Share of bed days ÷ share of hospitalisations", f: (v) => `${d3.format(".2f")(v)}×` },
};

export class SeverityChart {
  constructor(selector, data) {
    this.selector = selector;
    this.key = "los";
    this.data = data.map((d) => ({ ...d, ratio: d.share_bed / d.share_hosp }));
    const tot = { hosp: d3.sum(data, (d) => d.hosp), bed: d3.sum(data, (d) => d.bed), died: d3.sum(data, (d) => d.died) };
    this.avg = { los: tot.bed / tot.hosp, died_rate: tot.died / (tot.hosp + tot.died), ratio: 1 };
    bindChips("#severity-controls", "measure", (k) => { this.key = k; this.render(); });
  }

  render() {
    const margin = { top: 16, right: 64, bottom: 34, left: 124 };
    const { g, width, height } = createSvg(this.selector, { height: 280, margin });
    const k = this.key, m = MEASURES[k];
    const rows = [...this.data].sort((a, b) => b[k] - a[k]);

    const x = d3.scaleLinear().domain([0, d3.max(rows, (d) => d[k]) * 1.08]).nice().range([0, width]);
    const y = d3.scaleBand().domain(rows.map((d) => d.group)).range([0, height]).padding(0.5);

    g.append("g").attr("class", "grid").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(k === "died_rate" ? d3.format(".1%") : (v) => v));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickFormat((d) => SHORT[d]).tickSize(0).tickPadding(10));

    // Average reference line
    const ref = g.append("g").attr("class", "annotation");
    ref.append("line").attr("x1", x(this.avg[k])).attr("x2", x(this.avg[k])).attr("y1", -6).attr("y2", height);
    ref.append("text").attr("x", x(this.avg[k]) + 4).attr("y", -4).text(k === "ratio" ? "fair share (1×)" : `all road users ${m.f(this.avg[k])}`);

    const t = d3.transition().duration(500);
    const row = g.selectAll(".row").data(rows, (d) => d.group).join("g").attr("class", "row")
      .attr("transform", (d) => `translate(0,${y(d.group) + y.bandwidth() / 2})`)
      .on("pointermove", (event, d) => showTooltip(event, SHORT[d.group], [
        ["Hospitalisations", fmt(d.hosp)], ["Avg days in hospital", fmt1(d.los)],
        ["Died within 30 days", d3.format(".1%")(d.died_rate)],
        ["Share of hospitalisations", d3.format(".0%")(d.share_hosp)],
        ["Share of bed days", d3.format(".0%")(d.share_bed)],
      ]))
      .on("pointerleave", hideTooltip);
    row.append("line").attr("x1", 0).attr("x2", 0).attr("stroke", (d) => groupColor(d.group))
      .attr("stroke-width", 2).transition(t).attr("x2", (d) => x(d[k]));
    row.append("circle").attr("cx", 0).attr("r", (d) => (FOCUS.includes(d.group) ? 8 : 6))
      .attr("fill", (d) => groupColor(d.group)).transition(t).attr("cx", (d) => x(d[k]));
    row.append("text").attr("class", "value-label").attr("dy", "0.35em").attr("x", 0)
      .attr("font-weight", (d) => (FOCUS.includes(d.group) ? 700 : 400))
      .text((d) => m.f(d[k])).transition(t).attr("x", (d) => x(d[k]) + 12);
  }
}
