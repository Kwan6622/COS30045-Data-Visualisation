/**
 * age.js — Ch3: who among pedestrians and cyclists is hurt worst, by age.
 * Vertical bars by age group (ordered categories → bars, zero baseline).
 * The 75+ bar is labelled because it carries the chapter's point.
 * Rate per 100,000 uses ABS population; for age groups that do not line up
 * with ABS 5-year bands the population is split evenly (marked "≈").
 */
/* global d3 */
import { AGE_ORDER, groupColor, SHORT } from "../config.js";
import { createSvg, showTooltip, hideTooltip, bindChips, fmt, fmt1 } from "../utils.js";

const MEASURES = {
  los: { label: "Average days in hospital", f: (v) => `${fmt1(v)} d` },
  died_rate: { label: "Died within 30 days", f: d3.format(".1%") },
  rate: { label: "Hospitalisations per 100,000 people per year", f: fmt1 },
};

export class AgeChart {
  constructor(selector, titleSel, data) {
    this.selector = selector;
    this.titleSel = titleSel;
    this.data = data;
    this.group = "Pedestrian";
    this.key = "los";
    bindChips("#age-group-controls", "group", (v) => { this.group = v; this.render(); });
    bindChips("#age-measure-controls", "measure", (v) => { this.key = v; this.render(); });
  }

  render() {
    const margin = { top: 28, right: 12, bottom: 34, left: 52 };
    const { g, width, height } = createSvg(this.selector, { height: 320, margin });
    const k = this.key, m = MEASURES[k];
    const rows = AGE_ORDER.map((a) => this.data.find((d) => d.group === this.group && d.age === a));
    document.querySelector(this.titleSel).textContent = `${SHORT[this.group]}: ${m.label.toLowerCase()}, by age group (2011–2021)`;

    const x = d3.scaleBand().domain(AGE_ORDER).range([0, width]).padding(0.25);
    // Fixed domain across both groups so switching group does not rescale silently
    const y = d3.scaleLinear().domain([0, d3.max(this.data, (d) => d[k])]).nice().range([height, 0]);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(k === "died_rate" ? d3.format(".0%") : (v) => v));
    g.append("text").attr("class", "value-label").attr("x", -margin.left).attr("y", -14).text(m.label);

    const col = groupColor(this.group);
    const t = d3.transition().duration(500);
    g.selectAll(".bar").data(rows).join("rect").attr("class", "bar")
      .attr("x", (d) => x(d.age)).attr("width", x.bandwidth()).attr("rx", 3)
      .attr("fill", col).attr("opacity", (d) => (d.age === "75+" ? 1 : 0.55))
      .attr("y", height).attr("height", 0)
      .on("pointermove", (event, d) => showTooltip(event, `${SHORT[this.group]}, age ${d.age}`, [
        ["Hospitalisations", fmt(d.hosp)], ["Avg days in hospital", fmt1(d.los)],
        ["Died within 30 days", `${d3.format(".1%")(d.died_rate)} (${fmt(d.died)})`],
        [`Per 100,000 / yr${d.exact_pop === "True" || d.exact_pop === true ? "" : " ≈"}`, fmt1(d.rate)],
      ]))
      .on("pointerleave", hideTooltip)
      .transition(t).attr("y", (d) => y(d[k])).attr("height", (d) => height - y(d[k]));

    g.selectAll(".val").data(rows).join("text").attr("class", "value-label")
      .attr("x", (d) => x(d.age) + x.bandwidth() / 2).attr("y", (d) => y(d[k]) - 6).attr("text-anchor", "middle")
      .attr("font-weight", (d) => (d.age === "75+" ? 700 : 400))
      .text((d) => `${k === "rate" && !(d.exact_pop === "True" || d.exact_pop === true) ? "≈" : ""}${m.f(d[k])}`);
  }
}
