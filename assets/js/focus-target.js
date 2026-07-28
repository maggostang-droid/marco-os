export function nextFocusTarget(prevProjectId, nextProjectId, focusWasInWindow) {
  if (nextProjectId && nextProjectId !== prevProjectId) return "open-window";
  if (nextProjectId && focusWasInWindow) return "open-window";
  if (!nextProjectId && focusWasInWindow && prevProjectId) return `graph-node:${prevProjectId}`;
  return "unchanged";
}
