"use client";

import { CircleDollarSign, Info } from "lucide-react";
import { useState } from "react";

const presetAmounts = [1, 5, 10];

export function ProjectTipPanel({ projectName }: { projectName: string }) {
  const [amount, setAmount] = useState("5");
  const [message, setMessage] = useState("");

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
            className={`min-h-10 rounded-lg border text-sm font-black transition ${
              amount === preset.toString()
                ? "border-blueprint bg-blueprint text-paper"
                : "border-ink/10 bg-paper text-ink hover:border-blueprint/40"
            }`}
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
            inputMode="decimal"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            step="0.01"
            type="number"
            value={amount}
          />
          <span className="text-xs font-black text-ink/45">USDC</span>
        </div>
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-black uppercase text-ink/45">
          Message (optional)
        </span>
        <textarea
          className="mt-2 min-h-20 w-full resize-none rounded-lg border border-ink/10 bg-paper p-3 text-sm font-semibold text-ink outline-none transition focus:border-blueprint"
          maxLength={280}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Why are you supporting this project?"
          value={message}
        />
      </label>

      <button
        className="mt-4 flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-lg bg-ink/10 px-4 text-sm font-black text-ink/45"
        disabled
        type="button"
      >
        Tipping will be enabled after integration
      </button>
      <p className="mt-3 flex gap-2 text-xs font-semibold leading-5 text-ink/45">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        This is the prepared interface only. It does not create a transaction
        or move USDC yet.
      </p>
    </section>
  );
}
