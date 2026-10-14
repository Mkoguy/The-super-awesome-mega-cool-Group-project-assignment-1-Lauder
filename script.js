import {
  exportDocument,
  makeSection,
  MAX_SECTIONS,
  normalizeMotion,
  normalizeSite,
  renderSite,
  SECTION_LABELS,
  SECTION_TYPES,
  SHAPE_TYPES,
  shapeSvgMarkup,
  SITE_CSS,
  template,
  THEMES
} from "./site-model.js";
import {createPluginSection, normalizePluginPack} from "./plugin-model.js";
import {
  defaultShortcuts,
  normalizeShortcuts,
  SHORTCUT_DEFINITIONS,
  shortcutFromKeyboardEvent
} from "./shortcuts-model.js";

const siteStyles = document.createElement("style"); siteStyles.textContent = SITE_CSS; document.head.append(siteStyles);

const $ = selector => document.querySelector(selector);
const sidebar = $(".sidebar");
const panelDefinitions = [
  ["templates", "Templates", "Choose a starting point or add a saved design.", ["drawer-templates", "template-tools"]],
  ["elements", "Elements", "Add shapes and other canvas elements.", ["drawer-add", "shape-tools"]],
  ["text", "Text", "Add text, then double-click it on the canvas to type.", ["text-tools"]],
  ["uploads", "Uploads", "Add an image frame or upload an image.", ["image-tools"]],
  ["site", "Website settings", "Set the website name, address, and logo.", ["drawer-site"]],
  ["layers", "Layers", "Select and arrange what is on your page.", ["drawer-layers"]],
  ["pages", "Pages", "Add and reorder website sections.", ["drawer-pages"]]
];
for (const [name, title, description, ids] of panelDefinitions) {
  const panel = $("#panel-" + name);
  const heading = document.createElement("div"); heading.className = "rail-panel-heading";
  const label = document.createElement("h2"); label.textContent = title;
  const help = document.createElement("p"); help.textContent = description;
  heading.append(label, help); panel.append(heading);
  for (const id of ids) panel.append($("#" + id));
}
$("#panel-text .rail-panel-heading").after($("#add-text-button"));
$("#panel-uploads .rail-panel-heading").after($("#add-image-button"));
$("#panel-uploads").append($("#canvas-image-file"));
$("#panel-templates .rail-panel-heading").after($("#open-templates-button"));
$("#panel-text").append($("#drawer-add .helper"));
$("#addon-tool-tabs").hidden = true;
sidebar.append($(".inspector"));
$(".inspector").hidden = true;
const uploadToolButton = document.createElement("button");
uploadToolButton.type = "button"; uploadToolButton.className = "button subtle wide"; uploadToolButton.textContent = "↑ Upload image";
uploadToolButton.addEventListener("click", () => { selectedContent = null; selectedObjectId = ""; selectedShapeId = ""; $("#canvas-image-file").click(); });
$("#add-image-object").after(uploadToolButton);
const storageKey = "websiteforge-project-v1";
const pluginStorageKey = "websiteforge-plugins-v1";
const workspaceModeKey = "websiteforge-workspace-mode-v1";
const shortcutStorageKey = "websiteforge-shortcuts-v1";
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
let selectedShapeId = "";
let selectedObjectId = "";
let selectedContent = null;
let activeAddonTool = "";
let suppressPaletteClickUntil = 0;
let activeTab = "build";
let activeRail = "templates";
let toastTimer;
let zoom = 1;
let history = [JSON.stringify(site)];
let historyIndex = 0;
let restoringHistory = false;
let shortcuts;
try { shortcuts = normalizeShortcuts(JSON.parse(localStorage.getItem(shortcutStorageKey))); }
catch { shortcuts = defaultShortcuts(); }
let copiedElement = null;

