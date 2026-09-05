import {z} from 'zod';
import type {MarketId,TradeRecord} from './types';
const hex=z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const trade=z.object({clientTradeId:z.string(),marketId:hex,symbol:z.string(),outcome:z.enum(['UP','DOWN']),requestedQuantity:z.number().finite(),limitPrice:z.number().finite(),expectedAveragePrice:z.number().finite().optional(),txHash:hex.optional(),filledQuantity:z.number().finite().optional(),actualAveragePrice:z.number().finite().optional(),status:z.enum(['PREVIEWED','AWAITING_SIGNATURE','SUBMITTED','CONFIRMED','PARTIAL','REJECTED','REVERTED']),createdAtMs:z.number(),updatedAtMs:z.number()});
const schema=z.object({version:z.literal(1),trackedMarketIds:z.array(hex).max(500),trades:z.array(trade).max(200),redemptionTxHashes:z.array(hex).max(200)});
export type SavedState={version:1;trackedMarketIds:MarketId[];trades:TradeRecord[];redemptionTxHashes:MarketId[]};
export const emptyState=():SavedState=>({version:1,trackedMarketIds:[],trades:[],redemptionTxHashes:[]});
export function readState(wallet:string):SavedState { try {const raw=localStorage.getItem(`windowguard:50312:${wallet.toLowerCase()}`);return raw? schema.parse(JSON.parse(raw)) as SavedState:emptyState();}catch {return emptyState();} }
export function saveState(wallet:string,state:SavedState) {localStorage.setItem(`windowguard:50312:${wallet.toLowerCase()}`,JSON.stringify(schema.parse(state)));}
