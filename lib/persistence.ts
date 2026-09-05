import {z} from 'zod';
import type {UnifiedOrder,UnifiedTrade} from '@somnia-chain/markets-sdk';
import type {MarketId,TradeRecord} from './types';
const hex=z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const trade=z.object({clientTradeId:z.string(),marketId:hex,symbol:z.string(),outcome:z.enum(['UP','DOWN']),requestedQuantity:z.number().finite(),limitPrice:z.number().finite(),expectedAveragePrice:z.number().finite().optional(),txHash:hex.optional(),filledQuantity:z.number().finite().optional(),actualAveragePrice:z.number().finite().optional(),status:z.enum(['PREVIEWED','AWAITING_SIGNATURE','SUBMITTED','CONFIRMED','PARTIAL','REJECTED','REVERTED']),createdAtMs:z.number(),updatedAtMs:z.number()});
const schema=z.object({version:z.literal(1),trackedMarketIds:z.array(hex).max(500),trades:z.array(trade).max(200),redemptionTxHashes:z.array(hex).max(200)});
export type SavedState={version:1;trackedMarketIds:MarketId[];trades:TradeRecord[];redemptionTxHashes:MarketId[]};
export const emptyState=():SavedState=>({version:1,trackedMarketIds:[],trades:[],redemptionTxHashes:[]});
export function readState(wallet:string):SavedState { try {const raw=localStorage.getItem(`windowguard:50312:${wallet.toLowerCase()}`);return raw? schema.parse(JSON.parse(raw)) as SavedState:emptyState();}catch {return emptyState();} }
export function saveState(wallet:string,state:SavedState) {localStorage.setItem(`windowguard:50312:${wallet.toLowerCase()}`,JSON.stringify(schema.parse(state)));}

const isHash=(value:unknown):value is `0x${string}`=>typeof value==='string'&&/^0x[0-9a-fA-F]{64}$/.test(value);

export function mergeIndexedOrders(state:SavedState,orders:UnifiedOrder[]):SavedState {
  const known=new Set(state.trades.flatMap(t=>t.txHash?[t.txHash.toLowerCase()]:[]));
  const recovered:TradeRecord[]=[];
  for(const order of orders){
    const info=order.info as {market?:unknown}|undefined;
    if(order.side!=='buy'||!isHash(info?.market)||!isHash(order.txHash)||known.has(order.txHash.toLowerCase()))continue;
    const createdAtMs=order.timestamp??Date.now();
    recovered.push({
      clientTradeId:order.txHash,
      marketId:info.market,
      symbol:order.symbol,
      outcome:order.symbol.endsWith('#NO')?'DOWN':'UP',
      requestedQuantity:order.amount,
      limitPrice:order.price??0,
      txHash:order.txHash,
      filledQuantity:order.filled,
      status:order.status==='open'?'SUBMITTED':order.status==='expired'?'REJECTED':order.filled>0&&order.filled<order.amount?'PARTIAL':'CONFIRMED',
      createdAtMs,
      updatedAtMs:createdAtMs,
    });
    known.add(order.txHash.toLowerCase());
  }
  const trades=[...state.trades,...recovered].sort((a,b)=>b.createdAtMs-a.createdAtMs).slice(0,200);
  const trackedMarketIds=Array.from(new Set([...state.trackedMarketIds,...recovered.map(t=>t.marketId)])).slice(-500);
  return {...state,trades,trackedMarketIds};
}

export function mergeIndexedTrades(state:SavedState,fills:UnifiedTrade[]):SavedState {
  const known=new Set(state.trades.flatMap(t=>t.txHash?[t.txHash.toLowerCase()]:[]));
  const grouped=new Map<string,{hash:`0x${string}`;marketId:`0x${string}`;symbol:string;amount:number;cost:number;timestamp:number}>();
  for(const fill of fills){
    const info=fill.info as {market?:unknown}|undefined;
    if(fill.side!=='buy'||!isHash(info?.market)||!isHash(fill.txHash)||known.has(fill.txHash.toLowerCase()))continue;
    const key=`${fill.txHash.toLowerCase()}:${fill.symbol}`;const previous=grouped.get(key);
    grouped.set(key,{hash:fill.txHash,marketId:info.market,symbol:fill.symbol,amount:(previous?.amount??0)+fill.amount,cost:(previous?.cost??0)+fill.cost,timestamp:Math.max(previous?.timestamp??0,fill.timestamp)});
  }
  const recovered:TradeRecord[]=Array.from(grouped.values()).map(fill=>({
    clientTradeId:fill.hash,
    marketId:fill.marketId,
    symbol:fill.symbol,
    outcome:fill.symbol.endsWith('#NO')?'DOWN':'UP',
    requestedQuantity:fill.amount,
    limitPrice:fill.amount?fill.cost/fill.amount:0,
    txHash:fill.hash,
    filledQuantity:fill.amount,
    actualAveragePrice:fill.amount?fill.cost/fill.amount:undefined,
    status:'CONFIRMED',
    createdAtMs:fill.timestamp,
    updatedAtMs:fill.timestamp,
  }));
  const trades=[...state.trades,...recovered].sort((a,b)=>b.createdAtMs-a.createdAtMs).slice(0,200);
  const trackedMarketIds=Array.from(new Set([...state.trackedMarketIds,...recovered.map(t=>t.marketId)])).slice(-500);
  return {...state,trades,trackedMarketIds};
}
