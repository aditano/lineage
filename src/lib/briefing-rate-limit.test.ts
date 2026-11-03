import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BriefingRateLimitError,
  createBriefingRateLimiter,
  clientKeyFromHeaders,
} from "./briefing-rate-limit.ts";

test("briefing rate limiter allows traffic under the limit", () => {
  const limiter = createBriefingRateLimiter({ limit: 3, windowMs: 60_000, now: () => 1_000 });
  assert.equal(limiter.take("ip-a").ok, true);
  assert.equal(limiter.take("ip-a").ok, true);
  assert.equal(limiter.take("ip-a").ok, true);
});

test("briefing rate limiter rejects traffic over the limit", () => {
  const limiter = createBriefingRateLimiter({ limit: 2, windowMs: 60_000, now: () => 1_000 });
  assert.equal(limiter.take("ip-a").ok, true);
  assert.equal(limiter.take("ip-a").ok, true);
  const blocked = limiter.take("ip-a");
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterMs > 0);
  assert.throws(() => limiter.assertAllowed("ip-a"), BriefingRateLimitError);
});

test("briefing rate limiter isolates clients", () => {
  const limiter = createBriefingRateLimiter({ limit: 1, windowMs: 60_000, now: () => 1_000 });
  assert.equal(limiter.take("ip-a").ok, true);
  assert.equal(limiter.take("ip-b").ok, true);
  assert.equal(limiter.take("ip-a").ok, false);
});

test("briefing rate limiter resets after the window", () => {
  let now = 1_000;
  const limiter = createBriefingRateLimiter({
    limit: 1,
    windowMs: 1_000,
    now: () => now,
  });
  assert.equal(limiter.take("ip-a").ok, true);
  assert.equal(limiter.take("ip-a").ok, false);
  now = 2_001;
  assert.equal(limiter.take("ip-a").ok, true);
});

test("clientKeyFromHeaders prefers forwarded client IP", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    "x-real-ip": "198.51.100.7",
  });
  assert.equal(clientKeyFromHeaders(headers), "203.0.113.10");
});

test("clientKeyFromHeaders falls back when no IP headers are present", () => {
  assert.equal(clientKeyFromHeaders(new Headers()), "unknown");
});
