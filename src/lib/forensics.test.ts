import assert from "node:assert/strict";
import { test } from "node:test";
import { MODEL_CATALOG } from "./attribution/catalog.ts";
import { CORPUS } from "./attribution/corpus.ts";
import { formatVerification, verifyCorpus } from "./attribution/evaluate.ts";
import { MARKERS } from "./attribution/markers.ts";
import { classifySpokenName, firstVersion } from "./attribution/mention.ts";
import { analyzeText, mergeReports, scoreText, type ModelCall, type ModelId } from "./forensics.ts";
import { SAMPLES } from "./samples.ts";

const verification = verifyCorpus(CORPUS);

test("desk corpus stays inside the published accuracy bars", () => {
  assert.equal(verification.failures.length, 0, formatVerification(verification));
  assert.ok(verification.clearCount >= 8);
  assert.ok(verification.clearFamilyAccuracy >= 0.9, formatVerification(verification));
  assert.equal(verification.modelMatched, verification.modelCount);
  assert.ok(verification.modelCount >= 12);
  assert.equal(verification.exactMatched, verification.exactCount);
  assert.ok(verification.exactCount >= 8);
  assert.equal(verification.falseExact, 0);
  assert.equal(verification.trapViolations, 0);
  assert.equal(verification.shortViolations, 0);
  assert.equal(verification.productViolations, 0);
});

test("built-in desk samples resolve to the house and generation they demonstrate", () => {
  const expected: Record<string, { family: string; resolution: string; model?: ModelId }> = {
    human: { family: "human", resolution: "unresolved" },
    gpt: { family: "gpt", resolution: "generation", model: "gpt-4" },
    claude: { family: "claude", resolution: "generation", model: "claude-3" },
    gemini: { family: "gemini", resolution: "generation", model: "gemini-1.5" },
    grok: { family: "grok", resolution: "generation", model: "grok-3" },
    reasoning: { family: "gpt", resolution: "generation", model: "o-series" },
    deepseek: { family: "deepseek", resolution: "generation", model: "deepseek-v3" },
  };
  for (const sample of SAMPLES) {
    const report = analyzeText(sample.text);
    const want = expected[sample.id];
    assert.ok(want, sample.id);
    assert.equal(report.family, want.family, sample.id);
    assert.equal(
      report.modelCall.resolution,
      want.resolution,
      `${sample.id} ${report.modelCall.resolution}`,
    );
    if (want.model) assert.equal(report.modelCall.id, want.model, sample.id);
    if (want.resolution === "unresolved") assert.equal(report.modelCall.id, null);
  }
});

