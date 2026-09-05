import {describe,it,expect} from 'vitest';
import {evaluateGuard} from '../lib/guard-engine';
import {estimateBuyFill} from '../lib/fill-simulation';
import {market,A} from './fixtures/markets';
const now=1000000;
const intent={marketId:A,outcome:'UP' as const,quantity:2,maximumAveragePrice:.6,minimumSecondsRemaining:30,createdAtMs:now};
const book={marketId:A,outcome:'UP' as const,capturedAtMs:now,bids:[],asks:[{price:.5,quantity:2}]};
const input={intent,currentMarket:market(),book,nowMs:now,estimate:estimateBuyFill(2,book.asks,.6)};
describe('guard data integrity',()=>{
  it('rejects a mismatched outcome book',()=>expect(evaluateGuard({...input,book:{...book,outcome:'DOWN'}}).allowed).toBe(false));
  it.each([NaN,Infinity,now+1])('rejects invalid book timestamp %s',capturedAtMs=>expect(evaluateGuard({...input,book:{...book,capturedAtMs}}).allowed).toBe(false));
  it('rejects an expensive consumed level even with acceptable average',()=>expect(evaluateGuard({...input,estimate:{...input.estimate,worstPrice:.7}}).code).toBe('PRICE_MOVED'));
  it.each([0,-1,NaN,300])('rejects unsafe minimum time %s',minimumSecondsRemaining=>expect(evaluateGuard({...input,intent:{...intent,minimumSecondsRemaining}}).code).toBe('INVALID_INTENT'));
});
