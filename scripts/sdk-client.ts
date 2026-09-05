import {config} from 'dotenv';
config({path:'.env.local',quiet:true});
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaTestnet } from "viem/chains";
import type { Hex } from "viem";

export function createCliExchange(role: "maker"|"taker") {
  const raw = role === "maker" ? process.env.DEMO_MAKER_PRIVATE_KEY : process.env.DEMO_TAKER_PRIVATE_KEY;
  const privateKey = raw?.trim().replace(/^0x/i, "");
  if (!privateKey || !/^[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error(`Configure a valid disposable ${role} EVM key in .env.local. Never use a personal wallet.`);
  return new SomniaMarkets({ chain:somniaTestnet, addresses:SOMNIA_TESTNET_ADDRESSES, privateKey:`0x${privateKey}` as Hex, wsRpcUrl:process.env.NEXT_PUBLIC_SOMNIA_WS_RPC_URL ?? "wss://api.infra.testnet.somnia.network/ws", indexerUrl:process.env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL ?? "https://dev.smk.somnia.host/v1/graphql" });
}
