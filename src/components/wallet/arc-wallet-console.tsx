"use client";

import {
  ArrowUpRight,
  BadgeDollarSign,
  CheckCircle2,
  Copy,
  ExternalLink,
  Fuel,
  LinkIcon,
  LogOut,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
} from "wagmi";

import { arcContracts, arcCurrency, arcLinks, arcTestnet } from "@/config/arc";
import { cn, shortenAddress } from "@/lib/utils";
import { erc20BalanceAbi } from "@/wallet/erc20";

type ReadinessItem = {
  done: boolean;
  label: string;
  supporting: string;
};

const zeroAddress = "0x0000000000000000000000000000000000000000" as const;
const zeroBalance = BigInt(0);

export function ArcWalletConsole() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  const isOnArc = chainId === arcTestnet.id;
  const explorerAddressUrl = address
    ? `${arcLinks.explorer}/address/${address}`
    : arcLinks.explorer;

  const {
    data: nativeBalance,
    isLoading: isNativeBalanceLoading,
    refetch: refetchNativeBalance,
  } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const {
    data: erc20Balance,
    isLoading: isErc20BalanceLoading,
    refetch: refetchErc20Balance,
  } = useReadContract({
    abi: erc20BalanceAbi,
    address: arcContracts.usdc,
    args: [address ?? zeroAddress],
    chainId: arcTestnet.id,
    functionName: "balanceOf",
    query: {
      enabled: Boolean(address),
    },
  });

  const nativeBalanceValue = nativeBalance?.value ?? zeroBalance;
  const erc20BalanceValue = erc20Balance ?? zeroBalance;
  const formattedNativeBalance = formatDisplayBalance(
    nativeBalanceValue,
    arcCurrency.nativeUsdcDecimals,
  );
  const formattedErc20Balance = formatDisplayBalance(
    erc20BalanceValue,
    arcCurrency.erc20UsdcDecimals,
  );
  const readiness = useMemo<ReadinessItem[]>(
    () => [
      {
        done: isConnected,
        label: "Wallet connected",
        supporting: address
          ? shortenAddress(address)
          : "Connect MetaMask, Coinbase Wallet, or injected wallet.",
      },
      {
        done: isConnected && isOnArc,
        label: "Arc Testnet selected",
        supporting: isOnArc
          ? `Chain ${arcTestnet.id}`
          : "Switch wallet network to Arc Testnet.",
      },
      {
        done: nativeBalanceValue > zeroBalance,
        label: "Gas balance ready",
        supporting:
          nativeBalanceValue > zeroBalance
            ? `${formattedNativeBalance} native USDC`
            : "Use the faucet to fund testnet gas.",
      },
      {
        done: erc20BalanceValue > zeroBalance,
        label: "Tip balance ready",
        supporting:
          erc20BalanceValue > zeroBalance
            ? `${formattedErc20Balance} ERC-20 USDC`
            : "ERC-20 USDC balance is required for tip transfers.",
      },
    ],
    [
      address,
      erc20BalanceValue,
      formattedErc20Balance,
      formattedNativeBalance,
      isConnected,
      isOnArc,
      nativeBalanceValue,
    ],
  );
  const readyCount = readiness.filter((item) => item.done).length;

  async function copyAddress() {
    if (!address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
    } catch {
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function refreshBalances() {
    void refetchNativeBalance();
    void refetchErc20Balance();
  }

  return (
    <section className="border-b border-ink/10 bg-paper" id="wallet">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-blueprint">
                Wallet console
              </p>
              <h2 className="mt-2 text-3xl font-black text-ink">
                Get ready for Arc Testnet tips
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
                Connect a wallet, switch to Arc, fund testnet USDC, and verify
                both gas and ERC-20 balances before the onchain tipping phase.
              </p>
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 bg-paper px-3 text-sm font-black text-ink/60">
              <ShieldCheck aria-hidden className="size-4 text-forest" />
              {readyCount}/{readiness.length} ready
            </div>
          </div>

          {!isConnected ? (
            <div className="grid gap-3 md:grid-cols-3">
              {connectors.map((connector) => (
                <button
                  className="flex min-h-20 items-center justify-between rounded-lg border border-ink/10 bg-paper px-4 text-left font-black text-ink transition hover:border-blueprint hover:text-blueprint"
                  disabled={isPending}
                  key={connector.uid}
                  type="button"
                  onClick={() => connect({ connector })}
                >
                  <span className="min-w-0 truncate">{connector.name}</span>
                  <PlugZap aria-hidden className="size-4" />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <BalancePanel
                icon={Fuel}
                isLoading={isNativeBalanceLoading}
                label="Native gas USDC"
                supporting="Pays Arc Testnet transaction gas"
                value={`${formattedNativeBalance} USDC`}
              />
              <BalancePanel
                icon={BadgeDollarSign}
                isLoading={isErc20BalanceLoading}
                label="ERC-20 USDC"
                supporting="Used for project tip transfers"
                value={`${formattedErc20Balance} USDC`}
              />
            </div>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <button
              className={cn("btn-primary min-h-11", isOnArc && "opacity-70")}
              disabled={!isConnected || isOnArc || isSwitching}
              type="button"
              onClick={() => switchChain({ chainId: arcTestnet.id })}
            >
              <Wallet aria-hidden className="size-4" />
              {isSwitching ? "Switching" : isOnArc ? "On Arc" : "Switch to Arc"}
            </button>
            <a
              className="btn-secondary min-h-11"
              href={arcLinks.faucet}
              rel="noreferrer"
              target="_blank"
            >
              Faucet
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
            <button
              className="btn-ghost min-h-11"
              disabled={!isConnected}
              type="button"
              onClick={refreshBalances}
            >
              <RefreshCw aria-hidden className="size-4" />
              Refresh
            </button>
            {isConnected ? (
              <button
                className="btn-ghost min-h-11"
                type="button"
                onClick={copyAddress}
              >
                <Copy aria-hidden className="size-4" />
                {copied ? "Copied" : "Copy address"}
              </button>
            ) : (
              <a
                className="btn-ghost min-h-11"
                href={arcLinks.docs}
                rel="noreferrer"
                target="_blank"
              >
                Docs
                <ExternalLink aria-hidden className="size-4" />
              </a>
            )}
          </div>

          {isConnected ? (
            <div className="mt-5 flex flex-wrap gap-3 border-t border-ink/10 pt-5">
              <a
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-paper px-3 text-xs font-black uppercase text-ink transition hover:border-ink/30"
                href={explorerAddressUrl}
                rel="noreferrer"
                target="_blank"
              >
                Explorer address
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
              <button
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-paper px-3 text-xs font-black uppercase text-ink/55 transition hover:border-coral hover:text-coral"
                type="button"
                onClick={() => disconnect()}
              >
                <LogOut aria-hidden className="size-3.5" />
                Disconnect
              </button>
            </div>
          ) : null}
        </div>

        <aside className="grid content-start gap-3">
          {readiness.map((item) => (
            <div
              className="flex min-h-20 items-start gap-3 rounded-lg border border-ink/10 bg-white p-4 shadow-sm"
              key={item.label}
            >
              {item.done ? (
                <CheckCircle2
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-forest"
                />
              ) : (
                <XCircle
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-ink/25"
                />
              )}
              <div>
                <p className="font-black text-ink">{item.label}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-ink/55">
                  {item.supporting}
                </p>
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-ink/10 bg-ink p-4 text-paper shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-mint">
              <LinkIcon aria-hidden className="size-4" />
              <span className="text-xs font-black uppercase">Phase 4 note</span>
            </div>
            <p className="text-sm font-semibold leading-6 text-paper/65">
              Faucet funding can take a moment to show up. After claiming testnet
              USDC, return here and refresh balances before tipping projects.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function BalancePanel({
  icon: Icon,
  isLoading,
  label,
  supporting,
  value,
}: BalancePanelProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-4">
      <div className="mb-4 flex items-center justify-between">
        <Icon aria-hidden className="size-5 text-blueprint" />
        <span className="text-xs font-black uppercase text-ink/40">{label}</span>
      </div>
      <p className="font-mono text-3xl font-black text-ink">
        {isLoading ? "..." : value}
      </p>
      <p className="mt-2 text-sm font-bold text-ink/55">{supporting}</p>
    </div>
  );
}

type BalancePanelProps = {
  icon: LucideIcon;
  isLoading: boolean;
  label: string;
  supporting: string;
  value: string;
};

function formatDisplayBalance(value: bigint, decimals: number) {
  const formatted = Number(formatUnits(value, decimals));

  return formatted.toLocaleString("en", {
    maximumFractionDigits: formatted >= 1 ? 3 : 6,
  });
}
