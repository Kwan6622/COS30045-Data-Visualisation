/**
 * utils.js — small helpers shared by all charts: formatting, tooltip,
 * responsive SVG creation and toggle-button groups.
 *
 * GenAI acknowledgement: drafted with Claude (Anthropic), reviewed by the team.
 */
/* global d3 */

export const fmt = d3.format(",");
export const fmt1 = d3.format(",.1f");
export const pct = d3.format(".0%");

/* ---------------- Tooltip (single shared element) ---------------- */
const tip = document.getElementById("tooltip");

/**
 * Show the tooltip near the pointer.
 * @param {MouseEvent} event
 * @param {string} title
 * @param {Array<[string, string]>} rows  label/value pairs
 */
export function showTooltip(event, title, rows = []) {
  tip.innerHTML =
    `<div class="tt-title">${title}</div>` +
    rows.map(([k, v]) => `<div class="tt-row"><span>${k}</span><b>${v}</b></div>`).join("");
  tip.hidden = false;
  moveTooltip(event);
}

export function moveTooltip(event) {
  const pad = 14;
  const { innerWidth: w, innerHeight: h } = window;
  const rect = tip.getBoundingClientRect();
  let x = event.clientX + pad;
  let y = event.clientY + pad;
  if (x + rect.width > w - 8) x = event.clientX - rect.width - pad; // flip left near edge
  if (y + rect.height > h - 8) y = event.clientY - rect.height - pad;
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

export function hideTooltip() { tip.hidden = true; }

/* ---------------- Responsive SVG ---------------- */
/**
 * Create (or recreate) an SVG that scales with its container via viewBox.
 * Returns { svg, g, width, height } where g is translated by the margin.
 */
export function createSvg(selector, { height = 380, margin }) {
  const container = d3.select(selector);
  container.selectAll("svg").remove();
  const outerW = Math.max(320, container.node().clientWidth);
  const width = outerW - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${outerW} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  return { svg, g, width, height: innerH, outerW };
}

/* ---------------- Toggle-chip groups ---------------- */
/**
 * Wire a group of .chip buttons that share a data-* attribute.
 * Updates aria-pressed for screen readers (accessibility).
 */
export function bindChips(containerSel, attr, onChange) {
  const buttons = document.querySelectorAll(`${containerSel} [data-${attr}]`);
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      onChange(btn.dataset[attr]);
    });
  });
}

/** Build chip buttons from a list of values, then wire them. */
export function makeChips(containerSel, attr, values, initial, onChange) {
  const el = document.querySelector(containerSel);
  el.innerHTML = values
    .map((v) => `<button class="chip${v === initial ? " is-active" : ""}" data-${attr}="${v}"
       aria-pressed="${v === initial}">${v}</button>`)
    .join("");
  bindChips(containerSel, attr, onChange);
}

/** Read a CSS custom property's resolved value (needed for d3 colour interpolation). */
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Debounce helper for resize handling. */
export function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
