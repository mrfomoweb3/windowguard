import {config} from 'dotenv';
config({path:'.env.local',quiet:true});
import { createPublicClient, http } from "viem";
import { somniaTestnet } from "viem/chains";

const rpc = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? "https://dream-rpc.somnia.network";
const client = createPublicClient({ chain: somniaTestnet, transport: http(rpc) });
async function main() {
  const id = await client.getChainId();
  if (id !== 50312) throw new Error(`Wrong network: expected 50312, received ${id}`);
  console.log(JSON.stringify({ ok: true, chainId: id, rpc, sdk: "0.28.1", makerKeyConfigured: Boolean(process.env.DEMO_MAKER_PRIVATE_KEY), takerKeyConfigured: Boolean(process.env.DEMO_TAKER_PRIVATE_KEY) }, null, 2));
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Doctor check failed");
  process.exitCode = 1;
});
