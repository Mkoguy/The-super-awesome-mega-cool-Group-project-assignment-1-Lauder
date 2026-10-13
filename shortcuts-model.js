export const SHORTCUT_DEFINITIONS = [
  { id: "copy", label: "Copy selected element", group: "Editing", default: "Ctrl+C" },
  { id: "paste", label: "Paste element", group: "Editing", default: "Ctrl+V" },
  { id: "cut", label: "Cut selected element", group: "Editing", default: "Ctrl+X" },
  { id: "duplicate", label: "Duplicate selected element", group: "Editing", default: "Ctrl+D" },
  { id: "delete", label: "Delete selected element", group: "Editing", default: "Delete" },
  { id: "deleteAlternate", label: "Delete (alternate)", group: "Editing", default: "Backspace" },
  { id: "undo", label: "Undo", group: "Editing", default: "Ctrl+Z" },
  { id: "redo", label: "Redo", group: "Editing", default: "Ctrl+Shift+Z" },
  { id: "redoAlternate", label: "Redo (alternate)", group: "Editing", default: "Ctrl+Y" },
  { id: "forward", label: "Bring forward", group: "Arrange", default: "Ctrl+BracketRight" },
  { id: "backward", label: "Send backward", group: "Arrange", default: "Ctrl+BracketLeft" },
  { id: "up", label: "Move up 1 px", group: "Arrange", default: "ArrowUp" },
  { id: "down", label: "Move down 1 px", group: "Arrange", default: "ArrowDown" },
  { id: "left", label: "Move left 1 px", group: "Arrange", default: "ArrowLeft" },
  { id: "right", label: "Move right 1 px", group: "Arrange", default: "ArrowRight" },
  { id: "upFast", label: "Move up 10 px", group: "Arrange", default: "Shift+ArrowUp" },
  { id: "downFast", label: "Move down 10 px", group: "Arrange", default: "Shift+ArrowDown" },
  { id: "leftFast", label: "Move left 10 px", group: "Arrange", default: "Shift+ArrowLeft" },
  { id: "rightFast", label: "Move right 10 px", group: "Arrange", default: "Shift+ArrowRight" },
  { id: "zoomIn", label: "Zoom in", group: "View", default: "Ctrl+Equal" },
  { id: "zoomOut", label: "Zoom out", group: "View", default: "Ctrl+Minus" },
  { id: "preview", label: "Preview site", group: "View", default: "Ctrl+P" },
  { id: "save", label: "Save project file", group: "Project", default: "Ctrl+S" },
  { id: "export", label: "Export website", group: "Project", default: "Ctrl+E" },
  { id: "settings", label: "Open settings", group: "Project", default: "Ctrl+Comma" }
];

const DEFAULTS = Object.fromEntries(SHORTCUT_DEFINITIONS.map(item => [item.id, item.default]));
const specialKeys = { " ": "Space", "+": "Plus", "-": "Minus", "=": "Equal", ",": "Comma", "[": "BracketLeft", "]": "BracketRight", "/": "Slash" };
const modifierKeys = new Set(["Control", "Shift", "Alt", "Meta"]);

export function shortcutFromKeyboardEvent(event) {
  if (modifierKeys.has(event.key)) return "";
  const key = specialKeys[event.key] || (event.key.length === 1 ? event.key.toUpperCase() : event.key);
  if (!/^(?:[A-Z0-9]|F(?:[1-9]|1[0-2])|Arrow(?:Up|Down|Left|Right)|Delete|Backspace|Escape|Enter|Tab|Space|Plus|Minus|Equal|Comma|BracketLeft|BracketRight|Slash)$/.test(key)) return "";
  return [event.ctrlKey || event.metaKey ? "Ctrl" : "", event.altKey ? "Alt" : "", event.shiftKey ? "Shift" : "", key].filter(Boolean).join("+");
}

export function normalizeShortcuts(saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...DEFAULTS };
  const valid = value => typeof value === "string" && value.length <= 36 &&
    /^(?:(?:Ctrl|Alt|Shift)\+)*(?:[A-Z0-9]|F(?:[1-9]|1[0-2])|Arrow(?:Up|Down|Left|Right)|Delete|Backspace|Escape|Enter|Tab|Space|Plus|Minus|Equal|Comma|BracketLeft|BracketRight|Slash)$/.test(value) &&
    !["Tab", "Ctrl+Tab", "Ctrl+R", "Ctrl+Shift+R", "Ctrl+L", "Ctrl+W", "F5"].includes(value);
  const proposed = Object.fromEntries(SHORTCUT_DEFINITIONS.map(item => [item.id, valid(saved[item.id]) ? saved[item.id] : item.default]));
  if (new Set(Object.values(proposed)).size === SHORTCUT_DEFINITIONS.length) return proposed;
  const result = {}, used = new Set();
  for (const item of SHORTCUT_DEFINITIONS) {
    const value = proposed[item.id];
    if (value !== item.default && !used.has(value)) { result[item.id] = value; used.add(value); }
  }
  for (const item of SHORTCUT_DEFINITIONS) {
    if (result[item.id]) continue;
    const value = !used.has(item.default) ? item.default : SHORTCUT_DEFINITIONS.map(entry => entry.default).find(entry => !used.has(entry));
    result[item.id] = value;
    used.add(value);
  }
  return result;
}

export function defaultShortcuts() { return { ...DEFAULTS }; }
