import {createCliExchange} from './sdk-client';
import {assertTestnet,finish} from './cli-common';
import {discoverClaims,redeemClaim} from '../lib/claim-controller';
import {readFileSync} from 'node:fs';
import {z} from 'zod';
import type {Address,Hex} from 'viem';
async function main(){await assertTestnet();const guaranteed=process.argv.includes('--guaranteed');const ex=createCliExchange(guaranteed?'maker':'taker');try{
  const path=guaranteed?'claim-market.json':'market.json';
  const recorded=z.object({marketId:z.string().regex(/^0x[0-9a-fA-F]{64}$/)}).parse(JSON.parse(readFileSync(path,'utf8')));
  const onchain=await ex.client.getMarketOnchain(recorded.marketId as Hex);
  const wallet=ex.walletAddress as Address;
  const [upBalance,downBalance]=await Promise.all([
    ex.client.getOutcomeBalance({outcomeToken:onchain.outcomeToken,account:wallet,id:onchain.yesId}),
    ex.client.getOutcomeBalance({outcomeToken:onchain.outcomeToken,account:wallet,id:onchain.noId}),
  ]);
  console.log(JSON.stringify({marketId:recorded.marketId,wallet,status:onchain.status,isResolved:onchain.isResolved,isVoided:onchain.isVoided,winningOutcome:onchain.isResolved?onchain.winningOutcome:null,expirySec:String(onchain.expiry),yesId:String(onchain.yesId),noId:String(onchain.noId),upBalance:String(upBalance),downBalance:String(downBalance)},null,2));
  const claims=await discoverClaims(ex,wallet,[recorded.marketId as Hex]);
  console.log(JSON.stringify(claims,(_,v)=>typeof v==='bigint'?String(v):v,2));
  if(process.argv.includes('--execute'))for(const claim of claims)for(const outcome of claim.claimableOutcomes){await assertTestnet();console.log(JSON.stringify({redemptionHash:await redeemClaim(ex,wallet,claim,outcome)}));}
  if(!claims.length)console.log('No payable position in the recorded market. It may be pending, losing, or already redeemed.');
}finally{await ex.close();}}
main().then(()=>finish()).catch(finish);
