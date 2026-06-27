import { isAddress } from "viem";

import { ARC_READINESS_AUDIT_AGENT_ID } from "@/types/agent";

const fallbackFeeRecipient =
  "0x7D98f82EE1B3f05c181e933f3574BE158E6d1839" as const;

const configuredFeeRecipient =
  process.env.NEXT_PUBLIC_AGENT_FEE_RECIPIENT_ADDRESS;

export const agentFeeRecipientAddress =
  configuredFeeRecipient && isAddress(configuredFeeRecipient)
    ? configuredFeeRecipient
    : fallbackFeeRecipient;

export const agentPaymentConfig = {
  arcReadinessAudit: {
    agentId: ARC_READINESS_AUDIT_AGENT_ID,
    priceLabel: "0.05 USDC",
    priceUsdc: "0.05",
    priceUsdcMicro: 50_000n,
    recipientAddress: agentFeeRecipientAddress as `0x${string}`,
  },
} as const;
