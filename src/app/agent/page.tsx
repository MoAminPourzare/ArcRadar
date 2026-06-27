import type { Metadata } from "next";
import {
  ArrowRightIcon as ArrowRight,
  ChartLineUpIcon as ChartLineUp,
  ClipboardTextIcon as ClipboardText,
  CurrencyCircleDollarIcon as CircleDollarSign,
  GaugeIcon as Gauge,
  ShieldCheckIcon as ShieldCheck,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";

import { agentPaymentConfig } from "@/config/agents";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Agent",
  description:
    "Run ArcRadar's paid Arc Readiness Audit Agent for project-level builder checks.",
};

const auditChecks = [
  "Profile completeness",
  "Website health",
  "Official links",
  "USDC tipping setup",
  "TipRouter registration",
  "Arc-specific proof",
  "Recent activity signal",
  "Actionable next steps",
] as const;

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <section className="border-b border-ink/10 bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-16">
            <div>
              <p className="text-sm font-black uppercase text-blueprint">
                ArcRadar agent layer
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-ink sm:text-6xl">
                Paid builder audits for Arc projects
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-ink/60">
                The first ArcRadar agent is live: a rule-based Arc Readiness
                Audit Agent that verifies project quality, website health,
                USDC tipping readiness, Arc-specific proof, and activity
                signals before generating a reusable report.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="btn-primary min-h-11" href="/projects">
                  Choose a project
                  <ArrowRight aria-hidden className="size-4" weight="bold" />
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 bg-paper px-4 text-sm font-black text-ink transition hover:border-blueprint/35 hover:text-blueprint"
                  href="/builders"
                >
                  Builder resources
                </Link>
              </div>
            </div>

            <aside className="rounded-lg border border-ink/10 bg-paper p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-blueprint">
                    Available now
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-ink">
                    Arc Readiness Audit
                  </h2>
                </div>
                <span className="grid size-11 place-items-center rounded-lg bg-mint/20 text-forest">
                  <ClipboardText aria-hidden className="size-7" weight="duotone" />
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-ink/60">
                Each run costs {agentPaymentConfig.arcReadinessAudit.priceLabel}{" "}
                on Arc Testnet. The report is generated only after ArcRadar
                verifies the ERC-20 USDC transfer onchain.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <AgentMetric
                  icon={CircleDollarSign}
                  label="Fee"
                  value={agentPaymentConfig.arcReadinessAudit.priceLabel}
                />
                <AgentMetric icon={ShieldCheck} label="Payment" value="Onchain" />
                <AgentMetric icon={Gauge} label="Score" value="/100" />
                <AgentMetric icon={ChartLineUp} label="Mode" value="Rule-based" />
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5">
            <p className="text-sm font-black uppercase text-blueprint">
              What the agent checks
            </p>
            <h2 className="mt-2 text-3xl font-black text-ink">
              Actionable output instead of generic advice
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {auditChecks.map((check) => (
              <div
                className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm"
                key={check}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-blueprint/10 text-blueprint">
                  <ShieldCheck aria-hidden className="size-5" weight="duotone" />
                </span>
                <p className="mt-4 text-sm font-black text-ink">{check}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function AgentMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <Icon aria-hidden className="size-4 text-blueprint" weight="duotone" />
        <span className="text-[10px] font-black uppercase text-ink/35">
          {label}
        </span>
      </div>
      <p className="mt-3 font-mono text-sm font-black text-ink">{value}</p>
    </div>
  );
}
