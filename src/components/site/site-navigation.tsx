"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/projects", label: "Projects" },
  { href: "/signals", label: "Signals" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/network", label: "Network" },
  { href: "/wallet", label: "Wallet" },
] as const;

export function SiteNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Primary navigation"}
      className={cn(
        mobile
          ? "flex gap-1 overflow-x-auto px-4 pb-2 md:hidden"
          : "hidden items-center gap-6 text-sm font-semibold text-ink/60 md:flex",
      )}
    >
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 transition",
              mobile
                ? "rounded-md px-3 py-2 text-xs font-black"
                : "hover:text-ink",
              isActive
                ? mobile
                  ? "bg-ink text-paper"
                  : "text-blueprint"
                : mobile
                  ? "text-ink/55 hover:bg-white hover:text-ink"
                  : undefined,
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
