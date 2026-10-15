import test from "node:test";
import assert from "node:assert/strict";
import { mountModelViewers, normalizeModelMotion, normalizeSite, renderSite, exportDocument, template } from "../site-model.js";

test("custom 3D motion animates the mesh and survives website export", () => {
  const site = template("portfolio");
  const source = "v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n";
  site.objects = [{ id: "animated-model", type: "model3d", modelFormat: "obj", modelFileName: "triangle.obj",
    modelData: `data:model/obj;base64,${Buffer.from(source).toString("base64")}`,
    modelRotateX: 0, modelRotateY: 0, modelMoveX: 0, modelMoveY: 0, modelMoveZ: 0,
    modelMotion: { enabled: true, mode: "sway", duration: 3, rotateZ: 90, moveX: .5, moveY: 0, moveZ: 0, scale: 1.5 } }];
  const normalized = normalizeSite(site);
  assert.deepEqual(normalized.objects[0].modelMotion, normalizeModelMotion(site.objects[0].modelMotion));
  assert.match(renderSite(normalized, true), /data-model-motion-rotate-z="90"/);
  assert.match(exportDocument(normalized), /data-model-motion-enabled="true"/);
  assert.match(exportDocument(normalized), /data-model-motion-move-x="0\.5"/);
  const frames = [], firstPoints = [];
  const context = new Proxy({ moveTo: (x, y) => firstPoints.push([x, y]) }, { get(target, key) { return target[key] ?? (() => {}); }, set(target, key, value) { target[key] = value; return true; } });
  const canvas = { clientWidth: 300, clientHeight: 300, getContext: () => context, addEventListener() {} };
  const stage = { isConnected: true,
    dataset: { modelFormat: "obj", modelData: normalized.objects[0].modelData, modelResources: "{}", modelColor: "#ed7418",
      modelScale: "1", modelRotateX: "0", modelRotateY: "0", modelMoveX: "0", modelMoveY: "0", modelMoveZ: "0",
      modelMotionEnabled: "true", modelMotionMode: "sway", modelMotionDuration: "3", modelMotionRotateX: "0",
      modelMotionRotateY: "0", modelMotionRotateZ: "90", modelMotionMoveX: ".5", modelMotionMoveY: "0",
      modelMotionMoveZ: "0", modelMotionScale: "1.5" },
    querySelector: selector => selector === ".model3d-canvas" ? canvas : { textContent: "" },
    querySelectorAll: () => [], classList: { add() {} }, addEventListener() {} };
  const previous = { window: globalThis.window, requestAnimationFrame: globalThis.requestAnimationFrame };
  try {
    globalThis.window = { devicePixelRatio: 1, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) };
    globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
    mountModelViewers({ querySelectorAll: () => [stage] });
    assert.equal(stage.dataset.modelReady, "true");
    frames.shift()(1000);
    frames.shift()(1750);
    assert.equal(firstPoints.length, 2);
    assert.notDeepEqual(firstPoints[0], firstPoints[1], "mesh coordinates should change over the animation cycle");
    assert.equal(stage.dataset.modelMoveX, "0", "animation must not change the saved base position");
    stage.isConnected = false;
    frames.shift()(1800);
  } finally {
    globalThis.window = previous.window;
    globalThis.requestAnimationFrame = previous.requestAnimationFrame;
  }
});

