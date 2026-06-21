import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasValidImageSignature,
  validateImageUploadCandidate,
} from "../src/server/security/image-upload.js";

describe("project logo upload policy", function () {
  it("accepts supported image metadata", function () {
    assert.deepEqual(
      validateImageUploadCandidate({
        name: "arc-project.png",
        size: 128_000,
        type: "image/png",
      }),
      { ok: true },
    );
  });

  it("rejects mismatched extensions and MIME types", function () {
    assert.equal(
      validateImageUploadCandidate({
        name: "arc-project.png",
        size: 128_000,
        type: "image/jpeg",
      }).ok,
      false,
    );
  });

  it("rejects oversized uploads", function () {
    assert.equal(
      validateImageUploadCandidate({
        name: "arc-project.webp",
        size: 2_000_001,
        type: "image/webp",
      }).ok,
      false,
    );
  });

  it("validates PNG, JPEG, and WebP file signatures", function () {
    assert.equal(
      hasValidImageSignature(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
      true,
    );
    assert.equal(
      hasValidImageSignature(new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg"),
      true,
    );
    assert.equal(
      hasValidImageSignature(
        new TextEncoder().encode("RIFF0000WEBP"),
        "image/webp",
      ),
      true,
    );
    assert.equal(
      hasValidImageSignature(new TextEncoder().encode("<svg></svg>"), "image/png"),
      false,
    );
  });
});
