import type { BookSnapshot, GuardDecision, MarketId, TradeRecord, TrackedMarket } from "./types";
export interface GenerationState { market?: TrackedMarket; book?: BookSnapshot; decision?: GuardDecision; submissionEnabled: boolean; trades: TradeRecord[]; trackedMarketIds: MarketId[] }
export function applyDiscoveredMarket(state: GenerationState, market: TrackedMarket): GenerationState {
  if (!state.market || state.market.marketId === market.marketId) return { ...state, market, submissionEnabled: Boolean(state.book && state.book.marketId === market.marketId) };
  return { market, book: undefined, decision: undefined, submissionEnabled: false, trades: state.trades, trackedMarketIds: Array.from(new Set([...state.trackedMarketIds, state.market.marketId, market.marketId])) };
}
export function acceptBook(state: GenerationState, book: BookSnapshot): GenerationState { return !state.market || book.marketId !== state.market.marketId ? state : { ...state, book, submissionEnabled: true }; }
