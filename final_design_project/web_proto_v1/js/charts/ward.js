/**
 * ward.js — Hero: "the ward". One bed icon = one hospital bed occupied every
 * day of the year by an injured pedestrian or cyclist (bed days 2011–2021 ÷
 * number of days). Beds fill in one by one when the hero is on screen, so the
 * size of the burden is felt before it is read.
 */
/* global d3 */
import { groupColor, SHORT } from "../config.js";
import { createSvg, showTooltip, hideTooltip, fmt } from "../utils.js";

const DAYS = d3.timeDay.count(new Date(2011, 0, 1), new Date(2022, 0, 1)); // 4,018

export class Ward {
  constructor(selector, severity) {
    this.selector = selector;
    this.beds = ["Pedestrian", "Pedal cyclist"].map((g) => {
      const row = severity.find((d) => d.group === g);
      return { group: g, n: Math.round(row.bed / DAYS), bedDays: row.bed };
    });
    this.played = false;
  }

  get total() { return d3.sum(this.beds, (d) => d.n); }

  render() {
    const margin = { top: 4, right: 0, bottom: 4, left: 0 };
    const node = document.querySelector(this.selector);
    const cols = node.clientWidth < 520 ? 12 : 24;
    const icons = this.beds.flatMap((b) => d3.range(b.n).map(() => b));
    const rows = Math.ceil(icons.length / cols);
    const { g, width } = createSvg(this.selector, { height: 8 + rows * 30, margin });
    const cell = width / cols;
    const w = Math.min(cell - 4, 34);

    const bed = g.selectAll(".bed").data(icons).join("g")
      .attr("class", (_, i) => `bed${this.played ? " is-in" : ""}`)
      .attr("transform", (_, i) => `translate(${(i % cols) * cell},${Math.floor(i / cols) * 30})`)
      .on("pointermove", (event, d) => showTooltip(event, SHORT[d.group], [
        ["Beds filled every day", fmt(d.n)],
        ["Bed days 2011–2021", fmt(d.bedDays)],
      ]))
      .on("pointerleave", hideTooltip);
    // Simple bed glyph: mattress + pillow + headboard
    bed.append("rect").attr("x", 0).attr("y", 10).attr("width", w).attr("height", 9).attr("rx", 2)
      .attr("fill", (d) => groupColor(d.group));
    bed.append("rect").attr("x", 0).attr("y", 4).attr("width", 3).attr("height", 18).attr("rx", 1)
      .attr("fill", (d) => groupColor(d.group));
    bed.append("rect").attr("x", 5).attr("y", 6).attr("width", 7).attr("height", 4).attr("rx", 1.5)
      .attr("fill", (d) => groupColor(d.group)).attr("opacity", 0.6);

    if (!this.played) this.observe();
  }

  /** Fill the ward once, when it scrolls into view (skipped for reduced motion). */
  observe() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const play = () => {
      this.played = true;
      d3.selectAll(`${this.selector} .bed`).each(function (_, i) {
        if (reduce) this.classList.add("is-in");
        else setTimeout(() => this.classList.add("is-in"), i * 18);
      });
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { play(); io.disconnect(); } },
      { threshold: 0.3 });
    io.observe(document.querySelector(this.selector));
  }
}
