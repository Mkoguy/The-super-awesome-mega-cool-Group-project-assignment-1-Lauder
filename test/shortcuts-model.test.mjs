import test from "node:test";
import assert from "node:assert/strict";
import { defaultShortcuts, normalizeShortcuts, shortcutFromKeyboardEvent } from "../shortcuts-model.js";

test("keyboard events use consistent names across common editing shortcuts", () => {
  assert.equal(shortcutFromKeyboardEvent({ key: "c", ctrlKey: true }), "Ctrl+C");
  assert.equal(shortcutFromKeyboardEvent({ key: "Z", ctrlKey: true, shiftKey: true }), "Ctrl+Shift+Z");
  assert.equal(shortcutFromKeyboardEvent({ key: "ArrowLeft", shiftKey: true }), "Shift+ArrowLeft");
  assert.equal(shortcutFromKeyboardEvent({ key: "]", ctrlKey: true }), "Ctrl+BracketRight");
  assert.equal(shortcutFromKeyboardEvent({ key: "Control", ctrlKey: true }), "");
});

test("custom shortcuts persist when two default assignments are exchanged", () => {
  const saved = { ...defaultShortcuts(), copy: "Ctrl+V", paste: "Ctrl+C" };
  assert.deepEqual(normalizeShortcuts(saved), saved);
});

test("invalid and duplicate stored shortcuts fall back to distinct bindings", () => {
  const result = normalizeShortcuts({ copy: "Ctrl+R", paste: "Ctrl+C", cut: "Ctrl+C" });
  assert.equal(result.copy, "Ctrl+V");
  assert.equal(result.paste, "Ctrl+C");
  assert.equal(new Set(Object.values(result)).size, Object.keys(result).length);
});
