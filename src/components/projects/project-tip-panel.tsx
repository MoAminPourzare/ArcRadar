"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BaseError, formatUnits, parseUnits, zeroAddress } from "viem";
import {
  useAccount,
  useConnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import { arcContracts, arcLinks, arcTestnet } from "@/config/arc";
import {
  tipRouterAbi,
  tipRouterAddress,
  tipRouterConfig,
} from "@/config/tip-router";
import { cn, shortenAddress } from "@/lib/utils";
import { arcUsdcAbi } from "@/wallet/erc20";

const presetAmounts = [1, 5, 10];

type TipStage =
  | "idle"
  | "approving"
  | "confirming-approval"
  | "submitting"
  | "confirming-tip"
  | "indexing"
  | "success";

type ProjectTipPanelProps = {
  projectName: string;
  projectSlug: string;
  projectWallet: `0x${string}`;
};

export function ProjectTipPanel({
  projectName,
  projectSlug,
  projectWallet,
}: ProjectTipPanelProps) {
  const router = useRouter();
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [amount, setAmount] = useState("5");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState<TipStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tipHash, setTipHash] = useState<`0x${string}` | null>(null);

  const contractAddress = tipRouterAddress ?? zeroAddress;
  const walletAddress = address ?? zeroAddress;
  const isOnArc = chainId === arcTestnet.id;
  const isBusy = stage !== "idle" && stage !== "success";

  const balanceQuery = useReadContract({
    abi: arcUsdcAbi,
    address: arcContracts.usdc,
    args: [walletAddress],
    chainId: arcTestnet.id,
    functionName: "balanceOf",
    query: { enabled: Boolean(address) },
  });
  const allowanceQuery = useReadContract({
    abi: arcUsdcAbi,
    address: arcContracts.usdc,
    args: [walletAddress, contractAddress],
    chainId: arcTestnet.id,
    functionName: "allowance",
    query: { enabled: Boolean(address && tipRouterAddress) },
  });
  const recipientQuery = useReadContract({
    abi: tipRouterAbi,
    address: contractAddress,
    args: [projectSlug],
    chainId: arcTestnet.id,
    functionName: "getProjectRecipient",
    query: { enabled: Boolean(tipRouterAddress) },
  });

  const amountMicro = useMemo(() => parseTipAmount(amount), [amount]);
  const balance = balanceQuery.data ?? 0n;
  const allowance = allowanceQuery.data ?? 0n;
  const registeredRecipient = recipientQuery.data;
  const recipientMatches =
    Boolean(registeredRecipient) &&
    registeredRecipient?.toLowerCase() === projectWallet.toLowerCase();
  const hasSufficientBalance = amountMicro !== null && balance >= amountMicro;
  const needsApproval = amountMicro !== null && allowance < amountMicro;
  const messageBytes = new TextEncoder().encode(message).length;
  const preferredConnector = connectors[0];

  async function handleTip() {
    setError(null);
    setTipHash(null);

    if (!tipRouterAddress || !publicClient) {
      setError("Tipping is not configured yet.");
      return;
    }

    if (!isConnected || !address) {
      if (preferredConnector) {
        connect({ connector: preferredConnector });
      }
      return;
    }

    if (!isOnArc) {
      await switchChainAsync({ chainId: arcTestnet.id });
      return;
    }

    if (!recipientMatches) {
      setError("This project's onchain tip recipient is not configured safely.");
      return;
    }

    if (amountMicro === null || amountMicro <= 0n) {
      setError("Enter a valid USDC amount with no more than 6 decimals.");
      return;
    }

    if (!hasSufficientBalance) {
      setError("Your Arc USDC balance is lower than this tip amount.");
      return;
    }

    if (messageBytes > tipRouterConfig.messageMaxLength) {
      setError("The message must be 280 bytes or fewer.");
      return;
    }

    try {
      if (allowance < amountMicro) {
        setStage("approving");
        await publicClient.simulateContract({
          abi: arcUsdcAbi,
          account: address,
          address: arcContracts.usdc,
          args: [tipRouterAddress, amountMicro],
          functionName: "approve",
        });
        const approvalHash = await writeContractAsync({
          abi: arcUsdcAbi,
          address: arcContracts.usdc,
          args: [tipRouterAddress, amountMicro],
          chainId: arcTestnet.id,
          functionName: "approve",
        });

        setStage("confirming-approval");
        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          confirmations: 1,
          hash: approvalHash,
        });

        if (approvalReceipt.status !== "success") {
          throw new Error("The USDC approval transaction was reverted.");
        }
      }

      setStage("submitting");
      await publicClient.simulateContract({
        abi: tipRouterAbi,
        account: address,
        address: tipRouterAddress,
        args: [projectSlug, amountMicro, message.trim()],
        functionName: "tip",
      });
      const transactionHash = await writeContractAsync({
        abi: tipRouterAbi,
        address: tipRouterAddress,
        args: [projectSlug, amountMicro, message.trim()],
        chainId: arcTestnet.id,
        functionName: "tip",
      });
      setTipHash(transactionHash);

      setStage("confirming-tip");
      const tipReceipt = await publicClient.waitForTransactionReceipt({
        confirmations: 1,
        hash: transactionHash,
      });

      if (tipReceipt.status !== "success") {
        throw new Error("The tip transaction was reverted.");
      }

      setStage("indexing");
      const response = await fetch("/api/tips/confirm", {
        body: JSON.stringify({ projectSlug, transactionHash }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "The tip is confirmed, but ArcRadar could not index it yet.",
        );
      }

      await Promise.all([
        balanceQuery.refetch(),
        allowanceQuery.refetch(),
        recipientQuery.refetch(),
      ]);
      setStage("success");
      setMessage("");
      router.refresh();
    } catch (caughtError) {
      setStage("idle");
      setError(getTipError(caughtError));
    }
  }

  const actionLabel = getActionLabel({
    isConnected,
    isConnecting,
    isSwitching,
    needsApproval,
    stage,
  });

  return (
    <section className="rounded-lg border border-blueprint/20 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-blueprint">
            Tip with USDC
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">
            Support {projectName}
          </h2>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-blueprint/10 text-blueprint">
          <CircleDollarSign aria-hidden className="size-5" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {presetAmounts.map((preset) => (
          <button
            className={cn(
              "min-h-10 rounded-lg border text-sm font-black transition",
              amount === preset.toString()
                ? "border-blueprint bg-blueprint text-paper"
                : "border-ink/10 bg-paper text-ink hover:border-blueprint/40",
            )}
            disabled={isBusy}
            key={preset}
            onClick={() => setAmount(preset.toString())}
            type="button"
          >
            {preset} USDC
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-black uppercase text-ink/45">
          Custom amount
        </span>
        <div className="mt-2 flex min-h-11 items-center rounded-lg border border-ink/10 bg-paper px-3 focus-within:border-blueprint">
          <input
            className="min-w-0 flex-1 bg-transparent font-mono text-base font-black text-ink outline-none"
            disabled={isBusy}
            inputMode="decimal"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            step="0.000001"
            type="number"
            value={amount}
          />
          <span className="text-xs font-black text-ink/45">USDC</span>
        </div>
      </label>

      <label className="mt-3 block">
        <span className="flex items-center justify-between gap-2 text-xs font-black uppercase text-ink/45">
          Message (optional)
          <span>{messageBytes}/280 bytes</span>
        </span>
        <textarea
          className="mt-2 min-h-20 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm font-semibold text-ink outline-none transition focus:border-blueprint"
          disabled={isBusy}
          maxLength={280}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Why are you supporting this project?"
          value={message}
        />
      </label>

      {isConnected ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
          <TipFact
            label="Balance"
            value={`${formatUsdcBalance(balance)} USDC`}
          />
          <TipFact
            label="Recipient"
            value={
              registeredRecipient
                ? shortenAddress(registeredRecipient)
                : "Not registered"
            }
          />
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-coral/30 bg-coral/10 p-3 text-sm font-semibold leading-5 text-ink/65">
          <AlertTriangle
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-coral"
          />
          {error}
        </div>
      ) : null}

      {stage === "success" && tipHash ? (
        <div className="mt-3 rounded-lg border border-mint/40 bg-mint/15 p-3">
          <p className="flex items-center gap-2 text-sm font-black text-forest">
            <CheckCircle2 aria-hidden className="size-4" />
            Tip confirmed and indexed
          </p>
          <a
            className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blueprint hover:underline"
            href={`${arcLinks.explorer}/tx/${tipHash}`}
            rel="noreferrer"
            target="_blank"
          >
            View transaction
            <ArrowUpRight aria-hidden className="size-3" />
          </a>
        </div>
      ) : null}

      <button
        className="btn-primary mt-4 min-h-11 w-full"
        disabled={isBusy || isConnecting || isSwitching || !preferredConnector}
        type="button"
        onClick={handleTip}
      >
        {isBusy || isConnecting || isSwitching ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : isConnected ? (
          <ShieldCheck aria-hidden className="size-4" />
        ) : (
          <Wallet aria-hidden className="size-4" />
        )}
        {actionLabel}
      </button>

      <p className="mt-3 text-xs font-semibold leading-5 text-ink/45">
        {needsApproval
          ? "Your wallet will first approve exactly this amount, then submit the tip."
          : "Your current allowance can cover this tip, so no approval transaction is needed."}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-ink/45">
        Wallet activity may label the contract call as 0 USDC. The actual USDC
        transfer appears in the transaction receipt and token balance.
      </p>
    </section>
  );
}

function TipFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-2.5">
      <p className="uppercase text-ink/35">{label}</p>
      <p className="mt-1 truncate font-mono text-ink">{value}</p>
    </div>
  );
}

