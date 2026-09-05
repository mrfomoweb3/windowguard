import type { BookLevel, FillEstimate } from "./types";

const valid = (level: BookLevel) => Number.isFinite(level.price) && level.price > 0 && level.price < 1 && Number.isFinite(level.quantity) && level.quantity > 0;
const epsilon = (quantity: number) => Math.max(1e-9, Math.abs(quantity) * 1e-9);

export function estimateBuyFill(requestedQuantity: number, asks: BookLevel[], maximumPrice = 1): FillEstimate {
  let remaining = requestedQuantity;
  let filled = 0;
  let cost = 0;
  let worstPrice: number | undefined;
  let levelsConsumed = 0;
  const clean = asks.filter(valid).sort((a, b) => a.price - b.price);
  const best = clean[0]?.price;
  for (const level of clean) {
    if (remaining <= epsilon(requestedQuantity) || level.price > maximumPrice) break;
    const take = Math.min(remaining, level.quantity);
    filled += take;
    cost += take * level.price;
    remaining -= take;
    worstPrice = level.price;
    levelsConsumed += 1;
  }
  const averagePrice = filled > 0 ? cost / filled : undefined;
  return {
    requestedQuantity,
    fillableQuantity: filled,
    totalCost: cost,
    averagePrice,
    worstPrice,
    priceImpactBps: best && averagePrice ? ((averagePrice - best) / best) * 10_000 : undefined,
    fullyFillable: remaining <= epsilon(requestedQuantity),
    levelsConsumed,
  };
}
