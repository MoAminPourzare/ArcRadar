import type { Metadata } from "next";
import {
  ClockCountdownIcon as Clock3,
  LockKeyIcon as LockKeyhole,
  RobotIcon as Bot,
} from "@phosphor-icons/react/ssr";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Agent",
  description: "ArcRadar Agent is reserved for a future product phase.",
};

export default function AgentPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto grid min-h-[70vh] w-full max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="w-full max-w-2xl rounded-lg border border-dashed border-ink/20 bg-white p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-lg bg-blueprint/10 text-blueprint">
            <Bot aria-hidden className="size-8" weight="duotone" />
          </span>
          <p className="mt-6 text-sm font-black uppercase text-blueprint">
            Future feature
          </p>
          <h1 className="mt-2 text-4xl font-black text-ink">ArcRadar Agent</h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-ink/55">
            This area is intentionally disabled. The product scope and agent
            capabilities will be designed in a later phase.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-ink/5 px-3 text-xs font-black uppercase text-ink/45">
              <LockKeyhole aria-hidden className="size-4" weight="duotone" />
              Disabled
            </span>
            <span className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-amber/15 px-3 text-xs font-black uppercase text-ink/55">
              <Clock3 aria-hidden className="size-4" weight="duotone" />
              Coming soon
            </span>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
