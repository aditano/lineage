import assert from "node:assert/strict";
import { test } from "node:test";
import { isBriefingTransportError, localFullRead } from "./full-read.ts";
import { SAMPLES } from "./samples.ts";

test("a full read without the briefing server still returns the local forensic report", () => {
  const sample = SAMPLES.find((item) => item.id === "gpt");
  assert.ok(sample);
  const result = localFullRead(sample.text);
  assert.equal(result.ok, true);
  assert.equal(result.usedModel, false);
  assert.equal(result.report.source, "local");
  assert.equal(result.report.family, "gpt");
  assert.equal(result.report.modelCall.id, "gpt-4");
  assert.equal(result.report.briefing, undefined);
  assert.ok(result.report.summary.length > 0);
  assert.ok(result.report.tells.length > 0);
});

test("a missing Pages server function is a transport miss, not a failed read", () => {
  assert.equal(isBriefingTransportError(new Error("Invariant failed")), true);
  assert.equal(
    isBriefingTransportError(new Error("<html><head><title>405 Not Allowed</title></head></html>")),
    true,
  );
  assert.equal(isBriefingTransportError(new Error("Failed to fetch")), true);
  assert.equal(
    isBriefingTransportError(new TypeError("NetworkError when attempting to fetch resource.")),
    true,
  );
  assert.equal(
    isBriefingTransportError(new Error("Need a bit more text — a short paragraph at least.")),
    false,
  );
});
