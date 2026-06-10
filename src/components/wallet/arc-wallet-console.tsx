"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Fuel,
  LinkIcon,
  LogOut,
  PlugZap,
  ReceiptText,
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
import { tipRouterConfig } from "@/config/tip-router";
import { cn, shortenAddress } from "@/lib/utils";
import { erc20BalanceAbi } from "@/wallet/erc20";

type ReadinessItem = {
  done: boolean;
  label: string;
  supporting: string;
};

type CopiedTarget = "address" | "network" | null;

const zeroAddress = "0x0000000000000000000000000000000000000000" as const;
const zeroBalance = BigInt(0);

const networkFacts = [
  {
    label: "Chain ID",
    value: arcTestnet.id.toString(),
  },
  {
    label: "RPC",
    value: arcTestnet.rpcUrls.default.http[0],
  },
  {
    label: "Explorer",
    value: arcLinks.explorer.replace("https://", ""),
  },
  {
    label: "ERC-20 USDC",
    value: arcContracts.usdc,
  },
];

export function ArcWalletConsole() {
  const { address, chainId, isConnected } = useAccount();
  const {
    connect,
    connectors,
    error: connectError,
    isPending,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    error: switchError,
    isPending: isSwitching,
    switchChain,
  } = useSwitchChain();
  const [copiedTarget, setCopiedTarget] = useState<CopiedTarget>(null);
  const [faucetOpened, setFaucetOpened] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const isOnArc = chainId === arcTestnet.id;
  const connectionState = getConnectionState(isConnected, isOnArc);
  const explorerAddressUrl = address
    ? `${arcLinks.explorer}/address/${address}`
    : arcLinks.explorer;

  const {
    data: nativeBalance,
    error: nativeBalanceError,
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
    error: erc20BalanceError,
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
          : "MetaMask, Coinbase Wallet, or injected wallet.",
      },
      {
        done: isConnected && isOnArc,
        label: "Arc Testnet active",
        supporting: isOnArc
          ? `Chain ${arcTestnet.id}`
          : "Use switch/add network before claiming faucet funds.",
      },
      {
        done: nativeBalanceValue > zeroBalance,
        label: "Gas balance funded",
        supporting:
          nativeBalanceValue > zeroBalance
            ? `${formattedNativeBalance} native USDC`
            : "Native USDC pays Arc Testnet gas.",
      },
      {
        done: erc20BalanceValue > zeroBalance,
        label: "Tip balance funded",
        supporting:
          erc20BalanceValue > zeroBalance
            ? `${formattedErc20Balance} ERC-20 USDC`
            : "ERC-20 USDC is the future tip transfer surface.",
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
  const hasAnyBalance =
    nativeBalanceValue > zeroBalance || erc20BalanceValue > zeroBalance;
  const walletError =
    refreshError ??
    switchError?.message ??
    connectError?.message ??
    nativeBalanceError?.message ??
    erc20BalanceError?.message ??
    null;

  async function copyAddress() {
    if (!address) {
      return;
    }

    await copyToClipboard(address, "address");
  }

  async function copyNetworkConfig() {
    await copyToClipboard(
      [
        `Network: ${arcTestnet.name}`,
        `Chain ID: ${arcTestnet.id}`,
        `RPC: ${arcTestnet.rpcUrls.default.http[0]}`,
        `Explorer: ${arcLinks.explorer}`,
        `ERC-20 USDC: ${arcContracts.usdc}`,
      ].join("\n"),
      "network",
    );
  }

  async function copyToClipboard(value: string, target: CopiedTarget) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }

    setCopiedTarget(target);
    window.setTimeout(() => setCopiedTarget(null), 1500);
  }

  async function openFaucet() {
    if (address) {
      await copyAddress();
    }

    setFaucetOpened(true);
    window.open(arcLinks.faucet, "_blank", "noopener,noreferrer");
  }

  async function refreshBalances() {
    setRefreshError(null);
    setIsRefreshing(true);

    try {
      await Promise.all([refetchNativeBalance(), refetchErc20Balance()]);
      setLastRefreshedAt(new Date());
    } catch (error) {
      setRefreshError(getReadableWalletError(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <section className="border-b border-ink/10 bg-paper" id="wallet">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_392px] lg:px-8">
        <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase text-blueprint">
                Wallet onboarding
              </p>
              <h2 className="mt-2 text-3xl font-black text-ink">
                Connect, fund, and verify Arc Testnet
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
                ArcRadar checks the active network, the wallet address, native
                USDC for gas, and ERC-20 USDC for future project tips.
              </p>
            </div>
            <StatusBadge
              icon={connectionState.icon}
              label={connectionState.label}
              tone={connectionState.tone}
              value={`${readyCount}/${readiness.length} ready`}
            />
          </div>

          {!isConnected ? (
            <ConnectorGrid
              connectors={connectors}
              isPending={isPending}
              onConnect={(connector) => connect({ connector })}
            />
          ) : (
            <div className="grid gap-4">
              <WalletIdentity
                address={address}
                copied={copiedTarget === "address"}
                explorerAddressUrl={explorerAddressUrl}
                isOnArc={isOnArc}
                onCopy={copyAddress}
                onDisconnect={() => disconnect()}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <BalancePanel
                  icon={Fuel}
                  isLoading={isNativeBalanceLoading}
                  label="Native gas USDC"
                  supporting="Transaction gas on Arc Testnet"
                  value={`${formattedNativeBalance} USDC`}
                />
                <BalancePanel
                  icon={BadgeDollarSign}
                  isLoading={isErc20BalanceLoading}
                  label="ERC-20 USDC"
                  supporting="Balance checked through balanceOf"
                  value={`${formattedErc20Balance} USDC`}
                />
              </div>
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
              {isSwitching
                ? "Switching"
                : isOnArc
                  ? "Arc active"
                  : "Switch / add Arc"}
            </button>
            <button
              className="btn-secondary min-h-11"
              type="button"
              onClick={openFaucet}
            >
              Get Arc Testnet USDC
              <ArrowUpRight aria-hidden className="size-4" />
            </button>
            <button
              className="btn-ghost min-h-11"
              disabled={!isConnected || isRefreshing}
              type="button"
              onClick={refreshBalances}
            >
              <RefreshCw
                aria-hidden
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
              {isRefreshing ? "Refreshing" : "Refresh balance"}
            </button>
            <button
              className="btn-ghost min-h-11"
              type="button"
              onClick={copyNetworkConfig}
            >
              <Copy aria-hidden className="size-4" />
              {copiedTarget === "network" ? "Copied" : "Copy network"}
            </button>
          </div>

          <WalletErrorPanel message={walletError} />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <FaucetReturnPanel
              faucetOpened={faucetOpened}
              hasAnyBalance={hasAnyBalance}
              lastRefreshedAt={lastRefreshedAt}
            />
            <a
              className="flex min-h-20 items-center justify-between rounded-lg border border-ink/10 bg-paper px-4 text-sm font-black text-ink transition hover:border-blueprint hover:text-blueprint"
              href={arcLinks.docs}
              rel="noreferrer"
              target="_blank"
            >
              <span>
                <span className="block text-xs uppercase text-ink/40">
                  Official setup
                </span>
                <span className="mt-1 block">Arc network docs</span>
              </span>
              <ExternalLink aria-hidden className="size-4" />
            </a>
          </div>
        </div>

        <aside className="grid content-start gap-3">
          <TransactionReadinessPanel
            erc20BalanceValue={erc20BalanceValue}
            isConnected={isConnected}
            isOnArc={isOnArc}
            nativeBalanceValue={nativeBalanceValue}
          />
          {readiness.map((item) => (
            <ReadinessCard item={item} key={item.label} />
          ))}
          <NetworkReference
            copied={copiedTarget === "network"}
            onCopy={copyNetworkConfig}
          />
        </aside>
      </div>
    </section>
  );
}

function WalletErrorPanel({ message }: { message: null | string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-5 flex items-start gap-3 rounded-lg border border-coral/30 bg-coral/10 p-4">
      <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-coral" />
      <div>
        <p className="font-black text-ink">Wallet action needs attention</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-ink/60">
          {message}
        </p>
      </div>
    </div>
  );
}

function TransactionReadinessPanel({
  erc20BalanceValue,
  isConnected,
  isOnArc,
  nativeBalanceValue,
}: {
  erc20BalanceValue: bigint;
  isConnected: boolean;
  isOnArc: boolean;
  nativeBalanceValue: bigint;
}) {
  const blockers = [
    !tipRouterConfig.address ? "TipRouter address missing" : null,
    !isConnected ? "Wallet not connected" : null,
    isConnected && !isOnArc ? "Wrong network" : null,
    isConnected && nativeBalanceValue === zeroBalance ? "Gas empty" : null,
    isConnected && erc20BalanceValue === zeroBalance ? "ERC-20 USDC empty" : null,
  ].filter((blocker): blocker is string => Boolean(blocker));
  const isReady = blockers.length === 0;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-sm",
        isReady
          ? "border-forest/20 bg-mint/20"
          : "border-amber/30 bg-amber/15",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ReceiptText
            aria-hidden
            className={cn("size-4", isReady ? "text-forest" : "text-ink")}
          />
          <span className="text-xs font-black uppercase text-ink/45">
            Transaction guard
          </span>
        </div>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-xs font-black uppercase",
            isReady ? "bg-white/70 text-forest" : "bg-white/70 text-ink",
          )}
        >
          {isReady ? "Ready" : "Blocked"}
        </span>
      </div>
      <p className="font-black text-ink">
        {tipRouterConfig.address
          ? shortenAddress(tipRouterConfig.address)
          : "TipRouter not configured"}
      </p>
      {blockers.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {blockers.map((blocker) => (
            <span
              className="rounded-md bg-white/70 px-2 py-1 text-xs font-black uppercase text-ink/55"
              key={blocker}
            >
              {blocker}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm font-semibold leading-6 text-forest">
          Wallet, network, gas, ERC-20 USDC, and TipRouter config are aligned.
        </p>
      )}
    </div>
  );
}

function ConnectorGrid({
  connectors,
  isPending,
  onConnect,
}: {
  connectors: ReturnType<typeof useConnect>["connectors"];
  isPending: boolean;
  onConnect: (connector: ReturnType<typeof useConnect>["connectors"][number]) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {connectors.map((connector) => (
        <button
          className="group flex min-h-24 items-center justify-between rounded-lg border border-ink/10 bg-paper px-4 text-left font-black text-ink transition hover:border-blueprint hover:text-blueprint"
          disabled={isPending}
          key={connector.uid}
          type="button"
          onClick={() => onConnect(connector)}
        >
          <span className="min-w-0">
            <span className="block truncate">{connector.name}</span>
            <span className="mt-1 block text-xs font-bold uppercase text-ink/40 group-hover:text-blueprint/60">
              Connect wallet
            </span>
          </span>
          <PlugZap aria-hidden className="size-4 shrink-0" />
        </button>
      ))}
    </div>
  );
}

function WalletIdentity({
  address,
  copied,
  explorerAddressUrl,
  isOnArc,
  onCopy,
  onDisconnect,
}: {
  address?: `0x${string}`;
  copied: boolean;
  explorerAddressUrl: string;
  isOnArc: boolean;
  onCopy: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-ink/10 bg-paper p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex min-h-7 items-center rounded-md px-2 text-xs font-black uppercase",
              isOnArc
                ? "bg-mint/20 text-forest"
                : "bg-amber/20 text-ink",
            )}
          >
            {isOnArc ? "Arc Testnet" : "Wrong network"}
          </span>
          <span className="inline-flex min-h-7 items-center rounded-md bg-white px-2 text-xs font-black uppercase text-ink/45">
            Connected
          </span>
        </div>
        <p className="font-mono text-sm font-black text-ink sm:text-base">
          {address ?? "Connected wallet"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 text-xs font-black uppercase text-ink transition hover:border-ink/30"
          type="button"
          onClick={onCopy}
        >
          <Copy aria-hidden className="size-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 text-xs font-black uppercase text-ink transition hover:border-ink/30"
          href={explorerAddressUrl}
          rel="noreferrer"
          target="_blank"
        >
          Explorer
          <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 text-xs font-black uppercase text-ink/55 transition hover:border-coral hover:text-coral"
          type="button"
          onClick={onDisconnect}
        >
          <LogOut aria-hidden className="size-3.5" />
          Disconnect
        </button>
      </div>
    </div>
  );
}

function FaucetReturnPanel({
  faucetOpened,
  hasAnyBalance,
  lastRefreshedAt,
}: {
  faucetOpened: boolean;
  hasAnyBalance: boolean;
  lastRefreshedAt: Date | null;
}) {
  return (
    <div
      className={cn(
        "flex min-h-20 items-start gap-3 rounded-lg border p-4",
        faucetOpened
          ? "border-mint/40 bg-mint/15"
          : "border-ink/10 bg-paper",
      )}
    >
      <ClipboardCheck
        aria-hidden
        className={cn(
          "mt-0.5 size-5 shrink-0",
          hasAnyBalance ? "text-forest" : "text-blueprint",
        )}
      />
      <div>
        <p className="font-black text-ink">
          {hasAnyBalance
            ? "Balance detected"
            : faucetOpened
              ? "Faucet opened"
              : "Faucet return check"}
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/55">
          {lastRefreshedAt
            ? `Last refreshed ${lastRefreshedAt.toLocaleTimeString("en", {
                hour: "2-digit",
                minute: "2-digit",
              })}.`
            : "Claim testnet USDC, return to ArcRadar, then refresh balance."}
        </p>
      </div>
    </div>
  );
}

function NetworkReference({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-ink p-4 text-paper shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-mint">
          <LinkIcon aria-hidden className="size-4" />
          <span className="text-xs font-black uppercase">Arc setup</span>
        </div>
        <button
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-paper/10 px-2 text-xs font-black uppercase text-paper/70 transition hover:border-mint/50 hover:text-mint"
          type="button"
          onClick={onCopy}
        >
          <Copy aria-hidden className="size-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="grid gap-2">
        {networkFacts.map((fact) => (
          <div className="rounded-md bg-paper/[0.06] p-3" key={fact.label}>
            <p className="text-xs font-black uppercase text-paper/40">
              {fact.label}
            </p>
            <p className="mt-1 break-all font-mono text-xs font-black text-paper">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessCard({ item }: { item: ReadinessItem }) {
  return (
    <div className="flex min-h-20 items-start gap-3 rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      {item.done ? (
        <CheckCircle2
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-forest"
        />
      ) : (
        <XCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-ink/25" />
      )}
      <div>
        <p className="font-black text-ink">{item.label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/55">
          {item.supporting}
        </p>
      </div>
    </div>
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <Icon aria-hidden className="size-5 text-blueprint" />
        <span className="text-right text-xs font-black uppercase text-ink/40">
          {label}
        </span>
      </div>
      <p className="font-mono text-3xl font-black text-ink">
        {isLoading ? "..." : value}
      </p>
      <p className="mt-2 text-sm font-bold text-ink/55">{supporting}</p>
    </div>
  );
}

function StatusBadge({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: "good" | "neutral" | "warn";
  value: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-lg border px-3 text-sm font-black shadow-sm",
        tone === "good" && "border-forest/20 bg-mint/20 text-forest",
        tone === "neutral" && "border-ink/10 bg-paper text-ink/60",
        tone === "warn" && "border-amber/40 bg-amber/15 text-ink",
      )}
    >
      <Icon aria-hidden className="size-4" />
      <span>{label}</span>
      <span className="rounded-md bg-white/70 px-2 py-1 text-xs text-ink/55">
        {value}
      </span>
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

function getConnectionState(isConnected: boolean, isOnArc: boolean) {
  if (!isConnected) {
    return {
      icon: PlugZap,
      label: "Not connected",
      tone: "neutral" as const,
    };
  }

  if (!isOnArc) {
    return {
      icon: AlertTriangle,
      label: "Switch needed",
      tone: "warn" as const,
    };
  }

  return {
    icon: ShieldCheck,
    label: "Arc ready",
    tone: "good" as const,
  };
}

function formatDisplayBalance(value: bigint, decimals: number) {
  const formatted = Number(formatUnits(value, decimals));

  return formatted.toLocaleString("en", {
    maximumFractionDigits: formatted >= 1 ? 3 : 6,
  });
}

function getReadableWalletError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Wallet request failed. Check the wallet popup and try again.";
  }

  if (/user rejected|rejected request/i.test(error.message)) {
    return "Request was rejected in the wallet.";
  }

  if (/chain|network/i.test(error.message)) {
    return "Network request failed. Switch to Arc Testnet and try again.";
  }

  return error.message || "Wallet request failed. Try again.";
}
