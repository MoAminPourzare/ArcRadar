type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult =
  | {
      ok: true;
      remaining: number;
      resetAt: Date;
    }
  | {
      ok: false;
      retryAfterSeconds: number;
      resetAt: Date;
    };

declare global {
  var arcRadarRateLimitBuckets: Map<string, RateLimitBucket> | undefined;
}

const buckets =
  globalThis.arcRadarRateLimitBuckets ??
  new Map<string, RateLimitBucket>();

globalThis.arcRadarRateLimitBuckets = buckets;

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, {
      count: 1,
      resetAt,
    });

    return {
      ok: true,
      remaining: limit - 1,
      resetAt: new Date(resetAt),
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1_000),
      resetAt: new Date(existing.resetAt),
    };
  }

  existing.count += 1;

  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: new Date(existing.resetAt),
  };
}

export function formatRateLimitMessage(result: Extract<RateLimitResult, { ok: false }>) {
  return `Too many admin actions. Try again in ${result.retryAfterSeconds} seconds.`;
}
