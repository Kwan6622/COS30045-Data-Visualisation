/**
 * trend.js — Ch1: hospitalisations per year by road user.
 * Indexed view (2012 = 100) compares growth on one base; count view shows size.
 * Focus + context: pedestrians and cyclists in colour, others grey.
 * Annotations: series break (NSW, 2017) and COVID years (2020–21) shaded,
 * so readers do not read those years as real trend changes.
 */
/* global d3 */
import { GROUPS, FOCUS, groupColor, SHORT, BASE_YEAR, END_YEAR } from "../config.js";
import { createSvg, showTooltip, hideTooltip, bindChips, fmt } from "../utils.js";

export class TrendChart {
  constructor(selector, data) {
    this.selector = selector;
    this.mode = "index";
    this.series = GROUPS.map((g) => {
      const rows = data.filter((d) => d.group === g).sort((a, b) => a.year - b.year);
      const base = rows.find((d) => d.year === BASE_YEAR).hosp;
      return { group: g, rows: rows.map((d) => ({ ...d, index: (d.hosp / base) * 100 })) };
    });
    bindChips("#trend-controls", "mode", (m) => { this.mode = m; this.render(); });
  }

  render() {
    const narrow = document.querySelector(this.selector).clientWidth < 560;
    const margin = { top: 24, right: narrow ? 16 : 118, bottom: 30, left: 48 };
    const { g, width, height } = createSvg(this.selector, { height: 380, margin });
    const key = this.mode;
    const all = this.series.flatMap((s) => s.rows);

    const x = d3.scaleLinear().domain([2011, 2021]).range([0, width]);
    const y = key === "index"
      ? d3.scaleLinear().domain(d3.extent([60, ...all.map((d) => d.index), 160])).nice().range([height, 0])
      : d3.scaleLinear().domain([0, d3.max(all, (d) => d.hosp)]).nice().range([height, 0]);

    // COVID band + series-break marker (context first, data drawn on top)
    g.append("rect").attr("x", x(2019.5)).attr("width", x(2021) - x(2019.5) + 4)
      .attr("y", 0).attr("height", height).attr("fill", "var(--covid)");
    g.append("text").attr("class", "value-label").attr("x", x(2020.25)).attr("y", -8)
      .attr("text-anchor", "middle").text("COVID");
    const brk = g.append("g").attr("class", "annotation");
    brk.append("line").attr("x1", x(2017)).attr("x2", x(2017)).attr("y1", 0).attr("y2", height);
    brk.append("text").attr("x", x(2017) + 4).attr("y", 10).text(narrow ? "NSW rule change" : "NSW counting change (2017)");

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(narrow ? 5 : 11).tickFormat(d3.format("d")));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(key === "index" ? (d) => d : d3.format("~s")));
    if (key === "index") {
      g.append("line").attr("x1", 0).attr("x2", width).attr("y1", y(100)).attr("y2", y(100))
        .attr("stroke", "var(--text-3)").attr("stroke-width", 1);
    }

    const line = d3.line().x((d) => x(d.year)).y((d) => y(d[key])).curve(d3.curveMonotoneX);
    const order = [...this.series].sort((a, b) => FOCUS.includes(a.group) - FOCUS.includes(b.group));
    g.selectAll(".series").data(order).join("path").attr("class", "series")
      .attr("fill", "none").attr("stroke", (s) => groupColor(s.group))
      .attr("stroke-width", (s) => (FOCUS.includes(s.group) ? 3 : 1.5))
      .attr("d", (s) => line(s.rows));

    // 2012 -> 2019 change, written at the 2019 point for the focus groups
    FOCUS.forEach((grp) => {
      const s = this.series.find((d) => d.group === grp);
      const a = s.rows.find((d) => d.year === BASE_YEAR);
      const b = s.rows.find((d) => d.year === END_YEAR);
      g.append("circle").attr("cx", x(END_YEAR)).attr("cy", y(b[key])).attr("r", 4.5)
        .attr("fill", groupColor(grp)).attr("stroke", "var(--surface)").attr("stroke-width", 1.5);
      g.append("text").attr("class", "direct-label").attr("x", x(END_YEAR) - 6).attr("y", y(b[key]) - 10)
        .attr("text-anchor", "end").attr("fill", groupColor(grp))
        .text(`${d3.format("+.0%")(b.hosp / a.hosp - 1)} 2012→19`);
    });

    // Direct labels at line ends (no separate legend needed)
    if (!narrow) {
      const ends = this.series.map((s) => ({ group: s.group, y: y(s.rows.at(-1)[key]) }));
      ends.sort((a, b) => a.y - b.y).forEach((d, i, arr) => { if (i && d.y - arr[i - 1].y < 14) d.y = arr[i - 1].y + 14; });
      g.selectAll(".end").data(ends).join("text").attr("class", "direct-label")
        .attr("x", width + 8).attr("y", (d) => d.y).attr("dy", "0.35em")
        .attr("fill", (d) => (FOCUS.includes(d.group) ? groupColor(d.group) : "var(--text-2)"))
        .text((d) => SHORT[d.group]);
    }

    // Crosshair tooltip: one hover shows every group for that year
    const hover = g.append("line").attr("y1", 0).attr("y2", height).attr("stroke", "var(--text-3)").attr("opacity", 0);
    g.append("rect").attr("width", width).attr("height", height).attr("fill", "transparent")
      .on("pointermove", (event) => {
        const yr = Math.round(x.invert(d3.pointer(event)[0]));
        hover.attr("x1", x(yr)).attr("x2", x(yr)).attr("opacity", 1);
        showTooltip(event, `${yr}${yr >= 2020 ? " (COVID)" : ""}`, GROUPS.map((grp) => {
          const r = this.series.find((s) => s.group === grp).rows.find((d) => d.year === yr);
          return [SHORT[grp], key === "index" ? `${fmt(r.hosp)} (${Math.round(r.index)})` : fmt(r.hosp)];
        }));
      })
      .on("pointerleave", () => { hover.attr("opacity", 0); hideTooltip(); });
  }
}
