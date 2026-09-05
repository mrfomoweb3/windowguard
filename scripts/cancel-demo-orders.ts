import {createCliExchange} from './sdk-client';
import {assertTestnet,requireExecute,readOrders,saveOrders,finish} from './cli-common';
import type {Address,Hex} from 'viem';
async function main(){
  requireExecute();await assertTestnet();const ex=createCliExchange('maker');
  try{
    let remaining=readOrders();
    for(const row of [...remaining]){
      if(row.wallet.toLowerCase()!==ex.walletAddress?.toLowerCase())continue;
      const chain=await ex.client.getMarketOnchain(row.marketId as Hex);
      if(chain.pool.toLowerCase()!==row.pool.toLowerCase())throw new Error('Pool binding changed. Manual review required.');
      await assertTestnet();
      const result=await ex.trader.cancelOrder({pool:row.pool as Address,orderId:BigInt(row.orderId)});
      if(result.receipt.status!=='success')throw new Error('Cancellation reverted; record retained.');
      remaining=remaining.filter(x=>x!==row);saveOrders(remaining);console.log(JSON.stringify({orderId:row.orderId,txHash:result.hash}));
    }
  }finally{await ex.close();}
}
main().then(()=>finish()).catch(finish);
