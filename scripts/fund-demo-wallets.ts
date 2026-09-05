import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { somniaTestnet } from "viem/chains";
import { createCliExchange } from "./sdk-client";
import { assertTestnet, finish, pub, requireExecute } from "./cli-common";

function localAccount(role: "maker" | "taker") {
  const raw = role === "maker" ? process.env.DEMO_MAKER_PRIVATE_KEY : process.env.DEMO_TAKER_PRIVATE_KEY;
  const key = raw?.trim().replace(/^0x/i, "");
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) throw new Error(`Invalid ${role} key`);
  return privateKeyToAccount(`0x${key}`);
}

async function main() {
  requireExecute();
  await assertTestnet();
  const maker = localAccount("maker");
  const taker = localAccount("taker");
  const takerGas = await pub.getBalance({ address: taker.address });
  if (takerGas < parseEther("2")) {
    const wallet = createWalletClient({ account: maker, chain: somniaTestnet, transport: http(process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? "https://dream-rpc.somnia.network") });
    const hash = await wallet.sendTransaction({ to: taker.address, value: parseEther("5") });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`Gas funding reverted: ${hash}`);
    console.log(JSON.stringify({ action: "fund_taker_gas", from: maker.address, to: taker.address, amountStt: 5, hash }));
  }
  for (const role of ["maker", "taker"] as const) {
    const exchange = createCliExchange(role);
    try {
      const address = exchange.walletAddress;
      if (!address) throw new Error(`${role} address unavailable`);
      const balances = await exchange.fetchBalance();
      if ((balances.tUSDC?.free ?? 0) === 0) {
        await assertTestnet();
        const result = await exchange.trader.faucet();
        if (result.receipt.status !== "success") throw new Error(`${role} tUSDC faucet reverted: ${result.hash}`);
        console.log(JSON.stringify({ action: "faucet_tusdc", role, address, hash: result.hash }));
      }
    } finally {
      await exchange.close();
    }
  }
}

main().then(() => finish()).catch(finish);
