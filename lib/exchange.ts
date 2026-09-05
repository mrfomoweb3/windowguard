import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from '@somnia-chain/markets-sdk';
import { somniaTestnet } from 'viem/chains';
import { INDEXER_URL, WS_RPC_URL } from './config';
export function createExchange() {
  return new SomniaMarkets({ chain: somniaTestnet, addresses: SOMNIA_TESTNET_ADDRESSES, indexerUrl: INDEXER_URL, wsRpcUrl: WS_RPC_URL });
}
