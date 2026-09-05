export const CHAIN_ID = 50312;
export const RPC_URL = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? "https://dream-rpc.somnia.network";
export const WS_RPC_URL = process.env.NEXT_PUBLIC_SOMNIA_WS_RPC_URL ?? "wss://api.infra.testnet.somnia.network/ws";
export const INDEXER_URL = process.env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL ?? "https://dev.smk.somnia.host/v1/graphql";
export const DEFAULT_POLICY = { maxBookAgeMs: 2_500, minimumSecondsRemaining: 30, maximumQuantity: 25, minimumQuantity: 0.01 } as const;
export const POLL_INTERVAL_MS = 1_000;
