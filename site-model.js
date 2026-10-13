export const CORE_SECTION_TYPES = ["hero", "intro", "gallery", "features", "events", "links", "cta", "blank"];
export const SECTION_TYPES = [...CORE_SECTION_TYPES, "plugin"];
export const MAX_SECTIONS = 100;
export const SHAPE_TYPES = ["square","rectangle","rounded-square","circle","ellipse","triangle","inverted-triangle","right-triangle","diamond","cross","plus","trapezoid","parallelogram","pentagon","hexagon","heptagon","octagon","nonagon","decagon","star-3","star-4","star-5","star-6","star-8","star-10","star-12","starburst","arrow-right","arrow-left","arrow-up","arrow-down","double-arrow","chevron","heart","lightning","moon","cloud","speech-bubble","line","curve","zigzag","pie","arc","ring","flow-terminal","flow-process","flow-decision","flow-document","flow-data","flow-delay","flow-display","flow-preparation","flow-database","flow-manual-input","flow-stored-data"];
export const SECTION_LABELS = { hero: "Hero", intro: "About", gallery: "Gallery", features: "Highlights", events: "Events", links: "Links", cta: "Call to action", blank: "Blank", plugin: "Plugin section" };
export const THEMES = {
  forge: { label: "Forge orange", accent: "#ed7418", paper: "#fff8f1", ink: "#27272b", muted: "#66666c" },
  clay: { label: "Warm clay", accent: "#bd5e47", paper: "#faf5ef", ink: "#2f302d", muted: "#6f7268" },
  moss: { label: "Moss & cream", accent: "#4b735f", paper: "#f5f5ec", ink: "#26382f", muted: "#687669" },
  lilac: { label: "Soft lilac", accent: "#8063aa", paper: "#f8f4fb", ink: "#332e40", muted: "#77717e" },
  ocean: { label: "Coastal blue", accent: "#407d9b", paper: "#f1f7f8", ink: "#263b43", muted: "#6a7b80" }
};

const limits = { name: 70, tagline: 120, eyebrow: 80, title: 130, body: 700, buttonText: 40, buttonUrl: 300, imageUrl: 500, itemTitle: 70, itemBody: 180 };
const trim = (value, length) => typeof value === "string" ? value.trim().slice(0, length) : "";
const color = (value, fallback = "") => /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
const number = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
const choice = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
export const makeId = () => globalThis.crypto?.randomUUID?.() || `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export function shapeSvgMarkup(type, fillColor = "#ed7418") {
  const fill = escapeHtml(color(fillColor, "#ed7418"));
  const polygons = {
    triangle:"50,3 97,93 3,93", "inverted-triangle":"3,7 97,7 50,97", "right-triangle":"5,5 5,95 95,95",
    diamond:"50,2 98,50 50,98 2,50", cross:"35,2 65,2 65,35 98,35 98,65 65,65 65,98 35,98 35,65 2,65 2,35 35,35",
    plus:"40,3 60,3 60,40 97,40 97,60 60,60 60,97 40,97 40,60 3,60 3,40 40,40",
    trapezoid:"20,5 80,5 98,95 2,95", parallelogram:"25,5 98,5 75,95 2,95",
    "flow-decision":"50,2 98,50 50,98 2,50", "flow-data":"25,5 98,5 75,95 2,95",
    "flow-manual-input":"3,20 97,5 97,95 3,95", "flow-preparation":"25,5 75,5 97,50 75,95 25,95 3,50",
    "arrow-right":"5,30 63,30 63,8 98,50 63,92 63,70 5,70", "arrow-left":"95,30 37,30 37,8 2,50 37,92 37,70 95,70",
    "arrow-up":"30,95 30,37 8,37 50,2 92,37 70,37 70,95", "arrow-down":"30,5 70,5 70,63 92,63 50,98 8,63 30,63",
    "double-arrow":"3,50 28,12 28,32 72,32 72,12 97,50 72,88 72,68 28,68 28,88", chevron:"10,5 50,5 90,50 50,95 10,95 50,50",
    "flow-display":"18,5 82,5 97,50 82,95 18,95 3,50"
  };
  const polygon = points => `<polygon points="${points}" fill="${fill}"/>`;
  const star = sides => Array.from({length:sides*2},(_,index)=>{const angle=-Math.PI/2+index*Math.PI/sides;const radius=index%2 ? 0.42 : 1;return `${50+48*radius*Math.cos(angle)},${50+48*radius*Math.sin(angle)}`;}).join(" ");
  if(type==="square"||type==="rectangle")return `<rect x="3" y="3" width="94" height="94" fill="${fill}"/>`;
  if(type==="rounded-square")return `<rect x="3" y="3" width="94" height="94" rx="20" fill="${fill}"/>`;
  if(type==="circle")return `<circle cx="50" cy="50" r="48" fill="${fill}"/>`;
  if(type==="ellipse")return `<ellipse cx="50" cy="50" rx="48" ry="32" fill="${fill}"/>`;
  if(type==="ring")return `<circle cx="50" cy="50" r="38" fill="none" stroke="${fill}" stroke-width="12"/>`;
  if(type==="arc")return `<path d="M8 78 A48 48 0 0 1 92 78" fill="none" stroke="${fill}" stroke-width="12" stroke-linecap="round"/>`;
  if(type==="line")return `<path d="M6 50 H94" fill="none" stroke="${fill}" stroke-width="10" stroke-linecap="round"/>`;
  if(type==="curve")return `<path d="M5 88 C20 5 80 5 95 88" fill="none" stroke="${fill}" stroke-width="10" stroke-linecap="round"/>`;
  if(type==="zigzag")return `<polyline points="5,75 30,25 50,70 72,25 95,75" fill="none" stroke="${fill}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(type==="heart")return `<path d="M50 91 12 53C-8 31 8 5 30 8c10 1 17 8 20 16 5-9 13-16 24-16 23 0 36 26 15 47Z" fill="${fill}"/>`;
  if(type==="lightning")return `<path d="M58 2 19 56h27l-5 42 40-61H54Z" fill="${fill}"/>`;
  if(type==="moon")return `<path d="M78 13A43 43 0 1 0 87 76 37 37 0 0 1 78 13Z" fill="${fill}"/>`;
  if(type==="cloud")return `<path d="M23 76a22 22 0 0 1-2-44 31 31 0 0 1 58 7 19 19 0 0 1-1 37Z" fill="${fill}"/>`;
  if(type==="speech-bubble")return `<path d="M10 12h80v58H48L25 92V70H10Z" fill="${fill}"/>`;
  if(type==="pie")return `<path d="M50 50 L50 3 A47 47 0 0 1 97 50 Z" fill="${fill}"/>`;
  if(type==="flow-terminal")return `<rect x="3" y="10" width="94" height="80" rx="40" fill="${fill}"/>`;
  if(type==="flow-process")return `<rect x="5" y="5" width="90" height="90" rx="5" fill="${fill}"/>`;
  if(type==="flow-document")return `<path d="M4 5h92v70c-16 0-16 18-32 18s-16-18-32-18S16 93 4 93Z" fill="${fill}"/>`;
  if(type==="flow-delay")return `<path d="M5 5h42a45 45 0 0 1 0 90H5Z" fill="${fill}"/>`;
  if(type==="flow-database"||type==="flow-stored-data")return `<path d="M5 20c0-20 90-20 90 0v60c0 20-90 20-90 0Zm0 0c0 20 90 20 90 0M5 50c0 20 90 20 90 0" fill="${type==="flow-database"?fill:"none"}" stroke="${fill}" stroke-width="7"/>`;
  if(type.startsWith("star-")){const sides=Number(type.slice(5))||5;return polygon(star(sides));}
  if(type==="starburst")return polygon(Array.from({length:32},(_,index)=>{const angle=-Math.PI/2+index*Math.PI/16;const radius=index%2 ? 0.72 : 1;return `${50+48*radius*Math.cos(angle)},${50+48*radius*Math.sin(angle)}`;}).join(" "));
  if(polygons[type])return polygon(polygons[type]);
  if(["pentagon","hexagon","heptagon","octagon","nonagon","decagon"].includes(type)){const sides={pentagon:5,hexagon:6,heptagon:7,octagon:8,nonagon:9,decagon:10}[type];return polygon(Array.from({length:sides},(_,index)=>{const angle=-Math.PI/2+index*2*Math.PI/sides;return `${50+48*Math.cos(angle)},${50+48*Math.sin(angle)}`;}).join(" "));}
  return polygon("5,5 95,5 95,95 5,95");
}
export const DEFAULT_DESIGN = Object.freeze({ contentWidth: 1180, sectionSpacing: 90, cornerRadius: 4, headingScale: 1, buttonStyle: "solid" });

