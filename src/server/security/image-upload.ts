const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"] as const;
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const imageUploadPolicy = {
  allowedExtensions,
  allowedMimeTypes,
  maxBytes: 2_000_000,
} as const;

export type ImageUploadCandidate = {
  name: string;
  size: number;
  type: string;
};

export type ImageUploadValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

export function validateImageUploadCandidate({
  name,
  size,
  type,
}: ImageUploadCandidate): ImageUploadValidationResult {
  const normalizedName = name.trim().toLowerCase();
  const extension = allowedExtensions.find((candidate) =>
    normalizedName.endsWith(candidate),
  );

  if (!normalizedName || /[\\/]/.test(normalizedName)) {
    return {
      ok: false,
      reason: "Image filename is invalid.",
    };
  }

  if (!extension) {
    return {
      ok: false,
      reason: "Only JPG, PNG, and WebP images are accepted.",
    };
  }

  if (!allowedMimeTypes.includes(type as (typeof allowedMimeTypes)[number])) {
    return {
      ok: false,
      reason: "Image MIME type is not accepted.",
    };
  }

  if (size <= 0 || size > imageUploadPolicy.maxBytes) {
    return {
      ok: false,
      reason: "Image size must be between 1 byte and 2 MB.",
    };
  }

  return {
    ok: true,
  };
}
