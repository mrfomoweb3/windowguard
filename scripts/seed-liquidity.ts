import {createCliExchange} from './sdk-client';
import {discoverCurrentBtc5mMarket} from '../lib/market-discovery';
import {assertTestnet,requireExecute,readOrders,saveOrders,finish,pub} from './cli-common';
import {parseUnits,type Address} from 'viem';
async function main(){
  requireExecute();await assertTestnet();const ex=createCliExchange('maker');
  try{
    const wallet=ex.walletAddress as Address;
    console.log(JSON.stringify({wallet,gasBalance:String(await pub.getBalance({address:wallet}))}));
    const market=await discoverCurrentBtc5mMarket(ex);
    if(!market||market.expirySec-Date.now()/1000<90)throw new Error('Wait for a BTC five-minute window with more than 90 seconds remaining.');
    const rows=readOrders();if(rows.some(r=>r.wallet.toLowerCase()===wallet.toLowerCase()))throw new Error('Clean up recorded maker orders before seeding again.');
    const chain=await ex.client.getMarketOnchain(market.marketId);
    if(chain.status!==1)throw new Error('Market is not trading.');
    const mint=await ex.trader.mintSet({pool:chain.pool,amount:parseUnits('5',chain.decimals)});
    if(mint.receipt.status!=='success')throw new Error('Inventory mint reverted.');
    for(const [price,amount] of [[.54,2],[.58,3]]){
      await assertTestnet();const fresh=await ex.client.getMarketOnchain(market.marketId);
      if(fresh.status!==1||Number(fresh.expiry)-Date.now()/1000<60)throw new Error('Window closing; run cleanup for any recorded orders.');
      const p=ex.priceToPrecision(market.upSymbol,price);const q=ex.amountToPrecision(market.upSymbol,amount);
      if(p!==price||q!==amount)throw new Error('Demo quantities or prices do not match this grid.');
      const result=await ex.trader.placeOrder({pool:fresh.pool,side:'SELL_YES',price:parseUnits(String(p),fresh.decimals),quantity:parseUnits(String(q),fresh.decimals),expireTimestampNs:fresh.expiry*1000000000n,orderType:3});
      if(result.receipt.status!=='success'||result.orderId===undefined)throw new Error('Maker order did not rest; inspect transaction and run cleanup.');
      rows.push({wallet,marketId:market.marketId,pool:fresh.pool,orderId:String(result.orderId)});saveOrders(rows);
      console.log(JSON.stringify({marketId:market.marketId,price,amount,orderId:String(result.orderId),txHash:result.hash}));
    }
    console.log('Cleanup: npm run cancel-demo -- --execute');
  }finally{await ex.close();}
}
main().then(()=>finish()).catch(finish);
