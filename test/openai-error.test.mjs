import test from "node:test";
import assert from "node:assert/strict";
import { explainOpenAIError } from "../openai-error.js";

test("429 billing and rate limits get different guidance", () => {
  assert.match(explainOpenAIError(429, { error: { code: "credit_balance_exhausted" } }), /credit balance is exhausted/);
  assert.match(explainOpenAIError(429, { error: { code: "project_spend_limit_exceeded", type: "insufficient_quota" } }), /spending limit/);
  assert.match(explainOpenAIError(429, { error: { type: "rate_limit_exceeded" } }), /Wait a little/);
  assert.match(explainOpenAIError(429, {}), /rate limit or an API billing or usage limit/);
});

test("authentication errors point to the right settings", () => {
  assert.match(explainOpenAIError(401, {}), /key saved in Settings/);
  assert.match(explainOpenAIError(403, {}), /project permissions/);
});
