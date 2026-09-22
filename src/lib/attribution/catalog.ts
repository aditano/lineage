import {
  MODEL_IDS,
  SCORE_FAMILIES,
  type ModelFamily,
  type ModelId,
  type ScoreFamily,
} from "./types.ts";

export type ModelSpec = {
  id: ModelId;
  family: ScoreFamily;
  label: string;
  /**
   * style: surface cues can name this generation.
   * self-id: only when the writing names the version. Later checkpoints
   * share a voice with the previous band, so we do not invent a split.
   */
  channel: "style" | "self-id";
};

export const MODEL_CATALOG: Record<ModelId, ModelSpec> = {
  "gpt-3.5": { id: "gpt-3.5", family: "gpt", label: "GPT-3.5 / early ChatGPT", channel: "style" },
  "gpt-4": { id: "gpt-4", family: "gpt", label: "GPT-4 class", channel: "style" },
  "gpt-4o": { id: "gpt-4o", family: "gpt", label: "GPT-4o / later ChatGPT", channel: "style" },
  "gpt-5": { id: "gpt-5", family: "gpt", label: "GPT-5 class", channel: "self-id" },
  "o-series": { id: "o-series", family: "gpt", label: "OpenAI o-series", channel: "style" },
  "claude-3": { id: "claude-3", family: "claude", label: "Claude 3", channel: "style" },
  "claude-4": { id: "claude-4", family: "claude", label: "Claude 4 class", channel: "style" },
  "claude-5": { id: "claude-5", family: "claude", label: "Claude 5 class", channel: "self-id" },
  "gemini-1.5": { id: "gemini-1.5", family: "gemini", label: "Gemini 1.5 class", channel: "style" },
  "gemini-2.5": { id: "gemini-2.5", family: "gemini", label: "Gemini 2.5 class", channel: "style" },
  "gemini-3": { id: "gemini-3", family: "gemini", label: "Gemini 3 class", channel: "self-id" },
  "grok-3": { id: "grok-3", family: "grok", label: "Grok 3 class", channel: "style" },
  "grok-4": { id: "grok-4", family: "grok", label: "Grok 4 class", channel: "style" },
  "deepseek-v3": { id: "deepseek-v3", family: "deepseek", label: "DeepSeek V3", channel: "style" },
  "deepseek-r1": { id: "deepseek-r1", family: "deepseek", label: "DeepSeek-R1", channel: "style" },
  "llama-3": { id: "llama-3", family: "llama", label: "Llama 3 class", channel: "style" },
};

export const FAMILY_META: Record<
  Exclude<ModelFamily, "unclear">,
  { label: string; blurb: string }
> = {
  human: {
    label: "Human",
    blurb: "Uneven rhythm, specific detail, and a voice that wanders.",
  },
  claude: {
    label: "Claude",
    blurb: "Careful hypotaxis, em-dashes, and collaborative hedging.",
  },
  gpt: {
    label: "ChatGPT",
    blurb: "Polite scaffolding, tidy thirds, and stock corporate diction.",
  },
  gemini: {
    label: "Gemini",
    blurb: "Outlined breakdowns, restated questions, key-takeaway voice.",
  },
  grok: {
    label: "Grok",
    blurb: "Punchy, opinionated, contractions — will pick a side.",
  },
  deepseek: {
    label: "DeepSeek",
    blurb: "Long key-point inventories, or a visible reasoning trace.",
  },
  llama: {
    label: "Llama",
    blurb: "Sure-opener, remembered closer, open-model helpfulness.",
  },
  mixed: {
    label: "Mixed / edited",
    blurb: "Human revision sitting on machine bones, or the reverse.",
  },
  other: {
    label: "Other model",
    blurb: "Machine cadence without a clean family match.",
  },
};

export function isModelId(value: string): value is ModelId {
  return (MODEL_IDS as readonly string[]).includes(value);
}

export function isScoreFamily(value: string): value is ScoreFamily {
  return (SCORE_FAMILIES as readonly string[]).includes(value);
}

export function familyLabel(id: ScoreFamily): string {
  return FAMILY_META[id].label;
}

export function modelsInFamily(family: ScoreFamily): ModelSpec[] {
  return MODEL_IDS.map((id) => MODEL_CATALOG[id]).filter((spec) => spec.family === family);
}

export function isMachineFamily(family: ModelFamily): boolean {
  switch (family) {
    case "claude":
    case "gpt":
    case "gemini":
    case "grok":
    case "deepseek":
    case "llama":
    case "other":
      return true;
    case "human":
    case "mixed":
    case "unclear":
      return false;
    default: {
      const neverFamily: never = family;
      return neverFamily;
    }
  }
}
