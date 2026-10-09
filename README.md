# WebsiteForge

WebsiteForge is a browser-based website builder for artists and makers. It includes editable sections, five starting templates, detailed design controls, desktop/mobile previews, project import/export, community plugin packs, and an optional OpenAI writing assistant.

## Run without Node.js

Open [`index.html`](index.html) or [`offline.html`](offline.html) directly in a browser. You can double-click either file after cloning or use WebStorm's **Open in Browser** action. The editor, templates, built-in plugins, project backups, and HTML exports work without installing anything. AI writing is unavailable in this mode because it needs a server to protect the API key.

WebStorm may still show its own “Node.js is required” banner. The browser-only builder does not use Node.js; open `index.html` in a browser even if that banner appears.

## Run with AI tools

1. Install Node.js 20 or newer.
2. In this folder, run `node server.mjs`. If npm is installed, `npm start` does the same thing.
3. Open `http://localhost:3000`.

### Run after cloning in WebStorm

If WebStorm shows **“Node.js is required for WebStorm to work correctly”**, click **Download Node.js** and install a supported version (Node.js 22 or 24), or click **Configure Node.js** to select an existing installation. This is a one-time setup on each computer; cloning a Git repository does not install Node.js. See [WebStorm's local Node.js runtime instructions](https://www.jetbrains.com/help/webstorm/developing-node-js-applications.html#local-node-runtime) if WebStorm cannot detect an installed version.

Open the cloned repository folder in WebStorm and select the shared **WebsiteForge** run configuration, then click **Run**. This configuration starts `server.mjs` with the project folder as its working directory. Open `http://localhost:3000` after the Run console says the server is ready. Do not run `index.html` with WebStorm's built-in preview server; that server does not provide WebsiteForge's `/api/settings` and `/api/ai` routes.

No environment variables are required to start the builder. `OPENAI_API_KEY` is optional and only enables the AI writing tools. Each person who clones the repository can enter their own key on the **Settings** page; the key is saved locally and is intentionally excluded from Git. Do not commit an API key or copy someone else's settings file into the repository.

After changing `builder.template.html`, CSS, JavaScript, or built-in plugins, maintainers can regenerate both browser-ready files with `node tools/build-offline.mjs`.

Manual editing, local saving, and exports work without an API key. Project changes are saved in your browser. **Save project** downloads a JSON backup; **Export website** downloads a standalone `index.html` that can be hosted anywhere.

## Customize your site

The **Design** tab controls the full palette, font, content width, section spacing, corner radius, heading scale, and button style. Select any section for its text, images, alignment, spacing, and optional background and text-color overrides. The five templates can be browsed in a visual gallery. The Links section provides editable destination URLs for link hub pages. All site settings are included in the standalone HTML export. Older WebsiteForge project JSON files still import.

## Community plugins

The **Plugins** tab lists packs from `plugins/catalog.json` and accepts a JSON file or HTTPS manifest URL. A community pack can contribute section layouts (`cards`, `faq`, `quote`, or `banner`) and color themes. The built-in **Light mode** pack adds an optional bright theme for the editor; it does not change the exported website. Installed packs are saved in this browser. Added sections are copied into the project, so uninstalling the pack does not break the site or its export. **Share JSON** downloads an installed pack for another creator.

Plugin packs are declarative JSON. They cannot run JavaScript, inject HTML, or include CSS. To publish one in the project catalog, add a manifest to `plugins/` and add its URL to `plugins/catalog.json` in a pull request. See [`plugins/artist-essentials.json`](plugins/artist-essentials.json) for a complete example. The core format is:

```json
{
  "format": "websiteforge-plugin",
  "version": 1,
  "id": "myname.my-pack",
  "name": "My pack",
  "author": "Your name",
  "description": "What it adds",
  "sections": [{
    "id": "my-faq",
    "name": "My FAQ",
    "layout": "faq",
    "defaults": {
      "eyebrow": "HELP",
      "title": "Questions",
      "body": "Find answers below.",
      "items": [{ "title": "A question?", "body": "An answer." }]
    }
  }],
  "themes": [{
    "id": "my-colors",
    "name": "My colors",
    "colors": { "accent": "#ed7418", "paper": "#fff8f1", "ink": "#27272b", "muted": "#66666c" }
  }]
}
```

Community packs need at least one section or theme. Section and theme IDs must be unique within the pack. Image URLs must use HTTPS. Remote hosts must allow browser cross-origin requests for installation by URL. Built-in packs can also expose allowlisted workspace features such as Light mode.

## Enable AI tools

Open **Settings** in the builder, paste your OpenAI API key, and save it. The key is stored in the local `.websiteforge-settings.json` file, which is ignored by Git and is never served or included in project exports. The Settings page only reports whether a key is configured; it does not return the key to the browser.

Alternatively, set `OPENAI_API_KEY` in the environment before starting the server. In PowerShell:

```powershell
$env:OPENAI_API_KEY = "your_api_key"
node server.mjs
```

The default model is `gpt-5-mini`. To choose a different text model, set `OPENAI_MODEL`. A key saved in Settings takes precedence over the environment variable. AI requests are sent from the local Node server; the key is never included in downloaded sites or browser code. Generating a draft sends your description and relevant current site content to OpenAI. Review AI text before publishing.

If AI returns 429, check the message in the builder. It distinguishes a temporary request rate limit from API credit, usage, and spending limits when OpenAI supplies an error code. A saved key does not by itself provide API credits. Check [API Billing](https://platform.openai.com/settings/organization/billing/overview) and [API Limits](https://platform.openai.com/settings/organization/limits) for the organization and project associated with your key.

The server binds to `127.0.0.1` and has no login or hosted storage. It is intended for local development. To host a builder for multiple users, add authentication, rate limiting, persistent storage, and production configuration first.
