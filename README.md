# WebsiteForge

WebsiteForge is a browser-based website builder for artists and makers. It includes editable sections, five starting templates, detailed design controls, desktop/mobile previews, project import/export, community plugin packs, and an optional OpenAI writing assistant.

## Run

1. Install Node.js 20 or newer.
2. In this folder, run `node server.mjs`. If npm is installed, you can also run the `start` script from `package.json` in WebStorm.
3. Open `http://localhost:3000`.

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

The server binds to `127.0.0.1` and has no login or hosted storage. It is intended for local development. To host a builder for multiple users, add authentication, rate limiting, persistent storage, and production configuration first.
