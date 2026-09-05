export type HexAddress = `0x${string}`;
export type MarketId = `0x${string}`;
export type Outcome = "UP" | "DOWN";
export type OutcomeIndex = 0 | 1;
export type Lifecycle = "LISTED" | "TRADING" | "LOCKED" | "SETTLING" | "RESOLVED" | "VOIDED" | "UNKNOWN";

export interface TrackedMarket {
  marketId: MarketId;
  symbol: string;
  upSymbol: string;
  downSymbol: string;
  asset: "BTC";
  cadenceSec: 300;
  venueId: string;
  pool: HexAddress;
  marketAddress: HexAddress;
  outcomeToken: HexAddress;
  yesId: bigint;
  noId: bigint;
  expirySec: number;
  status: Lifecycle;
  oracleQuestionId?: string;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
}

export interface BookLevel { price: number; quantity: number }
export interface BookSnapshot {
  marketId: MarketId;
  outcome: Outcome;
  capturedAtMs: number;
  bids: BookLevel[];
  asks: BookLevel[];
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
}
export interface OrderIntent {
  marketId: MarketId;
  outcome: Outcome;
  quantity: number;
  maximumAveragePrice: number;
  minimumSecondsRemaining: number;
  createdAtMs: number;
}
export interface FillEstimate {
  requestedQuantity: number;
  fillableQuantity: number;
  totalCost: number;
  averagePrice?: number;
  worstPrice?: number;
  priceImpactBps?: number;
  fullyFillable: boolean;
  levelsConsumed: number;
}
export type GuardCode = "SAFE" | "STALE_BOOK" | "WINDOW_CLOSING" | "INSUFFICIENT_DEPTH" | "PRICE_MOVED" | "WINDOW_ROLLED" | "MARKET_NOT_TRADING" | "INVALID_INTENT";
export interface GuardDecision {
  code: GuardCode;
  allowed: boolean;
  reasons: string[];
  evaluatedAtMs: number;
  marketId: MarketId;
  currentMarketId: MarketId;
  secondsRemaining: number;
  bookAgeMs: number;
  intent: OrderIntent;
  estimate?: FillEstimate;
}
export interface TradeRecord {
  clientTradeId: string;
  marketId: MarketId;
  symbol: string;
  outcome: Outcome;
  requestedQuantity: number;
  limitPrice: number;
  expectedAveragePrice?: number;
  txHash?: HexAddress;
  filledQuantity?: number;
  actualAveragePrice?: number;
  status: "PREVIEWED" | "AWAITING_SIGNATURE" | "SUBMITTED" | "CONFIRMED" | "PARTIAL" | "REJECTED" | "REVERTED";
  createdAtMs: number;
  updatedAtMs: number;
}
export interface ClaimCandidate {
  marketId: MarketId;
  marketAddress: HexAddress;
  outcomeToken: HexAddress;
  lifecycle: "RESOLVED" | "VOIDED";
  winningOutcome?: OutcomeIndex;
  balances: Record<OutcomeIndex, bigint>;
  claimableOutcomes: OutcomeIndex[];
  expirySec: number;
  oracleQuestionId?: string;
}
