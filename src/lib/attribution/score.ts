import {
  FAMILY_META,
  familyLabel,
  isMachineFamily,
  isScoreFamily,
  MODEL_CATALOG,
  modelsInFamily,
} from "./catalog.ts";
import { MARKERS } from "./markers.ts";
import { findSpokenIdentity, type SpokenIdentity } from "./mention.ts";
import {
  SCORE_FAMILIES,
  type FamilyScore,
  type ForensicReport,
  type Marker,
  type ModelCall,
  type ModelFamily,
  type ModelId,
  type Resolution,
  type ScoreFamily,
  type ScoredText,
  type Signal,
  type Tell,
  type TraceHit,
  type Verdict,
} from "./types.ts";

export const ATTRIBUTION_POLICY = {
  minGenerationWeight: 3.4,
  minGenerationMargin: 1.4,
  minGenerationHits: 2,
  singleSignatureWeight: 4.2,
  familyMargin: 0.08,
} as const;

function clamp(n: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, n));
}

function stddev(xs: number[]) {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? [];
}

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“([—-])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [cleaned];
}

function movingTtr(words: string[], window = 40): number {
  if (words.length < 12) {
    const uniq = new Set(words).size;
    return words.length ? uniq / words.length : 0.5;
  }
  const w = Math.min(window, words.length);
  let acc = 0;
  let n = 0;
  for (let i = 0; i + w <= words.length; i += Math.max(8, Math.floor(w / 3))) {
    acc += new Set(words.slice(i, i + w)).size / w;
    n += 1;
  }
  return n ? acc / n : 0.5;
}

function countMatches(text: string, re: RegExp): number {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const copy = new RegExp(re.source, flags);
  return (text.match(copy) ?? []).length;
}

function findAll(text: string, re: RegExp): Array<{ start: number; end: number; phrase: string }> {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const copy = new RegExp(re.source, flags);
  const out: Array<{ start: number; end: number; phrase: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = copy.exec(text)) && out.length < 24) {
    out.push({ start: match.index, end: match.index + match[0].length, phrase: match[0] });
    if (match[0].length === 0) copy.lastIndex += 1;
  }
  return out;
}

export function verdictFrom(score: number): Verdict {
  if (score < 28) return "likely-human";
  if (score < 42) return "leaning-human";
  if (score < 58) return "mixed";
  if (score < 74) return "leaning-ai";
  return "likely-ai";
}

function prior(): Record<ScoreFamily, number> {
  return {
    human: 0.22,
    gpt: 0.1,
    claude: 0.09,
    gemini: 0.09,
    grok: 0.09,
    deepseek: 0.07,
    llama: 0.05,
    other: 0.04,
  };
}

function emptyModelRaw(): Partial<Record<ModelId, number>> {
  return {};
}

function unresolvedCall(evidence: string[] = []): ModelCall {
  return {
    id: null,
    label: "Unresolved",
    exactName: null,
    resolution: "unresolved",
    confidence: 0,
    evidence,
  };
}

function familyOnlyCall(evidence: string[]): ModelCall {
  return {
    id: null,
    label: "Unresolved",
    exactName: null,
    resolution: "family",
    confidence: 36,
    evidence: evidence.slice(0, 3),
  };
}

type Stats = {
  wordCount: number;
  sentenceCount: number;
  charCount: number;
  paragraphCount: number;
  avgSentence: number;
  burstiness: number;
  emdashPer100: number;
  contractionRate: number;
  ttr: number;
  mdHeadings: number;
  mdLists: number;
  boldCount: number;
  structureScore: number;
  specificity: number;
  heat: number;
  citations: number;
  fragments: number;
  lowercaseStarts: number;
};

