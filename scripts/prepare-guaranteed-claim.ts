import { writeFileSync } from "node:fs";
import { parseUnits } from "viem";
import { discoverCurrentBtc5mMarket } from "../lib/market-discovery";
import { assertTestnet, finish, requireExecute } from "./cli-common";
import { createCliExchange } from "./sdk-client";

async function main() {
  requireExecute();
  await assertTestnet();
  const exchange = createCliExchange("maker");
  try {
    const market = await discoverCurrentBtc5mMarket(exchange);
    if (!market || market.expirySec - Date.now() / 1000 < 90) throw new Error("Wait for a BTC five-minute window with more than 90 seconds remaining.");
    const chain = await exchange.client.getMarketOnchain(market.marketId);
    if (chain.status !== 1) throw new Error("Market is not Trading.");
    const amount = parseUnits("0.01", chain.decimals);
    const result = await exchange.trader.mintSet({ pool: chain.pool, amount });
    if (result.receipt.status !== "success") throw new Error(`Complete-set mint reverted: ${result.hash}`);
    const record = { marketId: market.marketId, symbol: market.symbol, pool: chain.pool, amount: "0.01", expirySec: Number(chain.expiry), txHash: result.hash };
    writeFileSync("claim-market.json", JSON.stringify(record, null, 2), { mode: 0o600 });
    console.log(JSON.stringify(record, null, 2));
  } finally {
    await exchange.close();
  }
}

main().then(() => finish()).catch(finish);
