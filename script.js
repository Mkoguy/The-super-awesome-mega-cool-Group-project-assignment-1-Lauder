import { SECTION_LABELS, SECTION_TYPES, THEMES, SITE_CSS, makeSection, normalizeSite, renderSite, template, exportDocument } from "./site-model.js";
import { normalizePluginPack, createPluginSection } from "./plugin-model.js";

const siteStyles = document.createElement("style"); siteStyles.textContent = SITE_CSS; document.head.append(siteStyles);

const $ = selector => document.querySelector(selector);
const storageKey = "websiteforge-project-v1";
const pluginStorageKey = "websiteforge-plugins-v1";
const workspaceModeKey = "websiteforge-workspace-mode-v1";
const bundledCatalog = globalThis.websiteForgeBuiltins || null;
let site;
try { site = normalizeSite(JSON.parse(localStorage.getItem(storageKey))); }
catch { site = template(); }
let installed = [];
try { installed = JSON.parse(localStorage.getItem(pluginStorageKey) || "[]").map(normalizePluginPack).slice(0, 20); }
catch { installed = []; }
let lightModeEnabled = false;
try { lightModeEnabled = localStorage.getItem(workspaceModeKey) === "light"; }
catch { /* Browser storage may be unavailable for local files. */ }
let selectedId = site.sections[0]?.id;
let activeTab = "build";
let toastTimer;

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(site)); $("#save-status").textContent = "Saved on this device"; }
  catch { $("#save-status").textContent = "Could not save on this device"; }
}
function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.hidden = true, 3600);
}
function download(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 60000);
}
function selected() { return site.sections.find(section => section.id === selectedId); }
const templateChoices = [
  ["portfolio", "Artist portfolio", "Work, story, gallery, and contact."],
  ["events", "Event landing page", "Welcome, schedule, and RSVP details."],
  ["shop", "Creative shop", "Products, benefits, and a way to connect."],
  ["commissions", "Commissions & services", "Offerings, process, and inquiries."],
  ["links", "Simple link hub", "A compact home for your destinations."]
];
function applyTemplate(name) {
  if (!confirm("Replace the current page with this template?")) return;
  site = template(name); selectedId = site.sections[0].id; $("#template-select").value = name;
  if ($("#template-dialog").open) $("#template-dialog").close();
  update(); toast("Template applied.");
}
function renderTemplateGallery() {
  const gallery = $("#template-gallery"); gallery.replaceChildren();
  for (const [id, name, description] of templateChoices) {
    const card = document.createElement("button"); card.type = "button"; card.className = `template-card template-card-${id}`;
    const preview = document.createElement("span"); preview.className = "template-miniature"; preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<span class="mini-nav"></span><span class="mini-heading"></span><span class="mini-copy"></span><span class="mini-accent"></span><span class="mini-row"></span>';
    const title = document.createElement("strong"); title.textContent = name;
    const detail = document.createElement("small"); detail.textContent = description;
    card.append(preview, title, detail); card.addEventListener("click", () => applyTemplate(id)); gallery.append(card);
  }
}
function applyWorkspaceMode() {
  const installedLightMode = installed.some(pack => pack.id === "websiteforge.light-mode" && pack.features.includes("workspace-light-mode"));
  document.body.classList.toggle("workspace-light", installedLightMode && lightModeEnabled);
}
function setTab(name) {
  activeTab = name;
  $("#header-context").textContent = ({ build: "Build workspace", design: "Design studio", plugins: "Plugin library", ai: "AI tools" })[name] || "Build workspace";
  document.querySelectorAll("[data-header-for]").forEach(group => group.hidden = group.dataset.headerFor !== name);
  document.querySelectorAll(".tab").forEach(tab => {
    const current = tab.dataset.tab === name;
    tab.classList.toggle("active", current);
    tab.setAttribute("aria-selected", String(current));
  });
  document.querySelectorAll(".tab-panel").forEach(panel => {
    const current = panel.id === `panel-${name}`;
    panel.hidden = !current;
    panel.classList.toggle("active", current);
  });
}
function renderList() {
  const list = $("#section-list");
  list.replaceChildren();
  site.sections.forEach((section, index) => {
    const row = document.createElement("div"); row.className = `section-row ${section.id === selectedId ? "selected" : ""}`;
    const choose = document.createElement("button"); choose.type = "button"; choose.className = "section-choose";
    choose.textContent = `${String(index + 1).padStart(2, "0")}  ${section.type === "plugin" ? section.pluginName : SECTION_LABELS[section.type]}`;
    choose.addEventListener("click", () => select(section.id));
    const up = document.createElement("button"); up.type = "button"; up.className = "move-button"; up.textContent = "↑"; up.title = "Move up"; up.disabled = index === 0;
    up.addEventListener("click", () => move(index, -1));
    const down = document.createElement("button"); down.type = "button"; down.className = "move-button"; down.textContent = "↓"; down.title = "Move down"; down.disabled = index === site.sections.length - 1;
    down.addEventListener("click", () => move(index, 1));
    row.append(choose, up, down); list.append(row);
  });
  $("#section-count").textContent = String(site.sections.length);
}
function move(index, direction) {
  const [item] = site.sections.splice(index, 1);
  site.sections.splice(index + direction, 0, item);
  update();
}
function field(label, key, value, options = {}) {
  const wrap = document.createElement("div"); wrap.className = "control-group";
  const labelElement = document.createElement("label"); labelElement.textContent = label;
  const input = document.createElement(options.multiline ? "textarea" : "input");
  input.id = `edit-${key}${options.itemIndex === undefined ? "" : `-${options.itemIndex}`}`; input.name = key; input.value = value || "";
  if (options.multiline) input.rows = 4; else input.type = options.type || "text";
  if (options.placeholder) input.placeholder = options.placeholder;
  input.maxLength = options.max || 700;
  labelElement.htmlFor = input.id;
  input.addEventListener("input", () => {
    const section = selected(); if (!section) return;
    if (options.itemIndex !== undefined) section.items[options.itemIndex][key] = input.value;
    else section[key] = input.value;
    save(); renderCanvas();
  });
  wrap.append(labelElement, input); return wrap;
}
function choiceField(label, key, value, options) {
  const wrap = document.createElement("div"); wrap.className = "control-group";
  const select = document.createElement("select"); select.id = `edit-${key}`;
  options.forEach(([id, name]) => { const option = document.createElement("option"); option.value = id; option.textContent = name; select.append(option); });
  select.value = value;
  const labelElement = document.createElement("label"); labelElement.htmlFor = select.id; labelElement.textContent = label;
  select.addEventListener("change", () => { const section = selected(); if (!section) return; section[key] = select.value; save(); if (key === "layout") renderInspector(); renderCanvas(); });
  wrap.append(labelElement, select); return wrap;
}
function renderInspector() {
  const section = selected(); const form = $("#inspector-form"); form.replaceChildren();
  $("#inspector-actions").hidden = !section;
  if (!section) { $("#inspector-title").textContent = "Select a section"; $("#inspector-description").textContent = "Choose a section from the canvas or list to edit its content."; return; }
  $("#inspector-title").textContent = section.type === "plugin" ? section.pluginName : SECTION_LABELS[section.type];
  $("#inspector-description").textContent = "Changes appear in your preview immediately.";
  form.append(field("Small heading", "eyebrow", section.eyebrow, { max: 80 }), field("Title", "title", section.title, { max: 130 }), field("Description", "body", section.body, { multiline: true, max: 700 }));
  if (["hero", "cta", "plugin"].includes(section.type)) form.append(field("Button label", "buttonText", section.buttonText, { max: 40 }), field("Button link", "buttonUrl", section.buttonUrl, { max: 300, placeholder: "https://youtube.com/... or youtube.com/..." }));
  if (section.type === "hero" || section.type === "plugin" && section.layout === "banner") form.append(field("Image URL (HTTPS)", "imageUrl", section.imageUrl, { max: 500 }));
  if (section.type === "plugin") form.append(choiceField("Plugin layout", "layout", section.layout, [["cards", "Cards"], ["faq", "FAQ"], ["quote", "Quotes"], ["banner", "Banner"]]));
  if (["gallery", "features", "events", "links", "plugin"].includes(section.type) && !(section.type === "plugin" && section.layout === "banner")) {
    section.items.forEach((item, index) => {
      const group = document.createElement("fieldset"); group.className = "item-editor";
      const legend = document.createElement("legend"); legend.textContent = `Item ${index + 1}`; group.append(legend);
      group.append(field("Title", "title", item.title, { itemIndex: index, max: 70 }), field("Description", "body", item.body, { itemIndex: index, max: 180 }));
      if (section.type === "gallery" || section.type === "plugin" && section.layout === "cards") group.append(field("Image URL (HTTPS)", "imageUrl", item.imageUrl, { itemIndex: index, max: 500 }));
      if (section.type === "links") group.append(field("Destination URL", "linkUrl", item.linkUrl, { itemIndex: index, max: 300, placeholder: "https://example.com or example.com" }));
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "button ghost small"; remove.textContent = "Remove item";
      remove.addEventListener("click", () => { section.items.splice(index, 1); update(); }); group.append(remove); form.append(group);
    });
    if (section.items.length < 6) {
      const add = document.createElement("button"); add.type = "button"; add.className = "button subtle wide"; add.textContent = "+ Add item";
      add.addEventListener("click", () => { section.items.push({ title: "New item", body: "Describe it here.", imageUrl: "", linkUrl: "" }); update(); }); form.append(add);
    }
  }
  form.append(choiceField("Text alignment", "alignment", section.alignment, [["left", "Left"], ["center", "Center"]]), choiceField("Vertical spacing", "spacing", section.spacing, [["compact", "Compact"], ["normal", "Normal"], ["roomy", "Roomy"]]), field("Background override (hex, optional)", "background", section.background, { max: 7 }), field("Text color override (hex, optional)", "textColor", section.textColor, { max: 7 }));
}
function renderCanvas() {
  $("#site-preview").innerHTML = renderSite(site, true);
  document.querySelectorAll("#site-preview a").forEach(link => {
    if (/^https?:\/\//i.test(link.getAttribute("href") || "")) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
  });
  document.querySelectorAll("[data-section-id]").forEach(element => {
    element.classList.toggle("canvas-selected", element.dataset.sectionId === selectedId);
    element.addEventListener("click", event => { if (event.target.closest("a") || event.target.closest("details")) return; select(element.dataset.sectionId); });
    element.addEventListener("keydown", event => { if (event.target === element && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); select(element.dataset.sectionId); } });
  });
  $("#canvas-title").textContent = site.name;
}
function renderThemes() {
  const list = $("#theme-list"); list.replaceChildren();
  Object.entries(THEMES).forEach(([key, theme]) => {
    const exact = site.theme === key && site.accent === theme.accent && Object.entries(site.palette).every(([part, value]) => theme[part] === value);
    const button = document.createElement("button"); button.type = "button"; button.className = `theme-choice ${exact ? "selected" : ""}`;
    button.innerHTML = `<span class="theme-swatch" style="background:${theme.accent}"></span><span>${theme.label}</span>`;
    button.addEventListener("click", () => { site.theme = key; site.accent = theme.accent; site.palette = { paper: theme.paper, ink: theme.ink, muted: theme.muted }; update(); }); list.append(button);
  });
}
function pluginStatus(message) { $("#plugin-status").textContent = message; }
function savePlugins() {
  try { localStorage.setItem(pluginStorageKey, JSON.stringify(installed)); }
  catch { pluginStatus("Could not save plugin packs on this device."); }
}
function pluginCard(name, description) {
  const card = document.createElement("div"); card.className = "plugin-card";
  const title = document.createElement("strong"); title.textContent = name;
  const copy = document.createElement("p"); copy.textContent = description;
  card.append(title, copy); return card;
}
function renderPlugins() {
  const list = $("#plugin-installed"); list.replaceChildren();
  $("#plugin-count").textContent = String(installed.length);
  if (!installed.length) { const empty = document.createElement("p"); empty.className = "helper"; empty.textContent = "No packs installed yet."; list.append(empty); return; }
  installed.forEach(pack => {
    const card = pluginCard(pack.name, `${pack.author ? `by ${pack.author} · ` : ""}${pack.description}`);
    const actions = document.createElement("div"); actions.className = "plugin-actions";
    pack.sections.forEach(definition => {
      const add = document.createElement("button"); add.type = "button"; add.className = "button subtle"; add.textContent = `+ ${definition.name}`;
      add.addEventListener("click", () => { if (site.sections.length >= 14) { toast("A site can have up to 14 sections."); return; } const section = createPluginSection(definition); site.sections.push(section); selectedId = section.id; update(); setTab("build"); toast(`${definition.name} added.`); }); actions.append(add);
    });
    pack.themes.forEach(theme => {
      const apply = document.createElement("button"); apply.type = "button"; apply.className = "button subtle"; apply.textContent = `Use ${theme.name}`;
      apply.addEventListener("click", () => { site.accent = theme.colors.accent; site.palette = { paper: theme.colors.paper, ink: theme.colors.ink, muted: theme.colors.muted }; update(); pluginStatus(`${theme.name} applied to this website.`); }); actions.append(apply);
    });
    if (pack.features.includes("workspace-light-mode")) {
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "button subtle";
      toggle.textContent = lightModeEnabled ? "Use dark workspace" : "Enable light mode";
      toggle.addEventListener("click", () => { lightModeEnabled = !lightModeEnabled; try { localStorage.setItem(workspaceModeKey, lightModeEnabled ? "light" : "dark"); } catch { /* Keep the choice for this session. */ } applyWorkspaceMode(); renderPlugins(); pluginStatus(lightModeEnabled ? "Light mode is on for this editor." : "Dark mode is on for this editor."); });
      actions.append(toggle);
    }
    const exportButton = document.createElement("button"); exportButton.type = "button"; exportButton.className = "button ghost"; exportButton.textContent = "Share JSON";
    exportButton.addEventListener("click", () => download(`${pack.id}.json`, JSON.stringify(pack, null, 2), "application/json")); actions.append(exportButton);
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "button danger"; remove.textContent = "Uninstall";
    remove.addEventListener("click", () => { installed = installed.filter(item => item.id !== pack.id); savePlugins(); applyWorkspaceMode(); renderPlugins(); pluginStatus(`${pack.name} uninstalled. Existing sections stay on this website.`); }); actions.append(remove);
    card.append(actions); list.append(card);
  });
}
function installPack(raw) {
  const pack = normalizePluginPack(raw);
  if (installed.length >= 20 && !installed.some(item => item.id === pack.id)) throw new Error("You can install up to 20 packs.");
  installed = [...installed.filter(item => item.id !== pack.id), pack];
  savePlugins(); applyWorkspaceMode(); renderPlugins(); pluginStatus(`${pack.name} installed. Choose its options below.`);
}
async function fetchPack(rawUrl) {
  const url = new URL(rawUrl, location.href);
  if (!(url.protocol === "https:" || url.origin === location.origin && url.protocol === "http:")) throw new Error("Use an HTTPS URL for shared packs.");
  if (url.username || url.password) throw new Error("Plugin URLs cannot include credentials.");
  const response = await fetch(url, { credentials: "omit", mode: "cors" });
  if (!response.ok) throw new Error(`Could not download pack (${response.status}).`);
  const content = await response.text();
  if (content.length > 100000) throw new Error("Plugin pack is too large.");
  return JSON.parse(content);
}
async function renderCatalog() {
  const list = $("#plugin-catalog"); list.replaceChildren();
  try {
    let catalog = bundledCatalog?.catalog;
    if (!catalog) {
      const response = await fetch("/plugins/catalog.json");
      if (!response.ok) throw new Error("Could not load catalog.");
      catalog = await response.json();
    }
    for (const entry of catalog.packs || []) {
      if (typeof entry.name !== "string" || typeof entry.manifest !== "string") continue;
      const card = pluginCard(entry.name, String(entry.description || ""));
      const install = document.createElement("button"); install.type = "button"; install.className = "button subtle";
      install.textContent = "Install pack";
      install.addEventListener("click", async () => { install.disabled = true; try { installPack(bundledCatalog?.manifests[entry.manifest] || await fetchPack(entry.manifest)); } catch (error) { pluginStatus(error.message || "Could not install pack."); } finally { install.disabled = false; } });
      card.append(install); list.append(card);
    }
  } catch { const note = document.createElement("p"); note.className = "helper"; note.textContent = "Catalog unavailable. You can still install a JSON file or URL."; list.append(note); }
}
async function checkAiAvailability() {
  try {
    if (location.protocol === "file:") throw new Error("Static page");
    const response = await fetch("/api/settings");
    if (!response.ok || !response.headers.get("Content-Type")?.includes("application/json")) throw new Error("No API server");
  } catch {
    document.querySelectorAll('a[href="settings.html"]').forEach(link => link.hidden = true);
    $("#generate-site-button").disabled = true;
    $("#rewrite-section-button").disabled = true;
    $("#ai-status").textContent = "AI writing requires the optional local server and your API key. The builder works without Node.js.";
  }
}
function update() {
  save(); $("#site-name").value = site.name; $("#site-tagline").value = site.tagline;
  $("#font-select").value = site.font; $("#custom-accent").value = site.accent;
  [["paper-color", "paper"], ["ink-color", "ink"], ["muted-color", "muted"]].forEach(([id, key]) => $("#" + id).value = site.palette[key]);
  [["content-width", "contentWidth", "px"], ["section-spacing", "sectionSpacing", "px"], ["corner-radius", "cornerRadius", "px"], ["heading-scale", "headingScale", "×"]].forEach(([id, key, unit]) => { $("#" + id).value = site.design[key]; $("#" + id + "-value").textContent = `${site.design[key]}${unit}`; });
  $("#button-style").value = site.design.buttonStyle;
  renderList(); renderThemes(); renderInspector(); renderCanvas(); renderPlugins();
}
function select(id) { selectedId = id; renderList(); renderInspector(); renderCanvas(); }
async function ai(action) {
  const prompt = $("#ai-prompt").value.trim();
  if (!prompt) { $("#ai-status").textContent = "Describe what you want AI to write first."; $("#ai-prompt").focus(); return; }
  if (action === "rewrite" && !selected()) return;
  const button = $(action === "site" ? "#generate-site-button" : "#rewrite-section-button");
  button.disabled = true; $("#ai-status").textContent = "Writing your draft…";
  try {
    const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, prompt, site, selectedId }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI request failed.");
    if (action === "site") { site = normalizeSite({ ...data.site, theme: site.theme, accent: site.accent, palette: site.palette, design: site.design, font: site.font }); selectedId = site.sections[0].id; }
    else { const index = site.sections.findIndex(section => section.id === selectedId); if (index < 0) throw new Error("Select a section first."); site.sections[index] = normalizeSite({ ...site, sections: [{ ...site.sections[index], ...data.section, id: selectedId, type: site.sections[index].type }] }).sections[0]; }
    update(); $("#ai-status").textContent = "Draft ready. Review and edit it before publishing."; toast("AI draft added to your site.");
  } catch (error) { $("#ai-status").textContent = error.message || "AI request failed."; }
  finally { button.disabled = false; }
}

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => setTab(tab.dataset.tab)));
$("#site-name").addEventListener("input", event => { site.name = event.target.value; save(); renderCanvas(); });
$("#site-tagline").addEventListener("input", event => { site.tagline = event.target.value; save(); renderCanvas(); });
$("#font-select").addEventListener("change", event => { site.font = event.target.value; update(); });
$("#custom-accent").addEventListener("input", event => { site.accent = event.target.value; save(); renderCanvas(); renderThemes(); });
[["paper-color", "paper"], ["ink-color", "ink"], ["muted-color", "muted"]].forEach(([id, key]) => $("#" + id).addEventListener("input", event => { site.palette[key] = event.target.value; save(); renderCanvas(); renderThemes(); }));
[["content-width", "contentWidth", "px"], ["section-spacing", "sectionSpacing", "px"], ["corner-radius", "cornerRadius", "px"], ["heading-scale", "headingScale", "×"]].forEach(([id, key, unit]) => $("#" + id).addEventListener("input", event => { site.design[key] = Number(event.target.value); $("#" + id + "-value").textContent = `${site.design[key]}${unit}`; save(); renderCanvas(); }));
$("#button-style").addEventListener("change", event => { site.design.buttonStyle = event.target.value; save(); renderCanvas(); });
$("#apply-template-button").addEventListener("click", () => applyTemplate($("#template-select").value));
$("#browse-template-button").addEventListener("click", () => $("#template-dialog").showModal());
$("#close-template-dialog").addEventListener("click", () => $("#template-dialog").close());
$("#add-section").addEventListener("change", event => { if (!SECTION_TYPES.includes(event.target.value)) return; if (site.sections.length >= 14) { toast("A site can have up to 14 sections."); event.target.value = ""; return; } const section = makeSection(event.target.value); site.sections.push(section); selectedId = section.id; event.target.value = ""; update(); });
$("#duplicate-section-button").addEventListener("click", () => { const section = selected(); if (!section) return; if (site.sections.length >= 14) { toast("A site can have up to 14 sections."); return; } const { id, ...content } = structuredClone(section); const copy = makeSection(section.type, content); site.sections.splice(site.sections.indexOf(section) + 1, 0, copy); selectedId = copy.id; update(); });
$("#delete-section-button").addEventListener("click", () => { if (site.sections.length === 1) { toast("Keep at least one section."); return; } site.sections = site.sections.filter(section => section.id !== selectedId); selectedId = site.sections[0].id; update(); });
$("#desktop-button").addEventListener("click", () => { $("#canvas-frame").classList.remove("mobile"); $("#desktop-button").classList.add("active"); $("#mobile-button").classList.remove("active"); });
$("#mobile-button").addEventListener("click", () => { $("#canvas-frame").classList.add("mobile"); $("#mobile-button").classList.add("active"); $("#desktop-button").classList.remove("active"); });
$("#preview-button").addEventListener("click", () => { const url = URL.createObjectURL(new Blob([exportDocument(normalizeSite(site))], { type: "text/html" })); window.open(url, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(url), 60000); });
$("#design-preview-button").addEventListener("click", () => $("#preview-button").click());
$("#design-export-button").addEventListener("click", () => $("#export-html-button").click());
$("#plugin-browse-button").addEventListener("click", () => $("#plugin-catalog").scrollIntoView({ behavior: "smooth", block: "start" }));
$("#example-pack-button").addEventListener("click", async () => {
  try {
    const example = bundledCatalog?.manifests["/plugins/artist-essentials.json"] || await fetchPack("/plugins/artist-essentials.json");
    download("artist-essentials.json", JSON.stringify(example, null, 2), "application/json");
  } catch { pluginStatus("Could not load the example pack."); }
});
$("#export-html-button").addEventListener("click", () => download("index.html", exportDocument(normalizeSite(site)), "text/html"));
$("#export-json-button").addEventListener("click", () => download("websiteforge-project.json", JSON.stringify(normalizeSite(site), null, 2), "application/json"));
$("#import-button").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { const loaded = normalizeSite(JSON.parse(await file.text())); site = loaded; selectedId = site.sections[0].id; update(); toast("Project imported."); } catch (error) { toast(error.message || "Could not import project."); } event.target.value = ""; });
$("#install-url-button").addEventListener("click", async () => { const button = $("#install-url-button"); button.disabled = true; try { installPack(await fetchPack($("#plugin-url").value.trim())); } catch (error) { pluginStatus(error.message || "Could not install pack. The host may need to allow browser access."); } finally { button.disabled = false; } });
$("#install-file-button").addEventListener("click", () => $("#plugin-file").click());
$("#plugin-file").addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { if (file.size > 100000) throw new Error("Plugin pack is too large."); installPack(JSON.parse(await file.text())); } catch (error) { pluginStatus(error.message || "Could not install pack."); } event.target.value = ""; });
$("#generate-site-button").addEventListener("click", () => ai("site"));
$("#rewrite-section-button").addEventListener("click", () => ai("rewrite"));
renderTemplateGallery(); applyWorkspaceMode(); setTab(activeTab); update(); renderCatalog(); checkAiAvailability();
