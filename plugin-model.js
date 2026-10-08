import { makeSection, normalizeSite } from "./site-model.js";

const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const slug = value => typeof value === "string" && /^[a-z0-9][a-z0-9._-]{2,79}$/.test(value);
const hex = value => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
const layouts = ["cards", "faq", "quote", "banner"];
const builtInFeatures = ["workspace-light-mode"];

export function normalizePluginPack(input) {
  if (!input || input.format !== "websiteforge-plugin" || input.version !== 1 || !slug(input.id)) throw new Error("This is not a WebsiteForge plugin pack.");
  const name = text(input.name, 70);
  if (!name) throw new Error("A plugin pack needs a name.");
  const rawSections = Array.isArray(input.sections) ? input.sections : [];
  const rawThemes = Array.isArray(input.themes) ? input.themes : [];
  const rawFeatures = Array.isArray(input.features) ? input.features : [];
  if (!rawSections.length && !rawThemes.length && !rawFeatures.length) throw new Error("A plugin pack needs at least one section, theme, or feature.");
  if (rawSections.length > 10 || rawThemes.length > 10) throw new Error("A plugin pack can have up to 10 sections and 10 themes.");
  if (rawFeatures.length > 3 || rawFeatures.some(feature => !builtInFeatures.includes(feature)) || new Set(rawFeatures).size !== rawFeatures.length) throw new Error("Unknown or duplicate plugin feature.");
  if (rawFeatures.length && input.id !== "websiteforge.light-mode") throw new Error("Workspace features are reserved for built-in packs.");
  const seen = new Set();
  const sections = rawSections.map(entry => {
    if (!entry || !slug(entry.id) || seen.has(entry.id) || !layouts.includes(entry.layout)) throw new Error("Invalid or duplicate plugin section.");
    seen.add(entry.id);
    const label = text(entry.name, 70);
    if (!label) throw new Error("Every plugin section needs a name.");
    const raw = entry.defaults && typeof entry.defaults === "object" ? entry.defaults : {};
    const defaults = normalizeSite({ name: "Plugin preview", sections: [{ ...raw, id: "plugin-preview", type: "plugin", layout: entry.layout, pluginName: label }] }).sections[0];
    delete defaults.id;
    return { id: entry.id, name: label, description: text(entry.description, 180), layout: entry.layout, defaults };
  });
  const themes = rawThemes.map(entry => {
    if (!entry || !slug(entry.id) || seen.has(entry.id)) throw new Error("Invalid or duplicate plugin theme.");
    seen.add(entry.id);
    const label = text(entry.name, 70);
    const colors = entry.colors;
    if (!label || !colors || ![colors.accent, colors.paper, colors.ink, colors.muted].every(hex)) throw new Error("Plugin themes need a name and four hex colors.");
    return { id: entry.id, name: label, colors: { accent: colors.accent, paper: colors.paper, ink: colors.ink, muted: colors.muted } };
  });
  const homepage = typeof input.homepage === "string" && /^https:\/\//i.test(input.homepage) ? input.homepage.slice(0, 500) : "";
  return { format: "websiteforge-plugin", version: 1, id: input.id, name, author: text(input.author, 70), description: text(input.description, 240), homepage, sections, themes, features: rawFeatures };
}

export function createPluginSection(definition) {
  return makeSection("plugin", { ...structuredClone(definition.defaults), layout: definition.layout, pluginName: definition.name });
}