test("Blockbench mesh textures render and 3D depth moves survive export", async () => {
  const model = {
    elements: [{
      type: "mesh", uuid: "part",
      vertices: { a: [-1, -1, 0], b: [1, -1, 0], c: [1, 1, 0], d: [-1, 1, 0] },
      faces: { front: {
        vertices: ["a", "b", "c", "d"],
        uv: { a: [0, 0], b: [16, 0], c: [16, 16], d: [0, 16] }, texture: 0
      } }
    }],
    textures: [{ uuid: "texture", id: "0", uv_width: 16, uv_height: 16, source: "data:image/png;base64,iVBORw0KGgo=" }],
    outliner: ["part"]
  };
  const site = template("portfolio");
  site.objects = [{ id: "model-one", type: "model3d", modelFormat: "bbmodel", modelFileName: "sample.bbmodel",
    modelData: `data:application/json;base64,${Buffer.from(JSON.stringify(model)).toString("base64")}`,
    modelMoveX: .25, modelMoveY: -.1, modelMoveZ: .5, modelTintTextures: true }];
  const normalized = normalizeSite(site);
  assert.match(renderSite(normalized, true), /data-model-move-z="0\.5"/);
  assert.match(renderSite(normalized, true), /data-model-tint-textures="true"/);
  assert.match(renderSite(normalized, true), /data-model-mode="depth"/);
  assert.doesNotMatch(renderSite(normalized, true), /model3d-preview|model3d-cube/);
  assert.match(exportDocument(normalized), /data-model-move-z="0\.5"/);
  assert.match(exportDocument(normalized), /data-model-tint-textures="true"/);

  const handlers = {}, events = [], transforms = [], calls = { drawImage: 0, fill: 0, fillRect: 0 };
  const context = new Proxy({ setTransform: (...values) => transforms.push(values) }, { get(target, key) { return target[key] ?? (() => { if (key in calls) calls[key]++; }); }, set(target, key, value) { target[key] = value; return true; } });
  const canvas = { clientWidth: 300, clientHeight: 300, getContext: () => context,
    addEventListener: (name, callback) => { handlers[name] = callback; }, setPointerCapture() {} };
  const buttons = ["orbit", "move", "depth"].map(mode => ({ dataset: { modelMode: mode }, handlers: {},
    addEventListener(name, callback) { this.handlers[name] = callback; }, setAttribute() {} }));
  const stage = { dataset: { modelFormat: "bbmodel", modelData: normalized.objects[0].modelData, modelResources: "{}",
    modelColor: "#ed7418", modelScale: "1", modelRotateX: "0", modelRotateY: "0",
    modelMoveX: ".25", modelMoveY: "-.1", modelMoveZ: ".5", modelPixelArt: "true", modelTintTextures: "true" },
    querySelector: selector => selector === ".model3d-canvas" ? canvas : { textContent: "" },
    querySelectorAll: () => buttons, classList: { add() {} }, addEventListener() {},
    closest: selector => selector === "[data-object-id]" ? { dataset: { objectId: "model-one" } } : {},
    dispatchEvent: event => events.push(event) };
  const previous = { window: globalThis.window, createImageBitmap: globalThis.createImageBitmap, requestAnimationFrame: globalThis.requestAnimationFrame };
  try {
    globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
    globalThis.createImageBitmap = async () => ({ width: 16, height: 32 });
    globalThis.requestAnimationFrame = callback => { queueMicrotask(callback); return 1; };
    mountModelViewers({ querySelectorAll: () => [stage] });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(stage.dataset.modelReady, "true");
    assert.ok(calls.drawImage >= 2, "textured triangles should use the decoded Blockbench texture");
    assert.ok(calls.fillRect >= 2, "enabled model tint should recolor textured faces");
    assert.ok(transforms.some(values => Math.abs(values[3]) > 10), "animated texture UVs should use one 16px frame instead of stretching all 32px");
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

test("GLB texture UVs stay local to each mesh", async () => {
  const arrays = [
    [-2, -1, 0, -1, -1, 0, -2, 1, 0],
    [0, 0, 1, 0, 0, 1],
    [1, -1, 0, 2, -1, 0, 1, 1, 0],
    [0, 0, 1, 0, 0, 1]
  ].map(values => Buffer.from(new Float32Array(values).buffer));
  let offset = 0;
  const bufferViews = arrays.map(chunk => { const view = { buffer: 0, byteOffset: offset, byteLength: chunk.length }; offset += chunk.length; return view; });
  const binary = Buffer.concat(arrays);
  const document = {
    asset: { version: "2.0" }, buffers: [{ byteLength: binary.length }], bufferViews,
    accessors: [0, 1, 2, 3].map(index => ({ bufferView: index, componentType: 5126, count: 3, type: index % 2 ? "VEC2" : "VEC3" })),
    images: [{ uri: "data:image/png;base64,iVBORw0KGgo=" }], textures: [{ source: 0 }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 2, TEXCOORD_0: 3 }, material: 0 }] }],
    nodes: [{ mesh: 0 }, { mesh: 1 }], scenes: [{ nodes: [0, 1] }], scene: 0
  };
  const json = Buffer.from(JSON.stringify(document));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
  const glb = Buffer.alloc(12 + 8 + paddedJson.length + 8 + binary.length);
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(paddedJson.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); paddedJson.copy(glb, 20);
  const binaryHeader = 20 + paddedJson.length;
  glb.writeUInt32LE(binary.length, binaryHeader); glb.writeUInt32LE(0x004e4942, binaryHeader + 4); binary.copy(glb, binaryHeader + 8);
  let drawImageCount = 0;
  const context = new Proxy({}, { get(target, key) { return target[key] ?? (() => { if (key === "drawImage") drawImageCount++; }); }, set(target, key, value) { target[key] = value; return true; } });
  const canvas = { clientWidth: 300, clientHeight: 300, getContext: () => context, addEventListener() {} };
  const stage = {
    dataset: { modelFormat: "glb", modelData: `data:model/gltf-binary;base64,${glb.toString("base64")}`, modelResources: "{}",
      modelColor: "#ed7418", modelScale: "1", modelRotateX: "0", modelRotateY: "0", modelMoveX: "0", modelMoveY: "0", modelMoveZ: "0" },
    querySelector: selector => selector === ".model3d-canvas" ? canvas : { textContent: "" },
    querySelectorAll: () => [], classList: { add() {} }, addEventListener() {}
  };
  const previous = { window: globalThis.window, createImageBitmap: globalThis.createImageBitmap, requestAnimationFrame: globalThis.requestAnimationFrame };
  try {
    globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
    globalThis.createImageBitmap = async () => ({ width: 16, height: 16 });
    globalThis.requestAnimationFrame = callback => { queueMicrotask(callback); return 1; };
    mountModelViewers({ querySelectorAll: () => [stage] });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(stage.dataset.modelReady, "true");
    assert.equal(drawImageCount, 2, "both meshes should retain their own texture coordinates");
  } finally {
    globalThis.window = previous.window;
    globalThis.createImageBitmap = previous.createImageBitmap;
    globalThis.requestAnimationFrame = previous.requestAnimationFrame;
  }
});
