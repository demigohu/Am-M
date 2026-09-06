import type { Agent } from "./catalog";

export type MarketSortKey = "live" | "price" | "reputation" | "variant" | "name";

export function sortMarketAgents(list: Agent[], sort: MarketSortKey, desc: boolean): Agent[] {
  const out = [...list];
  const mul = desc ? -1 : 1;
  out.sort((a, b) => {
    switch (sort) {
      case "price":
        return (
          mul *
          (BigInt(a.priceWei) > BigInt(b.priceWei)
            ? 1
            : BigInt(a.priceWei) < BigInt(b.priceWei)
              ? -1
              : 0)
        );
      case "reputation": {
        const ar = a.reputation ?? -1;
        const br = b.reputation ?? -1;
        return mul * (ar > br ? 1 : ar < br ? -1 : 0);
      }
      case "variant":
        return mul * a.variant.localeCompare(b.variant);
      case "name":
        return mul * a.name.localeCompare(b.name);
      case "live":
      default:
        return mul * a.liveMetric.localeCompare(b.liveMetric);
    }
  });
  return out;
}
