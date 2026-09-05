import type { ClaimCandidate, OutcomeIndex } from "./types";
import type {SomniaMarkets} from '@somnia-chain/markets-sdk';
import type {Address,Hex} from 'viem';
export function selectClaimableOutcomes(input: Pick<ClaimCandidate, "lifecycle" | "winningOutcome" | "balances">): OutcomeIndex[] {
  if (input.lifecycle === "VOIDED") return ([0, 1] as OutcomeIndex[]).filter((i) => input.balances[i] > 0n);
  if (input.winningOutcome === undefined) return [];
  return input.balances[input.winningOutcome] > 0n ? [input.winningOutcome] : [];
}

export async function discoverClaims(exchange:SomniaMarkets,wallet:Address,ids:Hex[]):Promise<ClaimCandidate[]> {
  const claims:ClaimCandidate[]=[];
  for(const marketId of [...new Set(ids)].slice(-120)){
    const m=await exchange.client.getMarketOnchain(marketId);
    if(!m.isResolved&&!m.isVoided)continue;
    const [up,down]=await Promise.all([exchange.client.getOutcomeBalance({outcomeToken:m.outcomeToken,account:wallet,id:m.yesId}),exchange.client.getOutcomeBalance({outcomeToken:m.outcomeToken,account:wallet,id:m.noId})]);
    const candidate:ClaimCandidate={marketId,marketAddress:m.marketAddress,outcomeToken:m.outcomeToken,lifecycle:m.isVoided?'VOIDED':'RESOLVED',winningOutcome:m.isResolved&&(m.winningOutcome===0||m.winningOutcome===1)?m.winningOutcome:undefined,balances:{0:up,1:down},claimableOutcomes:[],expirySec:Number(m.expiry)};
    candidate.claimableOutcomes=selectClaimableOutcomes(candidate);
    if(candidate.claimableOutcomes.length)claims.push(candidate);
  }
  return claims;
}
export async function redeemClaim(exchange:SomniaMarkets,wallet:Address,claim:ClaimCandidate,outcome:OutcomeIndex){
  const current=(await discoverClaims(exchange,wallet,[claim.marketId]))[0];
  if(!current?.claimableOutcomes.includes(outcome))throw new Error('This outcome is no longer payable. Refresh claims.');
  const chain=await exchange.client.getMarketOnchain(claim.marketId);
  if(!chain.isVoided&&!(chain.isResolved&&chain.winningOutcome===outcome))throw new Error('Market is not payable.');
  const result=await exchange.trader.redeem({marketId:claim.marketId,outcomeIdx:outcome,amount:current.balances[outcome],market:chain.marketAddress,outcomeToken:chain.outcomeToken});
  if(result.receipt.status!=='success')throw new Error(`Redemption reverted: ${result.hash}`);
  const balance=await exchange.client.getOutcomeBalance({outcomeToken:chain.outcomeToken,account:wallet,id:outcome===0?chain.yesId:chain.noId});
  if(balance!==0n)throw new Error(`Redemption confirmed but balance verification needs review: ${result.hash}`);
  return result.hash;
}
