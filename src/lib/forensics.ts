export type ModelFamily =
  | "human"
  | "claude"
  | "gpt"
  | "gemini"
  | "grok"
  | "mixed"
  | "other"
  | "unclear";

export type Verdict =
  | "likely-human"
  | "leaning-human"
  | "mixed"
  | "leaning-ai"
  | "likely-ai";

export type Signal = {
  id: string;
  label: string;
  value: number;
  humanEnd: string;
  machineEnd: string;
  note: string;
};

export type FamilyScore = {
  id: Exclude<ModelFamily, "mixed" | "unclear">;
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
  signals: Signal[];
  tells: Tell[];
  summary: string;
  caveats: string[];
  source: "local" | "merged";
  briefing?: string;
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
  mixed: {
    label: "Mixed / edited",
    blurb: "Human revision sitting on machine bones, or the reverse.",
  },
  other: {
    label: "Other model",
    blurb: "Machine cadence without a clean family match.",
  },
};

type PhraseHit = {
  re: RegExp;
  w: number;
  family?: Exclude<ModelFamily, "mixed" | "unclear">;
  leans?: "ai";
  note: string;
};

const PHRASES: PhraseHit[] = [
  // GPT / generic assistant
  { re: /\bcertainly[!.,]/i, w: 3.2, family: "gpt", note: "Sycophantic opener" },
  { re: /\bof course[!.,]/i, w: 1.6, family: "gpt", note: "Agreeable opener" },
  { re: /\babsolutely[!.,]/i, w: 1.8, family: "gpt", note: "Agreeable opener" },
  { re: /\bgreat question\b/i, w: 3.4, family: "gpt", note: "Assistant flattery" },
  { re: /\bi'?d be happy to\b/i, w: 2.8, family: "gpt", note: "Assistant offer" },
  { re: /\bi hope this helps\b/i, w: 3.6, family: "gpt", note: "Classic closer" },
  { re: /\blet me know if (you )?(need|have|would)\b/i, w: 2.6, family: "gpt", note: "Support closer" },
  { re: /\bfeel free to\b/i, w: 1.8, family: "gpt", note: "Support closer" },
  { re: /\bdelve (into|deeper)\b/i, w: 3.4, family: "gpt", note: "Stock GPT verb" },
  { re: /\btapestry\b/i, w: 2.8, family: "gpt", note: "Overused metaphor" },
  { re: /\blandscape of\b/i, w: 2.4, family: "gpt", note: "Stock metaphor" },
  { re: /\bin the realm of\b/i, w: 2.6, family: "gpt", note: "Padded prepositional" },
  { re: /\bplays a (crucial|vital|pivotal|key) role\b/i, w: 3.0, family: "gpt", note: "Empty emphasis" },
  { re: /\bit'?s important to (note|remember|understand|consider)\b/i, w: 2.8, family: "gpt", note: "Teacher hedge" },
  { re: /\bin (today'?s|conclusion|summary)\b/i, w: 2.2, family: "gpt", note: "Essay scaffolding" },
  { re: /\bmultifaceted\b/i, w: 2.2, family: "gpt", note: "Inflated adjective" },
  { re: /\bcomprehensive (overview|guide|understanding)\b/i, w: 2.6, family: "gpt", note: "Brochure diction" },
  { re: /\brobust\b/i, w: 1.1, family: "gpt", note: "Corporate filler" },
  { re: /\bleverage\b/i, w: 1.2, family: "gpt", note: "Corporate filler" },
  { re: /\bfoster(s|ing)?\b/i, w: 1.1, family: "gpt", note: "Corporate filler" },
  { re: /\bnestled\b/i, w: 2.0, family: "gpt", note: "Travel-copy adjective" },
  { re: /\bvibrant\b/i, w: 1.2, family: "gpt", note: "Brochure adjective" },
  { re: /\bunderscore(s|d)?\b/i, w: 1.4, family: "gpt", note: "Essay verb" },
  { re: /\bshed light on\b/i, w: 2.2, family: "gpt", note: "Stock idiom" },
  { re: /\bnavigat(e|ing) the\b/i, w: 1.8, family: "gpt", note: "Stock verb" },
  { re: /\ba testament to\b/i, w: 2.0, family: "gpt", note: "Stock idiom" },
  { re: /\bin the ever-evolving\b/i, w: 3.0, family: "gpt", note: "Intro cliché" },
  { re: /\bwhether you'?re\b/i, w: 1.8, family: "gpt", note: "Listicle pivot" },
  { re: /\bnot only\b[\s\S]{0,40}\bbut also\b/i, w: 1.6, leans: "ai", note: "Correlative parallelism" },
  { re: /\bon (the )?one hand\b[\s\S]{0,80}\bon the other\b/i, w: 2.2, family: "gpt", note: "Both-sides scaffold" },

  // Claude
  { re: /\bi want to be (careful|honest|precise|clear) (here|about)?\b/i, w: 3.4, family: "claude", note: "Claude caution" },
  { re: /\bit'?s worth (sitting with|lingering|noting|being precise)\b/i, w: 2.8, family: "claude", note: "Reflective hedge" },
  { re: /\bthere'?s a (real )?(tension|tradeoff|nuance)\b/i, w: 2.6, family: "claude", note: "Nuance framing" },
  { re: /\blet me (think|sit) (through|with)\b/i, w: 2.4, family: "claude", note: "Thinking-aloud" },
  { re: /\bi('d| would) (push back|be cautious|be wary)\b/i, w: 2.2, family: "claude", note: "Gentle dissent" },
  { re: /\bgenuinely\b/i, w: 0.8, family: "claude", note: "Soft intensifier" },
  { re: /\bthe honest version\b/i, w: 1.8, family: "claude", note: "Candor frame" },
  { re: /\bif i'?m being (precise|honest|careful)\b/i, w: 2.4, family: "claude", note: "Self-qualifying" },
  { re: /\bhappy to (sit with|go deeper|unpack)\b/i, w: 2.6, family: "claude", note: "Collaborative offer" },
  { re: /\bthat said\b/i, w: 0.7, family: "claude", note: "Turn hedge" },
  { re: /\bthere'?s something (slightly|quietly|oddly)\b/i, w: 2.0, family: "claude", note: "Literary hedge" },

  // Gemini
  { re: /\bhere'?s a breakdown\b/i, w: 3.6, family: "gemini", note: "Gemini outline cue" },
  { re: /\bkey takeaways?\b/i, w: 3.0, family: "gemini", note: "Briefing header" },
  { re: /\blet'?s (explore|break (this )?down|dive in)\b/i, w: 2.2, family: "gemini", note: "Tour-guide opener" },
  { re: /\bto summarize\b/i, w: 1.6, family: "gemini", note: "Recap header" },
  { re: /\bi can help with that\b/i, w: 2.4, family: "gemini", note: "Assistant ack" },
  { re: /\bhere are some options\b/i, w: 2.4, family: "gemini", note: "Options list" },
  { re: /\bquick answer\b/i, w: 1.8, family: "gemini", note: "TL;DR header" },
  { re: /\bstep[- ]by[- ]step\b/i, w: 1.4, family: "gemini", note: "How-to frame" },
  { re: /\bat a glance\b/i, w: 1.6, family: "gemini", note: "Summary chip" },
  { re: /\bpros and cons\b/i, w: 1.2, family: "gemini", note: "Comparison frame" },

  // Grok
  { re: /\blook,\s/i, w: 2.4, family: "grok", note: "Direct address" },
  { re: /\bhonestly[, ]/i, w: 1.6, family: "grok", note: "Candid adverb" },
  { re: /\bhere'?s the (thing|deal|honest)\b/i, w: 2.4, family: "grok", note: "Street thesis" },
  { re: /\byeah,\s/i, w: 1.4, family: "grok", note: "Conversational yes" },
  { re: /\bnah,\s/i, w: 1.8, family: "grok", note: "Conversational no" },
  { re: /\bhot take\b/i, w: 2.2, family: "grok", note: "Opinion cue" },
  { re: /\bi'?m not going to (pretend|dress this up)\b/i, w: 2.6, family: "grok", note: "Anti-corporate" },
  { re: /\bthe boring (answer|truth)\b/i, w: 2.0, family: "grok", note: "Deflation" },
  { re: /\bwild(ly)?\b/i, w: 0.6, family: "grok", note: "Casual intensifier" },

  // Generic AI
  { re: /\bfurthermore\b/i, w: 1.6, leans: "ai", note: "Essay transition" },
  { re: /\bmoreover\b/i, w: 1.6, leans: "ai", note: "Essay transition" },
  { re: /\badditionally\b/i, w: 1.3, leans: "ai", note: "Essay transition" },
  { re: /\bconsequently\b/i, w: 1.4, leans: "ai", note: "Essay transition" },
  { re: /\bnonetheless\b/i, w: 1.2, leans: "ai", note: "Essay transition" },
  { re: /\bin conclusion\b/i, w: 2.4, leans: "ai", note: "Essay closer" },
  { re: /\bas an ai\b/i, w: 4.0, leans: "ai", note: "Self-identification" },
  { re: /\bi don'?t have (personal )?opinions\b/i, w: 3.0, leans: "ai", note: "Safety disclaimer" },
  { re: /\bi (cannot|can't) (browse|access) the internet\b/i, w: 2.4, leans: "ai", note: "Capability disclaimer" },
];

const HUMAN_TELLS: PhraseHit[] = [
  { re: /\bidk\b/i, w: 2.2, family: "human", note: "Typed abbreviation" },
  { re: /\blmao\b|\blol\b|\btbh\b|\bimo\b/i, w: 1.8, family: "human", note: "Chat register" },
  { re: /\b(?:gonna|wanna|gotta|kinda|sorta)\b/i, w: 1.4, family: "human", note: "Spoken reduction" },
  { re: /\b(?:um+|uh+|erm)\b/i, w: 2.0, family: "human", note: "Filled pause" },
];

function clamp(n: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, n));
}

function stddev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? [];
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
    n++;
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
  let m: RegExpExecArray | null;
  const limit = 12;
  while ((m = copy.exec(text)) && out.length < limit) {
    out.push({ start: m.index, end: m.index + m[0].length, phrase: m[0] });
    if (m[0].length === 0) copy.lastIndex++;
  }
  return out;
}

function verdictFrom(score: number): Verdict {
  if (score < 28) return "likely-human";
  if (score < 42) return "leaning-human";
  if (score < 58) return "mixed";
  if (score < 74) return "leaning-ai";
  return "likely-ai";
}

function familyLabel(id: FamilyScore["id"]): string {
  return FAMILY_META[id].label;
}

export function analyzeText(raw: string): ForensicReport {
  const text = raw.replace(/\u00a0/g, " ").trim();
  const charCount = text.length;
  const words = tokenizeWords(text);
  const wordCount = words.length;
  const sentences = splitSentences(text);
  const sentenceCount = sentences.length;
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const paragraphCount = Math.max(paragraphs.length, text ? 1 : 0);
  const lengths = sentences.map((s) => tokenizeWords(s).length).filter((n) => n > 0);
  const avgSentence = lengths.length
    ? lengths.reduce((a, b) => a + b, 0) / lengths.length
    : 0;
  const cv = avgSentence > 0 ? stddev(lengths) / avgSentence : 0;
  const burstiness = cv;

  const emdashes = (text.match(/[—–]/g) ?? []).length;
  const emdashPer100 = wordCount ? (emdashes / wordCount) * 100 : 0;

  const contractions = (text.match(/\b[a-z]+n't\b|\b(?:i'm|i've|i'd|i'll|you're|we've|they're|it's|that's|what's|don't|can't|won't|isn't)\b/gi) ?? []).length;
  const contractionRate = wordCount ? contractions / wordCount : 0;

  const ttr = movingTtr(words);

  const mdHeadings = (text.match(/^\s{0,3}#{1,3}\s/gm) ?? []).length;
  const mdLists = (text.match(/^\s*(?:[-*]|\d+\.)\s+\S/gm) ?? []).length;
  const structureScore = clamp((mdHeadings * 1.4 + mdLists * 0.7) / Math.max(3, paragraphCount));

  let stockWeight = 0;
  const familyRaw: Record<FamilyScore["id"], number> = {
    human: 0.15,
    claude: 0.08,
    gpt: 0.08,
    gemini: 0.08,
    grok: 0.08,
    other: 0.04,
  };
  const familyReasons: Record<FamilyScore["id"], string[]> = {
    human: [],
    claude: [],
    gpt: [],
    gemini: [],
    grok: [],
    other: [],
  };
  const tells: Tell[] = [];

  const pushReason = (id: FamilyScore["id"], note: string) => {
    if (!familyReasons[id].includes(note) && familyReasons[id].length < 4) {
      familyReasons[id].push(note);
    }
  };

  for (const p of PHRASES) {
    const hits = findAll(text, p.re);
    if (!hits.length) continue;
    const add = Math.min(hits.length, 4) * p.w;
    stockWeight += add;
    const target = p.family ?? (p.leans === "ai" ? "other" : undefined);
    if (target) {
      familyRaw[target] += add;
      pushReason(target, p.note);
    }
    for (const h of hits.slice(0, 2)) {
      tells.push({
        phrase: h.phrase,
        start: h.start,
        end: h.end,
        leans: p.family ?? "ai",
        note: p.note,
      });
    }
  }

  let humanWeight = 0;
  for (const p of HUMAN_TELLS) {
    const hits = findAll(text, p.re);
    if (!hits.length) continue;
    const add = Math.min(hits.length, 5) * p.w;
    humanWeight += add;
    familyRaw.human += add;
    pushReason("human", p.note);
    for (const h of hits.slice(0, 2)) {
      tells.push({
        phrase: h.phrase,
        start: h.start,
        end: h.end,
        leans: "human",
        note: p.note,
      });
    }
  }

  // Rhythm: low burstiness is a machine tell.
  const machineRhythm = clamp((0.55 - burstiness) / 0.45);
  const humanRhythm = clamp((burstiness - 0.35) / 0.55);

  // Type-token: very smooth mid TTR is machine; messy high or oddly low can be human.
  const ttrMachine = clamp(1 - Math.abs(ttr - 0.62) / 0.28) * (wordCount > 40 ? 1 : 0.4);

  // Formality without contractions.
  const formal = clamp((0.035 - contractionRate) / 0.035);

  // Em-dash as Claude prior.
  if (emdashPer100 > 0.6) {
    familyRaw.claude += Math.min(4.2, emdashPer100 * 1.6);
    pushReason("claude", "Heavy em-dash habit");
  }

  // Long hypotaxis → Claude
  if (avgSentence > 24 && burstiness < 0.55) {
    familyRaw.claude += 1.6;
    pushReason("claude", "Long even sentences");
  }

  // Outline structure → Gemini
  if (mdHeadings + mdLists >= 3) {
    familyRaw.gemini += 1.8 + Math.min(2, (mdHeadings + mdLists) * 0.25);
    pushReason("gemini", "Outlined / listed structure");
  }

  // Short punchy grafs + contractions → Grok / human
  const avgParaWords =
    paragraphCount > 0 ? wordCount / paragraphCount : wordCount;
  if (avgParaWords < 38 && contractionRate > 0.03 && burstiness > 0.4) {
    familyRaw.grok += 1.5;
    pushReason("grok", "Short grafs, spoken rhythm");
  }

  // Specificity: digits, proper-looking tokens, time crumbs
  const digits = (text.match(/\b\d{1,4}\b/g) ?? []).length;
  const proper = (text.match(/\b[A-Z][a-z]{3,}\b/g) ?? []).length;
  const specificity = clamp((digits * 0.35 + proper * 0.08) / 6);
  if (specificity > 0.45 && stockWeight < 4) {
    familyRaw.human += 2.2;
    pushReason("human", "Concrete names and numbers");
  }

  // Fragments and lowercase starts
  const fragmentish = sentences.filter((s) => {
    const w = tokenizeWords(s).length;
    return w > 0 && w < 5 && !/[.?!]$/.test(s.trim());
  }).length;
  if (fragmentish >= 1) {
    familyRaw.human += 1.2;
    pushReason("human", "Sentence fragments");
    humanWeight += 1.2;
  }

  const firstLower = (text.match(/(?:^|\n)[a-z]/g) ?? []).length;
  if (firstLower >= 1) {
    familyRaw.human += 0.8;
    humanWeight += 0.6;
  }

  // Swear / heat — more Grok / human than GPT
  const heat = countMatches(text, /\b(shit|fuck|damn|ass|crap|hell)\b/i);
  if (heat) {
    familyRaw.grok += Math.min(2.4, heat * 1.1);
    familyRaw.human += 0.8;
    pushReason("grok", "Unfiltered register");
  }

  const stockDensity = wordCount ? stockWeight / Math.max(40, wordCount / 8) : 0;
  const stockSignal = clamp(stockDensity / 1.15);

  const aiLikelihoodUncapped =
    18 +
    stockSignal * 38 +
    machineRhythm * 18 +
    ttrMachine * 10 +
    formal * 8 +
    structureScore * 12 -
    Math.min(22, humanWeight * 3.2) -
    humanRhythm * 10 -
    specificity * 8;

  let aiLikelihood = Math.round(clamp(aiLikelihoodUncapped, 6, 92));

  const strongestModel = (["claude", "gpt", "gemini", "grok"] as const)
    .map((id) => ({ id, v: familyRaw[id] }))
    .sort((a, b) => b.v - a.v)[0];
  if (strongestModel && strongestModel.v > 2.2 && strongestModel.v > familyRaw.human * 0.7) {
    const floor =
      strongestModel.id === "grok" ? 40 : strongestModel.id === "claude" ? 52 : 68;
    const share = strongestModel.v / (strongestModel.v + familyRaw.human + 0.01);
    aiLikelihood = Math.min(90, Math.max(aiLikelihood, Math.round(floor + share * 16)));
  }

  // Short text: pull toward 50 and cut confidence.
  let confidence = 86;
  if (wordCount < 20) {
    aiLikelihood = Math.round((aiLikelihood + 50) / 2);
    confidence = 22;
  } else if (wordCount < 60) {
    aiLikelihood = Math.round(aiLikelihood * 0.86 + 50 * 0.14);
    confidence = 48;
  } else if (wordCount < 140) {
    confidence = 64;
  } else if (wordCount < 260) {
    confidence = 76;
  }

  if (aiLikelihood < 30 && !(strongestModel && strongestModel.v > familyRaw.human)) {
    familyRaw.human += 3.2;
  } else if (aiLikelihood > 68) {
    familyRaw.human *= 0.4;
  }

  const famIds = Object.keys(familyRaw) as Array<FamilyScore["id"]>;
  const famSum = famIds.reduce((a, k) => a + Math.max(0.01, familyRaw[k]), 0);
  const familyScores: FamilyScore[] = famIds
    .map((id) => ({
      id,
      label: familyLabel(id),
      score: Math.max(0.01, familyRaw[id]) / famSum,
      reasons: familyReasons[id],
    }))
    .sort((a, b) => b.score - a.score);

  const top = familyScores[0];
  const second = familyScores[1];
  let family: ModelFamily = top?.id ?? "unclear";
  if (top && second && top.score - second.score < 0.08 && top.score < 0.42) {
    family = aiLikelihood > 52 ? "mixed" : "unclear";
  }

  const verdict = verdictFrom(aiLikelihood);

  const signals: Signal[] = [
    {
      id: "burst",
      label: "Burstiness",
      value: clamp(1 - (burstiness - 0.15) / 0.75),
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
      value: structureScore,
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
      value: 1 - specificity,
      humanEnd: "Concrete",
      machineEnd: "Generic",
      note: "Names, numbers, and places that a generator did not have to invent.",
    },
  ];

  tells.sort((a, b) => a.start - b.start);
  const deduped: Tell[] = [];
  for (const t of tells) {
    const overlap = deduped.some((d) => !(t.end <= d.start || t.start >= d.end));
    if (!overlap) deduped.push(t);
    if (deduped.length >= 14) break;
  }

  const caveats: string[] = [
    "This is a judgment, not a proof. Formal humans and edited machines overlap.",
  ];
  if (wordCount < 80) {
    caveats.push("Short samples are noisy. A paragraph or two is the floor for a real read.");
  }
  if (family === "mixed" || verdict === "mixed") {
    caveats.push("Mixed scores often mean a human rewrote a draft, or a model imitated a person.");
  }
  caveats.push("A family guess names the closest house style — not a courtroom identification.");

  const famLine =
    family === "human"
      ? "The voice reads closer to a person than to a house style."
      : family === "mixed" || family === "unclear"
        ? "No single house style owns this page."
        : `The closest house style is ${FAMILY_META[family].label}.`;

  const summary =
    wordCount < 12
      ? "Too little text to lean on. Paste a real paragraph."
      : verdict === "likely-human" || verdict === "leaning-human"
        ? `The cadence is uneven and the phrasing is not running a template. ${famLine}`
        : verdict === "mixed"
          ? `Machine manners and human mess are both present. ${famLine}`
          : `The page carries assistant scaffolding — even rhythm, stock diction, or a familiar closer. ${famLine}`;

  return {
    wordCount,
    sentenceCount,
    charCount,
    paragraphCount,
    avgSentence: Math.round(avgSentence * 10) / 10,
    burstiness: Math.round(burstiness * 100) / 100,
    aiLikelihood,
    confidence,
    verdict,
    family,
    familyScores,
    signals,
    tells: deduped,
    summary,
    caveats,
    source: "local",
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
    signals: [],
    tells: [],
    summary: "",
    caveats: [],
    source: "local",
  };
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
  },
): ForensicReport {
  const ai = Math.round(
    clamp((local.aiLikelihood * 0.4 + (remote.aiLikelihood ?? local.aiLikelihood) * 0.6) / 100, 0.06, 0.94) *
      100,
  );
  const familyMap = new Map<FamilyScore["id"], FamilyScore>();
  for (const f of local.familyScores) familyMap.set(f.id, { ...f, score: f.score * 0.4 });
  for (const f of remote.familyScores ?? []) {
    const prev = familyMap.get(f.id);
    familyMap.set(f.id, {
      id: f.id,
      label: f.label || familyLabel(f.id),
      score: (prev?.score ?? 0) + f.score * 0.6,
      reasons: Array.from(new Set([...(prev?.reasons ?? []), ...f.reasons])).slice(0, 4),
    });
  }
  const mergedFam = Array.from(familyMap.values());
  const sum = mergedFam.reduce((a, f) => a + f.score, 0) || 1;
  const familyScores = mergedFam
    .map((f) => ({ ...f, score: f.score / sum }))
    .sort((a, b) => b.score - a.score);

  const top = familyScores[0];
  const second = familyScores[1];
  let family: ModelFamily = remote.family ?? top?.id ?? local.family;
  if (top && second && top.score - second.score < 0.07) family = ai > 52 ? "mixed" : "unclear";

  const remoteTells = (remote.tells ?? []).filter((t) => t.phrase && t.note);
  const tells = [...remoteTells, ...local.tells].slice(0, 16);

  return {
    ...local,
    aiLikelihood: ai,
    confidence: Math.max(local.confidence, remote.confidence ?? 0),
    verdict: remote.verdict ?? verdictFrom(ai),
    family,
    familyScores,
    tells,
    summary: remote.summary || local.summary,
    caveats: Array.from(new Set([...(remote.caveats ?? []), ...local.caveats])).slice(0, 5),
    source: "merged",
    briefing: remote.briefing,
  };
}
