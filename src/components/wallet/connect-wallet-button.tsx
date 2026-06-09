"use client";

import { ChevronDown, LogOut, PlugZap, Wallet } from "lucide-react";
import { formatUnits } from "viem";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { arcCurrency, arcTestnet } from "@/config/arc";
import { cn, shortenAddress } from "@/lib/utils";

type ConnectWalletButtonProps = {
  className?: string;
};

export function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const preferredConnector = connectors[0];
  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;
  const formattedBalance = balance
    ? Number(
        formatUnits(balance.value, arcCurrency.nativeUsdcDecimals),
      ).toLocaleString("en", {
        maximumFractionDigits: 3,
      })
    : null;

  if (!isConnected) {
    return (
      <button
        className={cn("btn-primary", className)}
        disabled={!preferredConnector || isPending}
        type="button"
        onClick={() =>
          preferredConnector && connect({ connector: preferredConnector })
        }
      >
        <PlugZap aria-hidden className="size-4" />
        {isPending ? "Connecting" : "Connect wallet"}
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        className={cn("btn-warning", className)}
        disabled={isSwitching}
        type="button"
        onClick={() => switchChain({ chainId: arcTestnet.id })}
      >
        <Wallet aria-hidden className="size-4" />
        {isSwitching ? "Switching" : "Switch / add Arc"}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg border border-ink/10 bg-white px-2 text-sm shadow-sm",
        className,
      )}
    >
      <div className="hidden items-center gap-2 pl-2 text-ink/70 sm:flex">
        <span className="font-mono text-xs text-ink">
          {address ? shortenAddress(address) : "Connected"}
        </span>
        {formattedBalance ? (
          <span className="rounded bg-mint/15 px-2 py-1 text-xs font-semibold text-forest">
            {formattedBalance} USDC
          </span>
        ) : null}
      </div>
      <button
        aria-label="Disconnect wallet"
        className="inline-flex size-8 items-center justify-center rounded-md text-ink/55 transition hover:bg-ink/5 hover:text-ink"
        type="button"
        onClick={() => disconnect()}
      >
        <LogOut aria-hidden className="size-4" />
      </button>
      <ChevronDown aria-hidden className="hidden size-4 text-ink/35 sm:block" />
    </div>
  );
}
