import { createServerFn } from "@tanstack/react-start";
import {
  analyzeText,
  mergeReports,
  type FamilyScore,
  type ForensicReport,
  type ModelFamily,
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
    "other": number
  },
  "topFamily": "human" | "claude" | "gpt" | "gemini" | "grok" | "other" | "mixed",
  "tells": [{ "quote": string, "note": string, "leans": "human"|"claude"|"gpt"|"gemini"|"grok"|"ai" }],
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
  tells?: Array<{ quote?: string; phrase?: string; note?: string; leans?: string }>;
  briefing?: string;
  summary?: string;
  caveats?: string[];
};

function stripFence(s: string) {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function asFamily(v: string | undefined): ModelFamily | undefined {
  const ok = ["human", "claude", "gpt", "gemini", "grok", "mixed", "other", "unclear"];
  return v && ok.includes(v) ? (v as ModelFamily) : undefined;
}

function normalizeRemote(text: string, raw: RemoteJson): Partial<ForensicReport> {
  const famEntries: FamilyScore[] = [];
  if (Array.isArray(raw.familyScores)) {
    for (const f of raw.familyScores) {
      if (f && typeof f.score === "number" && f.id) famEntries.push(f);
    }
  } else if (raw.familyScores && typeof raw.familyScores === "object") {
    const ids = ["human", "claude", "gpt", "gemini", "grok", "other"] as const;
    let sum = 0;
    const vals: Record<string, number> = {};
    for (const id of ids) {
      const n = Number(raw.familyScores[id] ?? 0);
      vals[id] = Number.isFinite(n) ? Math.max(0, n) : 0;
      sum += vals[id];
    }
    if (sum <= 0) sum = 1;
    for (const id of ids) {
      famEntries.push({
        id,
        label:
          id === "gpt" ? "ChatGPT" : id === "other" ? "Other model" : id[0].toUpperCase() + id.slice(1),
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
    tells,
    briefing: raw.briefing?.trim().slice(0, 900),
    summary: raw.summary?.trim().slice(0, 400),
    caveats: Array.isArray(raw.caveats)
      ? raw.caveats.filter((c) => typeof c === "string").map((c) => c.slice(0, 200)).slice(0, 4)
      : undefined,
  };
}

export const runDeepAnalysis = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => {
    if (!input || typeof input.text !== "string") {
      throw new Error("Paste some writing first.");
    }
    const text = input.text.replace(/\u00a0/g, " ").trim().slice(0, 8000);
    if (text.length < 24) throw new Error("Need a bit more text — a short paragraph at least.");
    return { text };
  })
  .handler(async ({ data }): Promise<
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

    const excerpt = data.text.length > 4500 ? `${data.text.slice(0, 4500)}\n\n[truncated]` : data.text;
    const localBrief = {
      aiLikelihood: local.aiLikelihood,
      confidence: local.confidence,
      verdict: local.verdict,
      family: local.family,
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
                "You are a forensic linguist. You judge whether writing is human or machine and, if machine, which house style it most resembles in 2026: Claude (Anthropic), ChatGPT/GPT, Gemini/Google, or Grok (xAI). Be skeptical. Do not claim certainty. Formal humans and edited AI overlap. Return JSON only.",
            },
            {
              role: "user",
              content: `Return ONLY JSON matching this shape:\n${SCHEMA_HINT}\n\nHouse-style tells:\n- GPT/ChatGPT: Certainly / Of course, delve, tapestry, landscape of, I hope this helps, tidy numbered thirds, brochure adjectives (robust, vibrant, nestled), both-sides scaffolds.\n- Claude: em-dashes, I want to be careful, tension/tradeoff/nuance, collaborative hedging, long hypotaxis, happy to sit with.\n- Gemini: Here's a breakdown, Key takeaways, Let's explore, restated question, options lists, to summarize, step-by-step.\n- Grok: Look, / honestly / here's the thing, punchy grafs, will pick a side, anti-corporate, contractions, heat.\n- Human: specific lived detail, fragments, typos, odd word choice, uneven rhythm, digression.\n\nfamilyScores must be relative weights that sum to about 100. Quotes in tells must be verbatim short substrings of the text.\n\nLocal statistical read (use as prior, you may override):\n${JSON.stringify(localBrief)}\n\nTEXT:\n"""${excerpt}"""`,
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
  });
