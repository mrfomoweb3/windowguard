"use client";

import { useState, type ReactNode } from "react";
import {
  connectorsForWallets,
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { somniaTestnet } from "viem/chains";

const appName = "WindowGuard";
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
const fallbackProjectId = "00000000000000000000000000000000";
const chains = [somniaTestnet] as const;
const transports = {
  [somniaTestnet.id]: http(
    process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ||
      "https://dream-rpc.somnia.network",
  ),
};

const config = walletConnectProjectId
  ? getDefaultConfig({
      appName,
      projectId: walletConnectProjectId,
      chains,
      transports,
      ssr: true,
    })
  : createConfig({
      chains,
      connectors: connectorsForWallets(
        [{ groupName: "Browser wallets", wallets: [injectedWallet] }],
        { appName, projectId: fallbackProjectId },
      ),
      transports,
      ssr: true,
    });

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={somniaTestnet}
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#9ef0d0",
            accentColorForeground: "#071012",
            borderRadius: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