export function makeSection(type = "intro", overrides = {}) {
  const examples = {
    blank: {},
    hero: { eyebrow: "A CREATIVE WORLD OF MY OWN", title: "Art made to feel like home.", body: "Thoughtful work, small moments, and a little bit of magic. Welcome to my corner of the internet.", buttonText: "Explore my work", buttonUrl: "#gallery" },
    intro: { eyebrow: "HELLO THERE", title: "I make things with heart.", body: "I'm an artist who loves turning everyday inspiration into something you can hold, share, or remember." },
    gallery: { eyebrow: "SELECTED WORK", title: "A little look around", body: "A collection of recent favorites from my studio.", items: [{ title: "Color studies", body: "A playful exploration of shape and color." }, { title: "New beginnings", body: "Little ideas grown into something bigger." }, { title: "Everyday wonder", body: "Small details worth noticing." }] },
    features: { eyebrow: "WHAT I CREATE", title: "Made with intention", body: "From first sketch to final detail, every piece has its own story.", items: [{ title: "Original artwork", body: "One-of-a-kind pieces made in my studio." }, { title: "Thoughtful details", body: "A little care in every corner." }, { title: "For your space", body: "Art to live with and love." }] },
    events: { eyebrow: "FIND ME OUT THERE", title: "Upcoming events", body: "Come say hello in person. I would love to meet you.", items: [{ title: "Spring Art Market", body: "May 18 · Downtown Arts Hall" }, { title: "Makers Weekend", body: "June 8 · Riverfront Pavilion" }] },
    links: { eyebrow: "FIND ME ONLINE", title: "Explore more", body: "Choose where you would like to go next.", items: [{ title: "Portfolio", body: "Selected work and projects.", linkUrl: "#gallery" }, { title: "Email", body: "Start a conversation.", linkUrl: "mailto:hello@example.com" }] },
    cta: { eyebrow: "LET'S CONNECT", title: "Let's make something beautiful.", body: "Have an idea, a question, or just want to say hi? My inbox is open.", buttonText: "Get in touch", buttonUrl: "mailto:hello@example.com" }
  };
  return { id: makeId(), type, eyebrow: "", title: "", body: "", buttonText: "", buttonUrl: "", imageUrl: "", artLabel: "ARTIST / MAKER / DREAMER", items: [], layout: "cards", pluginName: "", background: "", textColor: "", alignment: "left", spacing: "normal", ...examples[type], ...overrides };
}

