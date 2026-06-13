"use client";

import { CheckCircle2, ClipboardCheck, Send, ShieldCheck } from "lucide-react";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import type { z } from "zod";

import {
  createProjectSubmission,
  type SubmissionActionResult,
} from "@/app/admin/projects/new/actions";
import { ProjectLogo } from "@/components/projects/project-logo";
import {
  projectSubmissionSchema,
  submissionCategories,
  type ProjectSubmissionInput,
} from "@/lib/project-submission";
import { slugifyProjectName } from "@/lib/slug";

type FieldErrors = Partial<Record<keyof ProjectSubmissionInput, string>>;

const initialValues: ProjectSubmissionInput = {
  builderName: "",
  builderXUrl: "",
  category: "AI Agents",
  contact: "",
  description: "",
  discordUrl: "",
  githubUrl: "",
  logoUrl: "",
  name: "",
  projectWallet: "",
  slug: "",
  tagline: "",
  websiteUrl: "",
  projectXUrl: "",
};

export function SubmitProjectForm() {
  const [values, setValues] = useState<ProjectSubmissionInput>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [packet, setPacket] = useState<ProjectSubmissionInput | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [actionResult, setActionResult] =
    useState<SubmissionActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const readiness = useMemo(
    () => [
      {
        label: "Clear project identity",
        done: values.name.trim().length >= 2 && values.tagline.trim().length > 8,
      },
      {
        label: "Useful builder context",
        done: values.builderName.trim().length >= 2,
      },
      {
        label: "Public proof link",
        done: Boolean(
          values.websiteUrl ||
            values.projectXUrl ||
            values.builderXUrl ||
            values.githubUrl ||
            values.discordUrl,
        ),
      },
      {
        label: "Tip wallet ready",
        done: /^0x[a-fA-F0-9]{40}$/.test(values.projectWallet ?? ""),
      },
    ],
    [values],
  );

  function updateField<Key extends keyof ProjectSubmissionInput>(
    key: Key,
    value: ProjectSubmissionInput[Key],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
  }

  function updateName(value: string) {
    setValues((current) => ({
      ...current,
      name: value,
      slug: slugEdited ? current.slug : slugifyProjectName(value),
    }));
    setErrors((current) => ({
      ...current,
      name: undefined,
      slug: undefined,
    }));
  }

  function updateSlug(value: string) {
    setSlugEdited(true);
    updateField("slug", slugifyProjectName(value));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = projectSubmissionSchema.safeParse(values);

    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      setPacket(null);
      return;
    }

    setErrors({});
    setActionResult(null);
    setPacket(result.data);

    startTransition(async () => {
      const response = await createProjectSubmission(result.data);

      setActionResult(response);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        className="grid gap-4 rounded-lg border border-ink/10 bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="text-sm font-black uppercase text-blueprint">
            Internal curation
          </p>
          <h1 className="mt-2 text-4xl font-black text-ink">
            Add a project candidate
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
            This is an internal ArcRadar intake form. Public builders cannot
            submit projects directly; we curate and add projects ourselves.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            error={errors.name}
            label="Project name"
            value={values.name}
            onChange={updateName}
          />
          <TextField
            error={errors.builderName}
            label="Builder or team"
            value={values.builderName}
            onChange={(value) => updateField("builderName", value)}
          />
        </div>

        <div className="grid gap-4 rounded-lg border border-ink/10 bg-paper p-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <ProjectLogo
            accent="blueprint"
            logoUrl={values.logoUrl}
            name={values.name || "New project"}
            size="lg"
          />
          <div>
            <TextField
              error={errors.logoUrl}
              label="Project logo URL"
              value={values.logoUrl ?? ""}
              onChange={(value) => updateField("logoUrl", value)}
            />
            <p className="mt-2 text-xs font-semibold leading-5 text-ink/45">
              Use the project&apos;s official square logo when available. PNG,
              WebP, or SVG works best.
            </p>
          </div>
        </div>

        <TextField
          error={errors.slug}
          label="Project slug"
          value={values.slug ?? ""}
          onChange={updateSlug}
        />

        <TextField
          error={errors.tagline}
          label="Tagline"
          value={values.tagline}
          onChange={(value) => updateField("tagline", value)}
        />

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase text-ink/45">
            Description
          </span>
          <textarea
            className="min-h-36 rounded-lg border border-ink/10 bg-paper px-3 py-3 text-sm font-semibold leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-blueprint"
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
          {errors.description ? <ErrorText text={errors.description} /> : null}
        </label>

        <label className="grid gap-2 md:w-1/2">
          <span className="text-xs font-black uppercase text-ink/45">
            Category
          </span>
          <select
            className="min-h-11 rounded-lg border border-ink/10 bg-paper px-3 text-sm font-black text-ink outline-none transition focus:border-blueprint"
            value={values.category}
            onChange={(event) =>
              updateField(
                "category",
                event.target.value as ProjectSubmissionInput["category"],
              )
            }
          >
            {submissionCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            error={errors.projectWallet}
            label="Arc tip wallet"
            value={values.projectWallet ?? ""}
            onChange={(value) => updateField("projectWallet", value)}
          />
          <TextField
            error={errors.contact}
            label="Contact"
            value={values.contact ?? ""}
            onChange={(value) => updateField("contact", value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            error={errors.websiteUrl}
            label="Website"
            value={values.websiteUrl ?? ""}
            onChange={(value) => updateField("websiteUrl", value)}
          />
          <TextField
            error={errors.projectXUrl}
            label="Project X / Twitter"
            value={values.projectXUrl ?? ""}
            onChange={(value) => updateField("projectXUrl", value)}
          />
          <TextField
            error={errors.builderXUrl}
            label="Builder X / Twitter"
            value={values.builderXUrl ?? ""}
            onChange={(value) => updateField("builderXUrl", value)}
          />
          <TextField
            error={errors.discordUrl}
            label="Discord"
            value={values.discordUrl ?? ""}
            onChange={(value) => updateField("discordUrl", value)}
          />
          <TextField
            error={errors.githubUrl}
            label="GitHub"
            value={values.githubUrl ?? ""}
            onChange={(value) => updateField("githubUrl", value)}
          />
        </div>

        <button
          className="btn-primary min-h-12 justify-self-start"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving" : "Save internal candidate"}
          <Send aria-hidden className="size-4" />
        </button>
      </form>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <ClipboardCheck aria-hidden className="size-5 text-blueprint" />
            <span className="text-xs font-black uppercase text-ink/40">
              Review readiness
            </span>
          </div>
          <div className="grid gap-3">
            {readiness.map((item) => (
              <div
                className="flex items-center gap-3 rounded-lg border border-ink/10 bg-paper p-3"
                key={item.label}
              >
                <CheckCircle2
                  aria-hidden
                  className={`size-5 ${item.done ? "text-forest" : "text-ink/25"}`}
                />
                <span className="text-sm font-bold text-ink/65">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <ShieldCheck aria-hidden className="size-5 text-forest" />
            <span className="text-xs font-black uppercase text-ink/40">
              Curation rules
            </span>
          </div>
          <div className="grid gap-3 text-sm font-semibold leading-6 text-ink/60">
            <p>Arc Testnet only until mainnet scope is explicit.</p>
            <p>No guaranteed yield, no fake verification, no hidden custody claim.</p>
            <p>Every listed project needs at least one public proof link.</p>
          </div>
        </section>

        {packet ? (
          <section className="rounded-lg border border-forest/25 bg-mint/20 p-5">
            <p className="text-sm font-black uppercase text-forest">
              {actionResult?.status === "success"
                ? "Submission saved"
                : "Packet ready"}
            </p>
            <h2 className="mt-2 text-2xl font-black text-ink">{packet.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
              {actionResult?.status === "success"
                ? `Saved to the internal review queue. ID: ${actionResult.id}`
                : "Validated locally. Waiting for the database response."}
            </p>
            {actionResult?.status === "error" ? (
              <p className="mt-3 text-sm font-black text-coral">
                {actionResult.message}
              </p>
            ) : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function TextField({
  error,
  label,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase text-ink/45">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-ink/10 bg-paper px-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink/35 focus:border-blueprint"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <ErrorText text={error} /> : null}
    </label>
  );
}

function ErrorText({ text }: { text: string }) {
  return <span className="text-xs font-bold text-coral">{text}</span>;
}

function getFieldErrors(error: z.ZodError<ProjectSubmissionInput>) {
  return error.issues.reduce<FieldErrors>((accumulator, issue) => {
    const key = issue.path[0] as keyof ProjectSubmissionInput | undefined;

    if (key) {
      accumulator[key] = issue.message;
    }

    return accumulator;
  }, {});
}
