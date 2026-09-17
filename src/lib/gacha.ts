import crypto from "node:crypto";

export type WeightedItem<T> = T & { weight: number };

/** Cryptographically random weighted pick — avoids Math.random() predictability for a "fair gacha" feel. */
export function weightedPick<T>(items: WeightedItem<T>[]): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) throw new Error("NO_WEIGHTED_ITEMS");

  const roll = (crypto.randomInt(0, 1_000_000) / 1_000_000) * total;
  let acc = 0;
  for (const item of items) {
    acc += Math.max(0, item.weight);
    if (roll < acc) return item;
  }
  return items[items.length - 1];
}