export function template(name = "portfolio") {
  const common = { version: 2, theme: "forge", accent: THEMES.forge.accent, palette: { paper: THEMES.forge.paper, ink: THEMES.forge.ink, muted: THEMES.forge.muted }, design: { ...DEFAULT_DESIGN }, font: "modern", footerNote: "Made with care ✳", shapes: [], objects: [] };
  if (name === "events") return { ...common, name: "The Artist Gathering", tagline: "A place for creative people to meet", sections: [makeSection("hero", { eyebrow: "YOU'RE INVITED", title: "A weekend made for makers.", body: "Meet artists, discover beautiful things, and leave with a little more inspiration.", buttonText: "See the schedule", buttonUrl: "#events" }), makeSection("intro", { title: "Come as you are.", body: "A welcoming space for artists and art lovers to connect, learn, and celebrate the joy of making." }), makeSection("events"), makeSection("cta", { title: "Save your spot.", body: "We can't wait to see you there.", buttonText: "Email the organizers", buttonUrl: "mailto:hello@example.com" })] };
  if (name === "shop") return { ...common, name: "Little Cove Studio", tagline: "Art and objects for everyday joy", sections: [makeSection("hero", { eyebrow: "HANDMADE WITH HEART", title: "Little pieces of joy for your everyday.", body: "Original art and handmade goods from a small, happy studio.", buttonText: "Browse the collection", buttonUrl: "#gallery" }), makeSection("gallery", { title: "From the studio" }), makeSection("features", { title: "Why handmade?" }), makeSection("cta", { title: "Want first dibs?", body: "Say hello and ask about the next collection.", buttonText: "Email the studio", buttonUrl: "mailto:hello@example.com" })] };
  if (name === "commissions") return { ...common, name: "Your Creative Studio", tagline: "Custom work made with care", sections: [makeSection("hero", { eyebrow: "CUSTOM WORK", title: "Let's make something for you.", body: "Explore the kinds of creative work I offer and get in touch to discuss an idea.", buttonText: "See services", buttonUrl: "#services" }), makeSection("features", { id: "services", eyebrow: "SERVICES", title: "Ways to work together", body: "Choose a starting point and ask about availability.", items: [{ title: "Custom artwork", body: "A personal piece shaped around your idea." }, { title: "Creative collaboration", body: "Visual work for a project or small business." }, { title: "Studio consultation", body: "A conversation to explore the right approach." }] }), makeSection("intro", { title: "How it works", body: "Share your idea, timeline, and budget. I will reply with availability and next steps." }), makeSection("cta", { title: "Start a conversation", body: "Tell me what you have in mind.", buttonText: "Email the studio", buttonUrl: "mailto:hello@example.com" })] };
  if (name === "links") return { ...common, name: "Your Name", tagline: "Find my work around the web", sections: [makeSection("hero", { eyebrow: "HELLO", title: "A little home for all my links.", body: "I'm a maker sharing projects, updates, and places to connect.", buttonText: "Get in touch", buttonUrl: "mailto:hello@example.com" }), makeSection("links", { eyebrow: "EXPLORE", title: "Where to find me", body: "Replace these examples with your own destinations.", items: [{ title: "Portfolio", body: "See selected work and recent projects.", linkUrl: "https://example.com" }, { title: "Shop", body: "Browse available pieces and new releases.", linkUrl: "https://example.com" }, { title: "Updates", body: "Follow along with what I am making next.", linkUrl: "https://example.com" }] }), makeSection("cta", { title: "Let's stay in touch", body: "Have a question or collaboration in mind?", buttonText: "Send an email", buttonUrl: "mailto:hello@example.com" })] };
  return { ...common, name: "Mira Studio", tagline: "Illustration, color & little wonders", sections: [makeSection("hero"), makeSection("intro"), makeSection("gallery"), makeSection("events"), makeSection("cta")] };
}

