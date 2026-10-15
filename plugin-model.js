import { makeSection, normalizeSite } from "./site-model.js";

const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const slug = value => typeof value === "string" && /^[a-z0-9][a-z0-9._-]{2,79}$/.test(value);
const hex = value => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
const layouts = ["cards", "faq", "quote", "banner"];
const builtInFeatureIds = {
  "websiteforge.light-mode": "workspace-light-mode",
  "websiteforge.drawing-menu": "drawing-menu",
  "websiteforge.text-tool": "text-tool",
  "websiteforge.image-tool": "image-tool",
  "websiteforge.template-studio": "template-studio",
  "websiteforge.3d-models": "3d-models",
  "websiteforge.motion-controls": "motion-controls"
};
const builtInFeatures = Object.values(builtInFeatureIds);

export function normalizePluginPack(input) {
  if (!input || input.format !== "websiteforge-plugin" || input.version !== 1 || !slug(input.id)) throw new Error("This is not a WebsiteForge plugin pack.");
  const name = text(input.name, 70);
  if (!name) throw new Error("A plugin pack needs a name.");
  const rawSections = Array.isArray(input.sections) ? input.sections : [];
  const rawThemes = Array.isArray(input.themes) ? input.themes : [];
  const rawFeatures = Array.isArray(input.features) ? input.features : [];
  const rawTemplates = Array.isArray(input.templates) ? input.templates : [];
  if (JSON.stringify(input).length > 1000000) throw new Error("A plugin pack cannot exceed 1 MB.");
  if (!rawSections.length && !rawThemes.length && !rawFeatures.length && !rawTemplates.length) throw new Error("A plugin pack needs at least one section, theme, feature, or template.");
  if (rawSections.length > 10 || rawThemes.length > 10) throw new Error("A plugin pack can have up to 10 sections and 10 themes.");
  if (rawTemplates.length > 20) throw new Error("A plugin pack can have up to 20 templates.");
  if (rawFeatures.length > 3 || rawFeatures.some(feature => !builtInFeatures.includes(feature)) || new Set(rawFeatures).size !== rawFeatures.length) throw new Error("Unknown or duplicate plugin feature.");
  if (rawFeatures.some(feature => feature !== builtInFeatureIds[input.id])) throw new Error("Workspace features are reserved for their matching built-in packs.");
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
  const templates = rawTemplates.map(entry => {
    if (!entry || !slug(entry.id) || seen.has(entry.id)) throw new Error("Invalid or duplicate plugin template.");
    seen.add(entry.id);
    const label = text(entry.name, 70);
    const description = text(entry.description, 180);
    const rawTemplateSections = Array.isArray(entry.sections) ? entry.sections : [];
    const rawTemplateShapes = Array.isArray(entry.shapes) ? entry.shapes : [];
    const rawTemplateObjects = Array.isArray(entry.objects) ? entry.objects : [];
    if (!label || (!rawTemplateSections.length && !rawTemplateShapes.length && !rawTemplateObjects.length)) throw new Error("Every template needs a name and some saved content.");
    const normalized = normalizeSite({ name: "Saved template", sections: rawTemplateSections.length ? rawTemplateSections : [makeSection("blank")], shapes: rawTemplateShapes, objects: rawTemplateObjects });
    const style = entry.style && typeof entry.style === "object" ? normalizeSite({ name: "Saved template", sections: [makeSection("blank")], theme: entry.style.theme, accent: entry.style.accent, palette: entry.style.palette, font: entry.style.font, design: entry.style.design }) : null;
    return { id: entry.id, name: label, description, sections: rawTemplateSections.length ? normalized.sections : [], shapes: normalized.shapes, objects: normalized.objects, style: style ? { theme: style.theme, accent: style.accent, palette: style.palette, font: style.font, design: style.design } : null };
  });
  const homepage = typeof input.homepage === "string" && /^https:\/\//i.test(input.homepage) ? input.homepage.slice(0, 500) : "";
  return { format: "websiteforge-plugin", version: 1, id: input.id, name, author: text(input.author, 70), description: text(input.description, 240), homepage, sections, themes, features: rawFeatures, templates };
}

export function createPluginSection(definition) {
  return makeSection("plugin", { ...structuredClone(definition.defaults), layout: definition.layout, pluginName: definition.name });
}
