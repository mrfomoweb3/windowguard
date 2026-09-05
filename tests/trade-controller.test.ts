import {beforeEach,describe,expect,it,vi} from 'vitest';
import type {SomniaMarkets} from '@somnia-chain/markets-sdk';
import {submitProtectedOrder} from '../lib/trade-controller';
import {market,A,B} from './fixtures/markets';
const mocks=vi.hoisted(()=>({discover:vi.fn(),book:vi.fn()}));
vi.mock('../lib/market-discovery',()=>({discoverCurrentBtc5mMarket:mocks.discover,lifecycle:(s:number)=>s===1?'TRADING':'LOCKED'}));
vi.mock('../lib/live-book',()=>({fetchBook:mocks.book}));
const intent=()=>({marketId:A,outcome:'UP' as const,quantity:2,maximumAveragePrice:.6,minimumSecondsRemaining:30,createdAtMs:Date.now()});
function exchange(){return {amountToPrecision:vi.fn((_:string,x:number)=>x),priceToPrecision:vi.fn((_:string,x:number)=>x),client:{getMarketOnchain:vi.fn().mockResolvedValue({status:1,expiry:BigInt(Math.floor(Date.now()/1000)+120),decimals:6})},createOrder:vi.fn().mockResolvedValue({info:{hash:A,receipt:{status:'success'},fills:[]}})};}
beforeEach(()=>{mocks.discover.mockResolvedValue({...market(),expirySec:Math.floor(Date.now()/1000)+120});mocks.book.mockResolvedValue({marketId:A,outcome:'UP',capturedAtMs:Date.now(),bids:[],asks:[{price:.5,quantity:2}]});});
describe('fresh pre-submit protection',()=>{
  it('does not open wallet or submit after a roll',async()=>{const ex=exchange(),sign=vi.fn();mocks.discover.mockResolvedValue({...market(B)});await expect(submitProtectedOrder(ex as unknown as SomniaMarkets,intent(),()=>true,sign)).rejects.toThrow('rolled');expect(sign).not.toHaveBeenCalled();expect(ex.createOrder).not.toHaveBeenCalled();});
  it('blocks thin depth before wallet',async()=>{const ex=exchange(),sign=vi.fn();mocks.book.mockResolvedValue({marketId:A,outcome:'UP',capturedAtMs:Date.now(),bids:[],asks:[]});await expect(submitProtectedOrder(ex as unknown as SomniaMarkets,intent(),()=>true,sign)).rejects.toThrow('INSUFFICIENT_DEPTH');expect(sign).not.toHaveBeenCalled();});
  it('rejects wallet generation change',async()=>{const ex=exchange();await expect(submitProtectedOrder(ex as unknown as SomniaMarkets,intent(),()=>false,vi.fn())).rejects.toThrow('changed');expect(ex.createOrder).not.toHaveBeenCalled();});
  it('uses IOC and reports zero actual fill',async()=>{const ex=exchange();const r=await submitProtectedOrder(ex as unknown as SomniaMarkets,intent(),()=>true,vi.fn());expect(ex.createOrder).toHaveBeenCalledWith('BTC-UP','limit','buy',2,.6,{timeInForce:'IOC'});expect(r.filledQuantity).toBe(0);expect(r.actualAveragePrice).toBeUndefined();});
  it('reports reverted receipts without a fill',async()=>{const ex=exchange();ex.createOrder.mockResolvedValue({info:{hash:A,receipt:{status:'reverted'},fills:[]}});const r=await submitProtectedOrder(ex as unknown as SomniaMarkets,intent(),()=>true,vi.fn());expect(r.status).toBe('REVERTED');expect(r.filledQuantity).toBeUndefined();});
  it('reconciles actual partial fills and price from events',async()=>{const ex=exchange();ex.createOrder.mockResolvedValue({info:{hash:A,receipt:{status:'success'},fills:[{quantityFilled:1000000n,fillPrice:500000n}]}} as never);const r=await submitProtectedOrder(ex as unknown as SomniaMarkets,intent(),()=>true,vi.fn());expect(r.status).toBe('PARTIAL');expect(r.filledQuantity).toBe(1);expect(r.actualAveragePrice).toBe(.5);});
  it('does not silently round quantity',async()=>{const ex=exchange();ex.amountToPrecision.mockReturnValue(1);await expect(submitProtectedOrder(ex as unknown as SomniaMarkets,intent(),()=>true,vi.fn())).rejects.toThrow('lot grid');expect(ex.createOrder).not.toHaveBeenCalled();});
});
