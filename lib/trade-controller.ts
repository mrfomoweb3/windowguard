import type {SomniaMarkets,PlaceOrderResult} from '@somnia-chain/markets-sdk';
import {formatUnits} from 'viem';
import {discoverCurrentBtc5mMarket,lifecycle} from './market-discovery';
import {fetchBook} from './live-book';
import {estimateBuyFill} from './fill-simulation';
import {evaluateGuard} from './guard-engine';
import type {OrderIntent,TradeRecord} from './types';

export async function submitProtectedOrder(exchange:SomniaMarkets,intent:OrderIntent,isCurrent:()=>boolean,onSigning:()=>void):Promise<TradeRecord> {
  const market=await discoverCurrentBtc5mMarket(exchange);
  if(!market || market.marketId!==intent.marketId)throw new Error('Window rolled. Review the current market before submitting.');
  const symbol=intent.outcome==='UP'?market.upSymbol:market.downSymbol;
  const quantity=exchange.amountToPrecision(symbol,intent.quantity);
  const price=exchange.priceToPrecision(symbol,intent.maximumAveragePrice);
  if(quantity!==intent.quantity || quantity<=0)throw new Error(`Quantity must match the lot grid. Enter ${quantity} and review again.`);
  if(price<=0 || price>intent.maximumAveragePrice)throw new Error('Maximum price cannot be represented safely on this market grid.');
  const book=await fetchBook(exchange,market,intent.outcome);
  const chain=await exchange.client.getMarketOnchain(market.marketId);
  const effective={...intent,maximumAveragePrice:price};
  const estimate=estimateBuyFill(quantity,book.asks,price);
  const decision=evaluateGuard({intent:effective,currentMarket:{...market,status:lifecycle(chain.status),expirySec:Number(chain.expiry)},book,estimate,nowMs:Date.now()});
  if(!decision.allowed)throw new Error(`${decision.code}: ${decision.reasons[0]}`);
  if(!isCurrent())throw new Error('Wallet, network, or market changed. Review again.');
  onSigning();
  const order=await exchange.createOrder(symbol,'limit','buy',quantity,price,{timeInForce:'IOC'});
  const result=order.info as PlaceOrderResult;
  if(!result?.receipt || !Array.isArray(result.fills))throw new Error('Order outcome is unverified. Check your wallet transaction history before retrying.');
  const record:TradeRecord={clientTradeId:result.hash,marketId:market.marketId,symbol,outcome:intent.outcome,requestedQuantity:quantity,limitPrice:price,expectedAveragePrice:estimate.averagePrice,txHash:result.hash,status:'REVERTED',createdAtMs:Date.now(),updatedAtMs:Date.now()};
  if(result.receipt.status!=='success')return record;
  let filled=0,cost=0;
  for(const fill of result.fills){const amount=Number(formatUnits(fill.quantityFilled,chain.decimals));const yes=Number(formatUnits(fill.fillPrice,chain.decimals));filled+=amount;cost+=amount*(intent.outcome==='UP'?yes:1-yes);}
  return {...record,filledQuantity:filled,actualAveragePrice:filled?cost/filled:undefined,status:filled>0&&filled<quantity?'PARTIAL':'CONFIRMED'};
}
