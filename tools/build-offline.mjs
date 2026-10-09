import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = name => readFile(join(root, name), "utf8");
const [html, css, siteModel, pluginModel, editor, catalog] = await Promise.all([
  read("index.html"), read("styles.css"), read("site-model.js"),
  read("plugin-model.js"), read("script.js"), read("plugins/catalog.json")
]);

const manifestEntries = await Promise.all(JSON.parse(catalog).packs.map(async pack => [pack.manifest, JSON.parse(await read(pack.manifest.replace(/^\//, "")))]));
const builtins = { catalog: JSON.parse(catalog), manifests: Object.fromEntries(manifestEntries) };
const stripModules = source => source.replace(/^import .*;\r?\n/gm, "").replace(/^export /gm, "");
const javascript = [
  `globalThis.websiteForgeBuiltins = ${JSON.stringify(builtins)};`,
  stripModules(siteModel), stripModules(pluginModel), stripModules(editor)
].join("\n");
if (/<\/script/i.test(javascript) || /<\/style/i.test(css)) throw new Error("Inline assets contain an HTML closing tag.");

const output = html
  .replace('    <link rel="stylesheet" href="styles.css" />', `    <style>\n${css}\n    </style>`)
  .replace('    <script type="module" src="script.js"></script>', "")
  .replace("  </body>", `    <script>\n(() => {\n${javascript}\n})();\n    </script>\n  </body>`);
if (output === html || /src="script\.js"|href="styles\.css"/.test(output)) throw new Error("Could not inline builder assets.");
await writeFile(join(root, "offline.html"), output);
console.log("Built offline.html");
