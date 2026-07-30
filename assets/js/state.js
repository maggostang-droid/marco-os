const listeners = new Set();

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;

// Deliberately not a plausible data/projects.js id (those are always plain
// kebab-case repo-name strings, e.g. "sql-agent" — this repo *has* a real
// project literally id'd "second-brain", so a bare "second-brain" sentinel
// would collide with it and hijack that project's own window).
export const SECOND_BRAIN_CHAT_ID = "__second-brain-chat__";

// Same reasoning as SECOND_BRAIN_CHAT_ID above — the résumé window isn't a
// real data/projects.js entry either, so it needs its own collision-proof id.
export const RESUME_ID = "__resume__";

// Sentinel für das interaktive Terminal-Fenster (Paket 1, Spec 2026-07-30).
// Gleiches Kollisionsschutz-Muster wie oben.
export const TERMINAL_ID = "__terminal__";

export const state = {
  bootComplete: false,
  activeProjectId: null,
  zoomLevel: 1
};

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) {
    listener(state);
  }
}

export function completeBoot() {
  if (state.bootComplete) return;
  state.bootComplete = true;
  notify();
}

export function focusProject(projectId) {
  state.activeProjectId = projectId;
  notify();
}

export function closeWindow() {
  state.activeProjectId = null;
  notify();
}

function clampZoom(value) {
  const rounded = Math.round(value * 10) / 10;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rounded));
}

export function zoomIn() {
  const next = clampZoom(state.zoomLevel + ZOOM_STEP);
  if (next === state.zoomLevel) return;
  state.zoomLevel = next;
  notify();
}

export function zoomOut() {
  const next = clampZoom(state.zoomLevel - ZOOM_STEP);
  if (next === state.zoomLevel) return;
  state.zoomLevel = next;
  notify();
}

export function resetState() {
  state.bootComplete = false;
  state.activeProjectId = null;
  state.zoomLevel = 1;
  listeners.clear();
}

// SECOND_BRAIN_CHAT_ID and RESUME_ID are UI sentinels, not real
// graph-layout.js node ids — the résumé "lives" at the center node, the chat
// "lives" at the second-brain moon node (see data/projects.js's
// orbitsCenter entry). scene.js needs the *real* node id a sentinel
// represents to correctly zoom/dim the right graph node — this is that
// mapping, kept here (next to the sentinels themselves) so the two can't
// drift apart.
export function resolveFocusedNodeId(activeProjectId) {
  if (!activeProjectId) return null;
  if (activeProjectId === RESUME_ID) return "center";
  if (activeProjectId === SECOND_BRAIN_CHAT_ID) return "second-brain";
  // Das Terminal gehört zu keinem Graph-Knoten: kein Fokus-Zoom, kein
  // Dimmen — scene.js behandelt "Fenster offen, aber kein Knoten" über
  // den null-Rückgabewert.
  if (activeProjectId === TERMINAL_ID) return null;
  return activeProjectId;
}
