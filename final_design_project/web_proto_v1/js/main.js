/**
 * main.js — entry point for web_proto_v1. Loads every CSV once, fills the
 * data-driven sentences in the text, then renders each chart.
 * Page UI: theme toggle, reading-progress bar, current-chapter nav highlight,
 * re-render on width change.
 *
 * GenAI acknowledgement: drafted with Claude (Anthropic), to be reviewed by the team.
 */
/* global d3 */
import { DATA, BASE_YEAR, END_YEAR } from "./config.js";
import { debounce, fmt, fmt1, pct } from "./utils.js";
import { Ward } from "./charts/ward.js";
import { TrendChart } from "./charts/trend.js";
import { SeverityChart } from "./charts/severity.js";
import { CounterpartyChart } from "./charts/counterparty.js";
import { AgeChart } from "./charts/age.js";
import { SeasonChart } from "./charts/season.js";
import { StateMap } from "./charts/stateMap.js";
import { RolePicker } from "./charts/roles.js";

async function loadData() {
  const entries = await Promise.all(Object.entries(DATA).map(async ([k, p]) => [k, await d3.csv(p, d3.autoType)]));
  return Object.fromEntries(entries);
}

/** Every number in the prose comes from the data, so text and charts cannot drift apart. */
function fillFacts(data, ward) {
  const sev = (g) => data.severity.find((d) => d.group === g);
  const yr = (g, y) => data.groupYear.find((d) => d.group === g && d.year === y).hosp;
  const cp = (g, c) => data.counterparty.find((d) => d.group === g && d.cp === c).share;
  const old = data.age.find((d) => d.group === "Pedestrian" && d.age === "75+");
  const vru2021 = yr("Pedestrian", 2021) + yr("Pedal cyclist", 2021);
  const vruShare = d3.sum(data.severity.filter((d) => ["Pedestrian", "Pedal cyclist", "Motorcyclist"].includes(d.group)), (d) => d.hosp)
    / d3.sum(data.severity, (d) => d.hosp);
  const ped = sev("Pedestrian"), car = sev("Car occupant"), cyc = sev("Pedal cyclist");
  const change = (g) => d3.format("+.0%")(yr(g, END_YEAR) / yr(g, BASE_YEAR) - 1);

  const facts = {
    beds: fmt(ward.total),
    vru2021: fmt(vru2021),
    every: Math.round((365 * 24 * 60) / vru2021),
    vruShare: pct(vruShare),
    pedChange: change("Pedestrian"),
    cycChange: change("Pedal cyclist"),
    pedLos: fmt1(ped.los), carLos: fmt1(car.los), cycLos: fmt1(cyc.los),
    pedDied: d3.format(".1%")(ped.died_rate), carDied: d3.format(".1%")(car.died_rate),
    pedShareHosp: pct(ped.share_hosp), pedShareBed: pct(ped.share_bed),
    pedCar: pct(cp("Pedestrian", "Car, pick-up truck or van")),
    cycFall: pct(cp("Pedal cyclist", "No collision (e.g. fall)")),
    oldLos: fmt1(old.los), oldDied: `1 in ${Math.round(1 / old.died_rate)}`,
  };
  document.querySelectorAll("[data-fact]").forEach((el) => { el.textContent = facts[el.dataset.fact]; });
}

function setupPageUI(charts) {
  const root = document.documentElement;
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch { /* storage blocked */ }
    charts.forEach((c) => c.render()); // colours are read from CSS variables at render time
  });

  const bar = document.getElementById("progress-bar");
  document.addEventListener("scroll", () => {
    const h = document.documentElement;
    bar.style.width = `${(h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100}%`;
  }, { passive: true });

  const links = [...document.querySelectorAll(".nav-links a")];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("is-current", a.hash === `#${e.target.id}`));
  }), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section[id]").forEach((s) => io.observe(s));

  let lastW = window.innerWidth;
  window.addEventListener("resize", debounce(() => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    charts.forEach((c) => c.render());
  }, 200));
}

async function init() {
  let data;
  try {
    data = await loadData();
  } catch (err) {
    document.querySelector("#main").insertAdjacentHTML("afterbegin",
      `<p class="wrap" style="color:var(--accent);padding-top:24px">Could not load data (${err.message}). Open the page through a local web server.</p>`);
    console.error(err);
    return;
  }
  const ward = new Ward("#chart-ward", data.severity);
  fillFacts(data, ward);
  const charts = [
    ward,
    new TrendChart("#chart-trend", data.groupYear),
    new SeverityChart("#chart-severity", data.severity),
    new CounterpartyChart("#chart-cp", "#legend-cp", data.counterparty),
    new AgeChart("#chart-age", "#age-title", data.age),
    new SeasonChart("#chart-season", data.season),
    new StateMap("#chart-states", "#chart-state-detail", "#state-detail-title", data.stateYear),
    new RolePicker("#roles", "#role-panel", data),
  ];
  charts.forEach((c) => c.render());
  setupPageUI(charts);
}

init();
