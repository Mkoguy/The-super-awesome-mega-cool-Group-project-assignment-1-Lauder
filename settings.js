const $ = selector => document.querySelector(selector);
try {
  if (localStorage.getItem("websiteforge-workspace-mode-v1") === "light" && JSON.parse(localStorage.getItem("websiteforge-plugins-v1") || "[]").some(pack => pack.id === "websiteforge.light-mode")) document.body.classList.add("workspace-light");
} catch { /* Keep the default theme if browser storage is unavailable. */ }

function displayState(data) {
  $("#key-state").textContent = data.configured
    ? `API key configured${data.source === "environment" ? " through the server environment" : " in local settings"}. Model: ${data.model}.`
    : "No API key is configured yet.";
  $("#remove-key").disabled = data.source !== "saved";
}
async function request(method, body) {
  let response;
  try {
    response = await fetch("/api/settings", {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("WebsiteForge's local server is unavailable. Start it with node server.mjs, then open http://localhost:3000/settings.html.");
  }
  if (!response.headers.get("Content-Type")?.includes("application/json")) {
    throw new Error("This is a static preview. Start WebsiteForge with node server.mjs, then open http://localhost:3000/settings.html.");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not update settings.");
  return data;
}

try { displayState(await request("GET")); }
catch (error) { $("#key-state").textContent = error.message; }

$("#api-key-form").addEventListener("submit", async event => {
  event.preventDefault();
  const key = $("#api-key").value.trim();
  $("#settings-status").textContent = "Saving…";
  try {
    displayState(await request("POST", { apiKey: key }));
    $("#api-key").value = "";
    $("#settings-status").textContent = "API key saved. AI tools are ready in the builder.";
  } catch (error) { $("#settings-status").textContent = error.message; }
});

$("#remove-key").addEventListener("click", async () => {
  $("#settings-status").textContent = "Removing…";
  try {
    displayState(await request("DELETE"));
    $("#settings-status").textContent = "Saved API key removed.";
  } catch (error) { $("#settings-status").textContent = error.message; }
});
