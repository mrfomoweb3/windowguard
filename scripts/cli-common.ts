import {config} from 'dotenv';
import {createPublicClient,http} from 'viem';
import {somniaTestnet} from 'viem/chains';
import {readFileSync,writeFileSync} from 'node:fs';
import {z} from 'zod';
config({path:'.env.local',quiet:true});
export const pub=createPublicClient({chain:somniaTestnet,transport:http(process.env.NEXT_PUBLIC_SOMNIA_RPC_URL??'https://dream-rpc.somnia.network')});
export async function assertTestnet(){if(await pub.getChainId()!==50312)throw new Error('Expected Shannon testnet chain 50312.');}
export function requireExecute(){if(!process.argv.includes('--execute'))throw new Error('Write command requires --execute. Use only disposable testnet wallets.');}
const order=z.object({wallet:z.string().regex(/^0x[0-9a-fA-F]{40}$/),marketId:z.string().regex(/^0x[0-9a-fA-F]{64}$/),pool:z.string().regex(/^0x[0-9a-fA-F]{40}$/),orderId:z.string().regex(/^\d+$/)});
export const records=z.array(order);
export function readOrders(){try{return records.parse(JSON.parse(readFileSync('.demo-orders.json','utf8')));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e;}}
export function saveOrders(rows:z.infer<typeof records>){writeFileSync('.demo-orders.json',JSON.stringify(records.parse(rows),null,2),{mode:0o600});}
export function finish(error?:unknown){if(error){console.error(error instanceof Error?error.message:'Command failed');process.exitCode=1;}setTimeout(()=>process.exit(process.exitCode??0),100).unref();}