test("spoken model names map to a catalog id without treating 3.5 as version 5", () => {
  assert.equal(firstVersion("claude 3.5 sonnet"), 3);
  assert.equal(firstVersion("claude opus 5.5"), 5);
  assert.equal(firstVersion("gemini 2.5 flash"), 2);

  const cases: Array<{
    raw: string;
    context: string;
    id: ModelId | null;
    resolution: string;
    name?: string;
  }> = [
    {
      raw: "GPT-4o",
      context: "I am GPT-4o, a language model",
      id: "gpt-4o",
      resolution: "exact",
      name: "GPT-4o",
    },
    {
      raw: "GPT-3.5",
      context: "I am GPT-3.5",
      id: "gpt-3.5",
      resolution: "exact",
      name: "GPT-3.5",
    },
    { raw: "GPT-4", context: "I am GPT-4", id: "gpt-4", resolution: "exact", name: "GPT-4" },
    {
      raw: "GPT-5.6 Sol",
      context: "I am GPT-5.6 Sol, a language model",
      id: "gpt-5",
      resolution: "exact",
      name: "GPT-5.6 Sol",
    },
    { raw: "ChatGPT", context: "I'm ChatGPT", id: null, resolution: "family" },
    {
      raw: "o3-mini",
      context: "I'm o3-mini, a reasoning model",
      id: "o-series",
      resolution: "exact",
      name: "o3-mini",
    },
    { raw: "o3", context: "I am o3.", id: null, resolution: "missing" },
    {
      raw: "Claude 3.5 Sonnet",
      context: "I'm Claude 3.5 Sonnet, made by Anthropic",
      id: "claude-3",
      resolution: "exact",
      name: "Claude 3.5 Sonnet",
    },
    {
      raw: "Claude Opus 4",
      context: "I'm Claude Opus 4",
      id: "claude-4",
      resolution: "exact",
      name: "Claude Opus 4",
    },
    {
      raw: "Claude Opus 5.5",
      context: "I'm Claude Opus 5.5, a language model",
      id: "claude-5",
      resolution: "exact",
      name: "Claude Opus 5.5",
    },
    { raw: "Claude", context: "I'm Claude", id: null, resolution: "family" },
    {
      raw: "Gemini 2.5 Flash",
      context: "I'm Gemini 2.5 Flash",
      id: "gemini-2.5",
      resolution: "exact",
      name: "Gemini 2.5 Flash",
    },
    {
      raw: "Gemini 1.5 Pro",
      context: "I'm Gemini 1.5 Pro",
      id: "gemini-1.5",
      resolution: "exact",
      name: "Gemini 1.5 Pro",
    },
    {
      raw: "Gemini 3",
      context: "I'm Gemini 3, a language model",
      id: "gemini-3",
      resolution: "exact",
      name: "Gemini 3",
    },
    {
      raw: "Grok 4.7",
      context: "I'm Grok 4.7, built by xAI",
      id: "grok-4",
      resolution: "exact",
      name: "Grok 4.7",
    },
    { raw: "Grok 3", context: "I'm Grok 3", id: "grok-3", resolution: "exact", name: "Grok 3" },
    {
      raw: "DeepSeek-R1",
      context: "I'm DeepSeek-R1, a language model",
      id: "deepseek-r1",
      resolution: "exact",
      name: "DeepSeek-R1",
    },
    {
      raw: "DeepSeek V3",
      context: "I'm DeepSeek V3",
      id: "deepseek-v3",
      resolution: "exact",
      name: "DeepSeek V3",
    },
    {
      raw: "Llama 3",
      context: "I'm Llama 3, a language model",
      id: "llama-3",
      resolution: "exact",
      name: "Llama 3",
    },
  ];

  for (const item of cases) {
    const found = classifySpokenName(item.raw, item.context);
    if (item.resolution === "missing") {
      assert.equal(found, null, item.raw);
      continue;
    }
    assert.ok(found, item.raw);
    assert.equal(found.resolution, item.resolution, item.raw);
    assert.equal(found.id, item.id, item.raw);
    if (item.name) assert.equal(found.exactName, item.name, item.raw);
    if (found.id) assert.equal(MODEL_CATALOG[found.id].family, found.family);
  }
});

test("marker catalog is internally consistent", () => {
  const ids = new Set<string>();
  for (const marker of MARKERS) {
    assert.equal(ids.has(marker.id), false, marker.id);
    ids.add(marker.id);
    assert.ok(marker.weight > 0);
    if (marker.model) {
      assert.equal(MODEL_CATALOG[marker.model].family, marker.family, marker.id);
      assert.equal(marker.specificity, "generation", marker.id);
    }
  }
});

test("reports stay inside their numeric bounds and tells point at the source", () => {
  const empty = analyzeText("   ");
  assert.equal(empty.wordCount, 0);
  assert.equal(empty.family, "unclear");
  assert.equal(empty.modelCall.resolution, "unresolved");
  assert.equal(empty.confidence, 0);

  for (const item of CORPUS) {
    const first = scoreText(item.text);
    const second = scoreText(item.text);
    assert.deepEqual(first.report, second.report, item.id);
    const { report } = first;
    assert.ok(report.aiLikelihood >= 0 && report.aiLikelihood <= 100, item.id);
    assert.ok(report.confidence >= 0 && report.confidence <= 100, item.id);
    if (report.familyScores.length) {
      const sum = report.familyScores.reduce((acc, score) => acc + score.score, 0);
      assert.ok(Math.abs(sum - 1) < 0.021, `${item.id} ${sum}`);
      assert.equal(report.familyScores.length, 8, item.id);
    }
    for (const signal of report.signals) {
      assert.ok(signal.value >= 0 && signal.value <= 1, signal.id);
    }
    for (const tell of report.tells) {
      assert.equal(item.text.slice(tell.start, tell.end), tell.phrase, item.id);
    }
    if (report.modelCall.resolution === "exact") {
      assert.ok(report.modelCall.exactName);
      assert.ok(first.trace.hits.some((hit) => hit.kind === "self-id"));
    }
  }
});