function safeUrl(value, image = false) {
  if (image && typeof value === "string" && value.length <= 2000000 && /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
  const url = trim(value, 500);
  const bareDomain = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;
  const destination = !image && bareDomain.test(url) ? `https://${url}` : url;
  if (!image && /^#[a-zA-Z0-9_-]*$/.test(url)) return url;
  try {
    const parsed = new URL(destination);
    if (image) return parsed.protocol === "https:" ? destination : "";
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) return destination;
  } catch { /* Invalid destinations are handled below. */ }
  return image ? "" : "#";
}
export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function normalizeSite(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.sections)) throw new Error("This is not a WebsiteForge project.");
  const theme = THEMES[input.theme] ? input.theme : "forge";
  const accent = color(input.accent, THEMES[theme].accent);
  const palette = { paper: color(input.palette?.paper, THEMES[theme].paper), ink: color(input.palette?.ink, THEMES[theme].ink), muted: color(input.palette?.muted, THEMES[theme].muted) };
  const design = { contentWidth: number(input.design?.contentWidth, 1180, 760, 1600), sectionSpacing: number(input.design?.sectionSpacing, 90, 35, 160), cornerRadius: number(input.design?.cornerRadius, 4, 0, 40), headingScale: number(input.design?.headingScale, 1, .7, 1.5), buttonStyle: choice(input.design?.buttonStyle, ["solid", "outline", "pill"], "solid") };
  const sections = input.sections.slice(0, MAX_SECTIONS).filter(section => section && SECTION_TYPES.includes(section.type)).map(section => ({
    id: /^[a-zA-Z0-9_-]{1,80}$/.test(section.id) ? section.id : makeId(), type: section.type,
    eyebrow: trim(section.eyebrow, limits.eyebrow), title: trim(section.title, limits.title), body: trim(section.body, limits.body), artLabel: typeof section.artLabel === "string" ? trim(section.artLabel, 80) : "ARTIST / MAKER / DREAMER",
    buttonText: trim(section.buttonText, limits.buttonText), buttonUrl: trim(section.buttonUrl, limits.buttonUrl) ? safeUrl(section.buttonUrl) : "", imageUrl: safeUrl(section.imageUrl, true),
    layout: choice(section.layout, ["cards", "faq", "quote", "banner"], "cards"), pluginName: trim(section.pluginName, 70),
    background: color(section.background), textColor: color(section.textColor), alignment: choice(section.alignment, ["left", "center"], "left"), spacing: choice(section.spacing, ["compact", "normal", "roomy"], "normal"),
    items: (Array.isArray(section.items) ? section.items : []).slice(0, 6).map(item => ({ title: trim(item?.title, limits.itemTitle), body: trim(item?.body, limits.itemBody), imageUrl: safeUrl(item?.imageUrl, true), linkUrl: trim(item?.linkUrl, limits.buttonUrl) ? safeUrl(item.linkUrl) : "" })),
    elementStyles: Object.fromEntries(Object.entries(section.elementStyles && typeof section.elementStyles === "object" ? section.elementStyles : {}).slice(0, 40).filter(([key, value]) => /^(eyebrow|title|body|artLabel|buttonText|imageUrl|item-[0-5]-(title|body|imageUrl|linkUrl))$/.test(key) && value && typeof value === "object").map(([key, value]) => [key, {
      x: number(value.x, 0, -2000, 2000), y: number(value.y, 0, -2000, 2000),
      width: number(value.width, 0, 0, 1600), height: number(value.height, 0, 0, 1200),
      fontSize: number(value.fontSize, 0, 0, 180), color: color(value.color),
      z: number(value.z, 0, -20, 20)
    }]))
  }));
  if (!sections.length) throw new Error("A project needs at least one section.");
  const shapeTypes = SHAPE_TYPES;
  const blends = ["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"];
  const shapes = (Array.isArray(input.shapes) ? input.shapes : []).slice(0, 80).filter(item => item && shapeTypes.includes(item.type)).map(item => {
    const size = number(item.size, 120, 24, 600);
    return { id: /^[a-zA-Z0-9_-]{1,80}$/.test(item.id) ? item.id : makeId(), type:item.type, x:number(item.x,50,0,100), y:number(item.y,50,0,100), size, width:number(item.width,size,24,600), height:number(item.height,size,24,600), color:color(item.color,"#f5b91b"), opacity:number(item.opacity,.8,0,1), blend:choice(item.blend,blends,"normal"), rotation:number(item.rotation,0,-360,360), z:number(item.z,2,-20,20) };
  });
  const objects = (Array.isArray(input.objects) ? input.objects : []).slice(0, 100).filter(item => item && ["text", "image"].includes(item.type)).map(item => ({
    id: /^[a-zA-Z0-9_-]{1,80}$/.test(item.id) ? item.id : makeId(), type: item.type,
    x: number(item.x, 50, 0, 100), y: number(item.y, 50, 0, 100),
    width: number(item.width, 240, 24, 900), height: number(item.height, 90, 24, 600),
    rotation: number(item.rotation, 0, -360, 360), color: color(item.color, "#27272b"), background: color(item.background),
    opacity: number(item.opacity, 1, 0, 1), blend: choice(item.blend, blends, "normal"), z:number(item.z,3,-20,20),
    text: trim(item.text, 500), fontSize: number(item.fontSize, 42, 10, 180),
    preset: choice(item.preset, ["heading", "subheading", "caption", "label", "badge", "plain"], "plain"),
    url: safeUrl(item.url, true), alt: trim(item.alt, 160)
  }));
  return { version: 2, name: trim(input.name, limits.name) || "My Artist Site", tagline: trim(input.tagline, limits.tagline), footerNote: typeof input.footerNote === "string" ? trim(input.footerNote, 120) : "Made with care ✳", theme, accent, palette, design, font: ["editorial", "modern", "playful"].includes(input.font) ? input.font : "modern", sections, shapes, objects };
}

const mark = (section, attrs = "") => `<p class="site-eyebrow"${attrs}>${escapeHtml(section.eyebrow)}</p>`;
const heading = (section, tag = "h2", attrs = "") => `<${tag}${attrs}>${escapeHtml(section.title)}</${tag}>`;
const body = (section, attrs = "") => `<p class="site-body"${attrs}>${escapeHtml(section.body)}</p>`;
const button = (section, attrs = "") => section.buttonText ? `<a class="site-button" href="${escapeHtml(safeUrl(section.buttonUrl))}"${attrs}>${escapeHtml(section.buttonText)} <span aria-hidden="true">↗</span></a>` : "";
const picture = (url, index) => url ? `<img src="${escapeHtml(safeUrl(url, true))}" alt="Artwork ${index + 1}" loading="lazy">` : `<span class="art-shape art-shape-${index % 4}" aria-hidden="true"></span>`;

