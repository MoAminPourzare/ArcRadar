"use client";

import {
  ArrowSquareOutIcon as ExternalLink,
  CheckCircleIcon as CheckCircle,
  ChartPieSliceIcon as ChartPieSlice,
  CurrencyCircleDollarIcon as CircleDollarSign,
  SpinnerGapIcon as LoaderCircle,
  WalletIcon as Wallet,
  WarningIcon as AlertTriangle,
} from "@phosphor-icons/react";
import Link from "next/link";
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
import { projectCategories } from "@/data/projects";
import { cn, shortenAddress } from "@/lib/utils";
import type {
  TipAllocationPlan,
  TipAllocationStrategy,
} from "@/types/agent";
import type { ProjectCategory } from "@/types/project";
import { arcUsdcAbi } from "@/wallet/erc20";

type AllocationStage =
  | "confirming-payment"
  | "idle"
  | "generating-plan"
  | "submitting-payment"
  | "success";

const allocationPayment = agentPaymentConfig.tipAllocation;
const strategies: Array<{
  description: string;
  label: string;
  value: TipAllocationStrategy;
}> = [
  {
    description: "Find projects with fresh weekly traction and rising signal.",
    label: "Rising projects",
    value: "rising_projects",
  },
  {
    description: "Prioritize good projects that have not received much support yet.",
    label: "Underfunded builders",
    value: "underfunded_builders",
  },
  {
    description: "Follow the strongest ArcRadar signal scores.",
    label: "Top signal",
    value: "top_signal",
  },
  {
    description: "Focus on AI agent projects building around Arc.",
    label: "AI agents",
    value: "ai_agents",
  },
  {
    description: "Support payments, wallets, DeFi, and DEX projects.",
    label: "Payments stack",
    value: "payments_stack",
  },
  {
    description: "Blend momentum, underfunded support, and profile quality.",
    label: "Balanced",
    value: "balanced",
  },
];

