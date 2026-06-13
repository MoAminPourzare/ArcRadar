import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ArcWalletConsole } from "@/components/wallet/arc-wallet-console";

export const metadata: Metadata = {
  title: "Wallet",
  description:
    "Connect a wallet and verify its Arc Testnet network and canonical USDC balance.",
};

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <main>
        <ArcWalletConsole />
      </main>
      <SiteFooter />
    </div>
  );
}
