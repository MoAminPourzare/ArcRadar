"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

const accentClass: Record<Project["accent"], string> = {
  amber: "from-amber to-[#ffcf61] text-accent-ink",
  blueprint: "from-blueprint to-[#6f93ff] text-paper",
  coral: "from-coral to-[#ff9b92] text-paper",
  cyan: "from-cyan to-[#b8efff] text-accent-ink",
  mint: "from-mint to-[#b5ffd8] text-accent-ink",
};

const sizeClass = {
  lg: "size-16 rounded-xl text-xl",
  md: "size-12 rounded-lg text-base",
  sm: "size-9 rounded-lg text-xs",
  xs: "size-7 rounded-md text-[10px]",
} as const;

type ProjectLogoProps = {
  accent: Project["accent"];
  className?: string;
  logoUrl?: string | null;
  name: string;
  size?: keyof typeof sizeClass;
};

export function ProjectLogo({
  accent,
  className,
  logoUrl,
  name,
  size = "md",
}: ProjectLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logoUrl && !failed);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden border border-ink/10 bg-gradient-to-br font-black shadow-sm",
        sizeClass[size],
        accentClass[accent],
        className,
      )}
    >
      {showImage ? (
        // Project logos may come from curated external URLs entered by admins.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${name} logo`}
          className="size-full bg-[#ffffff] object-contain p-[12%]"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={logoUrl ?? undefined}
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_42%)]"
          />
          <span className="relative tracking-[-0.05em]">
            {getProjectInitials(name)}
          </span>
        </>
      )}
    </span>
  );
}

function getProjectInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
