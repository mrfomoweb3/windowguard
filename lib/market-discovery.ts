import { isBinaryMarket, type SomniaMarkets } from '@somnia-chain/markets-sdk';
import type { Lifecycle, TrackedMarket } from './types';
export const lifecycle = (status: number): Lifecycle => (['LISTED','TRADING','LOCKED','SETTLING','RESOLVED','VOIDED'] as Lifecycle[])[status] ?? 'UNKNOWN';
export async function discoverCurrentBtc5mMarket(exchange: SomniaMarkets): Promise<TrackedMarket | null> {
  const rows = Object.values(await exchange.loadMarkets(true));
  const candidates = rows.filter(row => row.active && isBinaryMarket(row.info) && row.info.asset.toUpperCase() === 'BTC' && Number(row.info.intervalSec) === 300).sort((a,b) => isBinaryMarket(a.info) && isBinaryMarket(b.info) ? Number(a.info.expiry)-Number(b.info.expiry) : 0);
  for (const row of candidates) {
    if (!isBinaryMarket(row.info)) continue;
    const chain = await exchange.client.getMarketOnchain(row.info.marketId);
    if (chain.status !== 1 || Number(chain.expiry) <= Date.now()/1000) continue;
    const up = row.outcomes?.find(x=>x.index===0)?.symbol;
    const down = row.outcomes?.find(x=>x.index===1)?.symbol;
    if (!up || !down) continue;
    return { marketId:row.info.marketId, symbol:row.symbol, upSymbol:up, downSymbol:down, asset:'BTC', cadenceSec:300, venueId:row.info.venueId ?? '', pool:chain.pool, marketAddress:chain.marketAddress, outcomeToken:chain.outcomeToken, yesId:chain.yesId, noId:chain.noId, expirySec:Number(chain.expiry), status:lifecycle(chain.status), oracleQuestionId:row.info.oracleQuestionId ?? undefined, firstSeenAtMs:Date.now(), lastSeenAtMs:Date.now() };
  }
  return null;
}
