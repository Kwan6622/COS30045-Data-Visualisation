/**
 * roles.js — Ch5: "What can you do?" role picker.
 * The reader picks how they use the road; the panel repeats the figures from
 * earlier chapters that matter for that role, then lists actions.
 * Order follows the Safe System framing agreed by the team: system and driver
 * actions first, self-protection tips for pedestrians/cyclists labelled
 * "extra protection" so they do not read as blaming victims.
 *
 * IMPORTANT: every action needs a verified source before submission. Sources
 * shown here are placeholders marked "to verify" (see docs/references.md).
 */
import { fmt1, pct } from "../utils.js";

export class RolePicker {
  constructor(buttonsSel, panelSel, data) {
    this.buttonsSel = buttonsSel;
    this.panelSel = panelSel;
    const sev = (g) => data.severity.find((d) => d.group === g);
    const cp = (g, c) => data.counterparty.find((d) => d.group === g && d.cp === c).share;
    const age = (g, a) => data.age.find((d) => d.group === g && d.age === a);
    const season = (g, m) => data.season.find((d) => d.group === g && d.month === m).index;
    const ped = sev("Pedestrian"), car = sev("Car occupant"), cyc = sev("Pedal cyclist");
    const old = age("Pedestrian", "75+");

    this.roles = {
      driver: {
        icon: "🚗", name: "I drive", sub: "car, ute or van",
        title: "When you drive, the people outside your car have no crumple zone",
        stats: [
          [pct(cp("Pedestrian", "Car, pick-up truck or van")), "of pedestrian hospitalisations involved a collision with a car, pick-up truck or van"],
          [`${fmt1(ped.los)} days`, `average hospital stay for a pedestrian, vs ${fmt1(car.los)} for a car occupant`],
          [`+${pct(season("Pedestrian", 6) - 1)}`, "more pedestrian hospitalisations in June than in an average month"],
        ],
        actions: [
          ["System", "Lower speed limits in busy pedestrian areas and residential streets."],
          ["Driver", "Slow down where people walk: shops, schools, aged-care facilities."],
          ["Driver", "Take extra care in the winter months, when pedestrian hospitalisations peak."],
        ],
      },
      walk: {
        icon: "🚶", name: "I walk", sub: "or my parents do",
        title: "On foot, your body takes the whole impact",
        stats: [
          [`${fmt1(old.los)} days`, "average hospital stay for a pedestrian aged 75 and over"],
          [`1 in ${Math.round(1 / old.died_rate)}`, "pedestrians aged 75+ admitted to hospital died within 30 days"],
          [pct(ped.share_bed), `of all road-crash bed days, from ${pct(ped.share_hosp)} of hospitalisations`],
        ],
        actions: [
          ["System", "Longer crossing times at signals and more marked crossings near shops and aged care."],
          ["System", "Better street lighting where people walk after dark in winter."],
          ["Extra protection", "Cross at signals where possible; wear something light or reflective after dark."],
        ],
      },
      cycle: {
        icon: "🚲", name: "I ride", sub: "bike or e-bike",
        title: "Most cyclist injuries happen without another vehicle",
        stats: [
          [pct(cp("Pedal cyclist", "No collision (e.g. fall)")), "of cyclist hospitalisations were non-collision crashes, such as falls"],
          [pct(cp("Pedal cyclist", "Car, pick-up truck or van")), "involved a car, pick-up truck or van"],
          [`+${pct(season("Pedal cyclist", 3) - 1)}`, "more cyclist hospitalisations in March than in an average month"],
        ],
        actions: [
          ["System", "Separated bike lanes and well-maintained road surfaces (falls are the biggest group)."],
          ["Driver", "Give cyclists room when passing."],
          ["Extra protection", "Check brakes and tyres, wear a helmet, choose routes with separated lanes."],
        ],
      },
      policy: {
        icon: "🏛️", name: "I make decisions", sub: "council, state, federal",
        title: "Where the data says to act first",
        stats: [
          [pct(ped.died_rate), `of pedestrian admissions ended in death within 30 days (car occupants ${d3.format(".1%")(car.died_rate)})`],
          [`${Math.round((ped.bed + cyc.bed) / 4018)}`, "hospital beds filled every day by injured pedestrians and cyclists"],
          [pct(cp("Pedal cyclist", "No collision (e.g. fall)")), "of cyclist injuries involved no other vehicle: a road-design issue"],
        ],
        actions: [
          ["System", "Prioritise speed management and crossings where older pedestrians walk."],
          ["System", "Fund separated cycling infrastructure and surface maintenance."],
          ["System", "Use per-person rates, not raw counts, to choose where to spend first (Chapter 4)."],
        ],
      },
    };
    this.current = "driver";
  }

  render() {
    const btns = document.querySelector(this.buttonsSel);
    btns.innerHTML = Object.entries(this.roles).map(([k, r]) => `
      <button class="role${k === this.current ? " is-active" : ""}" data-role="${k}" aria-pressed="${k === this.current}">
        <span class="role-icon" aria-hidden="true">${r.icon}</span>
        <span class="role-name">${r.name}</span><br><span class="role-sub">${r.sub}</span>
      </button>`).join("");
    btns.querySelectorAll(".role").forEach((b) => b.addEventListener("click", () => {
      this.current = b.dataset.role; this.render();
      document.querySelector(this.panelSel).focus({ preventScroll: true });
    }));

    const r = this.roles[this.current];
    document.querySelector(this.panelSel).innerHTML = `
      <h3>${r.title}</h3>
      <div class="role-stats">${r.stats.map(([v, l]) => `<div class="stat"><div class="value">${v}</div><div class="label">${l}</div></div>`).join("")}</div>
      <ul class="actions">${r.actions.map(([tag, a]) => `<li><span class="tag">${tag}</span>${a}</li>`).join("")}</ul>
      <p class="src">Figures: BITRE (2023), Traffic hospitalisations 2011–2021. Actions follow the Safe System approach
      <span class="verify">[source to verify before submission: National Road Safety Strategy 2021–30]</span>.</p>`;
  }
}
