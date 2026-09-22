import { FAMILY_META, familyLabel, isModelId, MODEL_CATALOG } from "./catalog.ts";
import { verdictFrom } from "./score.ts";
import type {
  FamilyScore,
  ForensicReport,
  ModelCall,
  ModelFamily,
  ModelId,
  ScoreFamily,
  Tell,
  Verdict,
} from "./types.ts";

function clamp(n: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, n));
}

function unresolved(): ModelCall {
  return {
    id: null,
    label: "Unresolved",
    exactName: null,
    resolution: "unresolved",
    confidence: 0,
    evidence: [],
  };
}

export function emptyReport(): ForensicReport {
  return {
    wordCount: 0,
    sentenceCount: 0,
    charCount: 0,
    paragraphCount: 0,
    avgSentence: 0,
    burstiness: 0,
    aiLikelihood: 50,
    confidence: 0,
    verdict: "mixed",
    family: "unclear",
    familyScores: [],
    modelCall: unresolved(),
    signals: [],
    tells: [],
    summary: "",
    caveats: [],
    source: "local",
  };
}

function familyOnly(evidence: string[]): ModelCall {
  return {
    id: null,
    label: "Unresolved",
    exactName: null,
    resolution: "family",
    confidence: 34,
    evidence: evidence.slice(0, 3),
  };
}

/**
 * The briefing may confirm a generation. It may not invent an exact checkpoint,
 * and a disagreement drops the model claim back to the house style.
 */
export function mergeModelCalls(
  local: ModelCall,
  remote: ModelCall | undefined,
  family: ModelFamily,
): ModelCall {
  if (!remote) return local;
  if (local.resolution === "exact") return local;
  if (remote.resolution === "exact") return local;

  const remoteId = remote.id && isModelId(remote.id) ? remote.id : null;
  if (
    remote.resolution === "generation" &&
    remoteId &&
    local.resolution === "generation" &&
    local.id &&
    local.id !== remoteId
  ) {
    return familyOnly(["Local read and briefing named different models."]);
  }

  if (
    remote.resolution === "generation" &&
    remoteId &&
    MODEL_CATALOG[remoteId].family === family &&
    (local.resolution === "family" || local.resolution === "unresolved" || local.id === remoteId)
  ) {
    if (local.resolution === "generation" && local.id === remoteId) {
      return {
        ...local,
        confidence: Math.max(local.confidence, Math.min(remote.confidence, 70)),
        evidence: local.evidence.slice(0, 3),
      };
    }
    if (local.resolution === "family" || local.resolution === "unresolved") {
      return {
        id: remoteId,
        label: MODEL_CATALOG[remoteId].label,
        exactName: null,
        resolution: "generation",
        confidence: Math.min(remote.confidence || 60, 64),
        evidence: ["Briefing named a generation; the local pass had not separated one."],
      };
    }
  }

  return local;
}

export function mergeReports(
  local: ForensicReport,
  remote: Partial<ForensicReport> & {
    aiLikelihood?: number;
    familyScores?: FamilyScore[];
    briefing?: string;
    tells?: Tell[];
    family?: ModelFamily;
    verdict?: Verdict;
    summary?: string;
    caveats?: string[];
    confidence?: number;
    modelCall?: ModelCall;
  },
): ForensicReport {
  const ai = Math.round(
    clamp(
      (local.aiLikelihood * 0.4 + (remote.aiLikelihood ?? local.aiLikelihood) * 0.6) / 100,
      0.06,
      0.94,
    ) * 100,
  );
  const familyMap = new Map<ScoreFamily, FamilyScore>();
  for (const score of local.familyScores)
    familyMap.set(score.id, { ...score, score: score.score * 0.4 });
  for (const score of remote.familyScores ?? []) {
    if (!familyMap.has(score.id) && !(score.id in FAMILY_META)) continue;
    const prev = familyMap.get(score.id);
    familyMap.set(score.id, {
      id: score.id,
      label: score.label || familyLabel(score.id),
      score: (prev?.score ?? 0) + score.score * 0.6,
      reasons: Array.from(new Set([...(prev?.reasons ?? []), ...score.reasons])).slice(0, 4),
    });
  }
  const mergedFam = Array.from(familyMap.values());
  const sum = mergedFam.reduce((acc, score) => acc + score.score, 0) || 1;
  const familyScores = mergedFam
    .map((score) => ({ ...score, score: score.score / sum }))
    .sort((a, b) => b.score - a.score);

  const top = familyScores[0];
  const second = familyScores[1];
  let family: ModelFamily = remote.family ?? top?.id ?? local.family;
  if (top && second && top.score - second.score < 0.07) family = ai > 52 ? "mixed" : "unclear";

  const remoteTells = (remote.tells ?? []).filter((tell) => tell.phrase && tell.note);
  const tells = [...remoteTells, ...local.tells].slice(0, 16);
  const modelCall = mergeModelCalls(local.modelCall, remote.modelCall, family);
  const caveats = Array.from(new Set([...(remote.caveats ?? []), ...local.caveats]));
  if (modelCall.evidence.includes("Local read and briefing named different models.")) {
    caveats.unshift(
      "Local read and briefing named different models, so the checkpoint was dropped.",
    );
  }

  return {
    ...local,
    aiLikelihood: ai,
    confidence: Math.max(local.confidence, remote.confidence ?? 0),
    verdict: remote.verdict ?? verdictFrom(ai),
    family,
    familyScores,
    modelCall,
    tells,
    summary: remote.summary || local.summary,
    caveats: caveats.slice(0, 5),
    source: "merged",
    briefing: remote.briefing,
  };
}

export function modelIdOf(call: ModelCall | undefined): ModelId | null {
  if (!call?.id || !isModelId(call.id)) return null;
  return call.id;
}
