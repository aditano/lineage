import { getRequest } from "@tanstack/react-start/server";
import { briefingRateLimiter, clientKeyFromHeaders } from "./briefing-rate-limit";

/**
 * Enforce the briefing rate limit for the current server-function request.
 * Keep this in a `.server.ts` module so `getRequest` never ships to the browser.
 */
export function assertBriefingRateLimit(): void {
  const request = getRequest();
  const key = request ? clientKeyFromHeaders(request.headers) : "unknown";
  briefingRateLimiter.assertAllowed(key);
}