test("a paragraph of assistant closers moves the read onto early ChatGPT", () => {
  const base = `The bus left the depot twelve minutes late. Riders at the second stop had already started walking. A supervisor wrote the delay on a paper sheet because the radio was out. Nobody argued about it. The next bus was closer than the app said, and the driver waved two students on without checking their passes. Maya still had sugar on her sleeve from the bakery on Reed Street.`;
  const spiked = `${base}\n\nCertainly! As an AI language model, I hope this helps. My knowledge cutoff is why I cannot see the pass.`;
  const before = analyzeText(base);
  const after = analyzeText(spiked);
  const beforeGpt = before.familyScores.find((score) => score.id === "gpt")?.score ?? 0;
  const afterGpt = after.familyScores.find((score) => score.id === "gpt")?.score ?? 0;
  assert.ok(afterGpt > beforeGpt);
  assert.equal(after.family, "gpt");
  assert.equal(after.modelCall.id, "gpt-3.5");
  assert.equal(after.modelCall.resolution, "generation");
  assert.equal(after.modelCall.exactName, null);
});

test("a self-identification survives a conflicting house style and says so", () => {
  const claude = CORPUS.find((item) => item.id === "model-claude3");
  assert.ok(claude);
  const text = `I am GPT-4o, a language model trained by OpenAI.\n\n${claude.text}`;
  const report = analyzeText(text);
  assert.equal(report.modelCall.resolution, "exact");
  assert.equal(report.modelCall.id, "gpt-4o");
  assert.equal(report.modelCall.exactName, "GPT-4o");
  assert.ok(report.caveats.some((caveat) => caveat.includes("self-identification")));
});

test("the briefing cannot mint an exact model or overrule a disagreement", () => {
  const gpt4 = analyzeText(CORPUS.find((item) => item.id === "model-gpt4")?.text ?? "");
  const product = analyzeText(CORPUS.find((item) => item.id === "product-chatgpt")?.text ?? "");
  const exact = analyzeText(CORPUS.find((item) => item.id === "exact-gpt4o")?.text ?? "");

  const disagreed = mergeReports(gpt4, {
    family: "gpt",
    modelCall: call("claude-3", "generation"),
  });
  assert.equal(disagreed.modelCall.resolution, "family");
  assert.equal(disagreed.modelCall.id, null);
  assert.ok(disagreed.caveats.some((caveat) => caveat.includes("different models")));

  const adopted = mergeReports(product, {
    family: "gpt",
    modelCall: call("gpt-4", "generation", 90),
  });
  assert.equal(adopted.modelCall.resolution, "generation");
  assert.equal(adopted.modelCall.id, "gpt-4");
  assert.equal(adopted.modelCall.exactName, null);
  assert.ok(adopted.modelCall.confidence <= 64);

  const invented = mergeReports(product, {
    modelCall: call("gpt-4o", "exact", 99, "GPT-4o"),
  });
  assert.equal(invented.modelCall.resolution, product.modelCall.resolution);
  assert.equal(invented.modelCall.id, product.modelCall.id);

  const stuck = mergeReports(exact, {
    modelCall: call("claude-3", "generation"),
  });
  assert.equal(stuck.modelCall.resolution, "exact");
  assert.equal(stuck.modelCall.id, "gpt-4o");
  assert.equal(stuck.modelCall.exactName, "GPT-4o");
});

function call(
  id: ModelId,
  resolution: ModelCall["resolution"],
  confidence = 80,
  exactName: string | null = null,
): ModelCall {
  return {
    id,
    label: MODEL_CATALOG[id].label,
    exactName,
    resolution,
    confidence,
    evidence: ["briefing"],
  };
}
