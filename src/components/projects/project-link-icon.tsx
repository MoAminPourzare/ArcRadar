import { Globe2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { ProjectLink } from "@/types/project";

export function ProjectLinkIcon({
  className,
  label,
}: {
  className?: string;
  label: ProjectLink["label"];
}) {
  if (label === "Discord") {
    return (
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-md bg-[#5865F2] shadow-sm",
          className,
        )}
      >
        <Image alt="" aria-hidden height={16} src="/brands/discord.svg" width={22} />
      </span>
    );
  }

  if (label === "GitHub") {
    return (
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-md border border-[#111312]/10 bg-[#ffffff] shadow-sm",
          className,
        )}
      >
        <Image alt="" aria-hidden height={19} src="/brands/github.svg" width={19} />
      </span>
    );
  }

  if (label === "Project X" || label === "Builder X") {
    return (
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-md border border-[#111312]/10 bg-[#ffffff] shadow-sm",
          className,
        )}
      >
        <Image alt="" aria-hidden height={18} src="/brands/x-black.png" width={18} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-md bg-blueprint text-paper shadow-sm",
        className,
      )}
    >
      <Globe2 aria-hidden className="size-4" />
    </span>
  );
}