export function renderSection(section, editable = false) {
  const label = section.type === "plugin" ? section.pluginName || SECTION_LABELS.plugin : SECTION_LABELS[section.type];
  const anchor = section.type === "gallery" ? "gallery" : section.type === "events" ? "events" : section.id;
  const attrs = ` id="${escapeHtml(anchor)}"${editable ? ` data-section-id="${escapeHtml(section.id)}" tabindex="0" role="button" aria-label="Edit ${escapeHtml(label)} section"` : ""}`;
  const classes = `built-section section-${section.type} align-${choice(section.alignment, ["left", "center"], "left")} spacing-${choice(section.spacing, ["compact", "normal", "roomy"], "normal")}`;
  const style = `${section.background ? `background:${color(section.background)};` : ""}${section.textColor ? `color:${color(section.textColor)};--site-muted:${color(section.textColor)};` : ""}`;
  const fieldAttrs = key => {
    const entry = section.elementStyles?.[key];
    const rules = entry ? [
      key === "artLabel" ? "position:absolute" : "position:relative", `z-index:${number(entry.z, 0, -20, 20)}`,
      `transform:translate(${number(entry.x, 0, -2000, 2000)}px,${number(entry.y, 0, -2000, 2000)}px)`,
      entry.width ? `width:${number(entry.width, 0, 0, 1600)}px` : "",
      entry.height ? `height:${number(entry.height, 0, 0, 1200)}px` : "",
      entry.fontSize ? `font-size:${number(entry.fontSize, 0, 0, 180)}px` : "",
      entry.color ? `color:${color(entry.color)}` : ""
    ].filter(Boolean).join(";") : "";
    return `${editable ? ` data-content-key="${key}" tabindex="0"` : ""}${rules ? ` style="${rules}"` : ""}`;
  };
  let content = "";
  if (section.type === "hero") content = `<div class="site-content"><div>${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h1", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}${button(section, fieldAttrs("buttonText"))}</div><div class="hero-art"${fieldAttrs("imageUrl")}>${picture(section.imageUrl, 0)}<span class="art-label"${fieldAttrs("artLabel")}>${escapeHtml(section.artLabel ?? "ARTIST / MAKER / DREAMER")}</span></div></div>`;
  if (section.type === "intro") content = `<div class="intro-grid"><div>${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}</div><div>${body(section, fieldAttrs("body"))}<span class="intro-scribble" aria-hidden="true">✳</span></div></div>`;
  if (["gallery", "features", "events"].includes(section.type)) content = `<div class="site-section-heading">${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}</div><div class="card-grid ${section.type === "events" ? "event-grid" : ""}">${section.items.map((item, index) => `<article class="site-card">${section.type === "gallery" ? `<div class="card-art"${fieldAttrs(`item-${index}-imageUrl`)}>${picture(item.imageUrl, index)}</div>` : `<span class="card-number">${String(index + 1).padStart(2, "0")}</span>`}<h3${fieldAttrs(`item-${index}-title`)}>${escapeHtml(item.title)}</h3><p${fieldAttrs(`item-${index}-body`)}>${escapeHtml(item.body)}</p></article>`).join("")}</div>`;
  if (section.type === "links") content = `<div class="site-section-heading">${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}</div><div class="link-grid">${section.items.map((item, index) => `<a class="link-card" href="${escapeHtml(safeUrl(item.linkUrl))}"${fieldAttrs(`item-${index}-linkUrl`)}><strong${fieldAttrs(`item-${index}-title`)}>${escapeHtml(item.title)}</strong><span${fieldAttrs(`item-${index}-body`)}>${escapeHtml(item.body)}</span><b aria-hidden="true">↗</b></a>`).join("")}</div>`;
  if (section.type === "cta") content = `<div class="cta-content">${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}${button(section, fieldAttrs("buttonText"))}</div><span class="cta-star" aria-hidden="true">✳</span>`;
  if (section.type === "blank") content = "";
  if (section.type === "plugin") {
    const items = section.items || [];
    if (section.layout === "faq") content = `<div class="site-section-heading">${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}</div><div class="plugin-faq">${items.map((item, index) => `<details><summary${fieldAttrs(`item-${index}-title`)}>${escapeHtml(item.title)}</summary><p${fieldAttrs(`item-${index}-body`)}>${escapeHtml(item.body)}</p></details>`).join("")}</div>`;
    else if (section.layout === "quote") content = `<div class="site-section-heading">${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}</div><div class="plugin-quotes">${items.map((item, index) => `<blockquote><p${fieldAttrs(`item-${index}-body`)}>“${escapeHtml(item.body)}”</p><cite${fieldAttrs(`item-${index}-title`)}>${escapeHtml(item.title)}</cite></blockquote>`).join("")}</div>`;
    else if (section.layout === "banner") content = `<div class="site-content"><div>${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}${button(section, fieldAttrs("buttonText"))}</div><div class="hero-art"${fieldAttrs("imageUrl")}>${picture(section.imageUrl, 0)}</div></div>`;
    else content = `<div class="site-section-heading">${mark(section, fieldAttrs("eyebrow"))}${heading(section, "h2", fieldAttrs("title"))}${body(section, fieldAttrs("body"))}</div><div class="card-grid">${items.map((item, index) => `<article class="site-card">${item.imageUrl ? `<div class="card-art"${fieldAttrs(`item-${index}-imageUrl`)}>${picture(item.imageUrl, index)}</div>` : `<span class="card-number">${String(index + 1).padStart(2, "0")}</span>`}<h3${fieldAttrs(`item-${index}-title`)}>${escapeHtml(item.title)}</h3><p${fieldAttrs(`item-${index}-body`)}>${escapeHtml(item.body)}</p></article>`).join("")}</div>${button(section, fieldAttrs("buttonText"))}`;
  }
  return `<section class="${classes}" style="${style}"${attrs}>${content}</section>`;
}

