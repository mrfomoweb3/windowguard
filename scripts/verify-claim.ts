import {createCliExchange} from './sdk-client';
import {assertTestnet,finish} from './cli-common';
import {discoverClaims,redeemClaim} from '../lib/claim-controller';
import {readFileSync} from 'node:fs';
import {z} from 'zod';
import type {Address,Hex} from 'viem';
async function main(){await assertTestnet();const ex=createCliExchange('taker');try{
  const recorded=z.object({marketId:z.string().regex(/^0x[0-9a-fA-F]{64}$/)}).parse(JSON.parse(readFileSync('market.json','utf8')));
  const wallet=ex.walletAddress as Address;const claims=await discoverClaims(ex,wallet,[recorded.marketId as Hex]);
  console.log(JSON.stringify(claims,(_,v)=>typeof v==='bigint'?String(v):v,2));
  if(process.argv.includes('--execute'))for(const claim of claims)for(const outcome of claim.claimableOutcomes){await assertTestnet();console.log(JSON.stringify({redemptionHash:await redeemClaim(ex,wallet,claim,outcome)}));}
  if(!claims.length)console.log('No payable position in the recorded market. It may be pending, losing, or already redeemed.');
}finally{await ex.close();}}
main().then(()=>finish()).catch(finish);
