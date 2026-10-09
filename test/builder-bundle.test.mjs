import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import { exportDocument, normalizeSite, renderSite, template } from "../site-model.js";

test("both browser entry files include the editor and built-in packs", async () => {
  const [index, offline, editor, source] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../offline.html", import.meta.url), "utf8"),
    readFile(new URL("../script.js", import.meta.url), "utf8"),
    readFile(new URL("../builder.template.html", import.meta.url), "utf8")
  ]);
  assert.equal(index, offline);
  assert.doesNotMatch(index, /<script[^>]+src=|<link[^>]+rel="stylesheet"/i);
  assert.match(index, /websiteforge\.artist-essentials/);
  const scripts = [...index.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
  for (const [, id] of editor.matchAll(/\$\("#([^\"]+)"\)/g)) {
    assert.ok(source.includes(`id="${id}"`), `Missing editor control: ${id}`);
  }
});

test("template links point to sections in both the canvas and exported site", () => {
  for (const name of ["portfolio", "events", "shop", "commissions", "links"]) {
    const site = normalizeSite(template(name));
    for (const html of [renderSite(site, true), exportDocument(site)]) {
      const ids = new Set([...html.matchAll(/\sid="([^\"]+)"/g)].map(match => match[1]));
      for (const [, target] of html.matchAll(/\shref="#([^\"]+)"/g)) {
        assert.ok(ids.has(target), `${name} has a broken #${target} link`);
      }
    }
  }
});