export function renderSite(site, editable = false, selectedShapeId = "", selectedObjectId = "") {
  const theme = THEMES[site.theme] || THEMES.clay;
  const palette = site.palette || theme;
  const design = site.design || DEFAULT_DESIGN;
  const style = `--site-accent:${color(site.accent, theme.accent)};--site-paper:${color(palette.paper, theme.paper)};--site-ink:${color(palette.ink, theme.ink)};--site-muted:${color(palette.muted, theme.muted)};--content-width:${number(design.contentWidth, 1180, 760, 1600)}px;--section-space:${number(design.sectionSpacing, 90, 35, 160)}px;--corner-radius:${number(design.cornerRadius, 4, 0, 40)}px;--heading-scale:${number(design.headingScale, 1, .7, 1.5)}`;
  const nav = site.sections.filter(section => ["gallery", "events", "intro", "links"].includes(section.type)).slice(0, 3).map(section => `<a href="#${escapeHtml(section.type === "gallery" ? "gallery" : section.type === "events" ? "events" : section.id)}">${escapeHtml(SECTION_LABELS[section.type])}</a>`).join("");
  const shapes = (site.shapes || []).map(shape => {
    const shapeMarkup = shapeSvgMarkup(shape.type, shape.color);
    const editAttrs = editable ? `data-shape-id="${escapeHtml(shape.id)}" tabindex="0" role="button" aria-label="Move ${escapeHtml(shape.type)} shape"` : `aria-hidden="true"`;
    const blend = choice(shape.blend, ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], "normal");
    const resizeHandle = editable && shape.id === selectedShapeId ? `<rect class="shape-selection-box" x="1" y="1" width="98" height="98"/><rect class="shape-resize-handle" data-resize="n" x="35" y="-3" width="30" height="6" rx="3"/><rect class="shape-resize-handle" data-resize="e" x="97" y="35" width="6" height="30" rx="3"/><rect class="shape-resize-handle" data-resize="s" x="35" y="97" width="30" height="6" rx="3"/><rect class="shape-resize-handle" data-resize="w" x="-3" y="35" width="6" height="30" rx="3"/><circle class="shape-resize-handle" data-resize="nw" cx="3" cy="3" r="4"/><circle class="shape-resize-handle" data-resize="ne" cx="97" cy="3" r="4"/><circle class="shape-resize-handle" data-resize="se" cx="97" cy="97" r="5"/><circle class="shape-resize-handle" data-resize="sw" cx="3" cy="97" r="4"/>` : "";
    return `<svg class="site-decoration${editable ? " editor-decoration" : ""}" ${editAttrs} viewBox="0 0 100 100" preserveAspectRatio="none" style="left:${shape.x}%;top:${shape.y}%;width:${shape.width ?? shape.size}px;height:${shape.height ?? shape.size}px;opacity:${shape.opacity};mix-blend-mode:${blend};z-index:${number(shape.z,2,-20,20)};transform:translate(-50%,-50%) rotate(${shape.rotation}deg)">${shapeMarkup}${resizeHandle}</svg>`;
  }).join("");
  const objects = (site.objects || []).map(object => {
    const editAttrs = editable ? `data-object-id="${escapeHtml(object.id)}" tabindex="0" role="button" aria-label="Move ${object.type} object"` : "";
    const selected = editable && object.id === selectedObjectId;
    const handles = selected ? `<span class="object-selection-box"></span>${["n","e","s","w","nw","ne","se","sw"].map(direction => `<span class="object-resize-handle" data-resize="${direction}" aria-label="Resize ${direction}"></span>`).join("")}` : "";
    const style = `left:${object.x}%;top:${object.y}%;width:${object.width}px;height:${object.height}px;transform:translate(-50%,-50%) rotate(${object.rotation}deg);color:${color(object.color,"#27272b")};opacity:${number(object.opacity,1,0,1)};mix-blend-mode:${choice(object.blend,BLEND_MODES,"normal")};z-index:${number(object.z,3,-20,20)};${object.background ? `background:${color(object.background)};` : ""}`;
    const imageUrl = object.type === "image" ? safeUrl(object.url, true) : "";
    const content = object.type === "image"
      ? imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(object.alt)}" draggable="false">` : `<span class="image-object-empty">Add an HTTPS image URL</span>`
      : `<span class="text-object-content preset-${object.preset}" style="font-size:${number(object.fontSize,42,10,180)}px">${escapeHtml(object.text || "Your text")}</span>`;
    return `<div class="site-canvas-object canvas-object-${object.type}${object.type === "text" ? ` preset-frame-${object.preset}` : ""}${editable ? " editor-canvas-object" : ""}${selected ? " canvas-object-selected" : ""}" ${editAttrs} style="${style}">${content}${handles}</div>`;
  }).join("");
  const siteAttr = key => editable ? ` data-site-key="${key}" tabindex="0"` : "";
  return `<div class="built-site font-${site.font} button-${choice(design.buttonStyle, ["solid", "outline", "pill"], "solid")}" style="${style}">${shapes}${objects}<header class="site-nav"><div class="site-brand"><span aria-hidden="true">✳</span><strong${siteAttr("name")}>${escapeHtml(site.name)}</strong></div><nav>${nav}</nav><span class="nav-tagline"${siteAttr("tagline")}>${escapeHtml(site.tagline)}</span></header>${site.sections.map(section => renderSection(section, editable)).join("")}<footer class="site-footer"><strong${siteAttr("name")}>${escapeHtml(site.name)}</strong><span${siteAttr("tagline")}>${escapeHtml(site.tagline)}</span><small${siteAttr("footerNote")}>${escapeHtml(site.footerNote ?? "Made with care ✳")}</small></footer></div>`;
}

