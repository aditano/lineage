import { analyzeText, type ForensicReport } from "./forensics.ts";

declare const __LINEAGE_BRIEFING_SERVER__: boolean | undefined;

export type LocalFullRead = {
  ok: true;
  report: ForensicReport;
  usedModel: false;
};

/** True when this build can POST the optional Grok briefing. Static Pages cannot. */
export function briefingServerEnabled(): boolean {
  return typeof __LINEAGE_BRIEFING_SERVER__ === "boolean" ? __LINEAGE_BRIEFING_SERVER__ : true;
}

export function localFullRead(text: string): LocalFullRead {
  return {
    ok: true,
    report: analyzeText(text),
    usedModel: false,
  };
}

/**
 * GitHub Pages answers the missing server function with 405 and no JSON
 * content-type. The TanStack client turns that into "Invariant failed".
 * That is a transport miss, not a failed forensic read.
 */
export function isBriefingTransportError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  if (!message.trim()) return true;
  return (
    message.includes("invariant failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network error") ||
    message.includes("load failed") ||
    message.includes("not allowed") ||
    message.includes("405") ||
    message.includes("<html") ||
    message.includes("unexpected token") ||
    message.includes("content-type") ||
    message.includes("serverfn") ||
    message.includes("server function")
  );
}
