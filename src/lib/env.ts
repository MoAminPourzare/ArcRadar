import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
});
