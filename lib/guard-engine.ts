import { DEFAULT_POLICY } from "./config";
import type { BookSnapshot, FillEstimate, GuardCode, GuardDecision, OrderIntent, TrackedMarket } from "./types";

type Input = { intent: OrderIntent; currentMarket: TrackedMarket; book: BookSnapshot; nowMs: number; estimate: FillEstimate };
export function evaluateGuard({ intent, currentMarket, book, nowMs, estimate }: Input): GuardDecision {
  const secondsRemaining = Math.max(0, Math.floor(currentMarket.expirySec - nowMs / 1000));
  const bookAgeMs = Math.max(0, nowMs - book.capturedAtMs);
  const result = (code: GuardCode, reasons: string[], allowed = false): GuardDecision => ({ code, allowed, reasons, evaluatedAtMs: nowMs, marketId: intent.marketId, currentMarketId: currentMarket.marketId, secondsRemaining, bookAgeMs, intent, estimate });
  if (!Number.isFinite(nowMs) || !Number.isFinite(currentMarket.expirySec) || !['UP','DOWN'].includes(intent.outcome) || !Number.isFinite(intent.quantity) || intent.quantity < DEFAULT_POLICY.minimumQuantity || intent.quantity > DEFAULT_POLICY.maximumQuantity || !Number.isFinite(intent.maximumAveragePrice) || intent.maximumAveragePrice <= 0 || intent.maximumAveragePrice >= 1 || !Number.isFinite(intent.minimumSecondsRemaining) || intent.minimumSecondsRemaining < 1 || intent.minimumSecondsRemaining > 299) return result("INVALID_INTENT", ["Quantity, price, or time limit is outside the supported range."]);
  if (intent.marketId !== currentMarket.marketId || book.marketId !== currentMarket.marketId) return result("WINDOW_ROLLED", ["A new five-minute market opened. Review the new odds."]);
  if (currentMarket.status !== "TRADING") return result("MARKET_NOT_TRADING", [`The current market is ${currentMarket.status.toLowerCase()}, not trading.`]);
  if (secondsRemaining < intent.minimumSecondsRemaining) return result("WINDOW_CLOSING", [`Only ${secondsRemaining}s remain, below your ${intent.minimumSecondsRemaining}s minimum.`]);
  if (book.outcome !== intent.outcome || !Number.isFinite(book.capturedAtMs) || book.capturedAtMs > nowMs || bookAgeMs > DEFAULT_POLICY.maxBookAgeMs) return result("STALE_BOOK", [`The latest book is invalid for this outcome or exceeds the ${DEFAULT_POLICY.maxBookAgeMs}ms freshness limit.`]);
  if (!estimate.fullyFillable) return result("INSUFFICIENT_DEPTH", [`Only ${estimate.fillableQuantity.toFixed(2)} of ${intent.quantity.toFixed(2)} contracts are available at or below ${intent.maximumAveragePrice.toFixed(3)}.`]);
  if (estimate.averagePrice === undefined || !Number.isFinite(estimate.averagePrice) || estimate.averagePrice > intent.maximumAveragePrice || estimate.worstPrice === undefined || !Number.isFinite(estimate.worstPrice) || estimate.worstPrice > intent.maximumAveragePrice) return result("PRICE_MOVED", [`Expected execution exceeds your ${intent.maximumAveragePrice.toFixed(3)} maximum price per contract.`]);
  return result("SAFE", [`All ${intent.quantity.toFixed(2)} contracts are available within your ${intent.maximumAveragePrice.toFixed(3)} limit.`], true);
}
