import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizePluginPack, createPluginSection } from "../plugin-model.js";
import { exportDocument, normalizeSite, renderSite, template } from "../site-model.js";

const sample = JSON.parse(await readFile(new URL("../plugins/artist-essentials.json", import.meta.url), "utf8"));
const lightMode = JSON.parse(await readFile(new URL("../plugins/light-mode.json", import.meta.url), "utf8"));

test("community pack sections render in standalone exports", () => {
  const pack = normalizePluginPack(sample);
  assert.equal(pack.sections.length, 2);
  const site = normalizeSite({ ...template(), sections: [createPluginSection(pack.sections[0])] });
  const html = exportDocument(site);
  assert.match(html, /<details>/);
  assert.match(html, /How do commissions work\?/);
  assert.match(html, /--content-width:1180px/);
});

test("plugin data is validated and escaped", () => {
  const unsafe = structuredClone(sample);
  unsafe.sections[0].defaults.title = "<script>alert(1)</script>";
  unsafe.sections[0].defaults.buttonUrl = "javascript:alert(1)";
  const pack = normalizePluginPack(unsafe);
  const site = normalizeSite({ ...template(), sections: [createPluginSection(pack.sections[0])] });
  const html = exportDocument(site);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /&lt;script&gt;/);
  assert.equal(pack.sections[0].defaults.buttonUrl, "#");
});

test("rejects executable or malformed plugin definitions", () => {
  assert.throws(() => normalizePluginPack({ ...sample, sections: [{ ...sample.sections[0], layout: "javascript" }] }));
  assert.throws(() => normalizePluginPack({ ...sample, themes: [{ id: "bad", name: "Bad", colors: { accent: "red" } }] }));
});

test("older projects receive design defaults and preserve per-section styles", () => {
  const legacy = { version: 1, name: "Legacy", theme: "forge", accent: "#ed7418", font: "modern", sections: [{ id: "hero-old", type: "hero", title: "Hello", background: "#112233", textColor: "#ffffff", alignment: "center" }] };
  const site = normalizeSite(legacy);
  assert.equal(site.design.sectionSpacing, 90);
  assert.equal(site.palette.paper, "#fff8f1");
  const html = exportDocument(site);
  assert.match(html, /align-center/);
  assert.match(html, /background:#112233/);
});

test("five templates render and the link hub keeps safe destinations", () => {
  for (const name of ["portfolio", "events", "shop", "commissions", "links"]) {
    const site = normalizeSite(template(name));
    assert.ok(site.sections.length >= 3, `${name} should have useful content`);
    assert.match(exportDocument(site), /<header class="site-nav">/);
  }
  const linkHub = normalizeSite(template("links"));
  assert.equal(linkHub.sections.some(section => section.type === "links"), true);
  const links = linkHub.sections.find(section => section.type === "links");
  links.items[0].linkUrl = "javascript:alert(1)";
  const html = exportDocument(normalizeSite(linkHub));
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /class="link-card"/);
});

test("light mode is an allowlisted editor feature", () => {
  const pack = normalizePluginPack(lightMode);
  assert.deepEqual(pack.features, ["workspace-light-mode"]);
  assert.throws(() => normalizePluginPack({ ...lightMode, id: "other.light-mode" }));
  assert.throws(() => normalizePluginPack({ ...lightMode, features: ["run-javascript"] }));
});

test("website links accept pasted domains and remain clickable in the editor and export", () => {
  const site = template("links");
  site.sections[0].buttonUrl = "youtube.com/@artist";
  site.sections[1].items[0].linkUrl = "www.youtube.com/watch?v=example";
  const normalized = normalizeSite(site);
  assert.equal(normalized.sections[0].buttonUrl, "https://youtube.com/@artist");
  assert.equal(normalized.sections[1].items[0].linkUrl, "https://www.youtube.com/watch?v=example");
  assert.match(renderSite(normalized, true), /id="gallery"|id="[a-f0-9-]+" data-section-id=/);
  assert.match(renderSite(normalized, true), /href="https:\/\/youtube.com\/@artist"/);
  assert.match(exportDocument(normalized), /href="https:\/\/www.youtube.com\/watch\?v=example"/);
  site.sections[0].buttonUrl = "javascript:alert(1)";
  assert.equal(normalizeSite(site).sections[0].buttonUrl, "#");
});

test("new built-in tool packs are valid and template packs preserve safe content", async () => {
  for (const [file, feature] of [
    ["drawing-menu", "drawing-menu"], ["text-tool", "text-tool"],
    ["image-tool", "image-tool"], ["template-studio", "template-studio"]
  ]) {
    const raw = JSON.parse(await readFile(new URL(`../plugins/${file}.json`, import.meta.url), "utf8"));
    assert.deepEqual(normalizePluginPack(raw).features, [feature]);
  }
  const pack = normalizePluginPack({
    format: "websiteforge-plugin", version: 1, id: "artist.saved-template", name: "Saved design",
    templates: [{ id: "saved-design", name: "My design", sections: [{ id: "blank", type: "blank" }],
      objects: [{ id: "text-1", type: "text", text: "<b>Hello</b>" },
        { id: "image-1", type: "image", url: "javascript:alert(1)" }],
      shapes: [{ id: "shape-1", type: "heart", color: "#123456" }] }]
  });
  assert.equal(pack.templates.length, 1);
  assert.equal(pack.templates[0].objects[1].url, "");
  const site = normalizeSite({ ...template(), ...pack.templates[0], sections: pack.templates[0].sections });
  const html = exportDocument(site);
  assert.match(html, /class="site-decoration"/);
  assert.match(html, /&lt;b&gt;Hello&lt;\/b&gt;/);
  assert.doesNotMatch(html, /javascript:alert/);
});
