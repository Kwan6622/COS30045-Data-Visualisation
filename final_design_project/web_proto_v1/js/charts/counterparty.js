/**
 * counterparty.js — Ch2b: what pedestrians and cyclists collided with.
 * 100% stacked horizontal bars (part-to-whole for two groups). The segment
 * that tells the story for each group is labelled directly; hovering a
 * segment highlights the same category in both bars.
 * Wording: "collision with", never "hit by" — the data records the other
 * party, not who was at fault.
 */
/* global d3 */
import { SHORT } from "../config.js";
import { createSvg, showTooltip, hideTooltip, fmt, pct } from "../utils.js";

const CATS = ["Car, pick-up truck or van", "Heavy vehicle or bus", "Motorcycle",
  "Fixed object", "No collision (e.g. fall)", "Other"];

export class CounterpartyChart {
  constructor(selector, legendSel, data) {
    this.selector = selector;
    this.legendSel = legendSel;
    this.groups = ["Pedestrian", "Pedal cyclist"].map((grp) => {
      let x0 = 0;
      return { group: grp, segs: CATS.map((c) => {
        const r = data.find((d) => d.group === grp && d.cp === c) || { hosp: 0, share: 0 };
        const s = { cat: c, hosp: r.hosp, share: r.share, x0 }; x0 += r.share; return s;
      }) };
    });
  }

  color() {
    // Greys only: the two categories that carry the story get the strongest
    // contrast (car = darkest, no collision = second darkest) and a direct
    // label. The pedestrian/cyclist hues are NOT reused here, so orange/blue
    // keep meaning "who" across the whole page.
    return d3.scaleOrdinal(CATS, ["var(--text)", "var(--text-3)", "var(--moto)", "var(--other)", "var(--text-2)", "var(--grid)"]);
  }

  render() {
    const margin = { top: 8, right: 8, bottom: 28, left: 96 };
    const { g, width, height } = createSvg(this.selector, { height: 190, margin });
    const color = this.color();
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().domain(this.groups.map((d) => d.group)).range([0, height]).padding(0.3);

    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickFormat(pct));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickFormat((d) => SHORT[d]).tickSize(0).tickPadding(10));

    const bars = g.selectAll(".cp").data(this.groups).join("g").attr("transform", (d) => `translate(0,${y(d.group)})`);
    const seg = bars.selectAll("rect").data((d) => d.segs.map((s) => ({ ...s, group: d.group }))).join("rect")
      .attr("class", "seg").attr("x", (d) => x(d.x0)).attr("width", (d) => Math.max(0, x(d.share) - 1))
      .attr("height", y.bandwidth()).attr("fill", (d) => color(d.cat))
      .on("pointermove", (event, d) => {
        seg.attr("opacity", (s) => (s.cat === d.cat ? 1 : 0.25));
        showTooltip(event, `${SHORT[d.group]}: ${d.cat}`, [["Hospitalisations", fmt(d.hosp)], ["Share", d3.format(".1%")(d.share)]]);
      })
      .on("pointerleave", () => { seg.attr("opacity", 1); hideTooltip(); });

    // Label segments wide enough to hold text
    bars.selectAll("text").data((d) => d.segs.filter((s) => s.share > 0.12)).join("text")
      .attr("x", (d) => x(d.x0) + 8).attr("y", y.bandwidth() / 2).attr("dy", "0.35em")
      .attr("fill", (d) => (["Car, pick-up truck or van", "No collision (e.g. fall)"].includes(d.cat) ? "var(--surface)" : "var(--text)"))
      .attr("font-size", 13).attr("font-weight", 700).attr("pointer-events", "none")
      .text((d) => `${pct(d.share)}${x(d.share) > 150 ? ` ${d.cat.split(",")[0].replace(" (e.g. fall)", "")}` : ""}`);

    d3.select(this.legendSel).selectAll(".legend-item").data(CATS).join("span").attr("class", "legend-item")
      .html((c) => `<span class="swatch" style="background:${color(c)}"></span>${c}`);
  }
}
