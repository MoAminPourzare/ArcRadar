import { z } from "zod";

export const submissionCategories = [
  "AI Agents",
  "Payments",
  "DeFi",
  "Infrastructure",
  "Wallets",
  "Developer Tools",
] as const;

export const submissionStages = [
  "Prototype",
  "Public Testnet",
  "Community",
  "Partner",
  "Research",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().url().optional());

export const projectSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Project name is too short").max(120),
  tagline: z.string().trim().min(8, "Tagline needs more signal").max(180),
  description: z
    .string()
    .trim()
    .min(40, "Description should explain what the project does")
    .max(900),
  category: z.enum(submissionCategories),
  stage: z.enum(submissionStages),
  builderName: z.string().trim().min(2, "Builder name is required").max(120),
  contact: z.string().trim().max(160).optional(),
  projectWallet: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Use a valid EVM wallet address")
    .optional()
    .or(z.literal("")),
  websiteUrl: optionalUrl,
  xUrl: optionalUrl,
  discordUrl: optionalUrl,
  githubUrl: optionalUrl,
});

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>;
