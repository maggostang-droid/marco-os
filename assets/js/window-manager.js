import { subscribe, state, closeWindow } from "./state.js";
import { escapeHtml } from "./html-utils.js";
import { nextFocusTarget } from "./focus-target.js";

export function initWindowManager(container, projects) {
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  let lastRenderedProjectId = null;

  render();
  subscribe(render);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeProjectId) {
      closeWindow();
    }
  });

  function render() {
    const project = state.activeProjectId ? projectById[state.activeProjectId] : null;
    const hadFocusInWindow = container.contains(document.activeElement);
    const prevProjectId = lastRenderedProjectId;
    const focusTarget = nextFocusTarget(prevProjectId, project ? project.id : null, hadFocusInWindow);

    container.innerHTML = "";
    lastRenderedProjectId = project ? project.id : null;

    if (!project) {
      if (focusTarget.startsWith("graph-node:")) {
        const graphNodeId = focusTarget.slice("graph-node:".length);
        document.querySelector(`[data-node-id="${CSS.escape(graphNodeId)}"]`)?.focus();
      }
      return;
    }

    const isLive = Boolean(project.demoUrl);
    const statusLabel = isLive ? "● LIVE" : "● DEMO FOLGT";
    const actionHtml = isLive
      ? `<a class="btn primary" href="${project.demoUrl}" target="_blank" rel="noopener">Demo starten</a>`
      : `<button type="button" class="btn primary" disabled>Demo folgt</button>`;
    const repoHtml = project.repoUrl
      ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noopener">Repo öffnen</a>`
      : "";

    const win = document.createElement("div");
    win.className = "window";
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", project.title);
    win.innerHTML = `
      <div class="win-title">
        <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
        <span class="win-name">app://${escapeHtml(project.id)} — Terminal</span>
        <button type="button" class="win-close" aria-label="Fenster schließen">×</button>
      </div>
      <div class="win-body">
        <p class="prompt">marco@portfolio:~$ open ${escapeHtml(project.id)} --info</p>
        <p class="status-badge">${statusLabel}</p>
        <h3>${escapeHtml(project.title)}</h3>
        <p class="description">${escapeHtml(project.description)}</p>
        <div class="tags">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="btn-row">${actionHtml}${repoHtml}</div>
      </div>
    `;

    const closeBtn = win.querySelector(".win-close");
    closeBtn.addEventListener("click", closeWindow);
    container.appendChild(win);

    if (focusTarget === "open-window") {
      closeBtn.focus();
    }
  }
}
