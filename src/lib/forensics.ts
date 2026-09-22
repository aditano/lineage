export type {
  FamilyScore,
  ForensicReport,
  Marker,
  ModelCall,
  ModelFamily,
  ModelId,
  Resolution,
  ScoreFamily,
  ScoredText,
  ScoreTrace,
  Signal,
  Tell,
  TraceHit,
  Verdict,
} from "./attribution/types.ts";

export { MODEL_IDS, SCORE_FAMILIES } from "./attribution/types.ts";
export {
  FAMILY_META,
  MODEL_CATALOG,
  familyLabel,
  isMachineFamily,
  isModelId,
  isScoreFamily,
  modelsInFamily,
} from "./attribution/catalog.ts";
export { ATTRIBUTION_POLICY, analyzeText, scoreText, verdictFrom } from "./attribution/score.ts";
export { emptyReport, mergeModelCalls, mergeReports } from "./attribution/merge.ts";
export { classifySpokenName, findSpokenIdentity, firstVersion } from "./attribution/mention.ts";
