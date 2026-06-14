import { z } from "zod";

import { PROJECT_ID_MAX_LENGTH, PROJECT_ID_PATTERN } from "@/lib/project-id";

export const submissionCategories = [
  "AI Agents",
  "Blockchain",
  "Dashboards",
  "DEX",
  "Payments",
  "DeFi",
  "Faucets",
  "Games",
  "Infrastructure",
  "NFTs",
  "Other",
  "Security",
  "Wallets",
  "Developer Tools",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().url().optional());

export const projectSubmissionSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(PROJECT_ID_MAX_LENGTH)
    .regex(
      PROJECT_ID_PATTERN,
      "Use lowercase letters, numbers, and hyphens",
    )
    .optional()
    .or(z.literal("")),
  name: z.string().trim().min(2, "Project name is too short").max(120),
  tagline: z.string().trim().min(8, "Tagline needs more signal").max(180),
  description: z
    .string()
    .trim()
    .min(40, "Description should explain what the project does")
    .max(900),
  category: z.enum(submissionCategories),
  builderName: z.string().trim().min(2, "Builder name is required").max(120),
  contact: z.string().trim().max(160).optional(),
  projectWallet: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Use a valid EVM wallet address")
    .optional()
    .or(z.literal("")),
  logoUrl: optionalUrl,
  websiteUrl: optionalUrl,
  projectXUrl: optionalUrl,
  builderXUrl: optionalUrl,
  githubUrl: optionalUrl,
});

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>;
