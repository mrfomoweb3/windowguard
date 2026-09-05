import { createCliExchange } from "./sdk-client";
import { finish, pub } from "./cli-common";
import { formatEther } from "viem";

async function main() {
  for (const role of ["maker", "taker"] as const) {
    const exchange = createCliExchange(role);
    try {
      const address = exchange.walletAddress;
      if (!address) throw new Error(`${role} wallet address unavailable`);
      const [native, balances] = await Promise.all([
        pub.getBalance({ address }),
        exchange.fetchBalance(),
      ]);
      console.log(JSON.stringify({
        role,
        address,
        stt: formatEther(native),
        currencies: Object.fromEntries(Object.entries(balances).filter(([key]) => key !== "info")),
      }, null, 2));
    } finally {
      await exchange.close();
    }
  }
}

main().then(() => finish()).catch(finish);
