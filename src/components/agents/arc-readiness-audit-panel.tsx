"use client";

import {
  ArrowSquareOutIcon as ExternalLink,
  CheckCircleIcon as CheckCircle,
  ClipboardTextIcon as ClipboardText,
  CurrencyCircleDollarIcon as CircleDollarSign,
  GaugeIcon as Gauge,
  SpinnerGapIcon as LoaderCircle,
  WarningIcon as AlertTriangle,
  WalletIcon as Wallet,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BaseError, formatUnits, zeroAddress } from "viem";
import {
  useAccount,
  useConnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import { agentPaymentConfig } from "@/config/agents";
import { arcContracts, arcLinks, arcTestnet } from "@/config/arc";
import { cn, shortenAddress } from "@/lib/utils";
import type {
  AgentReportSummary,
  AuditFinding,
  AuditRecommendation,
} from "@/types/agent";
import { arcUsdcAbi } from "@/wallet/erc20";

type AuditStage =
  | "confirming-payment"
  | "idle"
  | "running-audit"
  | "submitting-payment"
  | "success";

type ArcReadinessAuditPanelProps = {
  initialReport?: AgentReportSummary | null;
  projectName: string;
  projectSlug: string;
};

const auditPayment = agentPaymentConfig.arcReadinessAudit;

export function ArcReadinessAuditPanel({
  initialReport,
  projectName,
  projectSlug,
}: ArcReadinessAuditPanelProps) {
  const router = useRouter();
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [error, setError] = useState<string | null>(null);
  const [paymentHash, setPaymentHash] = useState<`0x${string}` | null>(null);
  const [report, setReport] = useState<AgentReportSummary | null>(
    initialReport ?? null,
  );
  const [stage, setStage] = useState<AuditStage>("idle");

  const walletAddress = address ?? zeroAddress;
  const preferredConnector = connectors[0];
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
  const balance = balanceQuery.data ?? 0n;
  const hasSufficientBalance = balance >= auditPayment.priceUsdcMicro;

  async function handleRunAudit() {
    setError(null);
    setPaymentHash(null);

    if (!publicClient) {
      setError("Arc RPC is not available yet. Try again in a moment.");
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

    if (!hasSufficientBalance) {
      setError(
        `Your Arc ERC-20 USDC balance is below the ${auditPayment.priceLabel} audit fee.`,
      );
      return;
    }

    try {
      setStage("submitting-payment");
      await publicClient.simulateContract({
        abi: arcUsdcAbi,
        account: address,
        address: arcContracts.usdc,
        args: [
          auditPayment.recipientAddress,
          auditPayment.priceUsdcMicro,
        ],
        functionName: "transfer",
      });
      const transactionHash = await writeContractAsync({
        abi: arcUsdcAbi,
        address: arcContracts.usdc,
        args: [
          auditPayment.recipientAddress,
          auditPayment.priceUsdcMicro,
        ],
        chainId: arcTestnet.id,
        functionName: "transfer",
      });

      setPaymentHash(transactionHash);
      setStage("confirming-payment");

      const receipt = await publicClient.waitForTransactionReceipt({
        confirmations: 1,
        hash: transactionHash,
      });

      if (receipt.status !== "success") {
        throw new Error("The USDC payment transaction was reverted.");
      }

      setStage("running-audit");
      const response = await fetch("/api/agents/arc-readiness-audit", {
        body: JSON.stringify({
          auditDepth: "full",
          projectSlug,
          transactionHash,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        error?: string;
        report?: AgentReportSummary;
      };

      if (!response.ok || !result.report) {
        throw new Error(
          result.error ?? "The audit could not be generated yet.",
        );
      }

      setReport(result.report);
      setStage("success");
      await balanceQuery.refetch();
      router.refresh();
    } catch (caughtError) {
      setStage("idle");
      setError(getAuditError(caughtError));
    }
  }

  const actionLabel = getActionLabel({
    isConnected,
    isConnecting,
    isSwitching,
    reportExists: Boolean(report),
    stage,
  });

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-blueprint">
            Arc readiness agent
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">
            Audit {projectName}
          </h2>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-mint/20 text-forest">
          <ClipboardText aria-hidden className="size-6" weight="duotone" />
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
        Run a paid testnet audit that checks profile quality, website health,
        official links, USDC tipping readiness, Arc proof, and recent activity.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
        <AuditFact label="Fee" value={auditPayment.priceLabel} />
        <AuditFact
          label="Recipient"
          value={shortenAddress(auditPayment.recipientAddress)}
        />
        {isConnected ? (
          <>
            <AuditFact
              label="Balance"
              value={`${formatUsdcBalance(balance)} USDC`}
            />
            <AuditFact
              label="Network"
              value={isOnArc ? "Arc Testnet" : "Switch required"}
            />
          </>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-coral/30 bg-coral/10 p-3 text-sm font-semibold leading-5 text-ink/65">
          <AlertTriangle
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-coral"
            weight="duotone"
          />
          {error}
        </div>
      ) : null}

      {stage === "success" && paymentHash ? (
        <div className="mt-3 rounded-lg border border-mint/40 bg-mint/15 p-3">
          <p className="flex items-center gap-2 text-sm font-black text-forest">
            <CheckCircle aria-hidden className="size-4" weight="fill" />
            Audit payment verified
          </p>
          <a
            className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blueprint hover:underline"
            href={`${arcLinks.explorer}/tx/${paymentHash}`}
            rel="noreferrer"
            target="_blank"
          >
            View transaction
            <ExternalLink aria-hidden className="size-3" weight="bold" />
          </a>
        </div>
      ) : null}

      <button
        className="btn-primary mt-4 min-h-11 w-full"
        disabled={isBusy || isConnecting || isSwitching || !preferredConnector}
        onClick={handleRunAudit}
        type="button"
      >
        {isBusy || isConnecting || isSwitching ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" weight="bold" />
        ) : isConnected ? (
          <CircleDollarSign aria-hidden className="size-4" weight="duotone" />
        ) : (
          <Wallet aria-hidden className="size-4" weight="duotone" />
        )}
        {actionLabel}
      </button>

      <p className="mt-3 text-xs font-semibold leading-5 text-ink/45">
        The testnet fee is paid with Arc ERC-20 USDC, then ArcRadar verifies the
        token transfer onchain before generating the report.
      </p>

      {report ? <AuditReportCard report={report} /> : null}
    </section>
  );
}

function AuditReportCard({ report }: { report: AgentReportSummary }) {
  const findings = report.findings.slice(0, 6);
  const recommendations = report.recommendations.slice(0, 4);

  return (
    <div className="mt-5 border-t border-ink/10 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-ink/40">
            Latest report
          </p>
          <h3 className="mt-1 text-lg font-black text-ink">{report.title}</h3>
        </div>
        <span
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-lg border font-mono text-xl font-black",
            getScoreClass(report.score ?? 0),
          )}
        >
          {report.score ?? "-"}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
        {report.summary}
      </p>

      <div className="mt-4 grid gap-2">
        {findings.map((finding) => (
          <FindingRow finding={finding} key={finding.label} />
        ))}
      </div>

      {recommendations.length > 0 ? (
        <div className="mt-4 rounded-lg border border-blueprint/15 bg-blueprint/5 p-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-blueprint">
            <Gauge aria-hidden className="size-4" weight="duotone" />
            Recommended next steps
          </p>
          <div className="mt-3 grid gap-2">
            {recommendations.map((recommendation) => (
              <RecommendationRow
                key={recommendation.title}
                recommendation={recommendation}
              />
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs font-semibold text-ink/40">
        Generated {new Date(report.createdAt).toLocaleString("en-US")}
      </p>
    </div>
  );
}

function FindingRow({ finding }: { finding: AuditFinding }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-ink">{finding.label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">
            {finding.detail}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-1 font-mono text-xs font-black",
            finding.status === "passed" && "bg-mint/25 text-forest",
            finding.status === "warning" && "bg-amber/25 text-accent-ink",
            finding.status === "failed" && "bg-coral/20 text-coral",
            finding.status === "unverified" && "bg-ink/10 text-ink/55",
          )}
        >
          {finding.points}/{finding.maxPoints}
        </span>
      </div>
    </div>
  );
}

function RecommendationRow({
  recommendation,
}: {
  recommendation: AuditRecommendation;
}) {
  return (
    <div className="rounded-lg bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-black text-ink">{recommendation.title}</p>
        <span className="rounded-md bg-ink/5 px-2 py-1 text-[10px] font-black uppercase text-ink/45">
          {recommendation.priority}
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold leading-5 text-ink/55">
        {recommendation.detail}
      </p>
    </div>
  );
}

function AuditFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-2.5">
      <p className="uppercase text-ink/35">{label}</p>
      <p className="mt-1 truncate font-mono text-ink">{value}</p>
    </div>
  );
}

function formatUsdcBalance(value: bigint) {
  const formatted = formatUnits(value, 6);
  const [whole, fraction = ""] = formatted.split(".");
  const visibleFraction = fraction.slice(0, 4).replace(/0+$/, "");

  return visibleFraction ? `${whole}.${visibleFraction}` : whole;
}

function getActionLabel({
  isConnected,
  isConnecting,
  isSwitching,
  reportExists,
  stage,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  isSwitching: boolean;
  reportExists: boolean;
  stage: AuditStage;
}) {
  if (isConnecting) return "Connecting wallet";
  if (isSwitching) return "Switching to Arc";
  if (!isConnected) return "Connect wallet to audit";
  if (stage === "submitting-payment") return "Confirm USDC payment";
  if (stage === "confirming-payment") return "Confirming payment";
  if (stage === "running-audit") return "Running audit";
  if (stage === "success") return "Run again";
  return reportExists ? "Pay and run again" : "Pay and run audit";
}

function getAuditError(error: unknown) {
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

  return "The audit could not be completed. Please try again.";
}

function getScoreClass(score: number) {
  if (score >= 80) return "border-mint/40 bg-mint/20 text-forest";
  if (score >= 60) return "border-amber/40 bg-amber/20 text-accent-ink";
  return "border-coral/30 bg-coral/10 text-coral";
}
