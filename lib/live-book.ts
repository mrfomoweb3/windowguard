import type {SomniaMarkets} from '@somnia-chain/markets-sdk';
import {normalizeBook} from './book-controller';
import type {Outcome,TrackedMarket} from './types';
export async function fetchBook(exchange:SomniaMarkets,market:TrackedMarket,outcome:Outcome) {
  const started=Date.now();
  const raw=await exchange.fetchOrderBook(outcome==='UP'?market.upSymbol:market.downSymbol,10);
  return normalizeBook({marketId:market.marketId,outcome,capturedAtMs:started,bids:raw.bids.map(([price,quantity])=>({price,quantity})),asks:raw.asks.map(([price,quantity])=>({price,quantity}))});
}
