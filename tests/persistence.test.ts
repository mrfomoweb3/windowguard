import {describe,expect,it} from 'vitest';
import type {UnifiedOrder,UnifiedTrade} from '@somnia-chain/markets-sdk';
import {emptyState,mergeIndexedOrders,mergeIndexedTrades} from '../lib/persistence';

const market=`0x${'1'.repeat(64)}` as const;
const hash=`0x${'2'.repeat(64)}` as const;
function indexed(overrides:Partial<UnifiedOrder>={}):UnifiedOrder{return {id:'7',symbol:'BTC/tUSDC#YES',type:'limit',side:'buy',price:.44,amount:5,filled:2,remaining:3,status:'canceled',txHash:hash,timestamp:1234,datetime:new Date(1234).toISOString(),info:{market},...overrides};}
function fill(overrides:Partial<UnifiedTrade>={}):UnifiedTrade{return {id:'9',symbol:'BTC/tUSDC#YES',price:.43,amount:1,cost:.43,side:'buy',txHash:hash,timestamp:1234,datetime:new Date(1234).toISOString(),info:{market},...overrides};}

describe('indexed order activity',()=>{
  it('recovers a confirmed partial order from the indexer',()=>{
    const state=mergeIndexedOrders(emptyState(),[indexed()]);
    expect(state.trades).toMatchObject([{clientTradeId:hash,marketId:market,outcome:'UP',filledQuantity:2,status:'PARTIAL'}]);
    expect(state.trackedMarketIds).toEqual([market]);
  });

  it('keeps the richer local record instead of duplicating its transaction',()=>{
    const local=mergeIndexedOrders(emptyState(),[indexed()]);
    local.trades[0].actualAveragePrice=.43;
    const state=mergeIndexedOrders(local,[indexed({filled:5,remaining:0,status:'closed'})]);
    expect(state.trades).toHaveLength(1);
    expect(state.trades[0].actualAveragePrice).toBe(.43);
  });

  it('ignores sells and malformed indexer rows',()=>{
    const bad=indexed({side:'sell',txHash:undefined});
    expect(mergeIndexedOrders(emptyState(),[bad]).trades).toEqual([]);
  });

  it('recovers and aggregates fully filled IOC activity from the fill tape',()=>{
    const state=mergeIndexedTrades(emptyState(),[fill(),fill({id:'10',amount:2,cost:.9,price:.45})]);
    expect(state.trades).toHaveLength(1);
    expect(state.trades[0]).toMatchObject({txHash:hash,requestedQuantity:3,filledQuantity:3,status:'CONFIRMED'});
    expect(state.trades[0].actualAveragePrice).toBeCloseTo(.443333);
  });
});
