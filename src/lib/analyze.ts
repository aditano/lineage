import { createServerFn } from "@tanstack/react-start";
import {
  analyzeText,
  familyLabel,
  isModelId,
  isScoreFamily,
  mergeReports,
  MODEL_CATALOG,
  SCORE_FAMILIES,
  type FamilyScore,
  type ForensicReport,
  type ModelCall,
  type ModelFamily,
  type Resolution,
  type Tell,
  type Verdict,
} from "@/lib/forensics";

const SCHEMA_HINT = `{
  "aiLikelihood": 0-100,
  "confidence": 0-100,
  "verdict": "likely-human" | "leaning-human" | "mixed" | "leaning-ai" | "likely-ai",
  "familyScores": {
    "human": number,
    "claude": number,
    "gpt": number,
    "gemini": number,
    "grok": number,
    "deepseek": number,
    "llama": number,
    "other": number
  },
  "topFamily": "human" | "claude" | "gpt" | "gemini" | "grok" | "deepseek" | "llama" | "other" | "mixed",
  "model": {
    "id": "gpt-3.5" | "gpt-4" | "gpt-4o" | "gpt-5" | "o-series" | "claude-3" | "claude-4" | "claude-5" | "gemini-1.5" | "gemini-2.5" | "gemini-3" | "grok-3" | "grok-4" | "deepseek-v3" | "deepseek-r1" | "llama-3" | null,
    "resolution": "generation" | "family" | "unresolved"
  },
  "tells": [{ "quote": string, "note": string, "leans": "human"|"claude"|"gpt"|"gemini"|"grok"|"deepseek"|"llama"|"ai" }],
  "briefing": string,
  "summary": string,
  "caveats": string[]
}`;

type RemoteJson = {
  aiLikelihood?: number;
  confidence?: number;
  verdict?: Verdict;
  familyScores?: Record<string, number> | FamilyScore[];
  topFamily?: ModelFamily;
  model?: {
    id?: string | null;
    resolution?: string;
    confidence?: number;
    evidence?: string[];
  };
  tells?: Array<{ quote?: string; phrase?: string; note?: string; leans?: string }>;
  briefing?: string;
  summary?: string;
  caveats?: string[];
};

