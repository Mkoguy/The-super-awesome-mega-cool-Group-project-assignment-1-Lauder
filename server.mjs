import { createServer } from "node:http";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeSite, CORE_SECTION_TYPES } from "./site-model.js";
import { explainOpenAIError } from "./openai-error.js";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
const settingsPath = join(root, ".websiteforge-settings.json");
let savedApiKey = "";
try {
  const settings = JSON.parse(await readFile(settingsPath, "utf8"));
  if (typeof settings.apiKey === "string") savedApiKey = settings.apiKey;
} catch (error) {
  if (error.code !== "ENOENT") console.error("Could not load local settings:", error.message);
}
const apiKey = () => savedApiKey || process.env.OPENAI_API_KEY || "";
const localHost = host => /^(localhost|127\.0\.0\.1):\d+$/.test(host || "");
const sameOrigin = req => localHost(req.headers.host) && req.headers.origin === `http://${req.headers.host}`;
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
  ["/site-model.js", ["site-model.js", "text/javascript; charset=utf-8"]],
  ["/plugin-model.js", ["plugin-model.js", "text/javascript; charset=utf-8"]],
  ["/settings.html", ["settings.html", "text/html; charset=utf-8"]],
  ["/settings.js", ["settings.js", "text/javascript; charset=utf-8"]],
  ["/plugins/catalog.json", ["plugins/catalog.json", "application/json; charset=utf-8"]],
  ["/plugins/artist-essentials.json", ["plugins/artist-essentials.json", "application/json; charset=utf-8"]],
  ["/plugins/light-mode.json", ["plugins/light-mode.json", "application/json; charset=utf-8"]]
]);
const send = (res, status, value) => { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(value)); };
async function readJson(req) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 50000) throw new Error("Request is too large.");
  }
  try { return JSON.parse(data); } catch { throw new Error("Invalid JSON request."); }
}
function extractText(response) {
  return (response.output || []).flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text).join("");
}
async function generate(body) {
  if (!apiKey()) return { status: 503, error: "Add an OpenAI API key in Settings to enable AI tools." };
  const action = body?.action;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "";
  if (!prompt || !["site", "rewrite"].includes(action)) return { status: 400, error: "Choose an AI action and enter a description." };
  let current;
  try { current = normalizeSite(body.site); } catch { return { status: 400, error: "The current project is invalid." }; }
  const selected = current.sections.find(section => section.id === body.selectedId);
  if (action === "rewrite" && !selected) return { status: 400, error: "Select a section to rewrite." };
  const instruction = action === "site"
    ? `Return a JSON object with keys name, tagline, sections. Sections is an array of 3-6 objects. Allowed types: ${CORE_SECTION_TYPES.join(", ")}. Each section has type, eyebrow, title, body, buttonText, buttonUrl, imageUrl, items. Items is an array of objects with title, body, imageUrl, linkUrl. Use empty strings for unknown URLs. Make usable artist or small-business website copy. Do not invent real events, credentials, testimonials, or contact details. Current project name: ${current.name}.`
    : `Return one JSON section object with type exactly "${selected.type}" and fields eyebrow, title, body, buttonText, buttonUrl, imageUrl, items. Preserve factual details and URLs unless the user asks to change them. Do not invent real events, credentials, testimonials, or contact details. Current section: ${JSON.stringify(selected)}.`;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, store: false, input: [{ role: "system", content: `You help users draft websites. Output only valid JSON. ${instruction}` }, { role: "user", content: prompt }], text: { format: { type: "json_object" } }, max_output_tokens: 2500 })
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      const code = failure?.error?.code || failure?.error?.type || "unknown";
      console.error("OpenAI request failed:", response.status, code);
      return { status: response.status === 429 ? 429 : 502, error: explainOpenAIError(response.status, failure) };
    }
    const payload = await response.json();
    if (payload.status === "incomplete") return { status: 502, error: "AI stopped before finishing. Try a shorter description." };
    const draft = JSON.parse(extractText(payload));
    if (action === "site") return { status: 200, site: normalizeSite({ ...draft, theme: current.theme, accent: current.accent, palette: current.palette, design: current.design, font: current.font }) };
    const section = normalizeSite({ ...current, sections: [{ ...selected, ...draft, type: selected.type, id: selected.id }] }).sections[0];
    return { status: 200, section };
  } catch (error) {
    console.error("AI generation failed:", error?.message);
    return { status: 502, error: error?.name === "AbortError" ? "AI timed out. Try again." : "Could not generate a draft. Try again." };
  } finally { clearTimeout(timer); }
}
createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (pathname === "/api/settings") {
    if (!localHost(req.headers.host)) return send(res, 403, { error: "Open the builder from this local server." });
    if (req.method === "GET") return send(res, 200, { configured: Boolean(apiKey()), source: savedApiKey ? "saved" : process.env.OPENAI_API_KEY ? "environment" : null, model });
    if (!sameOrigin(req)) return send(res, 403, { error: "Open Settings from this local server." });
    if (req.method === "POST") {
      if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) return send(res, 415, { error: "Send JSON settings." });
      try {
        const body = await readJson(req);
        const key = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
        if (!/^\S{10,500}$/.test(key)) return send(res, 400, { error: "Enter a valid API key without spaces." });
        await writeFile(settingsPath, JSON.stringify({ apiKey: key }), { mode: 0o600 });
        savedApiKey = key;
        return send(res, 200, { configured: true, source: "saved", model });
      } catch (error) { return send(res, 400, { error: error.message || "Could not save the API key." }); }
    }
    if (req.method === "DELETE") {
      try { await unlink(settingsPath); } catch (error) { if (error.code !== "ENOENT") return send(res, 500, { error: "Could not remove the saved key." }); }
      savedApiKey = "";
      return send(res, 200, { configured: Boolean(apiKey()), source: process.env.OPENAI_API_KEY ? "environment" : null, model });
    }
    return send(res, 405, { error: "Method not allowed." });
  }
  if (pathname === "/api/ai" && req.method === "POST") {
    if (!sameOrigin(req)) return send(res, 403, { error: "Open the builder from this local server." });
    try { const result = await generate(await readJson(req)); const { status, ...body } = result; return send(res, status, body); }
    catch (error) { return send(res, 400, { error: error.message }); }
  }
  if (req.method !== "GET" || !files.has(pathname)) return send(res, 404, { error: "Not found." });
  const [name, type] = files.get(pathname);
  try { const content = await readFile(join(root, name)); res.writeHead(200, { "Content-Type": type, "X-Content-Type-Options": "nosniff" }); res.end(content); }
  catch { send(res, 500, { error: "Could not load file." }); }
}).listen(port, "127.0.0.1", () => console.log(`WebsiteForge is running at http://localhost:${port}`));
