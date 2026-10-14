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
  assert.match(index, /class="tool-rail"/);
  assert.match(index, /id="page-strip-list"/);
  assert.match(index, /id="settings-shortcuts"/);
  assert.match(index, /rel="icon" type="image\/png" href="data:image\/png;base64,/);
  assert.match(index, /class="brand-icon" src="data:image\/png;base64,/);
  assert.match(index, /function normalizeShortcuts\(/);
  const scripts = [...index.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
  for (const [, id] of editor.matchAll(/\$\("#([a-zA-Z0-9_-]+)"\)/g)) {
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

test("direct canvas edits survive normalization and standalone export", () => {
  const site = template("portfolio");
  site.sections[0].title = "Edited on canvas";
  site.sections[0].artLabel = "My studio";
  site.sections[0].imageUrl = "data:image/png;base64,aGVsbG8=";
  site.sections[0].elementStyles = { title: { x: 24, y: -8, width: 420, fontSize: 58, color: "#123456", z: 3 } };
  site.footerNote = "Custom footer";
  const normalized = normalizeSite(site);
  const exported = exportDocument(normalized);
  assert.match(exported, /Edited on canvas/);
  assert.match(exported, /translate\(24px,-8px\)/);
  assert.match(exported, /font-size:58px/);
  assert.match(exported, /data:image\/png;base64,aGVsbG8=/);
  assert.match(exported, /My studio/);
  assert.match(exported, /Custom footer/);
  assert.doesNotMatch(exported, /data-content-key=/);
});

test("shape motion and transform controls survive export", () => {
  const site = template("portfolio");
  site.shapes = [{ id: "test-shape", type: "square", x: 42, y: 38, width: 120, height: 130,
    color: "#aaddaa", opacity: .8, blend: "multiply", rotation: 24,
    motion: { enabled: true, speed: 2, x: 75, y: -30, fade: 40, scaleX: 125, scaleY: 80, hue: 45, rotation: 90 } }];
  const normalized = normalizeSite(site);
  assert.equal(normalized.shapes[0].motion.speed, 2);
  assert.equal(normalized.shapes[0].motion.fade, 40);
  assert.match(renderSite(normalized, true, "test-shape"), /class="shape-rotate-handle"/);
  const exported = exportDocument(normalized);
  assert.match(exported, /class="site-decoration site-motion"/);
  assert.match(exported, /--motion-x:75px/);
  assert.match(exported, /--motion-opacity-end:0\.48/);
  assert.match(exported, /@keyframes wf-motion/);
  assert.doesNotMatch(exported, /shape-rotate-handle/);
});
