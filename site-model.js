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
export const DEFAULT_MOTION = { enabled: false, speed: 1, x: 0, y: 0, fade: 0, scaleX: 100, scaleY: 100, hue: 0, rotation: 0 };
export function normalizeMotion(input) {
  const screen = input?.trigger === "screen" || (input?.trigger == null && (input?.moveX != null || input?.centerY != null));
  const scaleX = input?.scaleX != null && Number(input.scaleX) <= 3 ? Number(input.scaleX) * 100 : input?.scaleX;
  const scaleY = input?.scaleY != null && Number(input.scaleY) <= 3 ? Number(input.scaleY) * 100 : input?.scaleY;
  const x = number(input?.x ?? input?.moveX, 0, -500, 500);
  const y = number(input?.y ?? input?.moveY, 0, -500, 500);
  const fade = number(input?.fade ?? (input?.opacity != null ? (1 - Number(input.opacity)) * 100 : 0), 0, 0, 100);
  return {
    enabled: input?.enabled === true,
    speed: number(input?.speed, 1, .25, 4),
    screen, trigger: screen ? "screen" : "loop", centerY: number(input?.centerY, 50, 0, 100),
    x, y, moveX: x, moveY: y, fade, opacity: number(input?.opacity, 1 - fade / 100, 0, 1),
    scaleX: number(scaleX, 100, 25, 300), scaleY: number(scaleY, 100, 25, 300),
    hue: number(input?.hue, 0, -180, 180), rotation: number(input?.rotation, 0, -360, 360)
  };
};
const motionStyle = (raw, baseRotation, baseOpacity = 1) => {
  const motion = normalizeMotion(raw);
  const opacity = number(baseOpacity, 1, 0, 1);
  return `--motion-speed:${motion.speed};--motion-center-y:${motion.centerY}%;--motion-duration:${motion.screen ? Math.round(700 / motion.speed) + "ms" : 2 / motion.speed + "s"};--motion-x:${motion.x}px;--motion-y:${motion.y}px;--motion-scale-x:${motion.scaleX / 100};--motion-scale-y:${motion.scaleY / 100};--motion-hue:${motion.hue}deg;--motion-rotation:${motion.rotation}deg;--motion-opacity:${motion.opacity};--motion-opacity-start:${opacity};--motion-opacity-end:${Math.max(0, opacity * (1 - motion.fade / 100))};--base-rotation:${number(baseRotation, 0, -360, 360)}deg;--base-opacity:${opacity};--motion-current-x:0px;--motion-current-y:0px;--motion-current-scale-x:1;--motion-current-scale-y:1;--motion-current-hue:0deg;--motion-current-rotation:0deg;--motion-current-opacity:${opacity};`;
};
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
function safeWebsiteAddress(value) {
  const address = safeUrl(value);
  return /^https?:\/\//i.test(address) ? address : "";
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
    return { id: /^[a-zA-Z0-9_-]{1,80}$/.test(item.id) ? item.id : makeId(), type:item.type, x:number(item.x,50,0,100), y:number(item.y,50,0,100), size, width:number(item.width,size,24,600), height:number(item.height,size,24,600), color:color(item.color,"#f5b91b"), opacity:number(item.opacity,.8,0,1), blend:choice(item.blend,blends,"normal"), rotation:number(item.rotation,0,-360,360), z:number(item.z,2,-20,20), motion:normalizeMotion(item.motion) };
  });
  const objects = (Array.isArray(input.objects) ? input.objects : []).slice(0, 100).filter(item => item && ["text", "image", "model3d"].includes(item.type)).map(item => ({
    id: /^[a-zA-Z0-9_-]{1,80}$/.test(item.id) ? item.id : makeId(), type: item.type,
    x: number(item.x, 50, 0, 100), y: number(item.y, 50, 0, 100),
    width: number(item.width, 240, 24, 900), height: number(item.height, 90, 24, 600),
    rotation: number(item.rotation, 0, -360, 360), color: color(item.color, "#27272b"), background: color(item.background),
    opacity: number(item.opacity, 1, 0, 1), blend: choice(item.blend, blends, "normal"), z:number(item.z,3,-20,20),
    text: trim(item.text, 500), fontSize: number(item.fontSize, 42, 10, 180),
    preset: choice(item.preset, ["heading", "subheading", "caption", "label", "badge", "plain"], "plain"),
    url: safeUrl(item.url, true), alt: trim(item.alt, 160),
    modelData: item.type === "model3d" && typeof item.modelData === "string" && item.modelData.length <= 28000000 && /^data:(?:model\/(?:obj|stl|gltf-binary)|application\/(?:octet-stream|json)|text\/plain);base64,[A-Za-z0-9+/]+={0,2}$/.test(item.modelData) ? item.modelData : "",
    modelResources: item.type === "model3d" && item.modelResources && typeof item.modelResources === "object" ? Object.fromEntries(Object.entries(item.modelResources).slice(0, 40).filter(([name, source]) => /^[^\\/:*?"<>|]{1,180}$/.test(name) && typeof source === "string" && source.length <= 28000000 && /^data:(?:text\/plain|image\/(?:png|jpeg|webp|gif|bmp|avif));base64,[A-Za-z0-9+/]+={0,2}$/i.test(source)).map(([name, source]) => [name, source])) : {},
    modelFormat: choice(item.modelFormat, ["bbmodel", "obj", "stl", "glb"], "bbmodel"),
    modelFileName: trim(item.modelFileName, 160), modelScale: number(item.modelScale, 1, .2, 3),
    modelRotateX: number(item.modelRotateX, -25, -360, 360), modelRotateY: number(item.modelRotateY, 35, -360, 360), modelPixelArt: item.modelPixelArt !== false,
    motion: normalizeMotion(item.motion)
  }));
  return { version: 2, name: trim(input.name, limits.name) || "My Artist Site", address: safeWebsiteAddress(input.address), logoUrl: safeUrl(input.logoUrl, true), tagline: trim(input.tagline, limits.tagline), footerNote: typeof input.footerNote === "string" ? trim(input.footerNote, 120) : "Made with care ✳", theme, accent, palette, design, font: ["editorial", "modern", "playful"].includes(input.font) ? input.font : "modern", sections, shapes, objects };
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

function renderModelPreview(object) {
  let faces = {};
  if (object.modelFormat === "bbmodel" && object.modelData) {
    try {
      const bytes = Uint8Array.from(atob(object.modelData.split(",")[1]), character => character.charCodeAt(0));
      const model = JSON.parse(new TextDecoder().decode(bytes));
      const cube = model.elements?.find(element => element.type === "cube") || model.elements?.[0];
      for (const side of ["front", "back", "left", "right", "top", "bottom"]) {
        const sourceSide = ({ front: "south", back: "north", left: "west", right: "east", top: "up", bottom: "down" })[side];
        const textureIndex = cube?.faces?.[sourceSide]?.texture;
        const source = model.textures?.[textureIndex]?.source;
        faces[side] = safeUrl(source, true);
      }
    } catch { /* A model without usable textures still gets an editable preview. */ }
  }
  const colorValue = color(object.color, "#ff8b35");
  const sides = ["front", "back", "left", "right", "top", "bottom"].map(side => `<span class="model3d-face model3d-${side}" style="${faces[side] ? `background-image:url('${escapeHtml(faces[side])}');` : `background-color:${colorValue};`}"></span>`).join("");
  return `<div class="model3d-preview" style="--model-x:${number(object.modelRotateX,-25,-360,360)}deg;--model-y:${number(object.modelRotateY,35,-360,360)}deg;--model-scale:${number(object.modelScale,1,.2,3)}"><div class="model3d-cube">${sides}</div></div><span class="model3d-caption">${escapeHtml(object.modelFileName || "3D model")}</span>`;
}

export function renderSite(site, editable = false, selectedShapeId = "", selectedObjectId = "") {
  const theme = THEMES[site.theme] || THEMES.clay;
  const palette = site.palette || theme;
  const design = site.design || DEFAULT_DESIGN;
  const style = `--site-accent:${color(site.accent, theme.accent)};--site-paper:${color(palette.paper, theme.paper)};--site-ink:${color(palette.ink, theme.ink)};--site-muted:${color(palette.muted, theme.muted)};--content-width:${number(design.contentWidth, 1180, 760, 1600)}px;--section-space:${number(design.sectionSpacing, 90, 35, 160)}px;--corner-radius:${number(design.cornerRadius, 4, 0, 40)}px;--heading-scale:${number(design.headingScale, 1, .7, 1.5)}`;
  const nav = site.sections.filter(section => ["gallery", "events", "intro", "links"].includes(section.type)).slice(0, 3).map(section => `<a href="#${escapeHtml(section.type === "gallery" ? "gallery" : section.type === "events" ? "events" : section.id)}">${escapeHtml(SECTION_LABELS[section.type])}</a>`).join("");
  const shapes = (site.shapes || []).map(shape => {
    const shapeMarkup = shapeSvgMarkup(shape.type, shape.color);
    const motionEnabled = normalizeMotion(shape.motion).enabled;
    const editAttrs = editable ? `data-shape-id="${escapeHtml(shape.id)}" tabindex="0" role="button" aria-label="Move ${escapeHtml(shape.type)} shape"` : motionEnabled ? `tabindex="0" role="img" aria-label="${escapeHtml(shape.type)} shape"` : `aria-hidden="true"`;
    const blend = choice(shape.blend, ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], "normal");
    const resizeHandle = editable && shape.id === selectedShapeId ? `<rect class="shape-selection-box" x="1" y="1" width="98" height="98"/><rect class="shape-resize-handle" data-resize="n" x="35" y="-3" width="30" height="6" rx="3"/><rect class="shape-resize-handle" data-resize="e" x="97" y="35" width="6" height="30" rx="3"/><rect class="shape-resize-handle" data-resize="s" x="35" y="97" width="30" height="6" rx="3"/><rect class="shape-resize-handle" data-resize="w" x="-3" y="35" width="6" height="30" rx="3"/><circle class="shape-resize-handle" data-resize="nw" cx="3" cy="3" r="4"/><circle class="shape-resize-handle" data-resize="ne" cx="97" cy="3" r="4"/><circle class="shape-resize-handle" data-resize="se" cx="97" cy="97" r="5"/><circle class="shape-resize-handle" data-resize="sw" cx="3" cy="97" r="4"/><g class="shape-rotate-handle" aria-label="Rotate shape"><circle cx="103" cy="-15" r="8"/><text x="103" y="-11">↻</text></g>` : "";
    const motion = normalizeMotion(shape.motion);
    return `<svg class="site-decoration${editable ? " editor-decoration" : ""}${motion.enabled ? motion.screen ? " motion-enabled motion-screen" : " site-motion" : ""}" ${editAttrs} data-canvas-y="${shape.y}" viewBox="0 0 100 100" preserveAspectRatio="none" style="left:${shape.x}%;top:0px;width:${shape.width ?? shape.size}px;height:${shape.height ?? shape.size}px;opacity:${shape.opacity};mix-blend-mode:${blend};z-index:${number(shape.z,2,-20,20)};transform:translate(-50%,-50%) rotate(${shape.rotation}deg);${motionStyle(motion, shape.rotation, shape.opacity)}">${shapeMarkup}${resizeHandle}</svg>`;
  }).join("");
  const objects = (site.objects || []).map(object => {
    const motion = normalizeMotion(object.motion);
    const editAttrs = editable ? `data-object-id="${escapeHtml(object.id)}" tabindex="0" role="button" aria-label="Move ${object.type} object"` : motion.enabled ? `tabindex="0" role="img" aria-label="${object.type === "image" ? escapeHtml(object.alt || "Image") : "Text"}"` : "";
    const selected = editable && object.id === selectedObjectId;
    const handles = selected ? `<span class="object-selection-box"></span>${["n","e","s","w","nw","ne","se","sw"].map(direction => `<span class="object-resize-handle" data-resize="${direction}" aria-label="Resize ${direction}"></span>`).join("")}` : "";
    const style = `left:${object.x}%;top:0px;width:${object.width}px;height:${object.height}px;transform:translate(-50%,-50%) rotate(${object.rotation}deg);color:${color(object.color,"#27272b")};opacity:${number(object.opacity,1,0,1)};mix-blend-mode:${choice(object.blend,BLEND_MODES,"normal")};z-index:${number(object.z,3,-20,20)};${motionStyle(motion, object.rotation, object.opacity)}${object.background ? `background:${color(object.background)};` : ""}`;
    const imageUrl = object.type === "image" ? safeUrl(object.url, true) : "";
    const content = object.type === "model3d" ? renderModelPreview(object) : object.type === "image"
      ? imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(object.alt)}" draggable="false">` : `<span class="image-object-empty">Add an HTTPS image URL</span>`
      : object.type === "model3d"
        ? `<div class="model3d-viewer" data-model-format="${escapeHtml(object.modelFormat)}" data-model-data="${escapeHtml(object.modelData)}" data-model-resources="${escapeHtml(JSON.stringify(object.modelResources || {}))}" data-model-color="${color(object.color, "#ed7418")}" data-model-scale="${number(object.modelScale, 1, .2, 3)}" data-model-rotate-x="${number(object.modelRotateX, 18, -360, 360)}" data-model-rotate-y="${number(object.modelRotateY, -28, -360, 360)}" data-model-pixel-art="${object.modelPixelArt !== false}" role="img" aria-label="Interactive 3D model: ${escapeHtml(object.modelFileName || "model")}"><canvas class="model3d-canvas" aria-hidden="true"></canvas><span class="model3d-message">Loading 3D model…</span>${editable ? `<span class="model3d-editor-help">Drag to rotate · Shift-drag to move</span>` : ""}</div>`
        : `<span class="text-object-content preset-${object.preset}" style="font-size:${number(object.fontSize,42,10,180)}px">${escapeHtml(object.text || "Your text")}</span>`;
    return `<div class="site-canvas-object canvas-object-${object.type}${object.type === "text" ? ` preset-frame-${object.preset}` : ""}${editable ? " editor-canvas-object" : ""}${selected ? " canvas-object-selected" : ""}${motion.enabled ? motion.screen ? " motion-enabled motion-screen" : " site-motion" : ""}" ${editAttrs} data-canvas-y="${object.y}" style="${style}">${content}${handles}</div>`;
  }).join("");
  const siteAttr = key => editable ? ` data-site-key="${key}" tabindex="0"` : "";
  const logo = safeUrl(site.logoUrl, true);
  return `<div class="built-site font-${site.font} button-${choice(design.buttonStyle, ["solid", "outline", "pill"], "solid")}" style="${style}">${shapes}${objects}<header class="site-nav"><div class="site-brand">${logo ? `<img class="site-logo" src="${escapeHtml(logo)}" alt="">` : `<span aria-hidden="true">✳</span>`}<strong${siteAttr("name")}>${escapeHtml(site.name)}</strong></div><nav>${nav}</nav><span class="nav-tagline"${siteAttr("tagline")}>${escapeHtml(site.tagline)}</span></header>${site.sections.map(section => renderSection(section, editable)).join("")}<footer class="site-footer"><strong${siteAttr("name")}>${escapeHtml(site.name)}</strong><span${siteAttr("tagline")}>${escapeHtml(site.tagline)}</span><small${siteAttr("footerNote")}>${escapeHtml(site.footerNote ?? "Made with care ✳")}</small></footer></div>`;
}

export const SITE_CSS = `
.built-site{position:relative;--site-accent:#bd5e47;--site-paper:#faf5ef;--site-ink:#2f302d;--site-muted:#6f7268;background:var(--site-paper);color:var(--site-ink);font-family:Arial,Helvetica,sans-serif;line-height:1.55;min-height:100%;overflow:hidden}.built-site *{box-sizing:border-box}.built-site a{color:inherit;text-decoration:none}.built-site h1,.built-site h2,.built-site h3,.built-site p{margin-top:0}.built-site.font-editorial h1,.built-site.font-editorial h2,.built-site.font-editorial h3{font-family:Georgia,'Times New Roman',serif;font-weight:500}.built-site.font-playful h1,.built-site.font-playful h2,.built-site.font-playful h3{font-family:'Trebuchet MS',Arial,sans-serif;letter-spacing:-.03em}.site-nav{min-height:82px;padding:20px 6%;display:flex;align-items:center;gap:28px;border-bottom:1px solid color-mix(in srgb,var(--site-ink) 12%,transparent)}.site-brand{display:flex;align-items:center;gap:9px;font-size:17px;white-space:nowrap}.site-brand span{color:var(--site-accent);font-size:28px;line-height:1}.site-nav nav{display:flex;gap:25px;margin-left:auto;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.site-nav nav a:hover{color:var(--site-accent)}.nav-tagline{display:none;color:var(--site-muted);font-size:12px}.built-section{padding:90px 8%;position:relative;scroll-margin-top:20px}.section-blank{min-height:320px}.site-eyebrow{font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--site-accent);margin-bottom:20px}.built-section h1{font-size:clamp(44px,6vw,92px);line-height:1.05;letter-spacing:-.055em;margin-bottom:26px}.built-section h2{font-size:clamp(34px,4vw,62px);line-height:1.13;letter-spacing:-.045em;margin-bottom:20px}.built-section h3{font-size:24px;line-height:1.2;margin-bottom:10px}.site-body{color:var(--site-muted);font-size:16px;max-width:580px;line-height:1.8}.site-button{display:inline-flex;align-items:center;gap:24px;background:var(--site-accent);color:white!important;padding:15px 21px;border-radius:3px;font-size:13px;font-weight:700;margin-top:17px}.site-button:hover{filter:brightness(.92)}.section-hero{padding-top:95px;padding-bottom:95px}.site-content{display:grid;grid-template-columns:1.05fr .95fr;gap:8%;align-items:center}.hero-art{height:445px;position:relative;border-radius:48% 48% 4px 4px;background:color-mix(in srgb,var(--site-accent) 20%,white);display:flex;align-items:center;justify-content:center;overflow:hidden}.hero-art img{width:100%;height:100%;object-fit:cover}.art-shape{display:block;width:58%;height:68%;background:var(--site-accent);opacity:.72;box-shadow:35px 25px 0 color-mix(in srgb,var(--site-accent) 35%,white);transform:rotate(-13deg);border-radius:45% 50% 40% 48%}.art-shape-1{border-radius:12% 68% 28% 63%;transform:rotate(19deg)}.art-shape-2{border-radius:60% 15% 67% 20%;transform:rotate(-22deg)}.art-shape-3{border-radius:20% 45% 15% 70%;transform:rotate(8deg)}.art-label{position:absolute;bottom:24px;right:20px;background:var(--site-paper);font-size:9px;font-weight:800;letter-spacing:.18em;padding:10px 12px}.section-intro{background:white}.intro-grid{display:grid;grid-template-columns:1fr 1fr;gap:13%;align-items:start}.intro-scribble{display:block;color:var(--site-accent);font-size:100px;line-height:1;margin-top:30px}.site-section-heading{max-width:680px;margin:0 auto 44px;text-align:center}.site-section-heading .site-body{margin-inline:auto}.card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:19px}.site-card{min-width:0}.card-art{height:240px;background:color-mix(in srgb,var(--site-accent) 14%,white);display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:19px}.card-art img{height:100%;width:100%;object-fit:cover}.card-art .art-shape{width:45%;height:58%}.site-card h3{font-size:21px;margin-bottom:7px}.site-card p{color:var(--site-muted);font-size:13px;line-height:1.65}.card-number{display:inline-block;color:var(--site-accent);font-size:12px;letter-spacing:.14em;border-top:1px solid var(--site-accent);padding-top:14px;width:100%;margin-bottom:22px}.section-features,.section-events{background:white}.event-grid{grid-template-columns:repeat(2,1fr)}.event-grid .site-card{border:1px solid color-mix(in srgb,var(--site-ink) 13%,transparent);padding:26px}.section-cta{background:var(--site-accent);color:white;display:flex;justify-content:space-between;align-items:center;gap:20px}.section-cta .site-eyebrow,.section-cta .site-body{color:white;opacity:.82}.section-cta .site-button{background:white;color:var(--site-accent)!important}.cta-star{font-size:170px;line-height:1;opacity:.22}.site-footer{padding:38px 8%;display:flex;align-items:center;gap:15px;font-size:12px}.site-footer strong{font-size:16px}.site-footer span{color:var(--site-muted)}.site-footer small{margin-left:auto;color:var(--site-muted)}
@media(max-width:800px){.site-nav{min-height:65px;padding:16px 6%}.site-nav nav{gap:12px}.built-section{padding:65px 6%}.site-content{grid-template-columns:1fr;gap:45px}.hero-art{height:310px}.intro-grid{grid-template-columns:1fr;gap:12px}.intro-scribble{font-size:70px}.card-grid{grid-template-columns:1fr 1fr}.card-art{height:190px}.cta-star{display:none}}
@media(max-width:540px){.site-nav nav{display:none}.nav-tagline{display:block;margin-left:auto}.built-section{padding:55px 6%}.built-section h1{font-size:48px}.built-section h2{font-size:37px}.hero-art{height:290px}.card-grid,.event-grid{grid-template-columns:1fr}.card-art{height:240px}.site-footer{flex-wrap:wrap}.site-footer small{margin-left:0}}
.built-site .site-nav,.built-site .site-footer{padding-inline:max(6%,calc((100% - var(--content-width))/2))}.built-site .built-section{padding:var(--section-space) max(6%,calc((100% - var(--content-width))/2))}.built-site .spacing-compact{padding-block:calc(var(--section-space) * .6)}.built-site .spacing-roomy{padding-block:calc(var(--section-space) * 1.4)}.built-site .built-section h1{font-size:clamp(34px,calc(6vw * var(--heading-scale)),130px)}.built-site .built-section h2{font-size:clamp(28px,calc(4vw * var(--heading-scale)),92px)}.built-site .hero-art,.built-site .card-art,.built-site .site-card,.built-site .site-button{border-radius:var(--corner-radius)}.built-site .align-center{text-align:center}.built-site .align-center .site-body{margin-inline:auto}.built-site .align-center .site-content>div:first-child{margin-inline:auto}.built-site.button-outline .site-button{background:transparent;border:2px solid var(--site-accent);color:var(--site-accent)!important}.built-site.button-pill .site-button{border-radius:999px}.built-site .section-cta.button-outline .site-button{border-color:white;color:white!important}.plugin-faq{max-width:760px;margin:auto}.plugin-faq details{border-bottom:1px solid color-mix(in srgb,var(--site-ink) 18%,transparent);padding:20px 0}.plugin-faq summary{cursor:pointer;font-size:18px;font-weight:700}.plugin-faq details p{color:var(--site-muted);line-height:1.7;margin:14px 0 0}.plugin-quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}.plugin-quotes blockquote{margin:0;padding:28px;border:1px solid color-mix(in srgb,var(--site-ink) 15%,transparent);border-radius:var(--corner-radius);background:color-mix(in srgb,var(--site-accent) 7%,white)}.plugin-quotes blockquote p{font-size:18px;line-height:1.5}.plugin-quotes cite{color:var(--site-accent);font-size:12px;font-style:normal;font-weight:700}.section-plugin .site-content{min-height:320px}.section-plugin .site-button{margin-top:24px}@media(max-width:540px){.built-site .built-section{padding-inline:6%}.built-site .built-section h1{font-size:clamp(34px,calc(11vw * var(--heading-scale)),65px)}.built-site .built-section h2{font-size:clamp(28px,calc(8vw * var(--heading-scale)),48px)}}
.built-site .section-intro,.built-site .section-features,.built-site .section-events{background:color-mix(in srgb,var(--site-paper) 92%,var(--site-ink) 8%)}.built-site .plugin-quotes blockquote{background:color-mix(in srgb,var(--site-accent) 7%,var(--site-paper))}.built-site.button-outline .section-cta .site-button{border-color:white;color:white!important}
.built-site .site-logo{display:block;width:32px;height:32px;object-fit:contain;flex:none}
.built-site .link-grid{display:grid;gap:14px;max-width:760px;margin:auto}.built-site .link-card{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:20px 24px;border:1px solid color-mix(in srgb,var(--site-ink) 20%,transparent);border-radius:var(--corner-radius);background:color-mix(in srgb,var(--site-paper) 85%,white)}.built-site .link-card:hover{border-color:var(--site-accent);transform:translateY(-2px)}.built-site .link-card strong{font-size:18px}.built-site .link-card span{grid-column:1;color:var(--site-muted);font-size:13px}.built-site .link-card b{grid-column:2;grid-row:1/3;align-self:center;color:var(--site-accent);font-size:20px}
.site-decoration{position:absolute;z-index:1;overflow:visible;pointer-events:none}.site-canvas-object{position:absolute;z-index:2;display:flex;align-items:center;justify-content:center;overflow:visible;box-sizing:border-box}.canvas-object-text{padding:4px 8px}.canvas-object-text.preset-frame-badge{border-radius:999px}.text-object-content{display:block;width:100%;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.2}.preset-heading{font-weight:800;letter-spacing:-.055em;line-height:1.02}.preset-subheading{font-weight:600;letter-spacing:-.025em}.preset-caption{font-weight:400;line-height:1.5}.preset-label{font-weight:800;letter-spacing:.18em;text-transform:uppercase}.preset-badge{width:auto;padding:8px 16px;border-radius:999px;font-weight:800;text-align:center}.canvas-object-image{overflow:hidden;background:#e3e3e3}.canvas-object-image img{display:block;width:100%;height:100%;object-fit:cover}.image-object-empty{display:grid;width:100%;height:100%;place-items:center;padding:14px;background:linear-gradient(135deg,#e9e9e9,#d3d3d3);color:#555;font-size:13px;text-align:center}
.canvas-object-model3d{flex-direction:column;gap:8px;background:color-mix(in srgb,var(--site-paper) 85%,var(--site-ink) 15%);border-radius:8px;perspective:500px}.model3d-preview{position:relative;width:100%;height:75%;display:grid;place-items:center;transform-style:preserve-3d;pointer-events:none}.model3d-cube{position:relative;width:92px;height:92px;transform-style:preserve-3d;transform:rotateX(var(--model-x)) rotateY(var(--model-y)) scale(var(--model-scale))}.model3d-face{position:absolute;inset:0;background-size:cover;background-position:center;backface-visibility:hidden;border:1px solid #0002}.model3d-front{transform:translateZ(46px)}.model3d-back{transform:rotateY(180deg) translateZ(46px)}.model3d-left{transform:rotateY(-90deg) translateZ(46px)}.model3d-right{transform:rotateY(90deg) translateZ(46px)}.model3d-top{transform:rotateX(90deg) translateZ(46px)}.model3d-bottom{transform:rotateX(-90deg) translateZ(46px)}.model3d-caption{color:var(--site-muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90%;pointer-events:none}
.canvas-object-model3d{overflow:visible;background:transparent}.model3d-viewer{position:relative;display:block;width:100%;height:100%;min-width:24px;min-height:24px;overflow:hidden;background:transparent}.model3d-canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}.model3d-canvas:active{cursor:grabbing}.model3d-message{position:absolute;inset:0;display:grid;place-items:center;padding:10px;color:var(--site-muted);font:12px Arial,sans-serif;text-align:center;pointer-events:none}.model3d-viewer.model3d-ready .model3d-message{display:none}.model3d-editor-help{position:absolute;right:4px;bottom:4px;padding:2px 5px;border-radius:4px;background:#111b;color:#fff;font:9px Arial,sans-serif;pointer-events:none;opacity:0;transition:opacity .15s}.editor-canvas-object.canvas-object-model3d:hover .model3d-editor-help{opacity:1}
.built-site .motion-screen{transform-origin:center;will-change:transform,filter,opacity}.built-site .site-decoration.motion-enabled,.built-site .site-canvas-object.motion-enabled{pointer-events:auto}.built-site .motion-screen.motion-position-active{transform:translate(calc(-50% + var(--motion-current-x,0px)),calc(-50% + var(--motion-current-y,0px))) rotate(calc(var(--base-rotation,0deg) + var(--motion-current-rotation,0deg))) scale(var(--motion-current-scale-x,1),var(--motion-current-scale-y,1))!important;filter:hue-rotate(var(--motion-current-hue,0deg));opacity:var(--motion-current-opacity,1)!important}
.built-site .site-motion{animation:wf-motion var(--motion-duration,2s) ease-in-out infinite alternate}@keyframes wf-motion{from{translate:0 0;scale:1 1;rotate:0deg;filter:hue-rotate(0deg);opacity:var(--motion-opacity-start,1)}to{translate:var(--motion-x,0px) var(--motion-y,0px);scale:var(--motion-scale-x,1) var(--motion-scale-y,1);rotate:var(--motion-rotation,0deg);filter:hue-rotate(var(--motion-hue,0deg));opacity:var(--motion-opacity-end,1)}}@media(prefers-reduced-motion:reduce){.built-site .site-motion{animation:none}}
`;

export function mountModelViewers(root = document) {
  const cache = mountModelViewers.meshCache || (mountModelViewers.meshCache = new Map());
  const parse = (format, dataUrl, resourceJson = "{}") => {
    if (!dataUrl || !dataUrl.startsWith("data:") || !dataUrl.includes(",")) throw new Error("Add a supported 3D model file.");
    const bytes = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(",") + 1)), character => character.charCodeAt(0));
    const vertices = [], triangles = [], triangleMaterials = [], maxTriangles = 50000;
    let textures = [];
    let suppliedResources = {};
    try { suppliedResources = JSON.parse(resourceJson || "{}"); } catch { suppliedResources = {}; }
    const resourceEntries = Object.entries(suppliedResources).map(([name, source]) => [name.replaceAll("\\", "/").split("/").pop().toLowerCase(), source]).filter(([, source]) => typeof source === "string" && source.startsWith("data:") && source.includes(","));
    const findResource = name => { const key = String(name || "").replaceAll("\\", "/").split("/").pop().toLowerCase(); return resourceEntries.find(([candidate]) => candidate === key)?.[1] || null; };
    const mapFilename = value => {
      const tokens = value.match(/"[^"]+"|'[^']+'|\S+/g) || [];
      const numeric = token => /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(token);
      const fixedArguments = { "-mm": 2, "-blendu": 1, "-blendv": 1, "-boost": 1, "-texres": 1, "-clamp": 1, "-bm": 1, "-imfchan": 1, "-type": 1, "-cc": 1 };
      let index = 0;
      while (index < tokens.length && tokens[index].startsWith("-")) {
        const option = tokens[index++].toLowerCase();
        if (["-o", "-s", "-t"].includes(option)) {
          let consumed = 0;
          while (consumed < 3 && index < tokens.length && numeric(tokens[index])) { index++; consumed++; }
        } else if (fixedArguments[option]) index += fixedArguments[option];
      }
      return tokens.slice(index).join(" ").replace(/^['"]|['"]$/g, "");
    };
    const bytesFromDataUrl = source => Uint8Array.from(atob(source.slice(source.indexOf(",") + 1)), character => character.charCodeAt(0));
    const textFromDataUrl = source => new TextDecoder().decode(bytesFromDataUrl(source));
    const asDataUrl = (mime, data) => { let binary = ""; for (let offset = 0; offset < data.length; offset += 0x8000) binary += String.fromCharCode(...data.subarray(offset, offset + 0x8000)); return `data:${mime};base64,${btoa(binary)}`; };
    const addTriangle = (a, b, c, material = null) => {
      if (triangles.length >= maxTriangles * 3) throw new Error("This model has too many faces for the built-in viewer. Reduce it to 50,000 triangles or fewer and try again.");
      triangles.push(a, b, c);
      triangleMaterials.push(material);
    };
    if (format === "obj") {
      const points = [], pointColors = [], texcoords = [], faceRecords = [], materialLibraries = new Set();
      const source = new TextDecoder().decode(bytes);
      const sourceLines = source.split(/\r?\n/);
      sourceLines.forEach(line => { const trimmed = line.trim(); if (trimmed.startsWith("mtllib ")) (trimmed.slice(7).match(/"[^"]+"|'[^']+'|\S+/g) || []).forEach(name => materialLibraries.add(name.replace(/^['"]|['"]$/g, ""))); });
      const materials = new Map();
      for (const [resourceName] of resourceEntries) if (resourceName.endsWith(".mtl")) materialLibraries.add(resourceName);
      for (const library of materialLibraries) {
        const materialSource = findResource(library);
        if (!materialSource) continue;
        let current = null;
        for (const rawLine of textFromDataUrl(materialSource).split(/\r?\n/)) {
          const line = rawLine.trim();
          if (line.startsWith("newmtl ")) { current = { name: line.slice(7).trim(), color: [1, 1, 1, 1], textureId: null }; materials.set(current.name, current); }
          else if (current && line.startsWith("Kd ")) { const values = line.slice(3).trim().split(/\s+/).slice(0, 3).map(Number); if (values.length === 3 && values.every(Number.isFinite)) current.color = [...values.map(value => Math.max(0, Math.min(1, value))), current.color[3]]; }
          else if (current && /^(?:d|Tr)\s/.test(line)) { const value = Number(line.replace(/^(?:d|Tr)\s+/, "")); if (Number.isFinite(value)) current.color[3] = Math.max(0, Math.min(1, line.startsWith("Tr ") ? 1 - value : value)); }
          else if (current && line.startsWith("map_Kd ")) {
            const mapValue = line.slice(7).trim(), textureName = mapFilename(mapValue);
            const imageSource = findResource(textureName) || findResource(mapValue);
            if (imageSource) { current.textureId = `obj:${textureName.toLowerCase()}`; if (!textures.some(texture => texture.id === current.textureId)) textures.push({ id: current.textureId, source: imageSource, uvWidth: 1, uvHeight: 1 }); }
          }
        }
      }
      let activeMaterial = "";
      const resolveIndex = (raw, length) => { const index = Number.parseInt(raw, 10); return Number.isInteger(index) ? (index < 0 ? length + index : index - 1) : -1; };
      for (const line of source.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("v ")) {
          const values = trimmed.split(/\s+/).slice(1).map(Number);
          if (values.length >= 3 && values.slice(0, 3).every(Number.isFinite)) {
            if (points.length >= 200000) throw new Error("This OBJ has too many vertices for the built-in viewer.");
            points.push(values.slice(0, 3));
            if (values.length >= 6 && values.slice(3, 6).every(Number.isFinite)) { const rgb = values.slice(3, 6), scale = Math.max(...rgb) > 1 ? 255 : 1; pointColors.push([...rgb.map(value => Math.max(0, Math.min(1, value / scale))), values.length > 6 && Number.isFinite(values[6]) ? Math.max(0, Math.min(1, values[6] / scale)) : 1]); } else pointColors.push(null);
          }
        } else if (trimmed.startsWith("vt ")) {
          const values = trimmed.split(/\s+/).slice(1, 3).map(Number); if (values.length === 2 && values.every(Number.isFinite)) texcoords.push([values[0], 1 - values[1]]);
        } else if (trimmed.startsWith("usemtl ")) {
          activeMaterial = trimmed.slice(7).trim();
        } else if (trimmed.startsWith("f ")) {
          const corners = trimmed.slice(2).trim().split(/\s+/).map(token => { const [v, vt] = token.split("/"); return { vertex: resolveIndex(v, points.length), uv: resolveIndex(vt, texcoords.length) }; }).filter(corner => corner.vertex >= 0 && corner.vertex < points.length);
          for (let i = 1; i + 1 < corners.length; i++) faceRecords.push({ corners: [corners[0], corners[i], corners[i + 1]], materialName: activeMaterial });
        }
      }
      for (const point of points) vertices.push(point);
      for (const record of faceRecords) {
        const sourceMaterial = materials.get(record.materialName), colors = record.corners.map(corner => pointColors[corner.vertex]).filter(Boolean);
        let vertexColor = null;
        if (colors.length) vertexColor = colors[0].map((_, channel) => colors.reduce((sum, color) => sum + color[channel], 0) / colors.length);
        const materialColor = sourceMaterial?.color || null;
        const combinedColor = vertexColor ? vertexColor.map((value, channel) => value * (materialColor?.[channel] ?? 1)) : materialColor;
        const uvs = record.corners.map(corner => texcoords[corner.uv]).filter(Boolean);
        const material = sourceMaterial?.textureId && uvs.length === 3 ? { textureId: sourceMaterial.textureId, uvs, color: combinedColor, alpha: sourceMaterial.color[3] } : (combinedColor ? { color: combinedColor, alpha: sourceMaterial?.color?.[3] ?? 1 } : null);
        addTriangle(record.corners[0].vertex, record.corners[1].vertex, record.corners[2].vertex, material);
      }
    } else if (format === "stl") {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let binary = false;
      if (bytes.byteLength >= 84) {
        const count = view.getUint32(80, true);
        binary = 84 + count * 50 <= bytes.byteLength && count > 0;
        if (binary) {
          const header = new TextDecoder().decode(bytes.subarray(0, 80));
          const colorMarker = header.indexOf("COLOR=");
          const defaultColor = colorMarker >= 0 && colorMarker + 10 <= 80 ? Array.from(bytes.subarray(colorMarker + 6, colorMarker + 10)).slice(0, 3).map(value => value / 255) : null;
          const decode15 = (packed, reverse = false) => {
            const channels = reverse ? [packed & 31, (packed >> 5) & 31, (packed >> 10) & 31] : [(packed >> 10) & 31, (packed >> 5) & 31, packed & 31];
            return channels.map(value => Math.round(value * 255 / 31) / 255);
          };
          for (let face = 0, offset = 84; face < count; face++, offset += 50) {
            const first = vertices.length;
            for (let point = 0; point < 3; point++) {
              const start = offset + 12 + point * 12;
              vertices.push([view.getFloat32(start, true), view.getFloat32(start + 4, true), view.getFloat32(start + 8, true)]);
            }
            const attribute = view.getUint16(offset + 48, true), magics = Boolean(defaultColor) && !(attribute & 0x8000);
            const color = magics ? (attribute ? decode15(attribute, true) : defaultColor) : (attribute & 0x8000 ? decode15(attribute) : null);
            addTriangle(first, first + 1, first + 2, color ? { color: [...color, 1] } : null);
          }
        }
      }
      if (!binary) {
        const source = new TextDecoder().decode(bytes);
        const matches = source.matchAll(/vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/gi);
        for (const match of matches) vertices.push([Number(match[1]), Number(match[2]), Number(match[3])]);
        for (let i = 0; i + 2 < vertices.length; i += 3) addTriangle(i, i + 1, i + 2);
      }
    } else if (format === "glb") {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (view.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) throw new Error("This GLB file is not a valid glTF 2.0 binary model.");
      let offset = 12, document = null, binaryChunk = new Uint8Array();
      while (offset + 8 <= view.byteLength) {
        const length = view.getUint32(offset, true), type = view.getUint32(offset + 4, true), begin = offset + 8;
        if (length > view.byteLength - begin) throw new Error("This GLB file is incomplete.");
        const chunk = bytes.subarray(begin, begin + length);
        if (type === 0x4e4f534a) document = JSON.parse(new TextDecoder().decode(chunk).replace(/[\u0000\s]+$/g, ""));
        if (type === 0x004e4942) binaryChunk = chunk;
        offset = begin + length;
      }
      if (!document || !document.meshes?.length || !document.buffers?.length || document.buffers.some(buffer => buffer.uri)) throw new Error("Use a self-contained GLB file with embedded model data.");
      const binaryView = new DataView(binaryChunk.buffer, binaryChunk.byteOffset, binaryChunk.byteLength);
      const gltfImageSources = (document.images || []).map(image => {
        if (typeof image.uri === "string" && image.uri.startsWith("data:image/")) return image.uri;
        if (typeof image.uri === "string") { const externalImage = findResource(image.uri); if (externalImage?.startsWith("data:image/")) return externalImage; }
        const imageView = document.bufferViews?.[image.bufferView];
        if (!imageView || !image.mimeType || !/^image\/(?:png|jpeg|webp|gif|bmp|avif)$/i.test(image.mimeType)) return "";
        const begin = imageView.byteOffset || 0, end = begin + imageView.byteLength;
        return end <= binaryChunk.length ? asDataUrl(image.mimeType, binaryChunk.subarray(begin, end)) : "";
      });
      const gltfTextureIds = (document.textures || []).map((texture, index) => {
        const id = `gltf:${index}`, source = gltfImageSources[texture.source] || "";
        if (source) textures.push({ id, source, uvWidth: 1, uvHeight: 1 });
        return source ? id : null;
      });
      const accessorComponents = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
      const componentInfo = { 5120: [1, "getInt8", true], 5121: [1, "getUint8", false], 5122: [2, "getInt16", true], 5123: [2, "getUint16", false], 5125: [4, "getUint32", false], 5126: [4, "getFloat32", true] };
      const readAccessor = (accessorIndex, maxCount = 150000) => {
        const accessor = document.accessors?.[accessorIndex], bufferView = document.bufferViews?.[accessor?.bufferView], info = componentInfo[accessor?.componentType], components = accessorComponents[accessor?.type];
        if (!accessor || !bufferView || !info || !components || accessor.count > maxCount) return null;
        const [size, getter, signed] = info, elementBytes = size * components, stride = bufferView.byteStride || elementBytes, start = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0), normalized = Boolean(accessor.normalized);
        if (stride < elementBytes || start < 0 || start + Math.max(0, accessor.count - 1) * stride + elementBytes > binaryView.byteLength) return null;
        const values = [];
        for (let index = 0; index < accessor.count; index++) {
          const row = [], elementStart = start + index * stride;
          for (let channel = 0; channel < components; channel++) {
            let value = size === 1 ? binaryView[getter](elementStart + channel) : binaryView[getter](elementStart + channel * size, true);
            if (normalized && accessor.componentType !== 5126) value = signed ? Math.max(value / (2 ** (size * 8 - 1) - 1), -1) : value / (2 ** (size * 8) - 1);
            row.push(value);
          }
          values.push(row);
        }
        return values;
      };
      const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      const multiply = (a, b) => { const out = new Array(16); for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3]; return out; };
      const localMatrix = node => {
        if (node.matrix?.length === 16) return node.matrix;
        const [x, y, z, w] = node.rotation || [0, 0, 0, 1], [sx, sy, sz] = node.scale || [1, 1, 1], [tx, ty, tz] = node.translation || [0, 0, 0];
        return [(1-2*y*y-2*z*z)*sx,(2*x*y+2*w*z)*sx,(2*x*z-2*w*y)*sx,0,(2*x*y-2*w*z)*sy,(1-2*x*x-2*z*z)*sy,(2*y*z+2*w*x)*sy,0,(2*x*z+2*w*y)*sz,(2*y*z-2*w*x)*sz,(1-2*x*x-2*y*y)*sz,0,tx,ty,tz,1];
      };
      const transformedPoint = (position, matrix) => { const [x,y,z] = position; return [matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]]; };
      const emitted = new Set();
      const emitMesh = (meshIndex, matrix) => {
        const mesh = document.meshes[meshIndex]; if (!mesh) return;
        for (const primitive of mesh.primitives || []) {
          if (primitive.mode !== undefined && primitive.mode !== 4) continue;
          const accessor = document.accessors?.[primitive.attributes?.POSITION], positions = readAccessor(primitive.attributes?.POSITION);
          if (!accessor || accessor.componentType !== 5126 || accessor.type !== "VEC3" || !positions) continue;
          const meshIndices = [];
          for (const point of positions) { meshIndices.push(vertices.length); vertices.push(transformedPoint(point, matrix)); }
          const primitiveMaterial = document.materials?.[primitive.material], pbr = primitiveMaterial?.pbrMetallicRoughness || {}, baseColor = Array.isArray(pbr.baseColorFactor) ? pbr.baseColorFactor.slice(0, 4).map(value => Math.max(0, Math.min(1, Number(value) || 0))) : null;
          const textureIndex = pbr.baseColorTexture?.index, textureId = Number.isInteger(textureIndex) ? gltfTextureIds[textureIndex] : null;
          const uvSet = pbr.baseColorTexture?.texCoord ?? 0, uvs = readAccessor(primitive.attributes?.[`TEXCOORD_${uvSet}`]);
          const vertexColors = readAccessor(primitive.attributes?.COLOR_0);
          let sourceLocalIndices = positions.map((_, index) => index);
          if (primitive.indices !== undefined) {
            const indices = document.accessors?.[primitive.indices], readIndices = readAccessor(primitive.indices);
            if (!indices || indices.type !== "SCALAR" || ![5121,5123,5125].includes(indices.componentType) || !readIndices) continue;
            sourceLocalIndices = readIndices.map(row => row[0]);
            if (sourceLocalIndices.some(index => !Number.isInteger(index) || index < 0 || index >= meshIndices.length)) continue;
          }
          for (let i = 0; i + 2 < sourceLocalIndices.length; i += 3) {
            const localIndexes = sourceLocalIndices.slice(i, i + 3), meshVertexIndexes = localIndexes.map(index => meshIndices[index]), triangleIndexes = meshVertexIndexes;
            const triangleColors = vertexColors ? meshVertexIndexes.map(index => vertexColors[index] || [1, 1, 1, 1]) : [];
            const vertexColor = triangleColors.length ? [0, 1, 2, 3].map(channel => triangleColors.reduce((sum, color) => sum + (color[channel] ?? 1), 0) / 3) : null;
            const color = baseColor ? baseColor.map((value, channel) => value * (vertexColor?.[channel] ?? 1)) : vertexColor;
            let material = null;
            if ((textureId && uvs) || color) material = { ...(textureId && uvs ? { textureId, uvs: meshVertexIndexes.map(index => uvs[index] || [0, 0]) } : {}), ...(color ? { color } : {}) };
            addTriangle(triangleIndexes[0], triangleIndexes[1], triangleIndexes[2], material);
          }
        }
      };
      const walk = (nodeIndex, parent, path = new Set()) => { if (path.has(nodeIndex)) return; const node = document.nodes?.[nodeIndex]; if (!node) return; const next = new Set(path); next.add(nodeIndex); const matrix = multiply(parent, localMatrix(node)); if (node.mesh !== undefined) { emitted.add(node.mesh); emitMesh(node.mesh, matrix); } for (const child of node.children || []) walk(child, matrix, next); };
      const scene = document.scenes?.[document.scene || 0];
      if (scene?.nodes?.length) scene.nodes.forEach(index => walk(index, identity()));
      else if (document.nodes?.length) { const childNodes = new Set(document.nodes.flatMap(node => node.children || [])); document.nodes.forEach((node, index) => { if (!childNodes.has(index)) walk(index, identity()); }); }
      if (!vertices.length) document.meshes.forEach((mesh, index) => { if (!emitted.has(index)) emitMesh(index, identity()); });
    } else if (format === "bbmodel") {
      let project;
      try { project = JSON.parse(new TextDecoder().decode(bytes).replace(/^\uFEFF/, "")); }
      catch { throw new Error("This Blockbench file is not valid project JSON."); }
      if (!Array.isArray(project.elements)) throw new Error("This Blockbench project has no model elements.");
      const projectTextures = Array.isArray(project.textures) ? project.textures : [];
      const textureIdByReference = new Map();
      textures = projectTextures.map((texture, index) => {
        const id = String(texture?.uuid || texture?.id || index);
        const source = typeof texture?.source === "string" && /^data:image\/(?:png|jpeg|webp|gif|bmp|avif);base64,/i.test(texture.source) ? texture.source : "";
        const entry = { id, source, uvWidth: Number(texture?.uv_width) || Number(project.texture_width) || Number(project.resolution?.width) || 16, uvHeight: Number(texture?.uv_height) || Number(project.texture_height) || Number(project.resolution?.height) || 16 };
        [texture?.uuid, texture?.id, index].filter(value => value !== undefined && value !== null).forEach(value => textureIdByReference.set(String(value), id));
        return entry;
      });
      const textureReference = face => {
        const reference = face?.texture;
        if (reference === false || reference === null || reference === undefined || reference === "") return textures.length === 1 && textures[0].source ? textures[0].id : null;
        const id = textureIdByReference.get(String(reference));
        return id && textures.find(texture => texture.id === id)?.source ? id : null;
      };
      const elementById = new Map(project.elements.filter(element => element?.uuid).map(element => [String(element.uuid), element]));
      const groupById = new Map((Array.isArray(project.groups) ? project.groups : []).filter(group => group?.uuid).map(group => [String(group.uuid), group]));
      const vec3 = (value, fallback = [0, 0, 0]) => Array.isArray(value) && value.length >= 3 && value.slice(0, 3).every(entry => Number.isFinite(Number(entry))) ? value.slice(0, 3).map(Number) : fallback;
      const rotateAround = (point, origin, rotation) => {
        let [x, y, z] = point.map((value, axis) => value - origin[axis]);
        const [rx, ry, rz] = rotation.map(value => value * Math.PI / 180);
        let nextY = y * Math.cos(rx) - z * Math.sin(rx); let nextZ = y * Math.sin(rx) + z * Math.cos(rx); y = nextY; z = nextZ;
        let nextX = x * Math.cos(ry) + z * Math.sin(ry); nextZ = -x * Math.sin(ry) + z * Math.cos(ry); x = nextX; z = nextZ;
        nextX = x * Math.cos(rz) - y * Math.sin(rz); nextY = x * Math.sin(rz) + y * Math.cos(rz); x = nextX; y = nextY;
        return [x + origin[0], y + origin[1], z + origin[2]];
      };
      const transform = (point, element, ancestors) => {
        const origin = vec3(element.origin, [0, 0, 0]), stretch = vec3(element.stretch, [1, 1, 1]);
        let result = point.map((value, axis) => origin[axis] + (value - origin[axis]) * stretch[axis]);
        result = rotateAround(result, origin, vec3(element.rotation));
        for (const group of ancestors) result = rotateAround(result, vec3(group.origin), vec3(group.rotation));
        return result;
      };
      const emitPolygon = (points, element, ancestors, face) => {
        if (points.length < 3) return;
        if (vertices.length + points.length > 200000) throw new Error("This Blockbench model has too much geometry for the built-in viewer.");
        const start = vertices.length;
        points.forEach(point => vertices.push(transform(point, element, ancestors)));
        const rect = Array.isArray(face?.uv) && face.uv.length >= 4 ? face.uv.slice(0, 4).map(Number) : null;
        let uvCorners = rect?.every(Number.isFinite) ? [[rect[0],rect[1]],[rect[2],rect[1]],[rect[2],rect[3]],[rect[0],rect[3]]] : null;
        if (uvCorners && Number.isFinite(Number(face.rotation))) {
          const turns = ((Math.round(Number(face.rotation) / 90) % 4) + 4) % 4;
          uvCorners = uvCorners.map((_, index) => uvCorners[(index + turns) % 4]);
        }
        const textureId = textureReference(face);
        for (let index = 1; index + 1 < points.length; index++) {
          const material = textureId && uvCorners ? { textureId, uvs: [uvCorners[0], uvCorners[index], uvCorners[index + 1]] } : null;
          addTriangle(start, start + index, start + index + 1, material);
        }
      };
      const processed = new Set();
      const emitElement = (element, ancestors = []) => {
        if (!element || (element.uuid && processed.has(String(element.uuid)))) return;
        if (element.uuid) processed.add(String(element.uuid));
        if (element.visibility === false || ancestors.some(group => group.visibility === false)) return;
        if (Array.isArray(element.from) && Array.isArray(element.to)) {
          const inflate = Number.isFinite(Number(element.inflate)) ? Number(element.inflate) : 0;
          const from = vec3(element.from).map(value => value - inflate), to = vec3(element.to).map(value => value + inflate);
          const [x0, y0, z0] = from, [x1, y1, z1] = to;
          const faces = [
            ["north", [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]]], ["south", [[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1]]],
            ["east", [[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]]], ["west", [[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1]]],
            ["up", [[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0]]], ["down", [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]]
          ];
          const savedFaces = element.faces && typeof element.faces === "object" ? element.faces : {};
          faces.forEach(([name, points]) => { if (savedFaces[name] && savedFaces[name].enabled !== false) emitPolygon(points, element, ancestors, savedFaces[name]); });
        } else if (element.type === "mesh" && element.vertices && element.faces) {
          const keys = Object.keys(element.vertices), indexByKey = new Map();
          if (vertices.length + keys.length > 200000) throw new Error("This Blockbench model has too much geometry for the built-in viewer.");
          keys.forEach(key => { const point = vec3(element.vertices[key], [NaN, NaN, NaN]); if (point.every(Number.isFinite)) { indexByKey.set(key, vertices.length); vertices.push(transform(point, element, ancestors)); } });
          Object.values(element.faces).forEach(face => {
            const keysForFace = Array.isArray(face?.vertices) ? face.vertices.map(String) : [];
            const faceVertices = keysForFace.map(key => ({ key, index: indexByKey.get(key) })).filter(vertex => Number.isInteger(vertex.index));
            const indices = faceVertices.map(vertex => vertex.index);
            const textureId = textureReference(face);
            const uvByKey = face?.uv && typeof face.uv === "object" ? face.uv : {};
            for (let index = 1; index + 1 < indices.length; index++) {
              const vertexOffsets = [0, index, index + 1];
              const uvValues = vertexOffsets.map(offset => uvByKey[faceVertices[offset].key]);
              const uvs = uvValues.every(value => Array.isArray(value) && value.length >= 2 && value.slice(0, 2).every(entry => Number.isFinite(Number(entry)))) ? uvValues.map(value => value.slice(0, 2).map(Number)) : null;
              addTriangle(indices[0], indices[index], indices[index + 1], textureId && uvs ? { textureId, uvs } : null);
            }
          });
        }
      };
      const walk = (node, ancestors = [], path = new Set()) => {
        const id = typeof node === "string" ? node : String(node?.uuid || "");
        if (id && elementById.has(id)) { emitElement(elementById.get(id), ancestors); return; }
        const group = (id && groupById.get(id)) || (node && typeof node === "object" ? node : null);
        if (!group || !Array.isArray(group.children)) return;
        const cycleKey = id || group;
        if (path.has(cycleKey)) return;
        const nextPath = new Set(path); nextPath.add(cycleKey);
        const nextAncestors = [{ origin: vec3(group.origin), rotation: vec3(group.rotation), visibility: group.visibility }, ...ancestors];
        group.children.forEach(child => walk(child, nextAncestors, nextPath));
      };
      if (Array.isArray(project.outliner)) project.outliner.forEach(node => walk(node));
      project.elements.forEach(element => { if (!element?.uuid || !processed.has(String(element.uuid))) emitElement(element); });
    } else throw new Error("Unsupported model type. Choose OBJ, STL, GLB, or Blockbench BBMODEL.");
    if (vertices.length < 3 || triangles.length < 3) throw new Error("No triangle mesh was found in that file.");
    if (vertices.some(point => !point.every(Number.isFinite))) throw new Error("This model contains invalid vertex positions.");
    const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
    vertices.forEach(point => point.forEach((value, axis) => { low[axis] = Math.min(low[axis], value); high[axis] = Math.max(high[axis], value); }));
    const center = low.map((value, axis) => (value + high[axis]) / 2), span = Math.max(...high.map((value, axis) => value - low[axis]), .0001), factor = 1.7 / span;
    return { vertices: vertices.map(point => point.map((value, axis) => (value - center[axis]) * factor)), triangles, triangleMaterials, textures };
  };
  root.querySelectorAll(".model3d-viewer").forEach(stage => {
    if (stage.dataset.modelReady === "true") return;
    const canvas = stage.querySelector(".model3d-canvas"), context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let mesh;
    try {
      const resourceJson = stage.dataset.modelResources || "{}";
      let resourceHash = 2166136261; for (let index = 0; index < resourceJson.length; index++) resourceHash = Math.imul(resourceHash ^ resourceJson.charCodeAt(index), 16777619);
      const key = `${stage.dataset.modelData}:${resourceHash >>> 0}`;
      mesh = cache.get(key);
      if (!mesh) { mesh = parse(stage.dataset.modelFormat, stage.dataset.modelData, resourceJson); cache.set(key, mesh); }
    } catch (error) { const message = stage.querySelector(".model3d-message"); if (message) message.textContent = error.message || "Could not load the 3D model."; stage.dataset.modelReady = "error"; return; }
    stage.dataset.modelReady = "true"; stage.classList.add("model3d-ready");
    let yawDegrees = Number(stage.dataset.modelRotateY), pitchDegrees = Number(stage.dataset.modelRotateX);
    let yaw = (Number.isFinite(yawDegrees) ? yawDegrees : -28) * Math.PI / 180, pitch = (Number.isFinite(pitchDegrees) ? pitchDegrees : 18) * Math.PI / 180, dragging = null, frame = 0;
    const textureImages = new Map();
    const textureDefinitions = new Map((mesh.textures || []).map(texture => [texture.id, texture]));
    const draw = () => {
      frame = 0;
      const ratio = Math.min(window.devicePixelRatio || 1, 2), width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
      const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
      context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height);
      const factor = Math.min(width, height) * .44 * Math.max(.2, Math.min(3, Number(stage.dataset.modelScale) || 1));
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch), camera = 3.6;
      const projected = mesh.vertices.map(([x,y,z]) => { const rx = x * cy + z * sy, rz = -x * sy + z * cy, ry = y * cx - rz * sx, depth = y * sx + rz * cx, perspective = camera / Math.max(.7, camera - depth); return [width / 2 + rx * factor * perspective, height / 2 - ry * factor * perspective, depth]; });
      const faces = [];
      for (let i = 0; i + 2 < mesh.triangles.length; i += 3) { const a = projected[mesh.triangles[i]], b = projected[mesh.triangles[i + 1]], c = projected[mesh.triangles[i + 2]]; if (!a || !b || !c) continue; const ux = b[0]-a[0], uy = b[1]-a[1], vx = c[0]-a[0], vy = c[1]-a[1]; if (Math.abs(ux*vy-uy*vx) < .08) continue; faces.push({a,b,c,depth:(a[2]+b[2]+c[2])/3,material:mesh.triangleMaterials?.[i/3],area:ux*vy-uy*vx}); }
      faces.sort((a,b) => a.depth - b.depth);
      const color = /^#[0-9a-f]{6}$/i.test(stage.dataset.modelColor) ? stage.dataset.modelColor : "#ed7418", red=parseInt(color.slice(1,3),16), green=parseInt(color.slice(3,5),16), blue=parseInt(color.slice(5,7),16);
      faces.forEach(face => {
        const ux=face.b[0]-face.a[0], uy=face.b[1]-face.a[1], uz=face.b[2]-face.a[2], vx=face.c[0]-face.a[0], vy=face.c[1]-face.a[1], vz=face.c[2]-face.a[2], nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx, length=Math.hypot(nx,ny,nz)||1, light=Math.max(.28,Math.min(1,.4+.6*Math.abs((nx*.35+ny*-.45+nz*.82)/length))), shade=value=>Math.round(value*light);
        context.beginPath(); context.moveTo(face.a[0],face.a[1]); context.lineTo(face.b[0],face.b[1]); context.lineTo(face.c[0],face.c[1]); context.closePath();
        const image = face.material ? textureImages.get(face.material.textureId) : null, texture = face.material ? textureDefinitions.get(face.material.textureId) : null, authoredColor = face.material?.color;
        let textured = false;
        if (image?.complete && image.naturalWidth && texture && face.material.uvs?.length === 3) {
          const uv = face.material.uvs.map(([u,v]) => [u * image.naturalWidth / Math.max(1, texture.uvWidth || image.naturalWidth), v * image.naturalHeight / Math.max(1, texture.uvHeight || image.naturalHeight)]);
          const [s0,s1,s2] = uv, [d0,d1,d2] = [face.a,face.b,face.c], determinant=(s1[0]-s0[0])*(s2[1]-s0[1])-(s2[0]-s0[0])*(s1[1]-s0[1]);
          if (Math.abs(determinant) > .0001) {
            const a=((d1[0]-d0[0])*(s2[1]-s0[1])-(d2[0]-d0[0])*(s1[1]-s0[1]))/determinant, c=((s1[0]-s0[0])*(d2[0]-d0[0])-(s2[0]-s0[0])*(d1[0]-d0[0]))/determinant;
            const b=((d1[1]-d0[1])*(s2[1]-s0[1])-(d2[1]-d0[1])*(s1[1]-s0[1]))/determinant, d=((s1[0]-s0[0])*(d2[1]-d0[1])-(s2[0]-s0[0])*(d1[1]-d0[1]))/determinant;
            const e=d0[0]-a*s0[0]-c*s0[1], f=d0[1]-b*s0[0]-d*s0[1];
            context.save(); context.clip(); context.globalAlpha = Math.max(0, Math.min(1, authoredColor?.[3] ?? face.material.alpha ?? 1)); context.setTransform(ratio*a,ratio*b,ratio*c,ratio*d,ratio*e,ratio*f); context.imageSmoothingEnabled=stage.dataset.modelPixelArt !== "true"; context.drawImage(image,0,0);
            if (authoredColor && authoredColor.slice(0, 3).some(value => Math.abs(value - 1) > .001)) { context.globalCompositeOperation = "multiply"; context.fillStyle = `rgb(${authoredColor.slice(0, 3).map(value => Math.round(Math.max(0, Math.min(1, value)) * 255)).join(" ")})`; context.fillRect(0, 0, image.naturalWidth, image.naturalHeight); }
            context.restore(); textured = true;
          }
        }
        if (!textured) { const rgb = authoredColor?.length >= 3 ? authoredColor.slice(0, 3).map(value => Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 255)) : [red, green, blue]; context.fillStyle = `rgba(${shade(rgb[0])} ${shade(rgb[1])} ${shade(rgb[2])} / ${Math.max(0, Math.min(1, authoredColor?.[3] ?? face.material?.alpha ?? 1))})`; context.fill(); }
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    (mesh.textures || []).forEach(texture => {
      if (!texture.source || textureImages.has(texture.id)) return;
      const image = new Image(); image.onload = schedule; image.onerror = schedule; image.src = texture.source; textureImages.set(texture.id, image);
    });
    canvas.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.shiftKey) return;
      event.preventDefault(); event.stopPropagation();
      const objectId = stage.closest("[data-object-id]")?.dataset.objectId;
      dragging = { x: event.clientX, y: event.clientY, yaw, pitch, moved: false, objectId, selected: Boolean(stage.closest(".canvas-object-selected")) };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", event => { if (!dragging) return; const dx=event.clientX-dragging.x, dy=event.clientY-dragging.y; if (Math.abs(dx)+Math.abs(dy)>2) dragging.moved=true; yaw=dragging.yaw+dx*.012; pitch=Math.max(-1.45,Math.min(1.45,dragging.pitch+dy*.012)); schedule(); });
    const finish = () => {
      if (!dragging) return;
      const state = dragging; dragging = null;
      if (state.moved) {
        stage.dataset.modelRotateX = String(pitch * 180 / Math.PI); stage.dataset.modelRotateY = String(yaw * 180 / Math.PI);
        stage.dispatchEvent(new CustomEvent("modelviewchange", { bubbles: true, detail: { rotateX: Number(stage.dataset.modelRotateX), rotateY: Number(stage.dataset.modelRotateY) } }));
      }
      if (!state.selected) stage.dispatchEvent(new CustomEvent("modelselect", { bubbles: true, detail: { objectId: state.objectId } }));
    };
    canvas.addEventListener("pointerup", finish); canvas.addEventListener("pointercancel", finish);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(schedule).observe(stage); else window.addEventListener("resize", schedule, { passive:true });
    schedule();
  });
}

