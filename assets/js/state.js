let listeners = new Set();

export const state = {
  bootComplete: false,
  activeProjectId: null
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

export function resetState() {
  state.bootComplete = false;
  state.activeProjectId = null;
  listeners = new Set();
}
