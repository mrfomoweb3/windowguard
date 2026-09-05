import type { BookLevel, BookSnapshot, MarketId, Outcome } from "./types";
export function normalizeBook(input: { marketId: MarketId; outcome: Outcome; bids?: BookLevel[]; asks?: BookLevel[]; capturedAtMs?: number }): BookSnapshot {
  const valid = (x: BookLevel) => Number.isFinite(x.price) && x.price > 0 && x.price < 1 && Number.isFinite(x.quantity) && x.quantity > 0;
  const bids = (input.bids ?? []).filter(valid).sort((a, b) => b.price - a.price);
  const asks = (input.asks ?? []).filter(valid).sort((a, b) => a.price - b.price);
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  return { marketId: input.marketId, outcome: input.outcome, capturedAtMs: input.capturedAtMs ?? Date.now(), bids, asks, bestBid, bestAsk, spread: bestBid !== undefined && bestAsk !== undefined ? bestAsk - bestBid : undefined };
}