export function exportDocument(site) {
  const modelRuntime = `<script>(${mountModelViewers.toString()})(document);<\/script>`;
  const canvasPositionRuntime = `<script>(()=>{const place=()=>document.querySelectorAll(".built-site").forEach(root=>{const height=root.getBoundingClientRect().height;root.querySelectorAll("[data-canvas-y]").forEach(item=>{item.style.top=height*(Number(item.dataset.canvasY)||0)/100+"px";});});if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",place,{once:true});else place();window.addEventListener("load",place);window.addEventListener("resize",place);})();<\/script>`;
  const motionRuntime = `<script>(()=>{let queued=false;const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));const update=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll(".built-site .motion-screen").forEach(item=>{const root=item.closest(".built-site");if(!root)return;const rootRect=root.getBoundingClientRect();const height=window.innerHeight||document.documentElement.clientHeight||1;const anchorY=rootRect.top+rootRect.height*(Number(item.dataset.canvasY)||0)/100;const centerValue=Number.parseFloat(getComputedStyle(item).getPropertyValue("--motion-center-y"));const centerY=Math.max(0,Math.min(100,Number.isFinite(centerValue)?centerValue:50));const baseY=height*centerY/100;const travel=anchorY<baseY?baseY:height-baseY;const raw=clamp(Math.abs(baseY-anchorY)/Math.max(1,travel),0,1);const eased=raw*raw*(3-2*raw);const speed=Number.parseFloat(getComputedStyle(item).getPropertyValue("--motion-speed"))||1;const progress=Math.pow(eased,1/speed);const value=name=>Number.parseFloat(getComputedStyle(item).getPropertyValue(name))||0;item.style.setProperty("--motion-current-x",String(value("--motion-x")*progress)+"px");item.style.setProperty("--motion-current-y",String(value("--motion-y")*progress)+"px");item.style.setProperty("--motion-current-scale-x",String(1+(value("--motion-scale-x")-1)*progress));item.style.setProperty("--motion-current-scale-y",String(1+(value("--motion-scale-y")-1)*progress));item.style.setProperty("--motion-current-hue",String(value("--motion-hue")*progress)+"deg");item.style.setProperty("--motion-current-rotation",String(value("--motion-rotation")*progress)+"deg");const base=value("--base-opacity");item.style.setProperty("--motion-current-opacity",String(base+(value("--motion-opacity")-base)*progress));item.classList.add("motion-position-active");});});};document.addEventListener("scroll",update,{passive:true,capture:true});window.addEventListener("resize",update,{passive:true});window.addEventListener("load",update);update();})();<\/script>`;
  const icon = safeUrl(site.logoUrl, true);
  const address = safeWebsiteAddress(site.address);
  return `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(site.tagline)}">${icon ? `<link rel="icon" href="${escapeHtml(icon)}">` : ""}${address ? `<link rel="canonical" href="${escapeHtml(address)}">` : ""}<title>${escapeHtml(site.name)}</title><style>body{margin:0}${SITE_CSS}</style></head><body>${renderSite(site)}${site.shapes.length || site.objects.length ? canvasPositionRuntime : ""}${site.objects.some(object => object.type === "model3d") ? modelRuntime : ""}${[...site.shapes, ...site.objects].some(item => normalizeMotion(item.motion).screen && normalizeMotion(item.motion).enabled) ? motionRuntime : ""}</body></html>`;
}