function stripFence(s: string) {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function asFamily(v: string | undefined): ModelFamily | undefined {
  const ok = [
    "human",
    "claude",
    "gpt",
    "gemini",
    "grok",
    "deepseek",
    "llama",
    "mixed",
    "other",
    "unclear",
  ];
  return v && ok.includes(v) ? (v as ModelFamily) : undefined;
}

function asResolution(v: string | undefined): Resolution | undefined {
  switch (v) {
    case "exact":
    case "generation":
    case "family":
    case "unresolved":
      return v;
    default:
      return undefined;
  }
}

function modelFromRemote(raw: RemoteJson): ModelCall | undefined {
  const resolution = asResolution(raw.model?.resolution);
  // An exact name has to be read off the text by the local pass. The briefing cannot mint one.
  if (!resolution || resolution === "exact") return undefined;
  const id = raw.model?.id && isModelId(raw.model.id) ? raw.model.id : null;
  if (resolution === "generation" && !id) return undefined;
  const confidence =
    typeof raw.model?.confidence === "number" && Number.isFinite(raw.model.confidence)
      ? Math.round(Math.max(0, Math.min(70, raw.model.confidence)))
      : 50;
  return {
    id,
    label: id ? MODEL_CATALOG[id].label : "Unresolved",
    exactName: null,
    resolution,
    confidence,
    evidence: Array.isArray(raw.model?.evidence)
      ? raw.model.evidence.filter((note) => typeof note === "string").slice(0, 3)
      : [],
  };
}

function normalizeRemote(text: string, raw: RemoteJson): Partial<ForensicReport> {
  const famEntries: FamilyScore[] = [];
  if (Array.isArray(raw.familyScores)) {
    for (const f of raw.familyScores) {
      if (f && typeof f.score === "number" && isScoreFamily(f.id)) famEntries.push(f);
    }
  } else if (raw.familyScores && typeof raw.familyScores === "object") {
    let sum = 0;
    const vals: Record<string, number> = {};
    for (const id of SCORE_FAMILIES) {
      const n = Number(raw.familyScores[id] ?? 0);
      vals[id] = Number.isFinite(n) ? Math.max(0, n) : 0;
      sum += vals[id];
    }
    if (sum <= 0) sum = 1;
    for (const id of SCORE_FAMILIES) {
      famEntries.push({
        id,
        label: familyLabel(id),
        score: vals[id] / sum,
        reasons: [],
      });
    }
  }

  const tells: Tell[] = [];
  for (const t of raw.tells ?? []) {
    const phrase = (t.quote || t.phrase || "").trim();
    if (!phrase || phrase.length < 2) continue;
    const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
    const start = idx >= 0 ? idx : 0;
    const end = idx >= 0 ? idx + phrase.length : phrase.length;
    const leans = asFamily(t.leans) ?? (t.leans === "ai" ? "other" : "unclear");
    tells.push({
      phrase: idx >= 0 ? text.slice(start, end) : phrase.slice(0, 80),
      start,
      end,
      leans: leans === "unclear" ? "other" : leans,
      note: (t.note || "Noted by the briefing").slice(0, 160),
    });
  }

  const ai =
    typeof raw.aiLikelihood === "number" && Number.isFinite(raw.aiLikelihood)
      ? Math.round(Math.max(4, Math.min(96, raw.aiLikelihood)))
      : undefined;

  return {
    aiLikelihood: ai,
    confidence:
      typeof raw.confidence === "number"
        ? Math.round(Math.max(10, Math.min(94, raw.confidence)))
        : undefined,
    verdict: raw.verdict,
    family: asFamily(raw.topFamily),
    familyScores: famEntries,
    modelCall: modelFromRemote(raw),
    tells,
    briefing: raw.briefing?.trim().slice(0, 900),
    summary: raw.summary?.trim().slice(0, 400),
    caveats: Array.isArray(raw.caveats)
      ? raw.caveats
          .filter((c) => typeof c === "string")
          .map((c) => c.slice(0, 200))
          .slice(0, 4)
      : undefined,
  };
}

export const runDeepAnalysis = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => {
    if (!input || typeof input.text !== "string") {
      throw new Error("Paste some writing first.");
    }
    const text = input.text
      .replace(/\u00a0/g, " ")
      .trim()
      .slice(0, 8000);
    if (text.length < 24) throw new Error("Need a bit more text — a short paragraph at least.");
    return { text };
  })
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; report: ForensicReport; usedModel: boolean }
      | { ok: false; error: string; report: ForensicReport }
    > => {
      const local = analyzeText(data.text);
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) {
        return {
          ok: true,
          report: { ...local, briefing: undefined },
          usedModel: false,
        };
      }

      const excerpt =
        data.text.length > 4500 ? `${data.text.slice(0, 4500)}\n\n[truncated]` : data.text;
      const localBrief = {
        aiLikelihood: local.aiLikelihood,
        confidence: local.confidence,
        verdict: local.verdict,
        family: local.family,
        model: local.modelCall,
        topSignals: local.signals.map((s) => ({ id: s.id, value: Math.round(s.value * 100) })),
        topTells: local.tells.slice(0, 8).map((t) => t.phrase),
      };

      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            temperature: 0.2,
            max_tokens: 900,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are a forensic linguist. You judge whether writing is human or machine and, if machine, which house style it most resembles: Claude, ChatGPT/GPT, Gemini, Grok, DeepSeek, or Llama. You may name a generation (GPT-4 class, Claude 3, OpenAI o-series, Gemini 1.5, Grok 4 class, DeepSeek-R1) only when several cues agree. Do not invent an exact checkpoint. Exact names are the local reader's job, and only when the text identifies a version. Be skeptical. Formal humans and edited machines overlap. Return JSON only.",
              },
              {
                role: "user",
                content: `Return ONLY JSON matching this shape:\n${SCHEMA_HINT}\n\nHouse-style tells:\n- GPT-3.5 / early ChatGPT: Certainly, as an AI language model, I hope this helps, knowledge cutoff.\n- GPT-4 class: delve, tapestry, landscape of, it's important to note, comprehensive overview, both-sides scaffolds.\n- GPT-4o / later ChatGPT: here's the short version, quick take, got it, want me to. Less brochure.\n- OpenAI o-series: let me work through, assumptions, working backwards, the key insight, therefore we.\n- Claude 3: I want to be careful, tension/tradeoff, if I'm being precise, happy to sit with, em-dashes.\n- Claude 4 class: I'll be direct, I'll skip the preamble, worth separating, the direct answer.\n- Gemini 1.5: Here's a breakdown, key takeaways, let's explore, here are some options.\n- Gemini 2.5: at a glance, what this means, inline bold outlines without the 1.5 script.\n- Grok 3: Look, here's the thing, hot take, the boring truth.\n- Grok 4 class: the actual constraint, I'd ship, the price of being wrong.\n- DeepSeek V3: here are some key points, additionally consider, long numbered inventories.\n- DeepSeek-R1: a <think> trace, let me reconsider, the problem asks.\n- Llama 3: Sure, opener plus Remember, closer.\n- Human: specific lived detail, fragments, typos, odd word choice, uneven rhythm, citations.\n\nmodel.resolution must be generation, family, or unresolved. Never exact. familyScores are relative weights that sum to about 100. Quotes in tells must be verbatim short substrings of the text.\n\nLocal statistical read (use as prior, you may override):\n${JSON.stringify(localBrief)}\n\nTEXT:\n"""${excerpt}"""`,
              },
            ],
          }),
        });

        if (!res.ok) {
          return {
            ok: true,
            report: local,
            usedModel: false,
          };
        }

        const body = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = body.choices?.[0]?.message?.content ?? "";
        let parsed: RemoteJson = {};
        try {
          parsed = JSON.parse(stripFence(content)) as RemoteJson;
        } catch {
          return { ok: true, report: local, usedModel: false };
        }

        const remote = normalizeRemote(data.text, parsed);
        return {
          ok: true,
          report: mergeReports(local, remote),
          usedModel: true,
        };
      } catch {
        return { ok: true, report: local, usedModel: false };
      }
    },
  );
