import {createCliExchange} from './sdk-client';
import {assertTestnet,requireExecute,finish} from './cli-common';
import {discoverCurrentBtc5mMarket} from '../lib/market-discovery';
import {submitProtectedOrder} from '../lib/trade-controller';
import {writeFileSync} from 'node:fs';
async function main(){requireExecute();await assertTestnet();const ex=createCliExchange('taker');try{
  const market=await discoverCurrentBtc5mMarket(ex);if(!market)throw new Error('No current BTC five-minute market.');
  const max=Number(process.env.DEMO_MAXIMUM_PRICE??'.56');
  const trade=await submitProtectedOrder(ex,{marketId:market.marketId,outcome:'UP',quantity:.01,maximumAveragePrice:max,minimumSecondsRemaining:60,createdAtMs:Date.now()},()=>true,()=>console.log('Sending tiny IOC test order.'));
  writeFileSync('market.json',JSON.stringify(trade,null,2),{mode:0o600});console.log(JSON.stringify(trade,null,2));
  console.log('After resolution: npm run verify-claim. A losing position is not claimable.');
}finally{await ex.close();}}
main().then(()=>finish()).catch(finish);
