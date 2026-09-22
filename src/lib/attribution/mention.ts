import { MODEL_CATALOG } from "./catalog.ts";
import type { ModelId, Resolution, ScoreFamily } from "./types.ts";

export type SpokenIdentity = {
  id: ModelId | null;
  family: ScoreFamily;
  exactName: string | null;
  resolution: Extract<Resolution, "exact" | "family">;
  index: number;
  end: number;
  phrase: string;
  note: string;
};

const NAME = String.raw`gpt[\s-]*3\.5|gpt[\s-]*4o|gpt[\s-]*4\.1|gpt[\s-]*4|gpt[\s-]*[5-9](?:\.\d+)?(?:[\s-]*(?:sol|terra|astra))?|chatgpt|openai[\s-]+o[134](?:[\s-]*(?:mini|pro|preview))?|o[134](?:[\s-]*(?:mini|pro|preview))?|claude(?:[\s-]+(?:opus|sonnet|haiku|fable))?(?:[\s-]+\d+(?:\.\d+)?)?(?:[\s-]+(?:opus|sonnet|haiku|fable))?|gemini(?:[\s-]+\d+(?:\.\d+)?)?(?:[\s-]+(?:flash|pro|ultra))?|grok(?:[\s-]+\d+(?:\.\d+)?)?|deepseek(?:[\s-]*(?:r1|v3|v2))?|llama(?:[\s-]*\d+(?:\.\d+)?)?`;

const SELF_RE = new RegExp(
  `\\b(?:i(?:'m| am)|this is)\\s+(?:an?\\s+)?(?:(?:large\\s+)?language\\s+model(?:\\s*,)?\\s+)?(?:called\\s+|known\\s+as\\s+)?(${NAME})`,
  "gi",
);

type Classified = {
  id: ModelId | null;
  family: ScoreFamily;
  exactName: string | null;
  resolution: Extract<Resolution, "exact" | "family">;
  note: string;
};

/** First standalone version in a spoken name. "3.5" stays major 3, not 5. */
export function firstVersion(s: string): number | null {
  const match = s.match(/(?:^|\s)(\d+)(?:\.\d+)?(?=\s|$)/);
  return match ? Number(match[1]) : null;
}

