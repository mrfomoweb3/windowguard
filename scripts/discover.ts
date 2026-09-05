import { config } from 'dotenv';
config({path:'.env.local',quiet:true});
async function main() {
  const {createExchange} = await import('../lib/exchange');
  const {discoverCurrentBtc5mMarket} = await import('../lib/market-discovery');
  const exchange=createExchange();
  try {
    const market=await discoverCurrentBtc5mMarket(exchange);
    const book=market ? await exchange.fetchOrderBook(market.upSymbol,10) : null;
    console.log(JSON.stringify({market,book},(_,v)=>typeof v==='bigint'?v.toString():v,2));
  } finally { await exchange.close(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