function measure(text: string): Stats {
  const words = tokenizeWords(text);
  const wordCount = words.length;
  const sentences = splitSentences(text);
  const lengths = sentences.map((s) => tokenizeWords(s).length).filter((n) => n > 0);
  const avgSentence = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const burstiness = avgSentence > 0 ? stddev(lengths) / avgSentence : 0;
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const emdashes = (text.match(/[—–]/g) ?? []).length;
  const contractions = (
    text.match(
      /\b[a-z]+n't\b|\b(?:i'm|i've|i'd|i'll|you're|we've|they're|it's|that's|what's|don't|can't|won't|isn't)\b/gi,
    ) ?? []
  ).length;
  const mdHeadings = (text.match(/^\s{0,3}#{1,3}\s/gm) ?? []).length;
  const mdLists = (text.match(/^\s*(?:[-*]|\d+\.)\s+\S/gm) ?? []).length;
  const boldCount = (text.match(/\*\*[^*]+\*\*/g) ?? []).length;
  const paragraphCount = Math.max(paragraphs.length, text ? 1 : 0);
  const digits = (text.match(/\b\d{1,4}\b/g) ?? []).length;
  const proper = (text.match(/\b[A-Z][a-z]{3,}\b/g) ?? []).length;
  const fragments = sentences.filter((s) => {
    const n = tokenizeWords(s).length;
    return n > 0 && n < 5 && !/[.?!]$/.test(s.trim());
  }).length;
  return {
    wordCount,
    sentenceCount: sentences.length,
    charCount: text.length,
    paragraphCount,
    avgSentence,
    burstiness,
    emdashPer100: wordCount ? (emdashes / wordCount) * 100 : 0,
    contractionRate: wordCount ? contractions / wordCount : 0,
    ttr: movingTtr(words),
    mdHeadings,
    mdLists,
    boldCount,
    structureScore: clamp(
      (mdHeadings * 1.4 + mdLists * 0.55 + boldCount * 0.25) / Math.max(3, paragraphCount),
    ),
    specificity: clamp((digits * 0.35 + proper * 0.08) / 6),
    heat: countMatches(text, /\b(shit|fuck|damn|ass|crap|hell)\b/i),
    citations: countMatches(text, /\bet al\.?|\([12]\d{3}[a-z]?\)|\bdoi:\s*10\./gi),
    fragments,
    lowercaseStarts: (text.match(/(?:^|\n)[a-z]/g) ?? []).length,
  };
}

function countsAsGenerationHit(marker: Marker): boolean {
  return marker.specificity === "generation" && marker.weight >= 1.2 && Boolean(marker.model);
}

export function scoreText(raw: string): ScoredText {
  const text = raw.replace(/\u00a0/g, " ").trim();
  const stats = measure(text);
  const familyRaw = prior();
  const modelRaw = emptyModelRaw();
  const modelHits: Partial<Record<ModelId, string[]>> = {};
  const familyReasons: Record<ScoreFamily, string[]> = {
    human: [],
    claude: [],
    gpt: [],
    gemini: [],
    grok: [],
    deepseek: [],
    llama: [],
    other: [],
  };
  const hits: TraceHit[] = [];
  const tells: Tell[] = [];

  const pushReason = (id: ScoreFamily, note: string) => {
    if (!familyReasons[id].includes(note) && familyReasons[id].length < 4)
      familyReasons[id].push(note);
  };
  const addHit = (hit: TraceHit) => {
    hits.push(hit);
    if (!hit.model || hit.weight < 1.2) return;
    const list = modelHits[hit.model] ?? [];
    if (!list.includes(hit.id)) list.push(hit.id);
    modelHits[hit.model] = list;
  };

  let stockWeight = 0;
  let humanWeight = 0;

  if (!text) {
    return {
      report: blankReport(),
      trace: { hits, familyRaw, modelRaw, modelHits },
    };
  }

  for (const marker of MARKERS) {
    const found = findAll(text, marker.re);
    if (!found.length) continue;
    const added = marker.weight * Math.min(found.length, 2);
    if (marker.specificity === "human") humanWeight += added;
    else stockWeight += added;
    if (marker.family) {
      familyRaw[marker.family] += added;
      pushReason(marker.family, marker.note);
    }
    if (marker.model) modelRaw[marker.model] = (modelRaw[marker.model] ?? 0) + added;
    if (countsAsGenerationHit(marker) || marker.specificity === "human" || marker.family) {
      addHit({
        id: marker.id,
        note: marker.note,
        weight: added,
        family: marker.family,
        model: countsAsGenerationHit(marker) ? marker.model : undefined,
        kind: "marker",
      });
    }
    const leans = marker.family ?? "ai";
    for (const foundHit of found.slice(0, 2)) {
      tells.push({
        phrase: foundHit.phrase,
        start: foundHit.start,
        end: foundHit.end,
        leans,
        note: marker.note,
      });
    }
  }

  if (stats.emdashPer100 >= 0.9 && stats.avgSentence >= 18 && stats.specificity < 0.5) {
    const added = Math.min(3, stats.emdashPer100 * 1.1);
    familyRaw.claude += added;
    pushReason("claude", "Heavy em-dash habit");
    addHit({
      id: "struct-emdash",
      note: "Heavy em-dash habit",
      weight: added,
      family: "claude",
      kind: "structure",
    });
  }

  if (stats.avgSentence > 24 && stats.burstiness < 0.5 && stats.specificity < 0.45) {
    familyRaw.claude += 1.2;
    pushReason("claude", "Long even sentences");
  }

  if (stats.citations > 0) {
    const added = Math.min(3.6, stats.citations * 1.5);
    familyRaw.human += added;
    humanWeight += added;
    familyRaw.gpt *= 0.8;
    pushReason("human", "Citation apparatus");
  }

  if (stats.specificity > 0.42 && stockWeight < 5) {
    familyRaw.human += 2.3;
    humanWeight += 1.3;
    pushReason("human", "Concrete names and numbers");
  }

  if (stats.fragments >= 1) {
    familyRaw.human += 1.2;
    humanWeight += 1.1;
    pushReason("human", "Sentence fragments");
  }

  if (stats.lowercaseStarts >= 1) {
    familyRaw.human += 0.8;
    humanWeight += 0.6;
  }

  if (stats.heat) {
    familyRaw.grok += Math.min(1.5, stats.heat * 0.7);
    familyRaw.human += 0.7;
    humanWeight += 0.5;
    pushReason("grok", "Unfiltered register");
  }

  const sureOpener = /^\s*sure[,!]/i.test(text);
  const rememberCloser = /\bremember,\s/i.test(text);
  if (sureOpener && rememberCloser && stockWeight < 8) {
    const added = 4.5;
    familyRaw.llama += added;
    modelRaw["llama-3"] = (modelRaw["llama-3"] ?? 0) + added;
    pushReason("llama", "Sure-opener and remembered closer");
    addHit({
      id: "struct-llama-pair",
      note: "Sure-opener and remembered closer",
      weight: added,
      family: "llama",
      model: "llama-3",
      kind: "structure",
    });
  }

  if (stats.boldCount >= 5 && stats.mdHeadings + stats.mdLists >= 2) {
    const classic = (modelHits["gemini-1.5"] ?? []).length;
    if (classic === 0) {
      const added = 2.4;
      familyRaw.gemini += added;
      modelRaw["gemini-2.5"] = (modelRaw["gemini-2.5"] ?? 0) + added;
      pushReason("gemini", "Inline-bold outline");
      addHit({
        id: "struct-gemini-bold",
        note: "Inline-bold outline",
        weight: added,
        family: "gemini",
        model: "gemini-2.5",
        kind: "structure",
      });
    }
  }

  const machineRhythm = clamp((0.55 - stats.burstiness) / 0.45);
  const humanRhythm = clamp((stats.burstiness - 0.35) / 0.55);
  const ttrMachine =
    clamp(1 - Math.abs(stats.ttr - 0.62) / 0.28) * (stats.wordCount > 40 ? 1 : 0.4);
  const formal = clamp((0.035 - stats.contractionRate) / 0.035);
  const stockSignal = clamp(stockWeight / Math.max(6, stats.wordCount / 9) / 1.05);

  let aiLikelihood =
    16 +
    stockSignal * 42 +
    machineRhythm * 16 +
    ttrMachine * 8 +
    formal * 7 +
    stats.structureScore * 10 -
    Math.min(26, humanWeight * 3.3) -
    humanRhythm * 10 -
    stats.specificity * 9 -
    Math.min(12, stats.citations * 4);

  if (aiLikelihood < 32) familyRaw.human += 2.6;
  else if (aiLikelihood > 70) familyRaw.human *= 0.45;

  if (machineRhythm > 0.72 && formal > 0.65 && stockWeight < 1.5 && stats.wordCount > 70) {
    familyRaw.other += 1.6;
    pushReason("other", "Even machine cadence without a house style");
  }

  const spoken = findSpokenIdentity(text, stats.wordCount);
  suppressUnestablished(familyRaw, hits);
  const stylisticBefore = leadingFamily(familyRaw);
  if (spoken) {
    familyRaw[spoken.family] += spoken.resolution === "exact" ? 8 : 5.2;
    if (spoken.id) modelRaw[spoken.id] = (modelRaw[spoken.id] ?? 0) + 8;
    pushReason(spoken.family, spoken.note);
    addHit({
      id: spoken.resolution === "exact" ? "self-id-exact" : "self-id-family",
      note: spoken.note,
      weight: 8,
      family: spoken.family,
      model: spoken.id ?? undefined,
      kind: "self-id",
    });
    tells.push({
      phrase: spoken.phrase,
      start: spoken.index,
      end: spoken.end,
      leans: spoken.family,
      note: spoken.note,
    });
  }

  let confidence = 84;
  if (stats.wordCount < 18) confidence = spoken ? 58 : 22;
  else if (stats.wordCount < 55) confidence = 50;
  else if (stats.wordCount < 120) confidence = 66;
  else if (stats.wordCount < 240) confidence = 76;

  let family: ModelFamily = pickFamily(familyRaw, aiLikelihood, stats.wordCount, spoken);
  if (
    spoken?.resolution === "exact" &&
    spoken.id &&
    !isMachineFamily(family) &&
    stats.specificity < 0.4
  ) {
    family = spoken.family;
  }

  if (isMachineFamily(family) && family !== "other") aiLikelihood = Math.max(aiLikelihood, 62);
  else if (family === "other") aiLikelihood = Math.max(aiLikelihood, 56);
  else if (family === "human") aiLikelihood = Math.min(aiLikelihood, stockWeight > 5 ? 52 : 38);

  if (stats.wordCount < 18 && !spoken) {
    family = "unclear";
    aiLikelihood = (aiLikelihood + 50) / 2;
    confidence = 20;
  } else if (stats.wordCount < 55 && stats.wordCount >= 18) {
    aiLikelihood = aiLikelihood * 0.92 + 50 * 0.08;
  }

  aiLikelihood = Math.round(clamp(aiLikelihood, 6, 92) * 100) / 100;
  aiLikelihood = Math.round(aiLikelihood);

  const familyScores = normalizeFamilies(familyRaw, familyReasons);
  const modelCall = decideModel({
    family,
    familyRaw,
    modelRaw,
    modelHits,
    hits,
    spoken,
    specificity: stats.specificity,
    wordCount: stats.wordCount,
  });

  if (modelCall.resolution === "generation" || modelCall.resolution === "family") {
    confidence = Math.min(confidence, modelCall.resolution === "generation" ? 74 : confidence);
  }
  if (family === "mixed" || family === "unclear") confidence = Math.min(confidence, 58);

  const signals = buildSignals({
    stats,
    stockSignal,
    formal,
    ttrMachine,
  });

  const caveats = buildCaveats({
    wordCount: stats.wordCount,
    family,
    verdict: verdictFrom(aiLikelihood),
    spoken,
    stylistic: stylisticBefore,
    modelCall,
  });

  const summary = buildSummary({
    wordCount: stats.wordCount,
    verdict: verdictFrom(aiLikelihood),
    family,
    modelCall,
  });

  tells.sort((a, b) => a.start - b.start);
  const deduped: Tell[] = [];
  for (const tell of tells) {
    const overlap = deduped.some((prev) => !(tell.end <= prev.start || tell.start >= prev.end));
    if (!overlap) deduped.push(tell);
    if (deduped.length >= 14) break;
  }

  const report: ForensicReport = {
    wordCount: stats.wordCount,
    sentenceCount: stats.sentenceCount,
    charCount: stats.charCount,
    paragraphCount: stats.paragraphCount,
    avgSentence: Math.round(stats.avgSentence * 10) / 10,
    burstiness: Math.round(stats.burstiness * 100) / 100,
    aiLikelihood,
    confidence,
    verdict: verdictFrom(aiLikelihood),
    family,
    familyScores,
    modelCall,
    signals,
    tells: deduped,
    summary,
    caveats,
    source: "local",
  };

  return { report, trace: { hits, familyRaw, modelRaw, modelHits } };
}

export function analyzeText(raw: string): ForensicReport {
  return scoreText(raw).report;
}

function leadingFamily(raw: Record<ScoreFamily, number>): ScoreFamily {
  return SCORE_FAMILIES.reduce((best, id) => (raw[id] > raw[best] ? id : best));
}

function isEstablished(family: ScoreFamily, hits: TraceHit[]): boolean {
  const mine = hits.filter((hit) => hit.family === family);
  if (mine.some((hit) => hit.kind === "self-id")) return true;
  if (mine.some((hit) => hit.weight >= ATTRIBUTION_POLICY.singleSignatureWeight)) return true;
  return new Set(mine.map((hit) => hit.id)).size >= 2;
}

/** One borrowed phrase does not get to name a house. */
function suppressUnestablished(raw: Record<ScoreFamily, number>, hits: TraceHit[]) {
  const base = prior();
  for (let pass = 0; pass < SCORE_FAMILIES.length; pass += 1) {
    const leader = leadingFamily(raw);
    if (leader === "human" || leader === "other" || isEstablished(leader, hits)) return;
    raw[leader] = base[leader];
  }
}

function pickFamily(
  raw: Record<ScoreFamily, number>,
  aiLikelihood: number,
  wordCount: number,
  spoken: SpokenIdentity | null,
): ModelFamily {
  if (wordCount < 18 && !spoken) return "unclear";
  const scores = normalizeFamilies(raw, {
    human: [],
    claude: [],
    gpt: [],
    gemini: [],
    grok: [],
    deepseek: [],
    llama: [],
    other: [],
  });
  const top = scores[0];
  const second = scores[1];
  if (!top) return "unclear";
  if (
    !spoken &&
    second &&
    top.score - second.score < ATTRIBUTION_POLICY.familyMargin &&
    top.score < 0.42
  ) {
    return aiLikelihood > 56 ? "mixed" : "unclear";
  }
  return top.id;
}

function normalizeFamilies(
  raw: Record<ScoreFamily, number>,
  reasons: Record<ScoreFamily, string[]>,
): FamilyScore[] {
  const sum = SCORE_FAMILIES.reduce((acc, id) => acc + Math.max(0.01, raw[id]), 0);
  return SCORE_FAMILIES.map((id) => ({
    id,
    label: familyLabel(id),
    score: Math.max(0.01, raw[id]) / sum,
    reasons: reasons[id],
  })).sort((a, b) => b.score - a.score);
}

function decideModel(input: {
  family: ModelFamily;
  familyRaw: Record<ScoreFamily, number>;
  modelRaw: Partial<Record<ModelId, number>>;
  modelHits: Partial<Record<ModelId, string[]>>;
  hits: TraceHit[];
  spoken: SpokenIdentity | null;
  specificity: number;
  wordCount: number;
}): ModelCall {
  const { family, familyRaw, modelRaw, modelHits, hits, spoken, specificity, wordCount } = input;
  if (spoken?.resolution === "exact" && spoken.id) {
    const humanBlocked = family === "human" && specificity >= 0.4;
    if (!humanBlocked) {
      return {
        id: spoken.id,
        label: spoken.exactName ?? MODEL_CATALOG[spoken.id].label,
        exactName: spoken.exactName,
        resolution: "exact",
        confidence: wordCount < 18 ? 74 : 88,
        evidence: [spoken.note],
      };
    }
  }

  if (family === "human" || family === "mixed" || family === "unclear") {
    return unresolvedCall(
      family === "human" ? ["No model name — the voice reads as a person."] : [],
    );
  }

  const productNote =
    spoken?.resolution === "family" && spoken.family === family ? spoken.note : null;

  if (family === "other") {
    return familyOnlyCall([productNote ?? "Machine cadence without a separable house style."]);
  }

  const ranked = modelsInFamily(family)
    .filter((spec) => spec.channel === "style")
    .map((spec) => ({
      spec,
      weight: modelRaw[spec.id] ?? 0,
      hits: modelHits[spec.id] ?? [],
    }))
    .sort((a, b) => b.weight - a.weight);

  const top = ranked[0];
  const second = ranked[1];
  if (!top) return familyOnlyCall(["No generation cue cleared the bar."]);
  if (isScoreFamily(family)) {
    const rival = SCORE_FAMILIES.find(
      (id) =>
        id !== family &&
        id !== "human" &&
        id !== "other" &&
        isEstablished(id, hits) &&
        familyRaw[id] > familyRaw[family] * 0.5,
    );
    if (rival) {
      return familyOnlyCall([
        "Another house style is also present, so the generation stays unresolved.",
      ]);
    }
  }
  const margin = top.weight - (second?.weight ?? 0);
  const paired =
    top.hits.length >= ATTRIBUTION_POLICY.minGenerationHits &&
    top.weight >= ATTRIBUTION_POLICY.minGenerationWeight &&
    margin >= ATTRIBUTION_POLICY.minGenerationMargin;
  const signature =
    top.hits.length >= 1 &&
    top.weight >= ATTRIBUTION_POLICY.singleSignatureWeight &&
    margin >= ATTRIBUTION_POLICY.minGenerationMargin;
  if (paired || signature) {
    const notes = top.hits
      .map((id) => MARKERS.find((marker) => marker.id === id)?.note)
      .filter((note): note is string => Boolean(note));
    const structureNotes = top.hits
      .filter((id) => id.startsWith("struct-"))
      .map((id) =>
        id === "struct-llama-pair" ? "Sure-opener and remembered closer" : "Inline-bold outline",
      );
    return {
      id: top.spec.id,
      label: top.spec.label,
      exactName: null,
      resolution: "generation",
      confidence: Math.min(72, wordCount < 55 ? 56 : 68),
      evidence: [...(productNote ? [productNote] : []), ...notes, ...structureNotes].slice(0, 3),
    };
  }

  return familyOnlyCall(
    [productNote ?? "House style is clear; the generation cues do not separate."].filter(
      (note): note is string => Boolean(note),
    ),
  );
}

function buildSignals(input: {
  stats: Stats;
  stockSignal: number;
  formal: number;
  ttrMachine: number;
}): Signal[] {
  const { stats, stockSignal, formal, ttrMachine } = input;
  return [
    {
      id: "burst",
      label: "Burstiness",
      value: clamp(1 - (stats.burstiness - 0.15) / 0.75),
      humanEnd: "Uneven",
      machineEnd: "Even",
      note: "How much sentence length jumps around. Machines tend to keep a metronome.",
    },
    {
      id: "stock",
      label: "Stock phrasing",
      value: stockSignal,
      humanEnd: "Sparse",
      machineEnd: "Thick",
      note: "Essay transitions, brochure verbs, and assistant manners.",
    },
    {
      id: "formality",
      label: "Register",
      value: formal,
      humanEnd: "Spoken",
      machineEnd: "Pressed",
      note: "Contractions and heat versus pressed-suit diction.",
    },
    {
      id: "structure",
      label: "Outline bones",
      value: stats.structureScore,
      humanEnd: "Loose",
      machineEnd: "Listed",
      note: "Headings, numbered lists, and ready-to-slide structure.",
    },
    {
      id: "lexicon",
      label: "Lexical weave",
      value: ttrMachine,
      humanEnd: "Idiosyncratic",
      machineEnd: "Smooth",
      note: "A mid, even type-token rhythm is a common model default.",
    },
    {
      id: "specificity",
      label: "Lived detail",
      value: 1 - stats.specificity,
      humanEnd: "Concrete",
      machineEnd: "Generic",
      note: "Names, numbers, and places that a generator did not have to invent.",
    },
  ];
}

function modelClause(call: ModelCall): string {
  switch (call.resolution) {
    case "exact":
      return `It names itself as ${call.exactName}.`;
    case "generation":
      return `The closest generation is ${call.label}.`;
    case "family":
      return "The specific model is not resolved.";
    case "unresolved":
      return "";
    default: {
      const neverResolution: never = call.resolution;
      return neverResolution;
    }
  }
}

function houseSentence(family: ModelFamily, call: ModelCall): string {
  switch (family) {
    case "human":
      return "The voice reads closer to a person than to a house style.";
    case "mixed":
    case "unclear":
      return "No single house style owns this page.";
    case "claude":
    case "gpt":
    case "gemini":
    case "grok":
    case "deepseek":
    case "llama":
    case "other": {
      const clause = modelClause(call);
      const house = `The closest house style is ${FAMILY_META[family].label}.`;
      return clause ? `${house} ${clause}` : house;
    }
    default: {
      const neverFamily: never = family;
      return neverFamily;
    }
  }
}

function buildSummary(input: {
  wordCount: number;
  verdict: Verdict;
  family: ModelFamily;
  modelCall: ModelCall;
}): string {
  const { wordCount, verdict, family, modelCall } = input;
  if (wordCount < 12) return "Too little text to lean on. Paste a real paragraph.";
  const house = houseSentence(family, modelCall);
  switch (verdict) {
    case "likely-human":
    case "leaning-human":
      return `The cadence is uneven and the phrasing is not running a template. ${house}`;
    case "mixed":
      return `Machine manners and human mess are both present. ${house}`;
    case "leaning-ai":
    case "likely-ai":
      return `The page carries assistant scaffolding — even rhythm, stock diction, or a familiar closer. ${house}`;
    default: {
      const neverVerdict: never = verdict;
      return neverVerdict;
    }
  }
}

function buildCaveats(input: {
  wordCount: number;
  family: ModelFamily;
  verdict: Verdict;
  spoken: SpokenIdentity | null;
  stylistic: ScoreFamily;
  modelCall: ModelCall;
}): string[] {
  const caveats = [
    "This is a judgment, not a proof. Formal humans and edited machines overlap.",
    "A generation is a style band, not a lab watermark. An exact model is reported only when the text names a version.",
  ];
  if (input.wordCount < 80) {
    caveats.push("Short samples are noisy. A paragraph or two is the floor for a real read.");
  }
  if (input.family === "mixed" || input.verdict === "mixed") {
    caveats.push("Mixed scores often mean a human rewrote a draft, or a model imitated a person.");
  }
  if (
    input.spoken?.resolution === "exact" &&
    input.modelCall.resolution === "exact" &&
    isMachineFamily(input.stylistic) &&
    input.stylistic !== input.spoken.family
  ) {
    caveats.push(
      "House-style cues and the self-identification point at different families. The named model is what the text claims.",
    );
  }
  if (input.modelCall.resolution === "family") {
    caveats.push("The house style is the claim. The checkpoint inside that house is not.");
  }
  return caveats.slice(0, 5);
}

function blankReport(): ForensicReport {
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
    modelCall: unresolvedCall(),
    signals: [],
    tells: [],
    summary: "",
    caveats: [],
    source: "local",
  };
}

export function resolutionRank(resolution: Resolution): number {
  switch (resolution) {
    case "unresolved":
      return 0;
    case "family":
      return 1;
    case "generation":
      return 2;
    case "exact":
      return 3;
    default: {
      const neverResolution: never = resolution;
      return neverResolution;
    }
  }
}
