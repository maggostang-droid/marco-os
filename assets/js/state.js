const listeners = new Set();

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;

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
