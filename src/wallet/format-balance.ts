import { formatUnits } from "viem";

export function formatWalletBalance(value: bigint, decimals: number) {
  const [whole, fraction = ""] = formatUnits(value, decimals).split(".");
  const groupedWhole = BigInt(whole).toLocaleString("en");
  const maximumFractionDigits = whole === "0" ? 6 : 3;
  const visibleFraction = fraction
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");

  return visibleFraction
    ? `${groupedWhole}.${visibleFraction}`
    : groupedWhole;
}
