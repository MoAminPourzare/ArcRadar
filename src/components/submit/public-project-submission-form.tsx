"use client";

import {
  CheckCircleIcon as CheckCircle,
  ImageIcon as ImageSquare,
  PaperPlaneTiltIcon as Send,
  ShieldCheckIcon as ShieldCheck,
  SpinnerGapIcon as Loader,
} from "@phosphor-icons/react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { ProjectLogo } from "@/components/projects/project-logo";
import { submissionCategories } from "@/lib/project-submission";
import {
  imageUploadPolicy,
  validateImageUploadCandidate,
} from "@/server/security/image-upload";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { message: string; status: "error" }
  | { id: string; status: "success" };

export function PublicProjectSubmissionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [projectName, setProjectName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function handleLogoChange(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!file) {
      setLogo(null);
      setPreviewUrl(null);
      return;
    }

    const validation = validateImageUploadCandidate(file);

    if (!validation.ok) {
      setLogo(null);
      setPreviewUrl(null);
      setState({ message: validation.reason, status: "error" });
      return;
    }

    setLogo(file);
    setPreviewUrl(URL.createObjectURL(file));
    setState({ status: "idle" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!logo) {
      setState({ message: "Choose a project logo before submitting.", status: "error" });
      return;
    }

    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/projects/submit", {
        body: new FormData(event.currentTarget),
        method: "POST",
      });
      const result = (await response.json()) as { error?: string; id?: string };

      if (!response.ok || !result.id) {
        throw new Error(result.error ?? "The project could not be submitted.");
      }

      formRef.current?.reset();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setLogo(null);
      setProjectName("");
      setState({ id: result.id, status: "success" });
    } catch (error) {
      setState({
        message:
          error instanceof Error
            ? error.message
            : "The project could not be submitted.",
        status: "error",
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        className="grid gap-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <input
          aria-hidden
          autoComplete="off"
          className="hidden"
          name="company"
          tabIndex={-1}
        />

        <div>
          <p className="text-sm font-black uppercase text-blueprint">
            Builder submission
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink sm:text-4xl">
            Put your project on the radar
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">
            Submit an Arc project for review. Approved projects receive a public
            profile in the curated directory.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" name="name" required minLength={2} maxLength={120} onChange={setProjectName} />
          <Field label="Builder or team" name="builderName" required minLength={2} maxLength={120} />
        </div>

        <div className="grid gap-4 rounded-lg border border-ink/10 bg-paper p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <ProjectLogo
            accent="blueprint"
            logoUrl={previewUrl}
            name={projectName || "New project"}
            size="lg"
          />
          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-xs font-black uppercase text-ink/45">
              <ImageSquare aria-hidden className="size-4 text-blueprint" weight="duotone" />
              Project logo
            </span>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="min-h-11 w-full rounded-lg border border-ink/10 bg-white p-2 text-sm font-semibold file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-black file:text-paper"
              name="logo"
              required
              type="file"
              onChange={(event) => handleLogoChange(event.target.files?.[0] ?? null)}
            />
            <span className="text-xs font-semibold text-ink/45">
              Square JPG, PNG, or WebP. Maximum {imageUploadPolicy.maxBytes / 1_000_000} MB.
            </span>
          </label>
        </div>

        <Field label="Tagline" name="tagline" required minLength={8} maxLength={180} />

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase text-ink/45">Description</span>
          <textarea
            className="min-h-36 rounded-lg border border-ink/10 bg-paper px-3 py-3 text-sm font-semibold leading-6 text-ink outline-none transition focus:border-blueprint"
            maxLength={900}
            minLength={40}
            name="description"
            required
          />
        </label>

        <label className="grid gap-2 sm:w-1/2">
          <span className="text-xs font-black uppercase text-ink/45">Category</span>
          <select className="min-h-11 rounded-lg border border-ink/10 bg-paper px-3 text-sm font-black text-ink outline-none focus:border-blueprint" name="category">
            {submissionCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email or handle" name="contact" required minLength={3} maxLength={160} />
          <Field label="Arc tip wallet (optional)" name="projectWallet" pattern="^0x[a-fA-F0-9]{40}$" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website" name="websiteUrl" type="url" />
          <Field label="Project X / Twitter" name="projectXUrl" type="url" />
          <Field label="Builder X / Twitter" name="builderXUrl" type="url" />
          <Field label="GitHub" name="githubUrl" type="url" />
        </div>
        <p className="text-xs font-semibold text-ink/45">
          Include at least one public website, X profile, or GitHub repository.
          Contact information is visible only to ArcRadar moderators.
        </p>

        {state.status === "error" ? (
          <p className="rounded-lg border border-coral/30 bg-coral/10 p-3 text-sm font-bold text-coral" role="alert">
            {state.message}
          </p>
        ) : null}

        {state.status === "success" ? (
          <div className="rounded-lg border border-mint/40 bg-mint/15 p-4" role="status">
            <p className="flex items-center gap-2 font-black text-forest">
              <CheckCircle aria-hidden className="size-5" weight="fill" />
              Project submitted for review
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/55">
              Submission ID: <span className="font-mono">{state.id}</span>
            </p>
          </div>
        ) : null}

        <button className="btn-primary min-h-12 justify-self-start" disabled={state.status === "submitting"} type="submit">
          {state.status === "submitting" ? <Loader aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" weight="bold" />}
          {state.status === "submitting" ? "Submitting" : "Submit project"}
        </button>
      </form>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <ShieldCheck aria-hidden className="size-7 text-forest" weight="duotone" />
          <h2 className="mt-4 text-xl font-black text-ink">Curated before publishing</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">
            ArcRadar reviews project identity, Arc relevance, public links, and
            the submitted logo before the profile appears in the directory.
          </p>
        </section>
        <section className="rounded-lg border border-blueprint/20 bg-blueprint/5 p-5">
          <p className="text-xs font-black uppercase text-blueprint">Listing rules</p>
          <div className="mt-3 grid gap-3 text-sm font-semibold leading-6 text-ink/60">
            <p>The project must be built on or directly support Arc.</p>
            <p>Links and claims must be public and verifiable.</p>
            <p>Duplicate, deceptive, or unsafe submissions are rejected.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  onChange,
  ...inputProps
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "onChange">) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase text-ink/45">{label}</span>
      <input
        className="min-h-11 rounded-lg border border-ink/10 bg-paper px-3 text-sm font-semibold text-ink outline-none transition focus:border-blueprint"
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        {...inputProps}
      />
    </label>
  );
}