function save() {
  const snapshot = JSON.stringify(site);
  if (!restoringHistory && snapshot !== history[historyIndex]) {
    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    while (history.length > 1 && (history.length > 80 || history.reduce((length, entry) => length + entry.length, 0) > 12000000)) history.shift();
    historyIndex = history.length - 1;
  }
  if ($("#undo-button")) $("#undo-button").disabled = historyIndex === 0;
  if ($("#redo-button")) $("#redo-button").disabled = historyIndex === history.length - 1;
  try { localStorage.setItem(storageKey, snapshot); $("#save-status").textContent = "Saved on this device"; }
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
async function openImportedProject() {
  if (!confirm("Open the design from the attached ZIP? This replaces the page currently open in this browser. Use Save project first if you want a backup.")) return;
  try {
    const source = bundledCatalog?.importedProject || await fetch("examples/websiteforge-import/websiteforge-project.json").then(response => { if (!response.ok) throw new Error("Saved design is unavailable."); return response.json(); });
    site = normalizeSite(source);
    selectedId = site.sections[0]?.id; selectedContent = null; selectedObjectId = ""; selectedShapeId = "";
    if ($("#template-dialog").open) $("#template-dialog").close();
    update(); setRailPanel("pages"); toast("Saved design opened in WebsiteForge.");
  } catch (error) { toast(error.message || "Could not open the saved design."); }
}
function renderTemplateGallery() {
  const gallery = $("#template-gallery"); gallery.replaceChildren();
  for (const [id, name, description] of templateChoices) {
    const card = document.createElement("button"); card.type = "button"; card.className = `template-card template-card-${id}`;
    const preview = document.createElement("span"); preview.className = "template-miniature"; preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<span class="mini-nav"></span><span class="mini-heading"></span><span class="mini-copy"></span><span class="mini-accent"></span><span class="mini-row"></span>';
    const title = document.createElement("strong"); title.textContent = name;
    const author = document.createElement("small"); author.className = "template-author"; author.textContent = "by WebsiteForge";
    const detail = document.createElement("small"); detail.textContent = description;
    card.append(preview, title, author, detail); card.addEventListener("click", () => applyTemplate(id)); gallery.append(card);
  }
  const imported = document.createElement("button"); imported.type = "button"; imported.className = "template-card template-card-imported";
  imported.innerHTML = '<span class="template-miniature" aria-hidden="true"><span class="mini-nav"></span><span class="mini-heading"></span><span class="mini-copy"></span><span class="mini-accent"></span></span><strong>Saved design from ZIP</strong><small class="template-author">Your attached project</small><small>Open its six sections, images, text, shapes, and 3D model.</small>';
  imported.addEventListener("click", openImportedProject); gallery.append(imported);
  const shared = installed.flatMap(pack => (pack.templates || []).map(saved => ({ pack, saved })));
  shared.forEach(({ pack, saved }, index) => {
    const card = document.createElement("article"); card.className = `template-card template-card-installed template-card-community template-tone-${index % 5}`;
    const preview = document.createElement("span"); preview.className = "template-miniature"; preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<span class="mini-nav"></span><span class="mini-heading"></span><span class="mini-copy"></span><span class="mini-accent"></span><span class="mini-row"></span>';
    const title = document.createElement("strong"); title.textContent = saved.name;
    const author = document.createElement("small"); author.className = "template-author"; author.textContent = `by ${pack.author || pack.name || "WebsiteForge creator"}`;
    const detail = document.createElement("small"); detail.textContent = saved.description || pack.description || "Reusable page template.";
    const add = document.createElement("button"); add.type = "button"; add.className = "button subtle template-add-button"; add.textContent = "Add to page";
    add.addEventListener("click", () => addTemplateToSite(saved));
    card.append(preview, title, author, detail, add); gallery.append(card);
  });
  const galleryCount = gallery.children.length;
  if (galleryCount === templateChoices.length) {
    const note = document.createElement("p"); note.className = "template-gallery-empty"; note.textContent = "Install a template pack from Plugins to see shared templates here."; gallery.append(note);
  }
}
function applyWorkspaceMode() {
  const installedLightMode = installed.some(pack => pack.id === "websiteforge.light-mode" && pack.features.includes("workspace-light-mode"));
  document.body.classList.toggle("workspace-light", installedLightMode && lightModeEnabled);
}
function setTab(name) {
  setRailPanel(name === "build" ? "pages" : name);
}
function setRailPanel(name) {
  activeRail = name;
  activeTab = ["design", "plugins", "ai"].includes(name) ? name : "build";
  $("#header-context").textContent = ({ templates: "Templates", elements: "Elements", text: "Text", uploads: "Uploads", design: "Design studio", site: "Website settings", layers: "Layers", pages: "Pages", edit: "Edit selection", plugins: "Plugin library", ai: "AI tools" })[name] || "Build workspace";
  document.querySelectorAll("[data-header-for]").forEach(group => group.hidden = group.dataset.headerFor !== activeTab);
  document.querySelectorAll(".tab").forEach(tab => {
    const current = tab.dataset.tab === activeTab;
    tab.classList.toggle("active", current);
    tab.setAttribute("aria-selected", String(current));
  });
  document.querySelectorAll(".tab-panel").forEach(panel => {
    const current = panel.id === `panel-${name}`;
    panel.hidden = !current;
    panel.classList.toggle("active", current);
  });
  document.querySelectorAll(".rail-button").forEach(button => {
    const active = button.dataset.rail === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "true" : "false");
  });
  $(".inspector").hidden = name !== "edit";
  const panel = $("#panel-" + name);
  if (["templates", "elements", "site", "layers", "pages"].includes(name)) {
    const drawer = panel?.querySelector("details.drawer-section");
    if (drawer) drawer.open = true;
  } else if (name === "design" && !panel?.querySelector("details.drawer-section[open]")) {
    const drawer = panel?.querySelector("details.drawer-section");
    if (drawer) drawer.open = true;
  }
  sidebar.scrollTop = 0;
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
function renderPageStrip() {
  const list = $("#page-strip-list");
  list.replaceChildren();
  site.sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `page-thumb-button ${section.id === selectedId ? "active" : ""}`;
    button.setAttribute("aria-label", `Select ${SECTION_LABELS[section.type] || "section"} ${index + 1}`);
    const preview = document.createElement("span"); preview.className = "page-thumb-preview";
    preview.style.setProperty("--thumb-accent", section.background || site.accent);
    const heading = document.createElement("strong"); heading.textContent = (section.title || SECTION_LABELS[section.type] || "Section").slice(0, 34);
    const line = document.createElement("i"); const art = document.createElement("b");
    preview.append(heading, line, art);
    const caption = document.createElement("span"); caption.className = "page-thumb-caption"; caption.textContent = `${index + 1}. ${SECTION_LABELS[section.type] || "Section"}`;
    button.append(preview, caption);
    button.addEventListener("click", () => { select(section.id); $("#site-preview [data-section-id=\"" + section.id + "\"]")?.scrollIntoView({ block: "center", behavior: "smooth" }); });
    list.append(button);
  });
  $("#page-strip-count").textContent = String(site.sections.length);
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
function contentRef(selection = selectedContent) {
  const section = site.sections.find(item => item.id === selection?.sectionId);
  if (!section) return null;
  const itemMatch = /^item-([0-5])-(title|body|imageUrl|linkUrl)$/.exec(selection.key);
  const target = itemMatch ? section.items[Number(itemMatch[1])] : section;
  const key = itemMatch ? itemMatch[2] : selection.key;
  return target ? { section, target, key, styleKey: selection.key } : null;
}
function selectionControl(form, label, type, value, onInput, options = {}) {
  const wrap = document.createElement("label"); wrap.className = "control-group selection-control"; wrap.textContent = label;
  const input = document.createElement(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  else input.rows = 4;
  input.value = value ?? "";
  if (options.min !== undefined) input.min = options.min;
  if (options.max !== undefined) input.max = options.max;
  if (options.step !== undefined) input.step = options.step;
  if (options.maxLength !== undefined) input.maxLength = options.maxLength;
  input.addEventListener("input", () => { onInput(input.value); save(); renderCanvas(); });
  wrap.append(input); form.append(wrap);
  return input;
}
function selectionGroup(form, title, open = false) {
  const group = document.createElement("details"); group.className = "selection-group"; group.open = open;
  const summary = document.createElement("summary"); summary.textContent = title;
  group.append(summary); form.append(group); return group;
}
function selectionDropdown(form, label, value, choices, onChange) {
  const wrap = document.createElement("label"); wrap.className = "control-group selection-control"; wrap.textContent = label;
  const input = document.createElement("select");
  choices.forEach(choice => input.add(new Option(choice.replaceAll("-", " "), choice)));
  input.value = value;
  input.addEventListener("change", () => { onChange(input.value); save(); renderCanvas(); });
  wrap.append(input); form.append(wrap);
}
function motionControls(form, item) {
  const group = selectionGroup(form, "Motion", false);
  const motion = item.motion = normalizeMotion(item.motion);
  const toggle = document.createElement("label"); toggle.className = "motion-toggle";
  const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = motion.enabled;
  checkbox.addEventListener("change", () => { motion.enabled = checkbox.checked; save(); renderCanvas(); });
  toggle.append(checkbox, document.createTextNode(" Animate this element")); group.append(toggle);
  const speed = selectionControl(group, `Move speed (${motion.speed}×)`, "range", motion.speed, value => { motion.speed = Number(value); }, { min: .25, max: 4, step: .25 });
  speed.addEventListener("input", () => { speed.parentElement.firstChild.textContent = `Move speed (${motion.speed}×)`; });
  selectionControl(group, "Move X (px)", "number", motion.x, value => { motion.x = Number(value) || 0; }, { min: -500, max: 500 });
  selectionControl(group, "Move Y (px)", "number", motion.y, value => { motion.y = Number(value) || 0; }, { min: -500, max: 500 });
  selectionControl(group, "Fade out (%)", "number", motion.fade, value => { motion.fade = Number(value) || 0; }, { min: 0, max: 100 });
  selectionControl(group, "Size X (%)", "number", motion.scaleX, value => { motion.scaleX = Number(value) || 100; }, { min: 25, max: 300 });
  selectionControl(group, "Size Y (%)", "number", motion.scaleY, value => { motion.scaleY = Number(value) || 100; }, { min: 25, max: 300 });
  selectionControl(group, "Color hue shift (°)", "number", motion.hue, value => { motion.hue = Number(value) || 0; }, { min: -180, max: 180 });
  selectionControl(group, "Rotation change (°)", "number", motion.rotation, value => { motion.rotation = Number(value) || 0; }, { min: -360, max: 360 });
  const hint = document.createElement("p"); hint.className = "helper"; hint.textContent = "Motion loops in the preview and exported website. It pauses while the element is selected."; group.append(hint);
}
function renderSelectionToolbar() {
  const chosen = selectedContent || selectedObjectId || selectedShapeId;
  const bar = $("#selection-toolbar");
  bar.hidden = !chosen;
  const selectedObject = site.objects.find(item => item.id === selectedObjectId);
  $("#selection-edit-text").hidden = !(selectedContent && !/imageUrl|linkUrl/.test(selectedContent.key) || selectedObject?.type === "text");
  if (chosen) $("#selection-label").textContent = selectedContent ? selectedContent.key.replace(/^item-\d+-/, "Item ").replace(/([A-Z])/g, " $1") : selectedObjectId ? ({ image: "Image", text: "Text", model3d: "3D model" })[selectedObject?.type] || "Element" : "Shape";
}
function renderLayerList() {
  const list = $("#layer-list"); if (!list) return;
  list.replaceChildren();
  let count = 0;
  const row = (parent, label, active, choose, item) => {
    const wrapper = document.createElement("div"); wrapper.className = "layer-entry";
    const button = document.createElement("button"); button.type = "button"; button.className = `layer-row ${active ? "selected" : ""}`;
    button.textContent = label; button.title = label; button.addEventListener("click", choose); wrapper.append(button);
    if (item) for (const [direction, symbol, title] of [[-1, "↓", "Send backward"], [1, "↑", "Bring forward"]]) {
      const move = document.createElement("button"); move.type = "button"; move.className = "layer-order"; move.textContent = symbol; move.title = title;
      move.setAttribute("aria-label", `${title}: ${label}`);
      move.disabled = direction < 0 ? Number(item.z || 0) <= -20 : Number(item.z || 0) >= 20;
      move.addEventListener("click", () => { item.z = Math.max(-20, Math.min(20, (Number(item.z) || 0) + direction)); save(); renderCanvas(); });
      wrapper.append(move);
    }
    parent.append(wrapper); count++;
  };
  const floating = document.createElement("details"); floating.className = "layer-group"; floating.open = Boolean(selectedObjectId || selectedShapeId);
  const floatingTitle = document.createElement("summary"); floatingTitle.textContent = "Floating elements · top to bottom"; floating.append(floatingTitle);
  const floatingItems = [
    ...site.objects.map((item, index) => ({ item, index, kind: "object" })),
    ...site.shapes.map((item, index) => ({ item, index, kind: "shape" }))
  ].sort((a, b) => (Number(b.item.z) || 0) - (Number(a.item.z) || 0) || b.index - a.index);
  for (const { item, kind } of floatingItems) {
    const label = kind === "shape" ? `Shape · ${item.type.replaceAll("-", " ")}` : item.type === "image" ? `Image · ${item.alt || "Image frame"}` : item.type === "model3d" ? `3D model · ${item.modelFileName || "Model"}` : `Text · ${item.text || "Untitled"}`;
    row(floating, label, kind === "shape" ? selectedShapeId === item.id : selectedObjectId === item.id,
      () => kind === "shape" ? selectCanvasShape(item.id, true) : selectCanvasObject(item.id, true), item);
  }
  if (floatingItems.length) list.append(floating);
  site.sections.forEach((section, index) => {
    const group = document.createElement("details"); group.className = "layer-group"; group.open = selectedId === section.id && !selectedObjectId && !selectedShapeId;
    const summary = document.createElement("summary"); summary.textContent = `${index + 1}. ${SECTION_LABELS[section.type] || "Section"}`; group.append(summary);
    const title = document.createElement("button"); title.type = "button"; title.className = `layer-section ${selectedId === section.id && !selectedContent && !selectedObjectId && !selectedShapeId ? "selected" : ""}`;
    title.textContent = "Select section";
    title.addEventListener("click", () => { select(section.id, true); $("#site-preview [data-section-id=\"" + section.id + "\"]")?.scrollIntoView({ block: "center", behavior: "smooth" }); });
    group.append(title); count++;
    $("#site-preview [data-section-id=\"" + section.id + "\"]")?.querySelectorAll("[data-content-key]").forEach(element => {
      const key = element.dataset.contentKey;
      const name = key.replace(/^item-(\d+)-/, (_, number) => `Item ${Number(number) + 1} `).replace(/([A-Z])/g, " $1").trim();
      const label = `${/imageUrl/i.test(key) ? "Image" : /linkUrl/i.test(key) ? "Link" : "Text"} · ${name}${/imageUrl|linkUrl/i.test(key) ? "" : `: ${(element.textContent || "Empty").trim().slice(0, 35)}`}`;
      section.elementStyles ||= {};
      const layerStyle = section.elementStyles[key] ||= {};
      row(group, label, selectedContent?.sectionId === section.id && selectedContent.key === key, () => {
        selectContent(section.id, key, true);
        $("#site-preview [data-section-id=\"" + section.id + "\"] [data-content-key=\"" + key + "\"]")?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, layerStyle);
    });
    list.append(group);
  });
  $("#layer-count").textContent = String(count);
}
function selectContent(sectionId, key, keepPanel = false) {
  selectedId = sectionId; selectedContent = { sectionId, key }; selectedObjectId = ""; selectedShapeId = "";
  if (!keepPanel) setRailPanel("edit"); renderList(); renderInspector(); renderCanvas();
}
function selectCanvasObject(id, keepPanel = false) { selectedObjectId = id; selectedShapeId = ""; selectedContent = null; if (!keepPanel) setRailPanel("edit"); renderInspector(); renderCanvas(); renderCanvasObjectTools(); }
function selectCanvasShape(id, keepPanel = false) { selectedShapeId = id; selectedObjectId = ""; selectedContent = null; if (!keepPanel) setRailPanel("edit"); renderInspector(); renderCanvas(); renderShapeTools(); }
function startInlineEdit(element, sectionId, key) {
  if (element.isContentEditable) return;
  selectedContent = { sectionId, key }; const ref = contentRef(); if (!ref) return;
  element.textContent = ref.target[ref.key] || "";
  element.contentEditable = "true"; element.classList.add("inline-editing"); element.focus();
  const range = document.createRange(); range.selectNodeContents(element);
  const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
  element.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); element.textContent = ref.target[ref.key] || ""; element.blur(); } else if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); element.blur(); } }, { once: false });
  element.addEventListener("blur", () => { ref.target[ref.key] = element.textContent.trim(); element.contentEditable = "false"; save(); renderCanvas(); renderInspector(); }, { once: true });
}
function startObjectInlineEdit(element, object) {
  if (object?.type !== "text") return;
  const textNode = element?.querySelector(".text-object-content");
  if (!textNode || textNode.isContentEditable) return;
  textNode.contentEditable = "true"; textNode.classList.add("inline-editing"); textNode.focus();
  const range = document.createRange(); range.selectNodeContents(textNode);
  const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
  textNode.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); textNode.textContent = object.text; textNode.blur(); } else if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); textNode.blur(); } });
  textNode.addEventListener("blur", () => { object.text = textNode.textContent.trim().slice(0, 500); textNode.contentEditable = "false"; save(); renderCanvas(); renderInspector(); }, { once: true });
}
function renderInspector() {
  const section = selected(); const form = $("#inspector-form"); form.replaceChildren();
  renderSelectionToolbar();
  if (selectedContent) {
    const ref = contentRef(); if (!ref) { selectedContent = null; return renderInspector(); }
    const isImage = ref.key === "imageUrl";
    const style = ref.section.elementStyles ||= {};
    const layout = style[ref.styleKey] ||= {};
    $("#inspector-actions").hidden = true;
    $("#inspector-title").textContent = isImage ? "Image" : "Text";
    $("#inspector-description").textContent = "Edit here or drag this element on the canvas. Double-click text to type in place.";
    selectionControl(form, isImage ? "Image URL (HTTPS)" : "Text", isImage ? "url" : "textarea", ref.target[ref.key], value => { ref.target[ref.key] = value; }, { maxLength: isImage ? 500 : 700 });
    if (isImage) { const upload = document.createElement("button"); upload.type = "button"; upload.className = "button subtle wide"; upload.textContent = "Upload image"; upload.addEventListener("click", () => $("#canvas-image-file").click()); form.append(upload); }
    else { selectionControl(form, "Font size (px)", "number", layout.fontSize || "", value => { layout.fontSize = Number(value) || 0; }, { min: 0, max: 180 }); selectionControl(form, "Text color", "color", layout.color || site.palette.ink, value => { layout.color = value; }); }
    selectionControl(form, "Move right (px)", "number", layout.x || 0, value => { layout.x = Number(value) || 0; }, { min: -2000, max: 2000 });
    selectionControl(form, "Move down (px)", "number", layout.y || 0, value => { layout.y = Number(value) || 0; }, { min: -2000, max: 2000 });
    selectionControl(form, "Width (px, 0 = auto)", "number", layout.width || 0, value => { layout.width = Number(value) || 0; }, { min: 0, max: 1600 });
    selectionControl(form, "Height (px, 0 = auto)", "number", layout.height || 0, value => { layout.height = Number(value) || 0; }, { min: 0, max: 1200 });
    return;
  }
  if (selectedObjectId || selectedShapeId) {
    const object = site.objects.find(item => item.id === selectedObjectId);
    const shape = site.shapes.find(item => item.id === selectedShapeId);
    const item = object || shape;
    if (!item) { selectedObjectId = ""; selectedShapeId = ""; return renderInspector(); }
    $("#inspector-actions").hidden = true;
    $("#inspector-title").textContent = object?.type === "text" ? "Text" : object?.type === "image" ? "Image" : object?.type === "model3d" ? "3D model" : "Shape";
    $("#inspector-description").textContent = "Drag to move, use edge handles to resize, or drag the round handle above to rotate.";
    if (object?.type === "text") { selectionControl(form, "Text", "textarea", object.text, value => { object.text = value; }, { maxLength: 500 }); selectionControl(form, "Font size (px)", "number", object.fontSize, value => { object.fontSize = Number(value); }, { min: 10, max: 180 }); }
    if (object?.type === "image") { selectionControl(form, "Image URL (HTTPS)", "url", object.url, value => { object.url = value; }, { maxLength: 500 }); selectionControl(form, "Alt text", "text", object.alt, value => { object.alt = value; }, { maxLength: 160 }); const upload = document.createElement("button"); upload.type = "button"; upload.className = "button subtle wide"; upload.textContent = "Upload image"; upload.addEventListener("click", () => $("#canvas-image-file").click()); form.append(upload); }
    if (object?.type === "model3d") { selectionControl(form, "Model name", "text", object.modelFileName, value => { object.modelFileName = value; }, { maxLength: 160 }); selectionControl(form, "Model scale", "number", object.modelScale, value => { object.modelScale = Number(value) || 1; }, { min: .2, max: 3, step: .1 }); selectionControl(form, "Rotate model X (degrees)", "number", object.modelRotateX, value => { object.modelRotateX = Number(value) || 0; }, { min: -360, max: 360 }); selectionControl(form, "Rotate model Y (degrees)", "number", object.modelRotateY, value => { object.modelRotateY = Number(value) || 0; }, { min: -360, max: 360 }); }
    const transform = selectionGroup(form, "Position & size", true);
    selectionControl(transform, "X position (%)", "number", item.x, value => { item.x = Number(value) || 0; }, { min: 0, max: 100, step: .1 });
    selectionControl(transform, "Y position (%)", "number", item.y, value => { item.y = Number(value) || 0; }, { min: 0, max: 100, step: .1 });
    selectionControl(transform, "Width (px)", "number", item.width ?? item.size, value => { item.width = Number(value); }, { min: 24, max: object ? 900 : 600 });
    selectionControl(transform, "Height (px)", "number", item.height ?? item.size, value => { item.height = Number(value); }, { min: 24, max: 600 });
    selectionControl(transform, "Rotation (degrees)", "number", item.rotation, value => { item.rotation = Number(value) || 0; }, { min: -360, max: 360 });
    const appearance = selectionGroup(form, "Color & blending");
    if (object?.type === "text" || object?.type === "model3d" || shape) selectionControl(appearance, "Color", "color", item.color, value => { item.color = value; });
    if (object?.type === "image") selectionControl(appearance, "Frame color", "color", item.background || "#d8d8d8", value => { item.background = value; });
    selectionControl(appearance, "Opacity (%)", "range", Math.round(item.opacity * 100), value => { item.opacity = Number(value) / 100; }, { min: 0, max: 100, step: 1 });
    selectionDropdown(appearance, "Blending", item.blend, blendOptions, value => { item.blend = value; });
    motionControls(form, item);
    return;
  }
  $("#inspector-actions").hidden = !section;
  if (!section) { $("#inspector-title").textContent = "Select a section"; $("#inspector-description").textContent = "Choose a section from the canvas or list to edit its content."; return; }
  $("#inspector-title").textContent = section.type === "plugin" ? section.pluginName : SECTION_LABELS[section.type];
  $("#inspector-description").textContent = "Changes appear in your preview immediately.";
  if (section.type !== "blank") form.append(field("Small heading", "eyebrow", section.eyebrow, { max: 80 }), field("Title", "title", section.title, { max: 130 }), field("Description", "body", section.body, { multiline: true, max: 700 }));
  if (["hero", "cta", "plugin"].includes(section.type)) form.append(field("Button label", "buttonText", section.buttonText, { max: 40 }), field("Button link", "buttonUrl", section.buttonUrl, { max: 300, placeholder: "https://youtube.com/... or youtube.com/..." }));
  if (section.type === "hero") form.append(field("Artwork label", "artLabel", section.artLabel, { max: 80 }));
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
  $("#site-preview").innerHTML = renderSite(site, true, selectedShapeId, selectedObjectId);
  document.querySelectorAll("#site-preview [data-site-key]").forEach(element => {
    element.classList.add("editor-content");
    element.title = "Double-click to edit";
    element.addEventListener("dblclick", event => {
      event.preventDefault(); event.stopPropagation();
      const key = element.dataset.siteKey;
      element.contentEditable = "true"; element.classList.add("inline-editing"); element.focus();
      const range = document.createRange(); range.selectNodeContents(element);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      element.addEventListener("keydown", e => { if (e.key === "Escape") { element.textContent = site[key]; element.blur(); } else if (e.key === "Enter") { e.preventDefault(); element.blur(); } });
      element.addEventListener("blur", () => { site[key] = element.textContent.trim().slice(0, key === "name" ? 70 : 120); save(); update(); }, { once: true });
    });
  });
  document.querySelectorAll("#site-preview a").forEach(link => {
    if (/^https?:\/\//i.test(link.getAttribute("href") || "")) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
  });
  document.querySelectorAll("[data-section-id]").forEach(element => {
    element.classList.toggle("canvas-selected", element.dataset.sectionId === selectedId);
    element.addEventListener("click", event => { if (event.target.closest("a") || event.target.closest("details")) return; select(element.dataset.sectionId); });
    element.addEventListener("keydown", event => { if (event.target === element && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); select(element.dataset.sectionId); } });
  });
  document.querySelectorAll("#site-preview [data-content-key]").forEach(element => {
    const sectionId = element.closest("[data-section-id]")?.dataset.sectionId;
    const key = element.dataset.contentKey;
    if (!sectionId || !key) return;
    element.classList.add("editor-content");
    if (selectedContent?.sectionId === sectionId && selectedContent.key === key) {
      element.classList.add("content-selected");
      const handle = document.createElement("span"); handle.className = "content-resize-handle"; handle.setAttribute("aria-hidden", "true"); element.append(handle);
    }
    element.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); });
    element.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.stopPropagation();
      if (element.isContentEditable) return;
      if (event.detail >= 2 && !/imageUrl|linkUrl/.test(key)) { event.preventDefault(); startInlineEdit(element, sectionId, key); return; }
      event.preventDefault();
      selectedId = sectionId; selectedContent = { sectionId, key }; selectedObjectId = ""; selectedShapeId = ""; setRailPanel("edit");
      document.querySelectorAll(".content-selected").forEach(node => node.classList.remove("content-selected"));
      element.classList.add("content-selected");
      if (!element.querySelector(".content-resize-handle")) { const handle = document.createElement("span"); handle.className = "content-resize-handle"; element.append(handle); }
      const ref = contentRef(); if (!ref) return;
      const layout = ref.section.elementStyles ||= {};
      const position = layout[key] ||= {};
      const startX = event.clientX, startY = event.clientY;
      const initialX = Number(position.x) || 0, initialY = Number(position.y) || 0;
      const initialWidth = Number(position.width) || element.getBoundingClientRect().width / zoom;
      const initialHeight = Number(position.height) || element.getBoundingClientRect().height / zoom;
      const resizing = Boolean(event.target.closest(".content-resize-handle"));
      let moved = false;
      element.setPointerCapture(event.pointerId);
      const move = current => {
        const dx = (current.clientX - startX) / zoom, dy = (current.clientY - startY) / zoom;
        if (Math.abs(dx) + Math.abs(dy) < 2 && !moved) return;
        moved = true;
        if (resizing) {
          position.width = Math.max(30, Math.min(1600, Math.round(initialWidth + dx)));
          position.height = Math.max(18, Math.min(1200, Math.round(initialHeight + dy)));
          element.style.width = `${position.width}px`; element.style.height = `${position.height}px`;
        } else {
          position.x = Math.max(-2000, Math.min(2000, Math.round(initialX + dx)));
          position.y = Math.max(-2000, Math.min(2000, Math.round(initialY + dy)));
          element.style.transform = `translate(${position.x}px,${position.y}px)`;
        }
      };
      const finish = () => { element.removeEventListener("pointermove", move); if (moved) { save(); renderCanvas(); } renderInspector(); renderLayerList(); renderList(); };
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", finish, { once: true });
      element.addEventListener("pointercancel", finish, { once: true });
    });
    element.addEventListener("dblclick", event => { event.preventDefault(); event.stopPropagation(); if (!/imageUrl|linkUrl/.test(key) && !element.isContentEditable) startInlineEdit(element, sectionId, key); });
  });
  document.querySelectorAll(".editor-decoration").forEach(element => {
    element.addEventListener("pointerdown", event => {
      event.preventDefault(); event.stopPropagation();
      const shape = site.shapes.find(item => item.id === element.dataset.shapeId); if (!shape) return;
      selectedShapeId = shape.id; selectedObjectId = ""; selectedContent = null; setRailPanel("edit");
      element.classList.remove("site-motion");
      document.querySelectorAll(".shape-resize-handle,.shape-rotate-handle,.shape-rotate-stem,.shape-selection-box").forEach(existing => { if (existing.parentElement !== element) existing.remove(); });
      if (!element.querySelector(".shape-resize-handle")) element.insertAdjacentHTML("beforeend", '<rect class="shape-selection-box" x="1" y="1" width="98" height="98"/><rect class="shape-resize-handle" data-resize="n" x="35" y="-3" width="30" height="6" rx="3"/><rect class="shape-resize-handle" data-resize="e" x="97" y="35" width="6" height="30" rx="3"/><rect class="shape-resize-handle" data-resize="s" x="35" y="97" width="30" height="6" rx="3"/><rect class="shape-resize-handle" data-resize="w" x="-3" y="35" width="6" height="30" rx="3"/><circle class="shape-resize-handle" data-resize="nw" cx="3" cy="3" r="4"/><circle class="shape-resize-handle" data-resize="ne" cx="97" cy="3" r="4"/><circle class="shape-resize-handle" data-resize="se" cx="97" cy="97" r="5"/><circle class="shape-resize-handle" data-resize="sw" cx="3" cy="97" r="4"/><path class="shape-rotate-stem" d="M50 0V-12"/><circle class="shape-rotate-handle" cx="50" cy="-17" r="7"/>');
      const resizeDirection = event.target.closest(".shape-resize-handle")?.dataset.resize || "";
      const rotating = Boolean(event.target.closest(".shape-rotate-handle"));
      const startX = event.clientX, startY = event.clientY;
      const startWidth = shape.width ?? shape.size, startHeight = shape.height ?? shape.size;
      const center = element.getBoundingClientRect();
      const centerX = center.left + center.width / 2, centerY = center.top + center.height / 2;
      const startAngle = Math.atan2(startY - centerY, startX - centerX), startRotation = shape.rotation;
      element.setPointerCapture(event.pointerId);
      const moveShape = e => {
        if (rotating) {
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const delta = Math.atan2(Math.sin(angle - startAngle), Math.cos(angle - startAngle));
          shape.rotation = Math.max(-360, Math.min(360, Math.round(startRotation + delta * 180 / Math.PI)));
          element.style.transform = `translate(-50%,-50%) rotate(${shape.rotation}deg)`;
        } else if (resizeDirection) {
          const dx = (e.clientX - startX) / zoom, dy = (e.clientY - startY) / zoom;
          if (resizeDirection.includes("e")) shape.width = Math.max(24, Math.min(600, startWidth + dx));
          else if (resizeDirection.includes("w")) shape.width = Math.max(24, Math.min(600, startWidth - dx));
          if (resizeDirection.includes("s")) shape.height = Math.max(24, Math.min(600, startHeight + dy));
          else if (resizeDirection.includes("n")) shape.height = Math.max(24, Math.min(600, startHeight - dy));
          element.style.width = `${shape.width}px`; element.style.height = `${shape.height}px`;
        } else {
          const currentRect = element.closest(".built-site").getBoundingClientRect();
          shape.x = Math.max(0, Math.min(100, (e.clientX - currentRect.left) / currentRect.width * 100));
          shape.y = Math.max(0, Math.min(100, (e.clientY - currentRect.top) / currentRect.height * 100));
          element.style.left = `${shape.x}%`; element.style.top = `${shape.y}%`;
        }
      };
      const stopShape = () => { element.removeEventListener("pointermove", moveShape); save(); renderShapeTools(); renderInspector(); };
      element.addEventListener("pointermove", moveShape);
      element.addEventListener("pointerup", stopShape, { once: true });
      element.addEventListener("pointercancel", stopShape, { once: true });
      renderShapeTools(); renderInspector(); renderLayerList();
    });
  });
  document.querySelectorAll(".editor-canvas-object").forEach(element => {
    element.addEventListener("dblclick", event => {
      const object = site.objects.find(item => item.id === element.dataset.objectId);
      if (object?.type !== "text") return;
      event.preventDefault(); event.stopPropagation();
      startObjectInlineEdit(element, object);
    });
    element.addEventListener("pointerdown", event => {
      if (event.target.closest("[contenteditable=true]")) return;
      event.preventDefault(); event.stopPropagation();
      const object = site.objects.find(item => item.id === element.dataset.objectId); if (!object) return;
      if (event.detail >= 2 && object.type === "text") { startObjectInlineEdit(element, object); return; }
      if (selectedObjectId !== object.id) {
        document.querySelectorAll(".canvas-object-selected").forEach(previous => { previous.classList.remove("canvas-object-selected"); previous.querySelectorAll(".object-selection-box,.object-resize-handle,.object-rotate-handle").forEach(handle => handle.remove()); });
        selectedObjectId = object.id; selectedShapeId = ""; selectedContent = null; setRailPanel("edit");
        element.classList.add("canvas-object-selected");
        element.insertAdjacentHTML("beforeend", `<span class="object-selection-box"></span>${["n","e","s","w","nw","ne","se","sw"].map(direction => `<span class="object-resize-handle" data-resize="${direction}" aria-label="Resize ${direction}"></span>`).join("")}<span class="object-rotate-handle" aria-label="Rotate element"></span>`);
        renderCanvasObjectTools(); renderInspector(); renderLayerList();
      }
      element.classList.remove("site-motion");
      const resizeDirection = event.target.closest(".object-resize-handle")?.dataset.resize || "";
      const rotating = Boolean(event.target.closest(".object-rotate-handle"));
      const startX = event.clientX, startY = event.clientY, startWidth = object.width, startHeight = object.height;
      const center = element.getBoundingClientRect();
      const centerX = center.left + center.width / 2, centerY = center.top + center.height / 2;
      const startAngle = Math.atan2(startY - centerY, startX - centerX), startRotation = object.rotation;
      element.setPointerCapture(event.pointerId);
      const moveObject = e => {
        if (rotating) {
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const delta = Math.atan2(Math.sin(angle - startAngle), Math.cos(angle - startAngle));
          object.rotation = Math.max(-360, Math.min(360, Math.round(startRotation + delta * 180 / Math.PI)));
          element.style.transform = `translate(-50%,-50%) rotate(${object.rotation}deg)`;
        } else if (resizeDirection) {
          const dx = (e.clientX - startX) / zoom, dy = (e.clientY - startY) / zoom;
          if (resizeDirection.includes("e")) object.width = Math.max(24, Math.min(900, startWidth + dx));
          else if (resizeDirection.includes("w")) object.width = Math.max(24, Math.min(900, startWidth - dx));
          if (resizeDirection.includes("s")) object.height = Math.max(24, Math.min(600, startHeight + dy));
          else if (resizeDirection.includes("n")) object.height = Math.max(24, Math.min(600, startHeight - dy));
          element.style.width = `${object.width}px`; element.style.height = `${object.height}px`;
        } else {
          const rect = element.closest(".built-site").getBoundingClientRect();
          object.x = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
          object.y = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100));
          element.style.left = `${object.x}%`; element.style.top = `${object.y}%`;
        }
      };
      const stopObject = () => { element.removeEventListener("pointermove", moveObject); save(); renderCanvas(); renderCanvasObjectTools(); };
      element.addEventListener("pointermove", moveObject);
      element.addEventListener("pointerup", stopObject, { once: true });
      element.addEventListener("pointercancel", stopObject, { once: true });
    });
  });
  $("#canvas-title").textContent = site.name;
  renderSelectionToolbar(); renderLayerList(); renderPageStrip();
}
const shapeOptions=SHAPE_TYPES;
const blendOptions=["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"];
function addShape(type,x=50,y=50){const shape={id:globalThis.crypto?.randomUUID?.()||`shape-${Date.now()}`,type,x,y,size:120,width:120,height:120,color:site.accent,opacity:.8,blend:"normal",rotation:0,z:2};site.shapes.push(shape);selectedShapeId=shape.id;selectedObjectId="";selectedContent=null;setRailPanel("edit");save();renderCanvas();renderShapeTools();renderInspector();}
function hexToHsv(hex){const value=hex.replace("#","");let r=parseInt(value.slice(0,2),16)/255,g=parseInt(value.slice(2,4),16)/255,b=parseInt(value.slice(4,6),16)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let h=0;if(delta){if(max===r)h=((g-b)/delta)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;h=(h*60+360)%360;}return{h,s:max?delta/max:0,v:max};}
function hsvToHex(h,s,v){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return"#"+rgb.map(channel=>Math.round((channel+m)*255).toString(16).padStart(2,"0")).join("");}
function appendShapeColorPicker(parent,shape){const state=hexToHsv(shape.color),wrap=document.createElement("div"),label=document.createElement("label"),hue=document.createElement("input"),field=document.createElement("div"),thumb=document.createElement("span");wrap.className="shape-color-picker";label.textContent="Color";hue.type="range";hue.min=0;hue.max=360;hue.value=state.h;hue.setAttribute("aria-label","Color hue");field.className="shape-color-field";field.tabIndex=0;field.setAttribute("role","slider");field.setAttribute("aria-label","Color saturation and brightness");thumb.className="shape-color-thumb";field.append(thumb);const paint=()=>{field.style.backgroundImage=`linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${state.h} 100% 50%))`;thumb.style.left=`${state.s*100}%`;thumb.style.top=`${(1-state.v)*100}%`;field.setAttribute("aria-valuetext",shape.color);};const updateColor=()=>{shape.color=hsvToHex(state.h,state.s,state.v);paint();save();renderCanvas();};const pickPoint=event=>{const rect=field.getBoundingClientRect();state.s=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));state.v=1-Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));updateColor();};hue.addEventListener("input",()=>{state.h=Number(hue.value);updateColor();});field.addEventListener("pointerdown",event=>{event.preventDefault();field.setPointerCapture(event.pointerId);pickPoint(event);const move=e=>pickPoint(e),stop=()=>{field.removeEventListener("pointermove",move);field.removeEventListener("pointerup",stop);field.removeEventListener("pointercancel",stop);};field.addEventListener("pointermove",move);field.addEventListener("pointerup",stop);field.addEventListener("pointercancel",stop);});field.addEventListener("keydown",event=>{const step=event.shiftKey ? 0.1 : 0.02;if(event.key==="ArrowLeft")state.s=Math.max(0,state.s-step);else if(event.key==="ArrowRight")state.s=Math.min(1,state.s+step);else if(event.key==="ArrowUp")state.v=Math.min(1,state.v+step);else if(event.key==="ArrowDown")state.v=Math.max(0,state.v-step);else return;event.preventDefault();updateColor();});paint();wrap.append(label,hue,field);parent.append(wrap);}
const shapeDropZone=$("#canvas-frame");
shapeDropZone.addEventListener("dragover",event=>{const types=Array.from(event.dataTransfer?.types||[]);if(types.some(type=>["application/x-websiteforge-shape","application/x-websiteforge-text","application/x-websiteforge-image"].includes(type))){event.preventDefault();event.dataTransfer.dropEffect="copy";}});
shapeDropZone.addEventListener("drop",event=>{const shapeType=event.dataTransfer?.getData("application/x-websiteforge-shape");const textPreset=event.dataTransfer?.getData("application/x-websiteforge-text");const imageType=event.dataTransfer?.getData("application/x-websiteforge-image");if(!shapeOptions.includes(shapeType)&&!textPresets[textPreset]&&!imageType)return;event.preventDefault();const canvas=$("#site-preview")?.querySelector(".built-site");if(!canvas)return;const rect=canvas.getBoundingClientRect();const x=Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100));const y=Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100));suppressPaletteClickUntil=Date.now()+500;if(shapeOptions.includes(shapeType))addShape(shapeType,x,y);else addCanvasObject(textPreset?"text":"image",x,y,textPreset||"plain");});
function renderAddonToolTabs(){
  $("#addon-tool-tabs").hidden = true;
  for (const id of ["shape-tools", "text-tools", "image-tools"]) $("#" + id).hidden = false;
  $("#template-tools").hidden = !installed.some(pack => pack.features.includes("template-studio"));
}
function renderShapeTools(){renderAddonToolTabs();const groups={"Basic shapes":["square","rectangle","rounded-square","circle","ellipse","triangle","inverted-triangle","right-triangle","diamond","cross","plus"],Polygons:["trapezoid","parallelogram","pentagon","hexagon","heptagon","octagon","nonagon","decagon"],Stars:["star-3","star-4","star-5","star-6","star-8","star-10","star-12","starburst"],Arrows:["arrow-right","arrow-left","arrow-up","arrow-down","double-arrow","chevron"],Symbols:["heart","lightning","moon","cloud","speech-bubble","line","curve","zigzag","pie","arc","ring"],Flowchart:["flow-terminal","flow-process","flow-decision","flow-document","flow-data","flow-delay","flow-display","flow-preparation","flow-database","flow-manual-input","flow-stored-data"]};const palette=$("#shape-palette");palette.replaceChildren();Object.entries(groups).forEach(([group,types])=>{const wrapper=document.createElement("div");wrapper.className="shape-group";const title=document.createElement("div");title.className="shape-group-title";title.textContent=group;wrapper.append(title);const row=document.createElement("div");row.className="shape-picks";types.forEach((type,index)=>{const button=document.createElement("button");button.type="button";button.className="shape-pick";button.title=type.replaceAll("-"," ");button.setAttribute("aria-label",`Add ${button.title}`);button.innerHTML=`<svg viewBox="0 0 100 100" aria-hidden="true">${shapeSvgMarkup(type,site.accent)}</svg>`;if(index>=5)button.hidden=true;button.addEventListener("click",()=>{if(Date.now()>=suppressPaletteClickUntil)addShape(type);});button.draggable=true;button.addEventListener("dragstart",event=>{event.dataTransfer?.setData("application/x-websiteforge-shape",type);if(event.dataTransfer)event.dataTransfer.effectAllowed="copy";});row.append(button);});wrapper.append(row);if(types.length>5){const more=document.createElement("button");more.type="button";more.className="button ghost small shape-more";more.textContent="Add more…";more.addEventListener("click",()=>{const expand=more.dataset.expanded!=="true";row.querySelectorAll("button").forEach(button=>button.hidden=!expand&&Array.from(row.children).indexOf(button)>=5);more.dataset.expanded=String(expand);more.textContent=expand?"Show less":"Add more…";});wrapper.append(more);}palette.append(wrapper);});const list=$("#shape-list");list.replaceChildren();$("#shape-count").textContent=String(site.shapes.length);site.shapes.forEach((shape,index)=>{const card=document.createElement("div");card.className=`shape-card ${selectedShapeId===shape.id?"selected":""}`;const head=document.createElement("div");head.className="shape-card-head";head.innerHTML=`<strong>${shape.type.replaceAll("-"," ")}</strong>`;head.addEventListener("click",()=>{selectedShapeId=shape.id;selectedObjectId="";renderCanvas();renderShapeTools();});const controls=document.createElement("div");controls.className="shape-controls";const addControl=(label,type,value,oninput,attrs={})=>{const wrap=document.createElement("label");wrap.textContent=label;const input=document.createElement("input");input.type=type;input.value=value;Object.assign(input,attrs);input.addEventListener("input",()=>{oninput(input.value);save();});input.addEventListener("change",renderCanvas);wrap.append(input);controls.append(wrap);};appendShapeColorPicker(controls,shape);addControl("Width","range",shape.width??shape.size,v=>shape.width=Number(v),{min:24,max:600});addControl("Height","range",shape.height??shape.size,v=>shape.height=Number(v),{min:24,max:600});addControl("Opacity","range",shape.opacity,v=>shape.opacity=Number(v),{min:0,max:1,step:.05});addControl("Rotation","range",shape.rotation,v=>shape.rotation=Number(v),{min:-180,max:180});const blendLabel=document.createElement("label");blendLabel.textContent="Blending";const blend=document.createElement("select");blendOptions.forEach(mode=>blend.add(new Option(mode.replaceAll("-"," "),mode)));blend.value=shape.blend;blend.addEventListener("change",()=>{shape.blend=blend.value;save();renderCanvas();});blendLabel.append(blend);controls.append(blendLabel);const remove=document.createElement("button");remove.type="button";remove.className="button danger wide";remove.textContent="Delete shape";remove.addEventListener("click",()=>{site.shapes.splice(index,1);save();renderCanvas();renderShapeTools();});card.append(head,controls,remove);list.append(card);});}
const textPresets={heading:{label:"Heading",text:"Your heading",fontSize:52},subheading:{label:"Subheading",text:"A supporting line",fontSize:32},caption:{label:"Caption",text:"Add a caption",fontSize:18},label:{label:"Label",text:"SECTION LABEL",fontSize:14},badge:{label:"Badge",text:"New",fontSize:20},plain:{label:"Plain text",text:"Your text",fontSize:24}};
function addCanvasObject(type,x=50,y=50,preset="plain") {const definition=textPresets[preset]||textPresets.plain;const object={id:globalThis.crypto?.randomUUID?.()||`object-${Date.now()}`,type,x,y,width:type==="image"?300:preset==="badge"?140:320,height:type==="image"?190:preset==="badge"?54:100,rotation:0,color:type==="text"?(preset==="badge"?"#ffffff":site.palette.ink):site.palette.ink,background:type==="text"&&preset==="badge"?site.accent:"",opacity:1,blend:"normal",z:3,text:definition.text,fontSize:definition.fontSize,preset:type==="text"?preset:"plain",url:"",alt:""};site.objects.push(object);selectedObjectId=object.id;selectedShapeId="";selectedContent=null;setRailPanel("edit");save();renderCanvas();renderCanvasObjectTools();renderInspector();}
function renderCanvasObjectTools(){renderAddonToolTabs();const presets=$("#text-presets");presets.replaceChildren();Object.entries(textPresets).forEach(([key,item])=>{const button=document.createElement("button");button.type="button";button.className=`object-preset preset-${key}`;button.textContent=item.label;button.title=`Add ${item.label.toLowerCase()}`;button.addEventListener("click",()=>{if(Date.now()>=suppressPaletteClickUntil)addCanvasObject("text",50,50,key);});button.draggable=true;button.addEventListener("dragstart",event=>{event.dataTransfer?.setData("application/x-websiteforge-text",key);if(event.dataTransfer)event.dataTransfer.effectAllowed="copy";});presets.append(button);});const addImage=$("#add-image-object");addImage.onclick=()=>addCanvasObject("image");addImage.draggable=true;addImage.ondragstart=event=>{event.dataTransfer?.setData("application/x-websiteforge-image","image");if(event.dataTransfer)event.dataTransfer.effectAllowed="copy";};const renderList=(type,target)=>{const list=$(target);list.replaceChildren();site.objects.forEach((object,index)=>{if(object.type!==type)return;const card=document.createElement("div");card.className=`shape-card ${selectedObjectId===object.id?"selected":""}`;const head=document.createElement("div");head.className="shape-card-head object-card-head";head.textContent=type==="text"?`${textPresets[object.preset]?.label||"Text"}: ${object.text.slice(0,24)||"Text"}`:"Image frame";head.addEventListener("click",()=>{selectedObjectId=object.id;selectedShapeId="";renderCanvas();renderCanvasObjectTools();});card.append(head);const controls=document.createElement("div");controls.className="shape-controls object-controls";const addControl=(label,inputType,value,oninput,attrs={})=>{const wrap=document.createElement("label");wrap.textContent=label;const input=document.createElement(inputType==="textarea"?"textarea":"input");input.type=inputType==="textarea"?"text":inputType;input.value=value??"";Object.assign(input,attrs);if(inputType==="textarea"){input.rows=3;input.maxLength=500;}input.addEventListener("input",()=>{oninput(input.value);save();if(inputType==="range")input.setAttribute("aria-valuenow",input.value);renderCanvas();});input.addEventListener("change",()=>{renderCanvas();renderCanvasObjectTools();});wrap.append(input);controls.append(wrap);};const addSelect=(label,value,options,onchange)=>{const wrap=document.createElement("label");wrap.textContent=label;const select=document.createElement("select");options.forEach(([key,name])=>select.add(new Option(name,key)));select.value=value;select.addEventListener("change",()=>{onchange(select.value);save();renderCanvas();renderCanvasObjectTools();});wrap.append(select);controls.append(wrap);};if(type==="text"){addControl("Text","textarea",object.text,value=>object.text=value);addSelect("Text style",object.preset,Object.entries(textPresets).map(([key,item])=>[key,item.label]),value=>{object.preset=value;object.fontSize=textPresets[value].fontSize;if(value==="badge"){object.background=site.accent;object.color="#ffffff";}else if(object.preset!=="badge"){object.background="";}});addControl("Text size","range",object.fontSize,value=>object.fontSize=Number(value),{min:10,max:180});appendShapeColorPicker(controls,object);addControl("Width","range",object.width,value=>object.width=Number(value),{min:24,max:900});addControl("Height","range",object.height,value=>object.height=Number(value),{min:24,max:600});if(object.preset==="badge")addControl("Badge background","color",object.background||site.accent,value=>object.background=value);}
else{addControl("Image URL (HTTPS)","url",object.url,value=>object.url=value,{placeholder:"https://example.com/image.jpg",maxLength:500});addControl("Alt text","text",object.alt,value=>object.alt=value,{maxLength:160});addControl("Width","range",object.width,value=>object.width=Number(value),{min:24,max:900});addControl("Height","range",object.height,value=>object.height=Number(value),{min:24,max:600});addControl("Frame color","color",object.background||"#d8d8d8",value=>object.background=value);}
addControl("Opacity","range",object.opacity,value=>object.opacity=Number(value),{min:0,max:1,step:.05});addSelect("Blending",object.blend,blendOptions.map(mode=>[mode,mode.replaceAll("-"," ")]),value=>object.blend=value);const remove=document.createElement("button");remove.type="button";remove.className="button danger wide";remove.textContent=`Delete ${type==="text"?"text":"image frame"}`;remove.addEventListener("click",()=>{site.objects.splice(index,1);if(selectedObjectId===object.id)selectedObjectId="";save();renderCanvas();renderCanvasObjectTools();});card.append(controls,remove);list.append(card);});};renderList("text","#text-object-list");renderList("image","#image-object-list");}
function freshContentId(prefix) { return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`; }
function addTemplateToSite(saved) {
  const sections = (saved.sections || []).map(section => { const { id, ...content } = structuredClone(section); return makeSection(section.type, content); });
  const shapes = (saved.shapes || []).map(shape => ({ ...structuredClone(shape), id: freshContentId("shape") }));
  const objects = (saved.objects || []).map(object => ({ ...structuredClone(object), id: freshContentId("object") }));
  if (site.sections.length + sections.length > MAX_SECTIONS) { toast(`This site can have up to ${MAX_SECTIONS} sections.`); return; }
  if (site.shapes.length + shapes.length > 80 || site.objects.length + objects.length > 100) { toast("This template has more shapes or canvas items than this page can hold."); return; }
  site.sections.push(...sections); site.shapes.push(...shapes); site.objects.push(...objects);
  if (saved.style) { site.theme = saved.style.theme; site.accent = saved.style.accent; site.palette = structuredClone(saved.style.palette); site.font = saved.style.font; site.design = structuredClone(saved.style.design); }
  if (sections.length) { selectedId = sections[0].id; selectedShapeId = ""; selectedObjectId = ""; }
  else if (shapes.length) { selectedShapeId = shapes[0].id; selectedObjectId = ""; }
  else if (objects.length) { selectedObjectId = objects[0].id; selectedShapeId = ""; }
  if ($("#template-dialog").open) $("#template-dialog").close();
  update(); setTab("build"); toast(`${saved.name} added to your page.`);
}
function saveTemplatePack() {
  const name = $("#template-name").value.trim().slice(0, 70);
  const description = $("#template-description").value.trim().slice(0, 180);
  if (!name) { $("#template-status").textContent = "Enter a name for this template."; $("#template-name").focus(); return; }
  let sections = [], shapes = [], objects = [], style = null;
  if ($("#template-scope").value === "page") {
    sections = structuredClone(site.sections); shapes = structuredClone(site.shapes); objects = structuredClone(site.objects);
    style = { theme: site.theme, accent: site.accent, palette: structuredClone(site.palette), font: site.font, design: structuredClone(site.design) };
  } else if (selectedShapeId) {
    const selectedShape = site.shapes.find(shape => shape.id === selectedShapeId);
    if (selectedShape) shapes = [structuredClone(selectedShape)];
  } else if (selectedObjectId) {
    const selectedObject = site.objects.find(object => object.id === selectedObjectId);
    if (selectedObject) objects = [structuredClone(selectedObject)];
  } else {
    const section = selected();
    if (section) sections = [structuredClone(section)];
  }
  if (!sections.length && !shapes.length && !objects.length) { $("#template-status").textContent = "Select a section or canvas item first, or choose All sections and canvas items."; return; }
  const packId = `websiteforge.template-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const pack = normalizePluginPack({
    format: "websiteforge-plugin", version: 1, id: packId, name,
    author: site.name || "WebsiteForge creator",
    description: description || `Reusable template shared from ${site.name || "WebsiteForge"}.`,
    sections: [], themes: [], features: [],
    templates: [{ id: freshContentId("template"), name, description, sections, shapes, objects, style }]
  });
  download(`${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "websiteforge-template"}.json`, JSON.stringify(pack, null, 2), "application/json");
  try {
    installPack(pack);
    $("#template-status").textContent = `${name} is saved in Installed packs and downloaded. URLs in the saved sections and image frames are included.`;
    toast(`${name} saved and downloaded.`);
  } catch (error) {
    $("#template-status").textContent = `${name} was downloaded. ${error.message || "It could not be added to this device's installed packs."}`;
    toast(`${name} downloaded.`);
  }
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
    (pack.templates || []).forEach(saved => {
      const add = document.createElement("button"); add.type = "button"; add.className = "button subtle"; add.textContent = `Add ${saved.name}`;
      add.addEventListener("click", () => { addTemplateToSite(saved); setTab("build"); }); actions.append(add);
    });
    pack.sections.forEach(definition => {
      const add = document.createElement("button"); add.type = "button"; add.className = "button subtle"; add.textContent = `+ ${definition.name}`;
      add.addEventListener("click", () => { if (site.sections.length >= MAX_SECTIONS) { toast(`This site can have up to ${MAX_SECTIONS} sections.`); return; } const section = createPluginSection(definition); site.sections.push(section); selectedId = section.id; update(); setTab("build"); toast(`${definition.name} added.`); }); actions.append(add);
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
    if (pack.features.includes("drawing-menu")) {
      const enabled = installed.some(item => item.id === "websiteforge.drawing-menu");
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "button subtle";
      toggle.textContent = enabled ? "Drawing menu enabled" : "Enable drawing menu";
      toggle.disabled = enabled;
      actions.append(toggle);
    }
    const exportButton = document.createElement("button"); exportButton.type = "button"; exportButton.className = "button ghost"; exportButton.textContent = "Share JSON";
    exportButton.addEventListener("click", () => download(`${pack.id}.json`, JSON.stringify(pack, null, 2), "application/json")); actions.append(exportButton);
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "button danger"; remove.textContent = "Uninstall";
    remove.addEventListener("click", () => { installed = installed.filter(item => item.id !== pack.id); savePlugins(); applyWorkspaceMode(); renderPlugins(); renderShapeTools(); renderCanvasObjectTools(); renderTemplateGallery(); pluginStatus(`${pack.name} uninstalled. Existing sections stay on this website.`); }); actions.append(remove);
    card.append(actions); list.append(card);
  });
}
function installPack(raw) {
  const pack = normalizePluginPack(raw);
  if (installed.length >= 20 && !installed.some(item => item.id === pack.id)) throw new Error("You can install up to 20 packs.");
  installed = [...installed.filter(item => item.id !== pack.id), pack];
  if (pack.features.includes("template-studio")) activeAddonTool = "template-studio";
  savePlugins(); applyWorkspaceMode(); renderPlugins(); renderShapeTools(); renderCanvasObjectTools(); renderTemplateGallery(); pluginStatus(`${pack.name} installed. Choose its options below.`);
}
async function fetchPack(rawUrl) {
  const url = new URL(rawUrl, location.href);
  if (!(url.protocol === "https:" || url.origin === location.origin && url.protocol === "http:")) throw new Error("Use an HTTPS URL for shared packs.");
  if (url.username || url.password) throw new Error("Plugin URLs cannot include credentials.");
  const response = await fetch(url, { credentials: "omit", mode: "cors" });
  if (!response.ok) throw new Error(`Could not download pack (${response.status}).`);
  const content = await response.text();
  if (content.length > 1000000) throw new Error("Plugin pack is too large.");
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
  save(); $("#site-name").value = site.name; $("#site-address").value = site.address || ""; $("#site-logo-url").value = /^https:\/\//i.test(site.logoUrl || "") ? site.logoUrl : ""; $("#site-logo-status").textContent = site.logoUrl?.startsWith("data:image/") ? "Uploaded logo is saved with this project and used in the exported site." : "Shown beside the website name and used as the exported browser icon."; $("#site-tagline").value = site.tagline; $("#site-footer-note").value = site.footerNote || "";
  $("#font-select").value = site.font; $("#custom-accent").value = site.accent;
  [["paper-color", "paper"], ["ink-color", "ink"], ["muted-color", "muted"]].forEach(([id, key]) => $("#" + id).value = site.palette[key]);
  [["content-width", "contentWidth", "px"], ["section-spacing", "sectionSpacing", "px"], ["corner-radius", "cornerRadius", "px"], ["heading-scale", "headingScale", "×"]].forEach(([id, key, unit]) => { $("#" + id).value = site.design[key]; $("#" + id + "-value").textContent = `${site.design[key]}${unit}`; });
  $("#button-style").value = site.design.buttonStyle;
  renderList(); renderThemes(); renderInspector(); renderCanvas(); renderPlugins(); renderShapeTools(); renderCanvasObjectTools();
}
function select(id, keepPanel = false) { selectedId = id; selectedObjectId = ""; selectedShapeId = ""; selectedContent = null; if (!keepPanel) setRailPanel("edit"); renderList(); renderInspector(); renderCanvas(); }
function restoreHistory(direction) {
  const next = historyIndex + direction;
  if (next < 0 || next >= history.length) return;
  historyIndex = next; restoringHistory = true;
  try { site = normalizeSite(JSON.parse(history[historyIndex])); selectedId = site.sections[0]?.id; selectedContent = null; selectedObjectId = ""; selectedShapeId = ""; update(); }
  finally { restoringHistory = false; }
}
function deleteSelection() {
  if (selectedContent) { const ref = contentRef(); if (ref) ref.target[ref.key] = ""; selectedContent = null; }
  else if (selectedObjectId) { site.objects = site.objects.filter(item => item.id !== selectedObjectId); selectedObjectId = ""; }
  else if (selectedShapeId) { site.shapes = site.shapes.filter(item => item.id !== selectedShapeId); selectedShapeId = ""; }
  else return;
  update();
}
function duplicateSelection() {
  if (selectedContent) {
    const ref = contentRef(); const element = document.querySelector(`[data-section-id="${selectedContent.sectionId}"] [data-content-key="${selectedContent.key}"]`);
    const artboard = $("#site-preview .built-site");
    if (!ref || !element || !artboard) return;
    const rect = element.getBoundingClientRect(), page = artboard.getBoundingClientRect();
    const x = (rect.left + rect.width / 2 - page.left) / page.width * 100 + 2;
    const y = (rect.top + rect.height / 2 - page.top) / page.height * 100 + 2;
    const image = ref.key === "imageUrl";
    const fontSize = Math.max(10, Math.min(180, Math.round(parseFloat(getComputedStyle(element).fontSize) || 24)));
    addCanvasObject(image ? "image" : "text", x, y, image ? "plain" : "caption");
    const copy = site.objects.find(item => item.id === selectedObjectId);
    if (image) { copy.url = ref.target[ref.key]; copy.alt = "Copied image"; }
    else { copy.text = ref.target[ref.key]; copy.fontSize = fontSize; }
    copy.width = Math.max(24, Math.min(900, Math.round(rect.width / zoom)));
    copy.height = Math.max(24, Math.min(600, Math.round(rect.height / zoom)));
  } else if (selectedObjectId) {
    const original = site.objects.find(item => item.id === selectedObjectId); if (!original) return;
    const copy = { ...structuredClone(original), id: freshContentId("object"), x: Math.min(100, original.x + 2), y: Math.min(100, original.y + 2) };
    site.objects.push(copy); selectedObjectId = copy.id;
  } else if (selectedShapeId) {
    const original = site.shapes.find(item => item.id === selectedShapeId); if (!original) return;
    const copy = { ...structuredClone(original), id: freshContentId("shape"), x: Math.min(100, original.x + 2), y: Math.min(100, original.y + 2) };
    site.shapes.push(copy); selectedShapeId = copy.id;
  } else return;
  update();
}
function shiftLayer(direction) {
  let item;
  if (selectedContent) { const ref = contentRef(); if (!ref) return; ref.section.elementStyles ||= {}; item = ref.section.elementStyles[selectedContent.key] ||= {}; }
  else if (selectedObjectId) item = site.objects.find(entry => entry.id === selectedObjectId);
  else if (selectedShapeId) item = site.shapes.find(entry => entry.id === selectedShapeId);
  if (!item) return;
  item.z = Math.max(-20, Math.min(20, (Number(item.z) || 0) + direction));
  save(); renderCanvas(); renderInspector();
}
function copySelection() {
  if (selectedObjectId) {
    const object = site.objects.find(item => item.id === selectedObjectId);
    if (!object) return false;
    copiedElement = { kind: "object", value: structuredClone(object) };
  } else if (selectedShapeId) {
    const shape = site.shapes.find(item => item.id === selectedShapeId);
    if (!shape) return false;
    copiedElement = { kind: "shape", value: structuredClone(shape) };
  } else if (selectedContent) {
    const ref = contentRef();
    const element = document.querySelector(`[data-section-id="${selectedContent.sectionId}"] [data-content-key="${selectedContent.key}"]`);
    const page = $("#site-preview .built-site");
    if (!ref || !element || !page) return false;
    const rect = element.getBoundingClientRect(), pageRect = page.getBoundingClientRect();
    copiedElement = { kind: "content", image: ref.key === "imageUrl", value: ref.target[ref.key],
      x: (rect.left + rect.width / 2 - pageRect.left) / pageRect.width * 100,
      y: (rect.top + rect.height / 2 - pageRect.top) / pageRect.height * 100,
      width: Math.round(rect.width / zoom), height: Math.round(rect.height / zoom),
      fontSize: Math.round(parseFloat(getComputedStyle(element).fontSize) || 24),
      color: getComputedStyle(element).color };
  } else return false;
  toast("Element copied. Press Ctrl+V to paste.");
  return true;
}
function pasteSelection() {
  if (!copiedElement) return false;
  if (copiedElement.kind === "content") {
    const copy = copiedElement;
    addCanvasObject(copy.image ? "image" : "text", Math.min(100, copy.x + 3), Math.min(100, copy.y + 3), copy.image ? "plain" : "caption");
    const object = site.objects.find(item => item.id === selectedObjectId);
    if (!object) return false;
    if (copy.image) { object.url = copy.value; object.alt = "Copied image"; }
    else { object.text = copy.value; object.fontSize = Math.max(10, Math.min(180, copy.fontSize)); }
    object.width = Math.max(24, Math.min(900, copy.width)); object.height = Math.max(24, Math.min(600, copy.height));
  } else if (copiedElement.kind === "object") {
    const object = { ...structuredClone(copiedElement.value), id: freshContentId("object"), x: Math.min(100, copiedElement.value.x + 3), y: Math.min(100, copiedElement.value.y + 3) };
    site.objects.push(object); selectedObjectId = object.id; selectedShapeId = ""; selectedContent = null;
  } else {
    const shape = { ...structuredClone(copiedElement.value), id: freshContentId("shape"), x: Math.min(100, copiedElement.value.x + 3), y: Math.min(100, copiedElement.value.y + 3) };
    site.shapes.push(shape); selectedShapeId = shape.id; selectedObjectId = ""; selectedContent = null;
  }
  setRailPanel("edit"); update(); toast("Element pasted.");
  return true;
}
function nudgeSelection(dx, dy) {
  if (!(selectedContent || selectedObjectId || selectedShapeId)) return false;
  if (selectedContent) {
    const ref = contentRef(); if (!ref) return false;
    ref.section.elementStyles ||= {};
    const layout = ref.section.elementStyles[selectedContent.key] ||= {};
    layout.x = Math.max(-2000, Math.min(2000, (Number(layout.x) || 0) + dx));
    layout.y = Math.max(-2000, Math.min(2000, (Number(layout.y) || 0) + dy));
  } else {
    const item = selectedObjectId ? site.objects.find(entry => entry.id === selectedObjectId) : site.shapes.find(entry => entry.id === selectedShapeId);
    const rect = $("#site-preview .built-site")?.getBoundingClientRect();
    if (!item || !rect) return false;
    item.x = Math.max(0, Math.min(100, item.x + dx * zoom / rect.width * 100));
    item.y = Math.max(0, Math.min(100, item.y + dy * zoom / rect.height * 100));
  }
  save(); renderCanvas(); renderInspector();
  return true;
}
function changeZoom(amount) {
  const control = $("#canvas-zoom");
  control.value = Math.max(Number(control.min), Math.min(Number(control.max), Number(control.value) + amount));
  control.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
function saveShortcuts() {
  try { localStorage.setItem(shortcutStorageKey, JSON.stringify(shortcuts)); }
  catch { $("#shortcut-status").textContent = "Could not save shortcuts in this browser."; }
}
function renderShortcutSettings() {
  const list = $("#shortcut-list"); list.replaceChildren();
  let group = "";
  for (const definition of SHORTCUT_DEFINITIONS) {
    if (definition.group !== group) { group = definition.group; const heading = document.createElement("h4"); heading.textContent = group; list.append(heading); }
    const row = document.createElement("div"); row.className = "shortcut-row";
    const label = document.createElement("span"); label.textContent = definition.label;
    const key = document.createElement("button"); key.type = "button"; key.className = "shortcut-key"; key.textContent = shortcuts[definition.id].replaceAll("+", " + ");
    key.setAttribute("aria-label", `Change ${definition.label} shortcut`);
    key.addEventListener("click", () => { key.textContent = "Press keys…"; key.classList.add("recording"); key.focus(); });
    key.addEventListener("keydown", event => {
      if (!key.classList.contains("recording")) return;
      event.preventDefault(); event.stopPropagation();
      if (event.key === "Escape") { renderShortcutSettings(); return; }
      const combination = shortcutFromKeyboardEvent(event);
      if (!combination) return;
      if (["Tab", "Ctrl+Tab", "Ctrl+R", "Ctrl+Shift+R", "Ctrl+L", "Ctrl+W", "F5"].includes(combination)) { $("#shortcut-status").textContent = "That key combination is reserved for the browser."; return; }
      const conflict = SHORTCUT_DEFINITIONS.find(item => item.id !== definition.id && shortcuts[item.id] === combination);
      if (conflict) { $("#shortcut-status").textContent = `${combination} is already used for ${conflict.label}.`; return; }
      shortcuts[definition.id] = combination; saveShortcuts(); renderShortcutSettings();
      $("#shortcut-status").textContent = `${definition.label} is now ${combination}.`;
    });
    const reset = document.createElement("button"); reset.type = "button"; reset.className = "shortcut-reset"; reset.textContent = "Reset";
    reset.setAttribute("aria-label", `Reset ${definition.label} shortcut`);
    reset.addEventListener("click", () => {
      const conflict = SHORTCUT_DEFINITIONS.find(item => item.id !== definition.id && shortcuts[item.id] === definition.default);
      if (conflict) { $("#shortcut-status").textContent = `Reset ${conflict.label} first, or use Reset all.`; return; }
      shortcuts[definition.id] = definition.default; saveShortcuts(); renderShortcutSettings();
      $("#shortcut-status").textContent = `${definition.label} restored.`;
    });
    row.append(label, key, reset); list.append(row);
  }
}
function showSettingsTab(name) {
  document.querySelectorAll(".settings-tab").forEach(button => button.classList.toggle("active", button.dataset.settingsTab === name));
  document.querySelectorAll(".settings-panel").forEach(panel => panel.hidden = panel.id !== `settings-${name}`);
}
async function uploadSelectedImage(file) {
  if (!file || !/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 15000000) { toast("Choose a PNG, JPG, WebP, or GIF under 15 MB."); return; }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close?.();
    const data = canvas.toDataURL("image/webp", 0.82);
    if (data.length > 2000000) { toast("This image is too large to save in the browser. Try a smaller image."); return; }
    const ref = selectedContent ? contentRef() : null;
    const object = site.objects.find(item => item.id === selectedObjectId);
    if (ref?.key === "imageUrl") ref.target.imageUrl = data;
    else if (object?.type === "image") object.url = data;
    else { addCanvasObject("image"); site.objects.find(item => item.id === selectedObjectId).url = data; }
    save(); renderCanvas(); renderInspector(); toast("Image added to the canvas.");
  } catch { toast("Could not read that image."); }
}
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

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => setRailPanel(tab.dataset.tab)));
document.querySelectorAll(".rail-button").forEach(button => button.addEventListener("click", () => setRailPanel(button.dataset.rail)));
$("#page-strip-add").addEventListener("click", () => { setRailPanel("pages"); $("#add-section").focus(); });
$("#settings-button").addEventListener("click", () => { showSettingsTab("general"); $("#settings-dialog").showModal(); });
$("#close-settings-dialog").addEventListener("click", () => $("#settings-dialog").close());
document.querySelectorAll(".settings-tab").forEach(button => button.addEventListener("click", () => showSettingsTab(button.dataset.settingsTab)));
$("#reset-all-shortcuts").addEventListener("click", () => { shortcuts = defaultShortcuts(); saveShortcuts(); renderShortcutSettings(); $("#shortcut-status").textContent = "All keyboard shortcuts restored."; });
$("#undo-button").addEventListener("click", () => restoreHistory(-1));
$("#redo-button").addEventListener("click", () => restoreHistory(1));
$("#selection-duplicate").addEventListener("click", duplicateSelection);
$("#selection-edit-text").addEventListener("click", () => {
  if (selectedContent && !/imageUrl|linkUrl/.test(selectedContent.key)) {
    const element = $("#site-preview [data-section-id=\"" + selectedContent.sectionId + "\"] [data-content-key=\"" + selectedContent.key + "\"]");
    if (element) startInlineEdit(element, selectedContent.sectionId, selectedContent.key);
  } else if (selectedObjectId) {
    const object = site.objects.find(item => item.id === selectedObjectId);
    startObjectInlineEdit($("#site-preview [data-object-id=\"" + selectedObjectId + "\"]"), object);
  }
});
$("#selection-delete").addEventListener("click", deleteSelection);
$("#selection-front").addEventListener("click", () => shiftLayer(1));
$("#selection-back").addEventListener("click", () => shiftLayer(-1));
$("#add-text-button").addEventListener("click", () => addCanvasObject("text", 50, 14, "heading"));
$("#add-image-button").addEventListener("click", () => { selectedContent = null; selectedObjectId = ""; selectedShapeId = ""; $("#canvas-image-file").click(); });
$("#add-shape-button").addEventListener("click", () => addShape("rounded-square", 50, 22));
$("#open-templates-button").addEventListener("click", () => $("#template-dialog").showModal());
$("#imported-project-button").addEventListener("click", openImportedProject);
$("#canvas-image-file").addEventListener("change", async event => { await uploadSelectedImage(event.target.files?.[0]); event.target.value = ""; });
$("#canvas-zoom").addEventListener("input", event => { zoom = Number(event.target.value) / 100; $("#canvas-frame").style.zoom = String(zoom); $("#zoom-value").textContent = `${event.target.value}%`; });
const shortcutHandlers = {
  copy: copySelection, paste: pasteSelection,
  cut: () => { if (!copySelection()) return false; deleteSelection(); return true; },
  duplicate: () => { if (!(selectedContent || selectedObjectId || selectedShapeId)) return false; duplicateSelection(); return true; },
  delete: () => { if (!(selectedContent || selectedObjectId || selectedShapeId)) return false; deleteSelection(); return true; },
  deleteAlternate: () => shortcutHandlers.delete(),
  undo: () => { restoreHistory(-1); return true; },
  redo: () => { restoreHistory(1); return true; },
  redoAlternate: () => { restoreHistory(1); return true; },
  forward: () => { if (!(selectedContent || selectedObjectId || selectedShapeId)) return false; shiftLayer(1); return true; },
  backward: () => { if (!(selectedContent || selectedObjectId || selectedShapeId)) return false; shiftLayer(-1); return true; },
  up: () => nudgeSelection(0, -1), down: () => nudgeSelection(0, 1), left: () => nudgeSelection(-1, 0), right: () => nudgeSelection(1, 0),
  upFast: () => nudgeSelection(0, -10), downFast: () => nudgeSelection(0, 10), leftFast: () => nudgeSelection(-10, 0), rightFast: () => nudgeSelection(10, 0),
  zoomIn: () => changeZoom(10), zoomOut: () => changeZoom(-10),
  preview: () => { $("#preview-button").click(); return true; },
  save: () => { $("#export-json-button").click(); return true; },
  export: () => { $("#export-html-button").click(); return true; },
  settings: () => { $("#settings-dialog").showModal(); return true; }
};
document.addEventListener("keydown", event => {
  if (event.target.closest?.("input,textarea,select,[contenteditable=true]") || $("#settings-dialog").open || $("#template-dialog").open) return;
  const combination = shortcutFromKeyboardEvent(event);
  const action = SHORTCUT_DEFINITIONS.find(item => shortcuts[item.id] === combination)?.id;
  if (action && shortcutHandlers[action]?.()) event.preventDefault();
});
$("#site-name").addEventListener("input", event => { site.name = event.target.value; save(); renderCanvas(); });
$("#site-address").addEventListener("change", event => { site.address = event.target.value.trim(); save(); });
$("#site-logo-url").addEventListener("change", event => { site.logoUrl = event.target.value.trim(); save(); renderCanvas(); });
$("#site-logo-upload-button").addEventListener("click", () => $("#site-logo-file").click());
$("#site-logo-file").addEventListener("change", async event => {
  const file = event.target.files?.[0]; event.target.value = "";
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 15000000) { toast("Choose a PNG, JPG, WebP, or GIF under 15 MB."); return; }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close?.();
    site.logoUrl = canvas.toDataURL("image/png");
    if (site.logoUrl.length > 2000000) throw new Error("Logo is too large to save.");
    save(); update(); toast("Website logo and browser icon updated.");
  } catch { toast("Could not read that logo image."); }
});
$("#site-tagline").addEventListener("input", event => { site.tagline = event.target.value; save(); renderCanvas(); });
$("#site-footer-note").addEventListener("input", event => { site.footerNote = event.target.value; save(); renderCanvas(); });
$("#font-select").addEventListener("change", event => { site.font = event.target.value; update(); });
$("#custom-accent").addEventListener("input", event => { site.accent = event.target.value; save(); renderCanvas(); renderThemes(); renderShapeTools(); });
[["paper-color", "paper"], ["ink-color", "ink"], ["muted-color", "muted"]].forEach(([id, key]) => $("#" + id).addEventListener("input", event => { site.palette[key] = event.target.value; save(); renderCanvas(); renderThemes(); }));
[["content-width", "contentWidth", "px"], ["section-spacing", "sectionSpacing", "px"], ["corner-radius", "cornerRadius", "px"], ["heading-scale", "headingScale", "×"]].forEach(([id, key, unit]) => $("#" + id).addEventListener("input", event => { site.design[key] = Number(event.target.value); $("#" + id + "-value").textContent = `${site.design[key]}${unit}`; save(); renderCanvas(); }));
$("#button-style").addEventListener("change", event => { site.design.buttonStyle = event.target.value; save(); renderCanvas(); });
$("#apply-template-button").addEventListener("click", () => applyTemplate($("#template-select").value));
$("#browse-template-button").addEventListener("click", () => $("#template-dialog").showModal());
$("#add-template-button").addEventListener("click", () => $("#template-dialog").showModal());
$("#close-template-dialog").addEventListener("click", () => $("#template-dialog").close());
$("#save-template-pack").addEventListener("click", saveTemplatePack);
$("#add-section").addEventListener("change", event => { if (!SECTION_TYPES.includes(event.target.value)) return; if (site.sections.length >= MAX_SECTIONS) { toast(`This site can have up to ${MAX_SECTIONS} sections.`); event.target.value = ""; return; } const section = makeSection(event.target.value); site.sections.push(section); selectedId = section.id; event.target.value = ""; update(); });

$("#duplicate-section-button").addEventListener("click", () => { const section = selected(); if (!section) return; if (site.sections.length >= MAX_SECTIONS) { toast(`This site can have up to ${MAX_SECTIONS} sections.`); return; } const { id, ...content } = structuredClone(section); const copy = makeSection(section.type, content); site.sections.splice(site.sections.indexOf(section) + 1, 0, copy); selectedId = copy.id; update(); });
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
$("#plugin-file").addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { if (file.size > 1000000) throw new Error("Plugin pack is too large."); installPack(JSON.parse(await file.text())); } catch (error) { pluginStatus(error.message || "Could not install pack."); } event.target.value = ""; });
$("#generate-site-button").addEventListener("click", () => ai("site"));
$("#rewrite-section-button").addEventListener("click", () => ai("rewrite"));
renderTemplateGallery(); renderShortcutSettings(); applyWorkspaceMode(); setRailPanel(activeRail); update(); renderCatalog(); checkAiAvailability();
