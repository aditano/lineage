/**
 * In-memory rate limit for the optional Grok briefing server function.
 *
 * The briefing endpoint is public (local forensic read stays available without
 * sign-in) but spends a shared upstream API key, so we cap calls per client key.
 * Process-local counters are enough for a single Node/Nitro instance; multi-
 * instance deployments may want an upstream / shared store later.
 */

export type BriefingRateLimitOptions = {
  /** Max successful takes per client inside one window. */
  limit: number;
  /** Sliding fixed window length in milliseconds. */
  windowMs: number;
  /** Injectable clock for tests. */
  now?: () => number;
};

export type BriefingRateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number };

type Bucket = {
  count: number;
  resetAt: number;
};

export class BriefingRateLimitError extends Error {
  readonly status = 429;
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("Too many briefing requests. Try again shortly.");
    this.name = "BriefingRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export function createBriefingRateLimiter(options: BriefingRateLimitOptions) {
  const { limit, windowMs } = options;
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();

  function take(clientKey: string): BriefingRateLimitResult {
    const key = clientKey.trim() || "unknown";
    const t = now();
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= t) {
      buckets.set(key, { count: 1, resetAt: t + windowMs });
      return { ok: true, remaining: Math.max(0, limit - 1) };
    }
    if (existing.count >= limit) {
      return { ok: false, retryAfterMs: Math.max(1, existing.resetAt - t) };
    }
    existing.count += 1;
    return { ok: true, remaining: Math.max(0, limit - existing.count) };
  }

  function assertAllowed(clientKey: string): void {
    const result = take(clientKey);
    if (!result.ok) throw new BriefingRateLimitError(result.retryAfterMs);
  }

  return { take, assertAllowed };
}

/** Default briefing budget: 10 full reads per IP per minute. */
export const briefingRateLimiter = createBriefingRateLimiter({
  limit: 10,
  windowMs: 60_000,
});

/** Prefer the left-most forwarded client address, then common proxy headers. */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  return "unknown";
}
