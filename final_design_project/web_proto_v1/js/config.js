/**
 * config.js — shared constants for web_proto_v1 (VRU story).
 * Colours are CSS variables so light/dark mode stay in one place (css/style.css).
 *
 * GenAI acknowledgement: drafted with Claude (Anthropic), to be reviewed by the team.
 */
import { cssVar } from "./utils.js";

/** Order used in every chart: the two focus groups first, context after. */
export const GROUPS = ["Pedestrian", "Pedal cyclist", "Motorcyclist", "Car occupant", "Other"];
export const FOCUS = ["Pedestrian", "Pedal cyclist"];

/** Read colours at render time so a theme switch is picked up. */
export const groupColor = (g) => cssVar({
  "Pedestrian": "--ped", "Pedal cyclist": "--cyc", "Motorcyclist": "--moto",
  "Car occupant": "--car", "Other": "--other",
}[g]);

export const SHORT = { "Pedestrian": "Pedestrians", "Pedal cyclist": "Cyclists",
  "Motorcyclist": "Motorcyclists", "Car occupant": "Car occupants", "Other": "Other road users" };

export const AGE_ORDER = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const STATE_NAMES = {
  NSW: "New South Wales", Vic: "Victoria", Qld: "Queensland", WA: "Western Australia",
  SA: "South Australia", Tas: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory",
};
/** Tile-grid layout [col, row] — every state gets equal area. */
export const STATE_TILES = {
  NT: [1, 0], Qld: [2, 0],
  WA: [0, 1], SA: [1, 1], NSW: [2, 1], ACT: [3, 1],
  Vic: [2, 2],
  Tas: [2, 3],
};

/** Comparison years agreed by the team: 2012 (after the Victorian series break)
 *  to 2019 (before COVID). */
export const BASE_YEAR = 2012;
export const END_YEAR = 2019;

export const DATA = {
  groupYear: "data/group_year.csv",
  severity: "data/severity.csv",
  counterparty: "data/counterparty.csv",
  season: "data/season.csv",
  age: "data/age.csv",
  stateYear: "data/state_year.csv",
};
