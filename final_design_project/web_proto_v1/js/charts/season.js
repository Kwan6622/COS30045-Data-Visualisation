/**
 * season.js — Ch4a: when in the year pedestrians and cyclists are hurt.
 * Line chart of each month relative to the average month (1.0 = typical),
 * 2011–2019 so COVID lockdowns do not distort the shape. Southern-hemisphere
 * winter (Jun–Aug) is shaded. Indexing puts both groups on one scale even
 * though cyclists are hospitalised ~2.6× more often.
 */
/* global d3 */
import { MONTHS, groupColor, SHORT } from "../config.js";
import { createSvg, showTooltip, hideTooltip, fmt } from "../utils.js";

export class SeasonChart {
  constructor(selector, data) {
    this.selector = selector;
    this.series = ["Pedestrian", "Pedal cyclist"].map((grp) => ({
      group: grp, rows: data.filter((d) => d.group === grp).sort((a, b) => a.month - b.month),
    }));
  }

  render() {
    const narrow = document.querySelector(this.selector).clientWidth < 520;
    const margin = { top: 22, right: narrow ? 12 : 84, bottom: 30, left: 44 };
    const { g, width, height } = createSvg(this.selector, { height: 300, margin });
    const x = d3.scalePoint().domain(d3.range(1, 13)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0.7, 1.25]).range([height, 0]);

    const step = x.step();
    g.append("rect").attr("x", x(6) - step / 2).attr("width", step * 3).attr("y", 0).attr("height", height).attr("fill", "var(--covid)");
    g.append("text").attr("class", "value-label").attr("x", x(7)).attr("y", -8).attr("text-anchor", "middle").text("Winter");

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((m) => (narrow ? MONTHS[m - 1][0] : MONTHS[m - 1])));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat((v) => `${v.toFixed(1)}×`));
    g.append("line").attr("x1", 0).attr("x2", width).attr("y1", y(1)).attr("y2", y(1)).attr("stroke", "var(--text-3)");
    g.append("text").attr("class", "value-label").attr("x", 4).attr("y", y(1) - 5).text("average month");

    const line = d3.line().x((d) => x(d.month)).y((d) => y(d.index)).curve(d3.curveMonotoneX);
    this.series.forEach((s) => {
      const c = groupColor(s.group);
      g.append("path").attr("d", line(s.rows)).attr("fill", "none").attr("stroke", c).attr("stroke-width", 3);
      g.selectAll(null).data(s.rows).join("circle").attr("cx", (d) => x(d.month)).attr("cy", (d) => y(d.index))
        .attr("r", 4).attr("fill", c).attr("stroke", "var(--surface)").attr("stroke-width", 1.5)
        .on("pointermove", (event, d) => showTooltip(event, `${SHORT[s.group]}, ${MONTHS[d.month - 1]}`, [
          ["Hospitalisations 2011–19", fmt(d.hosp)], ["vs average month", `${d3.format("+.0%")(d.index - 1)}`],
        ]))
        .on("pointerleave", hideTooltip);
      const last = s.rows.at(-1);
      g.append("text").attr("class", "direct-label").attr("fill", c)
        .attr("x", narrow ? x(1) : width + 8).attr("y", narrow ? y(s.group === "Pedestrian" ? 0.74 : 1.22) : y(last.index))
        .attr("dy", "0.35em").text(SHORT[s.group]);
    });
  }
}
