export const SCORE_FAMILIES = [
  "human",
  "claude",
  "gpt",
  "gemini",
  "grok",
  "deepseek",
  "llama",
  "other",
] as const;

export type ScoreFamily = (typeof SCORE_FAMILIES)[number];

export type ModelFamily = ScoreFamily | "mixed" | "unclear";

export type Verdict = "likely-human" | "leaning-human" | "mixed" | "leaning-ai" | "likely-ai";

export type Resolution = "exact" | "generation" | "family" | "unresolved";

export const MODEL_IDS = [
  "gpt-3.5",
  "gpt-4",
  "gpt-4o",
  "gpt-5",
  "o-series",
  "claude-3",
  "claude-4",
  "claude-5",
  "gemini-1.5",
  "gemini-2.5",
  "gemini-3",
  "grok-3",
  "grok-4",
  "deepseek-v3",
  "deepseek-r1",
  "llama-3",
] as const;

export type ModelId = (typeof MODEL_IDS)[number];

export type Signal = {
  id: string;
  label: string;
  value: number;
  humanEnd: string;
  machineEnd: string;
  note: string;
};

export type FamilyScore = {
  id: ScoreFamily;
  label: string;
  score: number;
  reasons: string[];
};

export type Tell = {
  phrase: string;
  start: number;
  end: number;
  leans: ModelFamily | "ai";
  note: string;
};

/** What the desk will stand behind about a specific model. */
export type ModelCall = {
  id: ModelId | null;
  label: string;
  /** Set only when the text itself names a version. */
  exactName: string | null;
  resolution: Resolution;
  /** Confidence in the model claim, not in the human/machine read. */
  confidence: number;
  evidence: string[];
};

export type ForensicReport = {
  wordCount: number;
  sentenceCount: number;
  charCount: number;
  paragraphCount: number;
  avgSentence: number;
  burstiness: number;
  aiLikelihood: number;
  confidence: number;
  verdict: Verdict;
  family: ModelFamily;
  familyScores: FamilyScore[];
  modelCall: ModelCall;
  signals: Signal[];
  tells: Tell[];
  summary: string;
  caveats: string[];
  source: "local" | "merged";
  briefing?: string;
};

export type MarkerSpecificity = "family" | "generation" | "ai" | "human";

export type Marker = {
  id: string;
  re: RegExp;
  note: string;
  weight: number;
  family?: ScoreFamily;
  model?: ModelId;
  specificity: MarkerSpecificity;
};

export type TraceHit = {
  id: string;
  note: string;
  weight: number;
  family?: ScoreFamily;
  model?: ModelId;
  kind: "marker" | "self-id" | "structure";
};

export type ScoreTrace = {
  hits: TraceHit[];
  familyRaw: Record<ScoreFamily, number>;
  modelRaw: Partial<Record<ModelId, number>>;
  modelHits: Partial<Record<ModelId, string[]>>;
};

export type ScoredText = {
  report: ForensicReport;
  trace: ScoreTrace;
};