export function TipAllocationPanel() {
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [budgetUsdc, setBudgetUsdc] = useState("10");
  const [category, setCategory] = useState<ProjectCategory | "All">("All");
  const [error, setError] = useState<string | null>(null);
  const [maxProjects, setMaxProjects] = useState(5);
  const [paymentHash, setPaymentHash] = useState<`0x${string}` | null>(null);
  const [plan, setPlan] = useState<TipAllocationPlan | null>(null);
  const [stage, setStage] = useState<AllocationStage>("idle");
  const [strategy, setStrategy] =
    useState<TipAllocationStrategy>("rising_projects");

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
  const hasSufficientFeeBalance = balance >= allocationPayment.priceUsdcMicro;

  async function handleGeneratePlan() {
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

    if (!hasSufficientFeeBalance) {
      setError(
        `Your Arc ERC-20 USDC balance is below the ${allocationPayment.priceLabel} allocation micro-payment.`,
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
          allocationPayment.recipientAddress,
          allocationPayment.priceUsdcMicro,
        ],
        functionName: "transfer",
      });
      const transactionHash = await writeContractAsync({
        abi: arcUsdcAbi,
        address: arcContracts.usdc,
        args: [
          allocationPayment.recipientAddress,
          allocationPayment.priceUsdcMicro,
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

      setStage("generating-plan");
      const response = await fetch("/api/agents/tip-allocation", {
        body: JSON.stringify({
          budgetUsdc,
          category,
          maxProjects,
          strategy,
          transactionHash,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        error?: string;
        plan?: TipAllocationPlan;
      };

      if (!response.ok || !result.plan) {
        throw new Error(result.error ?? "The allocation plan could not be generated.");
      }

      setPlan(result.plan);
      setStage("success");
      await balanceQuery.refetch();
    } catch (caughtError) {
      setStage("idle");
      setError(getAllocationError(caughtError));
    }
  }

  const actionLabel = getActionLabel({
    isConnected,
    isConnecting,
    isSwitching,
    planExists: Boolean(plan),
    stage,
  });

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-blueprint">
            Tip allocation agent
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">
            Generate a programmable support plan
          </h2>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-blueprint/10 text-blueprint">
          <ChartPieSlice aria-hidden className="size-6" weight="duotone" />
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
        Pay a tiny Arc Testnet USDC nanopayment-style fee, then let the agent
        split your support budget across eligible projects. The plan never moves
        your tip budget automatically.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label>
          <span className="text-xs font-black uppercase text-ink/45">
            Support budget
          </span>
          <div className="mt-2 flex min-h-11 items-center rounded-lg border border-ink/10 bg-paper px-3 focus-within:border-blueprint">
            <input
              className="min-w-0 flex-1 bg-transparent font-mono text-base font-black text-ink outline-none"
              disabled={isBusy}
              inputMode="decimal"
              min="0.1"
              onChange={(event) => setBudgetUsdc(event.target.value)}
              step="0.000001"
              type="number"
              value={budgetUsdc}
            />
            <span className="text-xs font-black text-ink/45">USDC</span>
          </div>
        </label>

        <label>
          <span className="text-xs font-black uppercase text-ink/45">
            Projects
          </span>
          <select
            className="mt-2 min-h-11 rounded-lg border border-ink/10 bg-paper px-3 text-sm font-black text-ink outline-none focus:border-blueprint"
            disabled={isBusy}
            onChange={(event) => setMaxProjects(Number(event.target.value))}
            value={maxProjects}
          >
            {[3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-xs font-black uppercase text-ink/45">
            Category
          </span>
          <select
            className="mt-2 min-h-11 rounded-lg border border-ink/10 bg-paper px-3 text-sm font-black text-ink outline-none focus:border-blueprint"
            disabled={isBusy}
            onChange={(event) =>
              setCategory(event.target.value as ProjectCategory | "All")
            }
            value={category}
          >
            {projectCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {strategies.map((item) => (
          <button
            aria-pressed={strategy === item.value}
            className={cn(
              "min-h-24 rounded-lg border p-3 text-left transition",
              strategy === item.value
                ? "border-blueprint bg-blueprint/5"
                : "border-ink/10 bg-paper hover:border-ink/25",
            )}
            disabled={isBusy}
            key={item.value}
            onClick={() => setStrategy(item.value)}
            type="button"
          >
            <span className="text-sm font-black text-ink">{item.label}</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-ink/50">
              {item.description}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold md:grid-cols-4">
        <AllocationFact label="Agent fee" value={allocationPayment.priceLabel} />
        <AllocationFact label="Payment mode" value="USDC nanopayment" />
        {isConnected ? (
          <>
            <AllocationFact
              label="Balance"
              value={`${formatUsdcBalance(balance)} USDC`}
            />
            <AllocationFact
              label="Network"
              value={isOnArc ? "Arc Testnet" : "Switch required"}
            />
          </>
        ) : (
          <AllocationFact
            label="Recipient"
            value={shortenAddress(allocationPayment.recipientAddress)}
          />
        )}
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
            Allocation micro-payment verified
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
        onClick={handleGeneratePlan}
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

      {plan ? <AllocationPlanCard plan={plan} /> : null}
    </section>
  );
}

function AllocationPlanCard({ plan }: { plan: TipAllocationPlan }) {
  return (
    <div className="mt-5 border-t border-ink/10 pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-ink/40">
            Generated plan
          </p>
          <h3 className="mt-1 text-xl font-black text-ink">
            {plan.budgetUsdc} USDC across {plan.allocations.length} projects
          </h3>
        </div>
        <span className="w-fit rounded-lg border border-blueprint/15 bg-blueprint/5 px-3 py-2 text-xs font-black uppercase text-blueprint">
          {plan.strategy.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
        {plan.summary}
      </p>

      <div className="mt-4 grid gap-3">
        {plan.allocations.map((allocation, index) => (
          <article
            className="rounded-lg border border-ink/10 bg-paper p-4"
            key={allocation.projectSlug}
          >
            <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
              <span className="grid size-9 place-items-center rounded-md bg-ink font-mono text-xs font-black text-paper">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-ink">
                    {allocation.projectName}
                  </h4>
                  <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase text-ink/45">
                    {allocation.category}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">
                  {allocation.reason}
                </p>
              </div>
              <div className="rounded-lg border border-mint/35 bg-white px-3 py-2 text-right">
                <p className="text-[10px] font-black uppercase text-ink/35">
                  Allocation
                </p>
                <p className="mt-1 font-mono text-lg font-black text-forest">
                  {allocation.amountUsdc} USDC
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-ink px-3 text-xs font-black uppercase text-paper transition hover:bg-blueprint"
                href={`/projects/${allocation.projectSlug}`}
              >
                Open project to tip
              </Link>
              <span className="inline-flex min-h-9 items-center rounded-lg border border-ink/10 bg-white px-3 font-mono text-xs font-black text-ink/45">
                score {allocation.score}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AllocationFact({ label, value }: { label: string; value: string }) {
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
  planExists,
  stage,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  isSwitching: boolean;
  planExists: boolean;
  stage: AllocationStage;
}) {
  if (isConnecting) return "Connecting wallet";
  if (isSwitching) return "Switching to Arc";
  if (!isConnected) return "Connect wallet to allocate";
  if (stage === "submitting-payment") return "Confirm micro-payment";
  if (stage === "confirming-payment") return "Confirming payment";
  if (stage === "generating-plan") return "Generating plan";
  if (stage === "success") return "Generate another plan";
  return planExists ? "Pay and regenerate plan" : "Pay and generate plan";
}

function getAllocationError(error: unknown) {
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

  return "The allocation plan could not be completed. Please try again.";
}
