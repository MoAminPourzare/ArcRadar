"use client";

import { MoonStarsIcon as Moon, SunHorizonIcon as Sun } from "@phosphor-icons/react";

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";

    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("arc-radar-theme", nextTheme);
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="grid size-10 place-items-center rounded-lg border border-ink/10 bg-white text-ink shadow-sm transition hover:border-blueprint/40 hover:text-blueprint disabled:cursor-wait"
      onClick={toggleTheme}
      title="Toggle color theme"
      type="button"
    >
      <Moon aria-hidden className="size-5 dark:hidden" weight="duotone" />
      <Sun aria-hidden className="hidden size-5 dark:block" weight="duotone" />
    </button>
  );
}
