import test from "node:test";
import assert from "node:assert/strict";
import { mountModelViewers, normalizeSite, renderSite, exportDocument, template } from "../site-model.js";

test("Blockbench mesh textures render and 3D depth moves survive export", async () => {
  const model = {
    elements: [{
      type: "mesh", uuid: "part",
      vertices: { a: [-1, -1, 0], b: [1, -1, 0], c: [1, 1, 0], d: [-1, 1, 0] },
      faces: { front: {
        vertices: ["a", "b", "c", "d"],
        uv: { a: [0, 0], b: [1, 0], c: [1, 1], d: [0, 1] }, texture: 0
      } }
    }],
    textures: [{ uuid: "texture", id: "0", uv_width: 1, uv_height: 1, source: "data:image/png;base64,iVBORw0KGgo=" }],
    outliner: ["part"]
  };
  const site = template("portfolio");
  site.objects = [{ id: "model-one", type: "model3d", modelFormat: "bbmodel", modelFileName: "sample.bbmodel",
    modelData: `data:application/json;base64,${Buffer.from(JSON.stringify(model)).toString("base64")}`,
    modelMoveX: .25, modelMoveY: -.1, modelMoveZ: .5 }];
  const normalized = normalizeSite(site);
  assert.match(renderSite(normalized, true), /data-model-move-z="0\.5"/);
  assert.match(renderSite(normalized, true), /data-model-mode="depth"/);
  assert.doesNotMatch(renderSite(normalized, true), /model3d-preview|model3d-cube/);
  assert.match(exportDocument(normalized), /data-model-move-z="0\.5"/);

  const handlers = {}, events = [], calls = { drawImage: 0, fill: 0 };
  const context = new Proxy({}, { get(target, key) { return target[key] ?? (() => { if (key in calls) calls[key]++; }); }, set(target, key, value) { target[key] = value; return true; } });
  const canvas = { clientWidth: 300, clientHeight: 300, getContext: () => context,
    addEventListener: (name, callback) => { handlers[name] = callback; }, setPointerCapture() {} };
  const buttons = ["orbit", "move", "depth"].map(mode => ({ dataset: { modelMode: mode }, handlers: {},
    addEventListener(name, callback) { this.handlers[name] = callback; }, setAttribute() {} }));
  const stage = { dataset: { modelFormat: "bbmodel", modelData: normalized.objects[0].modelData, modelResources: "{}",
    modelColor: "#ed7418", modelScale: "1", modelRotateX: "18", modelRotateY: "-28",
    modelMoveX: ".25", modelMoveY: "-.1", modelMoveZ: ".5", modelPixelArt: "true" },
    querySelector: selector => selector === ".model3d-canvas" ? canvas : { textContent: "" },
    querySelectorAll: () => buttons, classList: { add() {} }, addEventListener() {},
    closest: selector => selector === "[data-object-id]" ? { dataset: { objectId: "model-one" } } : {},
    dispatchEvent: event => events.push(event) };
  const previous = { window: globalThis.window, createImageBitmap: globalThis.createImageBitmap, requestAnimationFrame: globalThis.requestAnimationFrame };
  try {
    globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
    globalThis.createImageBitmap = async () => ({ width: 1, height: 1 });
    globalThis.requestAnimationFrame = callback => { queueMicrotask(callback); return 1; };
    mountModelViewers({ querySelectorAll: () => [stage] });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(stage.dataset.modelReady, "true");
    assert.ok(calls.drawImage >= 2, "textured triangles should use the decoded Blockbench texture");
    buttons[2].handlers.click({ stopPropagation() {} });
    handlers.pointerdown({ button: 0, shiftKey: false, clientX: 100, clientY: 100, pointerId: 1, preventDefault() {}, stopPropagation() {} });
    handlers.pointermove({ clientX: 100, clientY: 50 });
    handlers.pointerup();
    assert.ok(events.some(event => event.type === "modelviewchange" && event.detail.moveZ > .5));
    await new Promise(resolve => setTimeout(resolve, 0));
  } finally {
    globalThis.window = previous.window;
    globalThis.createImageBitmap = previous.createImageBitmap;
    globalThis.requestAnimationFrame = previous.requestAnimationFrame;
  }
});
