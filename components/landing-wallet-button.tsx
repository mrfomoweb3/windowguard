"use client";

import { useEffect, useState } from "react";
import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { somniaTestnet } from "viem/chains";
import { useAccount, useChainId } from "wagmi";

export function LandingWalletButton({ className }: { className: string }) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const [continueToDashboard, setContinueToDashboard] = useState(false);
  const wrongNetwork = isConnected && chainId !== somniaTestnet.id;

  useEffect(() => {
    if (continueToDashboard && isConnected && !wrongNetwork) {
      router.push("/dashboard");
    }
  }, [continueToDashboard, isConnected, router, wrongNetwork]);

  function act() {
    if (!isConnected) {
      setContinueToDashboard(true);
      openConnectModal?.();
      return;
    }

    if (wrongNetwork) {
      setContinueToDashboard(true);
      openChainModal?.();
      return;
    }

    router.push("/dashboard");
  }

  const modalReady = isConnected
    ? wrongNetwork
      ? Boolean(openChainModal)
      : true
    : Boolean(openConnectModal);

  return (
    <button className={className} type="button" disabled={!modalReady} onClick={act}>
      {wrongNetwork ? "Switch network" : isConnected ? "Open dashboard" : "Connect wallet"}
    </button>
  );
}
