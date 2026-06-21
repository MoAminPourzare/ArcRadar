const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"] as const;
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

const extensionByMimeType = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
} as const;

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

  const expectedExtensions =
    extensionByMimeType[type as keyof typeof extensionByMimeType];

  if (!expectedExtensions.includes(extension as never)) {
    return {
      ok: false,
      reason: "Image extension does not match its MIME type.",
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

export function hasValidImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((byte, index) => bytes[index] === byte);
  }

  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/webp") {
    return (
      readAscii(bytes, 0, 4) === "RIFF" &&
      readAscii(bytes, 8, 12) === "WEBP"
    );
  }

  return false;
}

export function getSafeImageExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return null;
}

function readAscii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}
