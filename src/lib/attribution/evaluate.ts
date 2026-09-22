import { MODEL_CATALOG } from "./catalog.ts";
import type { CorpusCase } from "./corpus.ts";
import { scoreText } from "./score.ts";
import type { ForensicReport, ModelFamily } from "./types.ts";

export type CaseFailure = {
  id: string;
  reason: string;
};

export type VerificationReport = {
  clearCount: number;
  clearCorrect: number;
  clearFamilyAccuracy: number;
  modelCount: number;
  modelMatched: number;
  exactCount: number;
  exactMatched: number;
  falseExact: number;
  trapViolations: number;
  shortViolations: number;
  productViolations: number;
  confusion: Record<string, Record<string, number>>;
  failures: CaseFailure[];
};

function bump(matrix: Record<string, Record<string, number>>, expected: string, actual: string) {
  const row = matrix[expected] ?? {};
  row[actual] = (row[actual] ?? 0) + 1;
  matrix[expected] = row;
}

function describe(report: ForensicReport): string {
  const call = report.modelCall;
  return `family=${report.family} verdict=${report.verdict} ai=${report.aiLikelihood} resolution=${call.resolution} id=${call.id ?? "-"} name=${call.exactName ?? "-"} evidence=${call.evidence.join("; ")}`;
}

function allows(actual: ModelFamily, allow: ModelFamily[]): boolean {
  return allow.includes(actual);
}

export function verifyCorpus(cases: readonly CorpusCase[]): VerificationReport {
  const failures: CaseFailure[] = [];
  const confusion: Record<string, Record<string, number>> = {};
  let clearCount = 0;
  let clearCorrect = 0;
  let modelCount = 0;
  let modelMatched = 0;
  let exactCount = 0;
  let exactMatched = 0;
  let falseExact = 0;
  let trapViolations = 0;
  let shortViolations = 0;
  let productViolations = 0;

  for (const item of cases) {
    const { report, trace } = scoreText(item.text);
    const expectedFamily = item.family ?? "abstain";
    if (
      item.tier === "clear" ||
      item.tier === "model" ||
      item.tier === "exact" ||
      item.tier === "product"
    ) {
      bump(confusion, expectedFamily, report.family);
    }

    const exactClaim = report.modelCall.resolution === "exact";
    if (exactClaim && item.tier !== "exact") {
      falseExact += 1;
      failures.push({
        id: item.id,
        reason: `exact claim on a ${item.tier} case (${describe(report)})`,
      });
    }
    if (
      exactClaim &&
      !trace.hits.some((hit) => hit.kind === "self-id" && hit.id === "self-id-exact")
    ) {
      failures.push({ id: item.id, reason: "exact resolution without a self-identification hit" });
    }

    if (item.tier === "clear" && item.family) {
      clearCount += 1;
      const modelFamily = report.modelCall.id
        ? MODEL_CATALOG[report.modelCall.id].family
        : item.family;
      const ok = report.family === item.family && modelFamily === item.family;
      if (ok) clearCorrect += 1;
      else
        failures.push({
          id: item.id,
          reason: `clear family wanted ${item.family} (${describe(report)})`,
        });
    }

    if (item.tier === "model" && item.family && item.model) {
      modelCount += 1;
      const ok =
        report.family === item.family &&
        report.modelCall.id === item.model &&
        report.modelCall.resolution === "generation" &&
        report.modelCall.exactName == null;
      if (ok) modelMatched += 1;
      else
        failures.push({ id: item.id, reason: `model wanted ${item.model} (${describe(report)})` });
    }

    if (item.tier === "exact" && item.family && item.model && item.exactName) {
      exactCount += 1;
      const ok =
        report.family === item.family &&
        report.modelCall.resolution === "exact" &&
        report.modelCall.id === item.model &&
        (report.modelCall.exactName ?? "").includes(item.exactName);
      if (ok) exactMatched += 1;
      else
        failures.push({
          id: item.id,
          reason: `exact wanted ${item.exactName} (${describe(report)})`,
        });
    }

    if (item.tier === "product" && item.family) {
      const ok =
        report.family === item.family &&
        report.modelCall.resolution === "family" &&
        report.modelCall.id == null &&
        report.modelCall.exactName == null;
      if (!ok) {
        productViolations += 1;
        failures.push({
          id: item.id,
          reason: `product name wanted family ${item.family} (${describe(report)})`,
        });
      }
    }

    if (item.tier === "trap" && item.allow) {
      const named = report.modelCall.id != null || report.modelCall.resolution === "generation";
      const ok =
        allows(report.family, item.allow) && !named && report.modelCall.resolution !== "exact";
      if (!ok) {
        trapViolations += 1;
        failures.push({
          id: item.id,
          reason: `trap allow [${item.allow.join(", ")}] (${describe(report)})`,
        });
      }
    }

    if (item.tier === "short") {
      const ok =
        report.wordCount < 18 &&
        report.family === "unclear" &&
        report.modelCall.resolution === "unresolved" &&
        report.modelCall.id == null &&
        report.confidence <= 30;
      if (!ok) {
        shortViolations += 1;
        failures.push({
          id: item.id,
          reason: `short text failed to abstain (${describe(report)})`,
        });
      }
    }
  }

  return {
    clearCount,
    clearCorrect,
    clearFamilyAccuracy: clearCount ? clearCorrect / clearCount : 0,
    modelCount,
    modelMatched,
    exactCount,
    exactMatched,
    falseExact,
    trapViolations,
    shortViolations,
    productViolations,
    confusion,
    failures,
  };
}

export function formatVerification(report: VerificationReport): string {
  const lines = [
    `clear ${report.clearCorrect}/${report.clearCount} (${Math.round(report.clearFamilyAccuracy * 100)}%)`,
    `model ${report.modelMatched}/${report.modelCount}`,
    `exact ${report.exactMatched}/${report.exactCount}`,
    `falseExact ${report.falseExact}`,
    `traps ${report.trapViolations}`,
    `short ${report.shortViolations}`,
    `product ${report.productViolations}`,
    "confusion (expected → actual):",
  ];
  for (const [expected, row] of Object.entries(report.confusion)) {
    const cells = Object.entries(row)
      .map(([actual, n]) => `${actual}:${n}`)
      .join(" ");
    lines.push(`  ${expected} → ${cells}`);
  }
  if (report.failures.length) {
    lines.push("failures:");
    for (const failure of report.failures) lines.push(`  ${failure.id}: ${failure.reason}`);
  }
  return lines.join("\n");
}
