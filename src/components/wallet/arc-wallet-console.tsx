"use client";

import {
  ArrowSquareOutIcon as ExternalLink,
  ArrowUpRightIcon as ArrowUpRight,
  ArrowsClockwiseIcon as RefreshCw,
  CheckCircleIcon as CheckCircle2,
  CopySimpleIcon as Copy,
  CurrencyCircleDollarIcon as BadgeDollarSign,
  GasPumpIcon as Fuel,
  LinkSimpleIcon as LinkIcon,
  ListChecksIcon as ClipboardCheck,
  PlugsConnectedIcon as PlugZap,
  ShieldCheckIcon as ShieldCheck,
  SignOutIcon as LogOut,
  WalletIcon as Wallet,
  WarningIcon as AlertTriangle,
  XCircleIcon as XCircle,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
} from "wagmi";

import { arcContracts, arcCurrency, arcLinks, arcTestnet } from "@/config/arc";
import { cn, shortenAddress } from "@/lib/utils";
import { arcUsdcAbi } from "@/wallet/erc20";
import { formatWalletBalance } from "@/wallet/format-balance";

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
    data: usdcBalance,
    error: usdcBalanceError,
    isLoading: isUsdcBalanceLoading,
    refetch: refetchUsdcBalance,
  } = useReadContract({
    abi: arcUsdcAbi,
    address: arcContracts.usdc,
    args: address ? [address] : [zeroAddress],
    chainId: arcTestnet.id,
    functionName: "balanceOf",
    query: {
      enabled: Boolean(address),
    },
  });

  const usdcBalanceValue = usdcBalance ?? zeroBalance;
  const formattedUsdcBalance = formatWalletBalance(
    usdcBalanceValue,
    arcCurrency.erc20UsdcDecimals,
  );
  const isBalanceSynchronized =
    Boolean(address) && usdcBalance !== undefined && !usdcBalanceError;

  const readiness = useMemo<ReadinessItem[]>(
    () => [
      {
        done: isConnected,
        label: "Wallet connected",
        supporting: address
          ? shortenAddress(address)
          : "MetaMask, Coinbase Wallet, Rabby, or another browser wallet.",
      },
      {
        done: isConnected && isOnArc,
        label: "Arc Testnet active",
        supporting: isOnArc
          ? `Chain ${arcTestnet.id}`
          : "Use switch/add network before claiming faucet funds.",
      },
      {
        done: usdcBalanceValue > zeroBalance,
        label: "USDC balance funded",
        supporting:
          usdcBalanceValue > zeroBalance
            ? `${formattedUsdcBalance} USDC available`
            : "Arc USDC pays gas and supports app transfers.",
      },
      {
        done: isBalanceSynchronized,
        label: "Balance synchronized",
        supporting: isBalanceSynchronized
          ? "Read through Arc's canonical USDC interface."
          : "Waiting for a successful Arc balance read.",
      },
    ],
    [
      address,
      formattedUsdcBalance,
      isConnected,
      isBalanceSynchronized,
      isOnArc,
      usdcBalanceValue,
    ],
  );
  const readyCount = readiness.filter((item) => item.done).length;
  const hasAnyBalance = usdcBalanceValue > zeroBalance;
  const walletRequestError = switchError ?? connectError ?? usdcBalanceError;
  const walletError =
    refreshError ??
    (walletRequestError ? getReadableWalletError(walletRequestError) : null);

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
      const result = await refetchUsdcBalance();

      if (result.error) {
        throw result.error;
      }

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
              <h1 className="mt-2 text-3xl font-black text-ink">
                Connect, fund, and verify Arc Testnet
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
                ArcRadar checks the active network, wallet address, and the
                canonical Arc USDC balance used for gas and app transfers.
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
                  icon={BadgeDollarSign}
                  isLoading={isUsdcBalanceLoading}
                  label="Arc USDC balance"
                  supporting="Read through the official 6-decimal USDC interface"
                  value={`${formattedUsdcBalance} USDC`}
                />
                <UnifiedBalancePanel hasBalance={hasAnyBalance} />
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
              <Wallet aria-hidden className="size-4" weight="duotone" />
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
              <ArrowUpRight aria-hidden className="size-4" weight="bold" />
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
                weight="bold"
              />
              {isRefreshing ? "Refreshing" : "Refresh balance"}
            </button>
            <button
              className="btn-ghost min-h-11"
              type="button"
              onClick={copyNetworkConfig}
            >
              <Copy aria-hidden className="size-4" weight="duotone" />
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
              <ExternalLink aria-hidden className="size-4" weight="bold" />
            </a>
          </div>
        </div>

        <aside className="grid content-start gap-3">
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
      <AlertTriangle
        aria-hidden
        className="mt-0.5 size-5 shrink-0 text-coral"
        weight="duotone"
      />
      <div>
        <p className="font-black text-ink">Wallet action needs attention</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-ink/60">
          {message}
        </p>
      </div>
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
          <PlugZap aria-hidden className="size-4 shrink-0" weight="duotone" />
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
          <Copy aria-hidden className="size-3.5" weight="duotone" />
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 text-xs font-black uppercase text-ink transition hover:border-ink/30"
          href={explorerAddressUrl}
          rel="noreferrer"
          target="_blank"
        >
          Explorer
          <ArrowUpRight aria-hidden className="size-3.5" weight="bold" />
        </a>
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 text-xs font-black uppercase text-ink/55 transition hover:border-coral hover:text-coral"
          type="button"
          onClick={onDisconnect}
        >
          <LogOut aria-hidden className="size-3.5" weight="bold" />
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
        weight="duotone"
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
          <LinkIcon aria-hidden className="size-4" weight="duotone" />
          <span className="text-xs font-black uppercase">Arc setup</span>
        </div>
        <button
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-paper/10 px-2 text-xs font-black uppercase text-paper/70 transition hover:border-mint/50 hover:text-mint"
          type="button"
          onClick={onCopy}
        >
          <Copy aria-hidden className="size-3.5" weight="duotone" />
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
          weight="fill"
        />
      ) : (
        <XCircle
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-ink/25"
          weight="duotone"
        />
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
        <Icon aria-hidden className="size-6 text-blueprint" weight="duotone" />
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

function UnifiedBalancePanel({ hasBalance }: { hasBalance: boolean }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Fuel aria-hidden className="size-6 text-blueprint" weight="duotone" />
        <span className="text-right text-xs font-black uppercase text-ink/40">
          Gas and transfers
        </span>
      </div>
      <p className="text-xl font-black text-ink">
        {hasBalance ? "Ready to use" : "USDC required"}
      </p>
      <p className="mt-2 text-sm font-bold leading-6 text-ink/55">
        Arc uses one underlying USDC balance for native gas and the ERC-20
        interface. It is not two separate assets.
      </p>
    </div>
  );
}

function StatusBadge({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: PhosphorIcon;
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
      <Icon aria-hidden className="size-4" weight="duotone" />
      <span>{label}</span>
      <span className="rounded-md bg-white/70 px-2 py-1 text-xs text-ink/55">
        {value}
      </span>
    </div>
  );
}

type BalancePanelProps = {
  icon: PhosphorIcon;
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

  if (/failed to fetch|http request failed|timeout/i.test(error.message)) {
    return "Arc balance service did not respond. Check your connection and refresh the balance.";
  }

  return "Wallet request failed. Refresh the balance or reconnect the wallet.";
}