function parseTipAmount(value: string) {
  try {
    return parseUnits(value, tipRouterConfig.usdcDecimals);
  } catch {
    return null;
  }
}

function formatUsdcBalance(value: bigint) {
  const formatted = formatUnits(value, tipRouterConfig.usdcDecimals);
  const [whole, fraction = ""] = formatted.split(".");
  const visibleFraction = fraction.slice(0, 4).replace(/0+$/, "");

  return visibleFraction ? `${whole}.${visibleFraction}` : whole;
}

function getActionLabel({
  isConnected,
  isConnecting,
  isSwitching,
  needsApproval,
  stage,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  isSwitching: boolean;
  needsApproval: boolean;
  stage: TipStage;
}) {
  if (isConnecting) return "Connecting wallet";
  if (isSwitching) return "Switching to Arc";
  if (!isConnected) return "Connect wallet to tip";
  if (stage === "approving") return "Confirm approval in wallet";
  if (stage === "confirming-approval") return "Confirming approval";
  if (stage === "submitting") return "Confirm tip in wallet";
  if (stage === "confirming-tip") return "Confirming tip";
  if (stage === "indexing") return "Updating ArcRadar";
  if (stage === "success") return "Send another tip";
  return needsApproval ? "Approve and tip" : "Send tip";
}

function getTipError(error: unknown) {
  if (error instanceof BaseError) {
    if (/user rejected|rejected the request/i.test(error.shortMessage)) {
      return "The request was rejected in your wallet.";
    }

    return error.shortMessage;
  }

  if (error instanceof Error) {
    if (/user rejected|rejected the request/i.test(error.message)) {
      return "The request was rejected in your wallet.";
    }

    return error.message;
  }

  return "The tip could not be completed. Please try again.";
}
