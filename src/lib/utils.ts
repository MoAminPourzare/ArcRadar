import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, visible = 4) {
  if (address.length <= visible * 2 + 2) {
    return address;
  }

  return `${address.slice(0, visible + 2)}...${address.slice(-visible)}`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}
