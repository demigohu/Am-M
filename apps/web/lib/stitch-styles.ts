import type { DeskSlug } from "./catalog";

/** Desk mark hex — matches stitch-export colored cards & badges */
export const DESK_HEX: Record<DeskSlug, string> = {
  rebalance: "#4a63c4",
  grid: "#7c4ac4",
  yield: "#1f8a5f",
  guard: "#c23b30",
};

export const HOME_DESK_CARDS: {
  slug: DeskSlug;
  deskNum: string;
  tagline: string;
  bgClass: string;
}[] = [
  {
    slug: "rebalance",
    deskNum: "LP REBALANCE",
    tagline: "Keep your PCS LP in range while you sleep.",
    bgClass: "bg-desk-rebalance",
  },
  {
    slug: "grid",
    deskNum: "GRID TRADING",
    tagline: "Buy dips, sell rips on autopilot.",
    bgClass: "bg-desk-grid",
  },
  {
    slug: "yield",
    deskNum: "YIELD",
    tagline: "Park idle tokens where APR is highest.",
    bgClass: "bg-desk-yield",
  },
  {
    slug: "guard",
    deskNum: "HEALTH FACTOR",
    tagline: "Never get liquidated while you sleep.",
    bgClass: "bg-desk-guard",
  },
];