function titleTail(raw: string, head: string): string {
  const rest = raw
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .slice(1)
    .map((word) => {
      if (/^\d/.test(word) || /^[vr]\d/i.test(word)) return word.toUpperCase().replace(/^V/, "V");
      if (/^(opus|sonnet|haiku|fable|flash|pro|ultra|mini|sol|terra|astra|preview)$/i.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
  return rest ? `${head} ${rest}` : head;
}

/**
 * Map a spoken model string to a catalog id.
 * A product name with no version stays at family resolution.
 * `context` is the surrounding sentence, used to reject bare "o3".
 */
export function classifySpokenName(raw: string, context: string): Classified | null {
  const s = raw.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const ctx = context.toLowerCase();

  if (s === "gpt 3.5" || s === "chatgpt 3.5") {
    return {
      id: "gpt-3.5",
      family: "gpt",
      exactName: "GPT-3.5",
      resolution: "exact",
      note: "Names GPT-3.5",
    };
  }
  if (s === "gpt 4o" || s === "gpt 4.1" || s === "chatgpt 4o") {
    const exactName = s.includes("4.1") ? "GPT-4.1" : "GPT-4o";
    return {
      id: "gpt-4o",
      family: "gpt",
      exactName,
      resolution: "exact",
      note: `Names ${exactName}`,
    };
  }
  if (s === "gpt 4" || s === "gpt 4 turbo") {
    return {
      id: "gpt-4",
      family: "gpt",
      exactName: "GPT-4",
      resolution: "exact",
      note: "Names GPT-4",
    };
  }
  if (/^gpt [5-9]/.test(s) || /^chatgpt [5-9]/.test(s)) {
    const exactName = s
      .replace(/^chatgpt/, "GPT")
      .replace(/^gpt/, "GPT")
      .replace(/\s+/g, " ")
      .replace(/^GPT\s+/, "GPT-")
      .replace(/\b(sol|terra|astra)\b/, (m) => m.charAt(0).toUpperCase() + m.slice(1));
    return {
      id: "gpt-5",
      family: "gpt",
      exactName,
      resolution: "exact",
      note: `Names ${exactName}`,
    };
  }
  if (s === "chatgpt") {
    return {
      id: null,
      family: "gpt",
      exactName: null,
      resolution: "family",
      note: "Names ChatGPT, not a checkpoint",
    };
  }
  if (/^(?:openai )?o[134](?: (?:mini|pro|preview))?$/.test(s)) {
    const named = s.startsWith("openai ") || /openai|model|reasoning|language/.test(ctx);
    if (!named) return null;
    const exactName = s.replace(/^openai /, "").replace(/ /g, "-");
    return {
      id: "o-series",
      family: "gpt",
      exactName,
      resolution: "exact",
      note: `Names ${exactName}`,
    };
  }
  if (s.startsWith("claude")) {
    const major = firstVersion(s);
    const exactName = titleTail(raw, "Claude");
    if (/\bfable\b/.test(s) || (major != null && major >= 5)) {
      return {
        id: "claude-5",
        family: "claude",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    if (major === 4) {
      return {
        id: "claude-4",
        family: "claude",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    if (major === 3) {
      return {
        id: "claude-3",
        family: "claude",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    return {
      id: null,
      family: "claude",
      exactName: null,
      resolution: "family",
      note: "Names Claude, not a version",
    };
  }
  if (s.startsWith("gemini")) {
    const major = firstVersion(s);
    const exactName = titleTail(raw, "Gemini");
    if (major != null && major >= 3) {
      return {
        id: "gemini-3",
        family: "gemini",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    if (major === 2) {
      return {
        id: "gemini-2.5",
        family: "gemini",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    if (major === 1) {
      return {
        id: "gemini-1.5",
        family: "gemini",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    return {
      id: null,
      family: "gemini",
      exactName: null,
      resolution: "family",
      note: "Names Gemini, not a version",
    };
  }
  if (s.startsWith("grok")) {
    const major = firstVersion(s);
    const exactName = titleTail(raw, "Grok");
    if (major != null && major >= 4) {
      return {
        id: "grok-4",
        family: "grok",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    if (major != null && major >= 1) {
      return {
        id: "grok-3",
        family: "grok",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    return {
      id: null,
      family: "grok",
      exactName: null,
      resolution: "family",
      note: "Names Grok, not a version",
    };
  }
  if (s.startsWith("deepseek")) {
    if (/\br1\b/.test(s)) {
      return {
        id: "deepseek-r1",
        family: "deepseek",
        exactName: "DeepSeek-R1",
        resolution: "exact",
        note: "Names DeepSeek-R1",
      };
    }
    if (/\bv[23]\b/.test(s)) {
      const exactName = /v2/.test(s) ? "DeepSeek V2" : "DeepSeek V3";
      return {
        id: "deepseek-v3",
        family: "deepseek",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    return {
      id: null,
      family: "deepseek",
      exactName: null,
      resolution: "family",
      note: "Names DeepSeek, not a version",
    };
  }
  if (s.startsWith("llama")) {
    if (/\d/.test(s)) {
      const exactName = titleTail(raw, "Llama");
      return {
        id: "llama-3",
        family: "llama",
        exactName,
        resolution: "exact",
        note: `Names ${exactName}`,
      };
    }
    return {
      id: null,
      family: "llama",
      exactName: null,
      resolution: "family",
      note: "Names Llama, not a version",
    };
  }
  return null;
}

function mentionIsBound(text: string, end: number): boolean {
  const after = text.slice(end);
  if (after === "" || /^[,.:;!?]/.test(after) || /^\s*$/.test(after) || /^\n/.test(after))
    return true;
  if (/^\s+(?:a|an|by|from|made|built|trained|which|that)\b/i.test(after)) return true;
  if (/^\s*\n/.test(after)) return true;
  if (/^\s+[A-Z0-9]/.test(after)) return true;
  return false;
}

function suppressed(text: string, index: number, end: number): boolean {
  const before = text.slice(Math.max(0, index - 96), index).toLowerCase();
  const after = text.slice(end, end + 140).toLowerCase();
  if (
    /\b(said|says|wrote|written|writes|called me|calls me|sticky|joke|quoted|whispers|texted|emailed|told me|note (?:that )?says|according to)\b/.test(
      before,
    )
  ) {
    return true;
  }
  if (
    /\b(sticker|sticky note|the note|the sign|joke|username|nickname|they call|she announced|he announced|they announced)\b/.test(
      after,
    )
  ) {
    return true;
  }
  if (/\b(?:she|he|they)\s+(?:said|announced|wrote|asked|joked)\b/.test(after)) return true;
  return false;
}

function assistantFrame(text: string, index: number, end: number, wordCount: number): boolean {
  if (!mentionIsBound(text, end) || suppressed(text, index, end)) return false;
  const around = text
    .slice(Math.max(0, index - 60), Math.min(text.length, end + 160))
    .toLowerCase();
  const framed =
    /language model|trained by|built by|made by|developed by|ai assistant|i'm an ai|i am an ai/.test(
      around,
    );
  if (framed) return true;
  return index < 24 && wordCount < 40;
}

/** First self-identification the policy is willing to trust. */
export function findSpokenIdentity(text: string, wordCount: number): SpokenIdentity | null {
  const re = new RegExp(SELF_RE.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const raw = match[1] ?? "";
    const index = match.index;
    const phrase = match[0];
    const end = index + phrase.length;
    if (!assistantFrame(text, index, end, wordCount)) {
      if (match[0].length === 0) re.lastIndex += 1;
      continue;
    }
    const context = text.slice(Math.max(0, index - 40), Math.min(text.length, end + 80));
    const classified = classifySpokenName(raw, context);
    if (!classified) {
      if (match[0].length === 0) re.lastIndex += 1;
      continue;
    }
    if (classified.id && MODEL_CATALOG[classified.id].family !== classified.family) continue;
    return {
      ...classified,
      index,
      end,
      phrase,
    };
  }
  return null;
}