export const SITE_CSS = `
.built-site{--site-accent:#bd5e47;--site-paper:#faf5ef;--site-ink:#2f302d;--site-muted:#6f7268;background:var(--site-paper);color:var(--site-ink);font-family:Arial,Helvetica,sans-serif;line-height:1.55;min-height:100%;overflow:hidden}.built-site *{box-sizing:border-box}.built-site a{color:inherit;text-decoration:none}.built-site h1,.built-site h2,.built-site h3,.built-site p{margin-top:0}.built-site.font-editorial h1,.built-site.font-editorial h2,.built-site.font-editorial h3{font-family:Georgia,'Times New Roman',serif;font-weight:500}.built-site.font-playful h1,.built-site.font-playful h2,.built-site.font-playful h3{font-family:'Trebuchet MS',Arial,sans-serif;letter-spacing:-.03em}.site-nav{min-height:82px;padding:20px 6%;display:flex;align-items:center;gap:28px;border-bottom:1px solid color-mix(in srgb,var(--site-ink) 12%,transparent)}.site-brand{display:flex;align-items:center;gap:9px;font-size:17px;white-space:nowrap}.site-brand span{color:var(--site-accent);font-size:28px;line-height:1}.site-nav nav{display:flex;gap:25px;margin-left:auto;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.site-nav nav a:hover{color:var(--site-accent)}.nav-tagline{display:none;color:var(--site-muted);font-size:12px}.built-section{padding:90px 8%;position:relative;scroll-margin-top:20px}.section-blank{min-height:320px}.site-eyebrow{font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--site-accent);margin-bottom:20px}.built-section h1{font-size:clamp(44px,6vw,92px);line-height:1.05;letter-spacing:-.055em;margin-bottom:26px}.built-section h2{font-size:clamp(34px,4vw,62px);line-height:1.13;letter-spacing:-.045em;margin-bottom:20px}.built-section h3{font-size:24px;line-height:1.2;margin-bottom:10px}.site-body{color:var(--site-muted);font-size:16px;max-width:580px;line-height:1.8}.site-button{display:inline-flex;align-items:center;gap:24px;background:var(--site-accent);color:white!important;padding:15px 21px;border-radius:3px;font-size:13px;font-weight:700;margin-top:17px}.site-button:hover{filter:brightness(.92)}.section-hero{padding-top:95px;padding-bottom:95px}.site-content{display:grid;grid-template-columns:1.05fr .95fr;gap:8%;align-items:center}.hero-art{height:445px;position:relative;border-radius:48% 48% 4px 4px;background:color-mix(in srgb,var(--site-accent) 20%,white);display:flex;align-items:center;justify-content:center;overflow:hidden}.hero-art img{width:100%;height:100%;object-fit:cover}.art-shape{display:block;width:58%;height:68%;background:var(--site-accent);opacity:.72;box-shadow:35px 25px 0 color-mix(in srgb,var(--site-accent) 35%,white);transform:rotate(-13deg);border-radius:45% 50% 40% 48%}.art-shape-1{border-radius:12% 68% 28% 63%;transform:rotate(19deg)}.art-shape-2{border-radius:60% 15% 67% 20%;transform:rotate(-22deg)}.art-shape-3{border-radius:20% 45% 15% 70%;transform:rotate(8deg)}.art-label{position:absolute;bottom:24px;right:20px;background:var(--site-paper);font-size:9px;font-weight:800;letter-spacing:.18em;padding:10px 12px}.section-intro{background:white}.intro-grid{display:grid;grid-template-columns:1fr 1fr;gap:13%;align-items:start}.intro-scribble{display:block;color:var(--site-accent);font-size:100px;line-height:1;margin-top:30px}.site-section-heading{max-width:680px;margin:0 auto 44px;text-align:center}.site-section-heading .site-body{margin-inline:auto}.card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:19px}.site-card{min-width:0}.card-art{height:240px;background:color-mix(in srgb,var(--site-accent) 14%,white);display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:19px}.card-art img{height:100%;width:100%;object-fit:cover}.card-art .art-shape{width:45%;height:58%}.site-card h3{font-size:21px;margin-bottom:7px}.site-card p{color:var(--site-muted);font-size:13px;line-height:1.65}.card-number{display:inline-block;color:var(--site-accent);font-size:12px;letter-spacing:.14em;border-top:1px solid var(--site-accent);padding-top:14px;width:100%;margin-bottom:22px}.section-features,.section-events{background:white}.event-grid{grid-template-columns:repeat(2,1fr)}.event-grid .site-card{border:1px solid color-mix(in srgb,var(--site-ink) 13%,transparent);padding:26px}.section-cta{background:var(--site-accent);color:white;display:flex;justify-content:space-between;align-items:center;gap:20px}.section-cta .site-eyebrow,.section-cta .site-body{color:white;opacity:.82}.section-cta .site-button{background:white;color:var(--site-accent)!important}.cta-star{font-size:170px;line-height:1;opacity:.22}.site-footer{padding:38px 8%;display:flex;align-items:center;gap:15px;font-size:12px}.site-footer strong{font-size:16px}.site-footer span{color:var(--site-muted)}.site-footer small{margin-left:auto;color:var(--site-muted)}
@media(max-width:800px){.site-nav{min-height:65px;padding:16px 6%}.site-nav nav{gap:12px}.built-section{padding:65px 6%}.site-content{grid-template-columns:1fr;gap:45px}.hero-art{height:310px}.intro-grid{grid-template-columns:1fr;gap:12px}.intro-scribble{font-size:70px}.card-grid{grid-template-columns:1fr 1fr}.card-art{height:190px}.cta-star{display:none}}
@media(max-width:540px){.site-nav nav{display:none}.nav-tagline{display:block;margin-left:auto}.built-section{padding:55px 6%}.built-section h1{font-size:48px}.built-section h2{font-size:37px}.hero-art{height:290px}.card-grid,.event-grid{grid-template-columns:1fr}.card-art{height:240px}.site-footer{flex-wrap:wrap}.site-footer small{margin-left:0}}
.built-site .site-nav,.built-site .site-footer{padding-inline:max(6%,calc((100% - var(--content-width))/2))}.built-site .built-section{padding:var(--section-space) max(6%,calc((100% - var(--content-width))/2))}.built-site .spacing-compact{padding-block:calc(var(--section-space) * .6)}.built-site .spacing-roomy{padding-block:calc(var(--section-space) * 1.4)}.built-site .built-section h1{font-size:clamp(34px,calc(6vw * var(--heading-scale)),130px)}.built-site .built-section h2{font-size:clamp(28px,calc(4vw * var(--heading-scale)),92px)}.built-site .hero-art,.built-site .card-art,.built-site .site-card,.built-site .site-button{border-radius:var(--corner-radius)}.built-site .align-center{text-align:center}.built-site .align-center .site-body{margin-inline:auto}.built-site .align-center .site-content>div:first-child{margin-inline:auto}.built-site.button-outline .site-button{background:transparent;border:2px solid var(--site-accent);color:var(--site-accent)!important}.built-site.button-pill .site-button{border-radius:999px}.built-site .section-cta.button-outline .site-button{border-color:white;color:white!important}.plugin-faq{max-width:760px;margin:auto}.plugin-faq details{border-bottom:1px solid color-mix(in srgb,var(--site-ink) 18%,transparent);padding:20px 0}.plugin-faq summary{cursor:pointer;font-size:18px;font-weight:700}.plugin-faq details p{color:var(--site-muted);line-height:1.7;margin:14px 0 0}.plugin-quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}.plugin-quotes blockquote{margin:0;padding:28px;border:1px solid color-mix(in srgb,var(--site-ink) 15%,transparent);border-radius:var(--corner-radius);background:color-mix(in srgb,var(--site-accent) 7%,white)}.plugin-quotes blockquote p{font-size:18px;line-height:1.5}.plugin-quotes cite{color:var(--site-accent);font-size:12px;font-style:normal;font-weight:700}.section-plugin .site-content{min-height:320px}.section-plugin .site-button{margin-top:24px}@media(max-width:540px){.built-site .built-section{padding-inline:6%}.built-site .built-section h1{font-size:clamp(34px,calc(11vw * var(--heading-scale)),65px)}.built-site .built-section h2{font-size:clamp(28px,calc(8vw * var(--heading-scale)),48px)}}
.built-site .section-intro,.built-site .section-features,.built-site .section-events{background:color-mix(in srgb,var(--site-paper) 92%,var(--site-ink) 8%)}.built-site .plugin-quotes blockquote{background:color-mix(in srgb,var(--site-accent) 7%,var(--site-paper))}.built-site.button-outline .section-cta .site-button{border-color:white;color:white!important}
.built-site .link-grid{display:grid;gap:14px;max-width:760px;margin:auto}.built-site .link-card{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:20px 24px;border:1px solid color-mix(in srgb,var(--site-ink) 20%,transparent);border-radius:var(--corner-radius);background:color-mix(in srgb,var(--site-paper) 85%,white)}.built-site .link-card:hover{border-color:var(--site-accent);transform:translateY(-2px)}.built-site .link-card strong{font-size:18px}.built-site .link-card span{grid-column:1;color:var(--site-muted);font-size:13px}.built-site .link-card b{grid-column:2;grid-row:1/3;align-self:center;color:var(--site-accent);font-size:20px}
.site-decoration{position:absolute;z-index:1;overflow:visible;pointer-events:none}.site-canvas-object{position:absolute;z-index:2;display:flex;align-items:center;justify-content:center;overflow:visible;box-sizing:border-box}.canvas-object-text{padding:4px 8px}.canvas-object-text.preset-frame-badge{border-radius:999px}.text-object-content{display:block;width:100%;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.2}.preset-heading{font-weight:800;letter-spacing:-.055em;line-height:1.02}.preset-subheading{font-weight:600;letter-spacing:-.025em}.preset-caption{font-weight:400;line-height:1.5}.preset-label{font-weight:800;letter-spacing:.18em;text-transform:uppercase}.preset-badge{width:auto;padding:8px 16px;border-radius:999px;font-weight:800;text-align:center}.canvas-object-image{overflow:hidden;background:#e3e3e3}.canvas-object-image img{display:block;width:100%;height:100%;object-fit:cover}.image-object-empty{display:grid;width:100%;height:100%;place-items:center;padding:14px;background:linear-gradient(135deg,#e9e9e9,#d3d3d3);color:#555;font-size:13px;text-align:center}
`;

export function exportDocument(site) {
  return `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(site.tagline)}"><title>${escapeHtml(site.name)}</title><style>body{margin:0}${SITE_CSS}</style></head><body>${renderSite(site)}</body></html>`;
}
