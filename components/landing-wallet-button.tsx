"use client";

import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";

export function LandingWalletButton({ className }: { className: string }) {
  const router = useRouter();
  const [continueToDashboard, setContinueToDashboard] = useState(false);
  const openDashboard = useCallback(() => router.push("/dashboard"), [router]);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openChainModal,
        openConnectModal,
      }) => {
        const connected = mounted && account && chain;

        return (
          <WalletAction
            className={className}
            connected={Boolean(connected)}
            ready={mounted}
            wrongNetwork={Boolean(connected && chain.unsupported)}
            continueToDashboard={continueToDashboard}
            onConnected={openDashboard}
            onRequestConnect={() => {
              setContinueToDashboard(true);
              openConnectModal();
            }}
            onRequestNetwork={() => {
              setContinueToDashboard(true);
              openChainModal();
            }}
          />
        );
      }}
    </ConnectButton.Custom>
  );
}

function WalletAction({
  className,
  connected,
  ready,
  wrongNetwork,
  continueToDashboard,
  onConnected,
  onRequestConnect,
  onRequestNetwork,
}: {
  className: string;
  connected: boolean;
  ready: boolean;
  wrongNetwork: boolean;
  continueToDashboard: boolean;
  onConnected: () => void;
  onRequestConnect: () => void;
  onRequestNetwork: () => void;
}) {
  useEffect(() => {
    if (continueToDashboard && connected && !wrongNetwork) onConnected();
  }, [connected, continueToDashboard, onConnected, wrongNetwork]);

  function act() {
    if (!connected) onRequestConnect();
    else if (wrongNetwork) onRequestNetwork();
    else onConnected();
  }

  return (
    <button className={className} type="button" disabled={!ready} onClick={act}>
      {wrongNetwork ? "Switch network" : "Connect wallet"}
    </button>
  );
}
