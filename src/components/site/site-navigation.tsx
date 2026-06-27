"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  { disabled: false, href: "/projects", label: "Projects" },
  { disabled: false, href: "/submit", label: "Submit" },
  { disabled: false, href: "/builders", label: "Builders" },
  { disabled: false, href: "/agent", label: "Agent" },
  { disabled: false, href: "/leaderboard", label: "Leaderboard" },
  { disabled: false, href: "/network", label: "Network" },
  { disabled: false, href: "/wallet", label: "Wallet" },
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
        if (item.disabled) {
          return (
            <span
              aria-disabled="true"
              className={cn(
                "shrink-0 cursor-not-allowed text-ink/25",
                mobile
                  ? "rounded-md px-3 py-2 text-xs font-black"
                  : "inline-flex items-center gap-1.5",
              )}
              key={item.href}
              title="Coming soon"
            >
              {item.label}
              <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[9px] font-black uppercase">
                Soon
              </span>
            </span>
          );
        }

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
