import { subscribe, state, closeWindow, SECOND_BRAIN_CHAT_ID } from "./state.js";
import { escapeHtml } from "./html-utils.js";
import { nextFocusTarget } from "./focus-target.js";

const SECOND_BRAIN_CHAT_URL = "https://second-brain-projects.streamlit.app/?embed=true";

export function initWindowManager(container, projects) {
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  let lastRenderedId = null;

  render();
  subscribe(render);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeProjectId) {
      closeWindow();
    }
  });

  function render() {
    const activeId = state.activeProjectId;
    const prevRenderedId = lastRenderedId;

    if (activeId && activeId === prevRenderedId) {
      // Window content depends only on which window is active, not on
      // other state fields (e.g. zoomLevel) — skip the rebuild so
      // unrelated notifies (zoom ticks) don't steal focus back to the
      // close button or reset .win-body's scroll position.
      return;
    }

    const hadFocusInWindow = container.contains(document.activeElement);
    const focusTarget = nextFocusTarget(prevRenderedId, activeId, hadFocusInWindow);

    container.innerHTML = "";
    lastRenderedId = activeId;

    if (!activeId) {
      if (focusTarget.startsWith("graph-node:")) {
        const graphNodeId = focusTarget.slice("graph-node:".length);
        // The chat's logical id (SECOND_BRAIN_CHAT_ID) is deliberately not a
        // real graph node id (it must never collide with a real project id —
        // see Task 1's fix) — the actual DOM node for it uses graph-layout.js's
        // own "center" node id instead, so map the two before looking it up.
        const domNodeId = graphNodeId === SECOND_BRAIN_CHAT_ID ? "center" : graphNodeId;
        document.querySelector(`[data-node-id="${CSS.escape(domNodeId)}"]`)?.focus({ preventScroll: true });
      }
      return;
    }

    const isChat = activeId === SECOND_BRAIN_CHAT_ID;
    const { win, closeBtn } = isChat ? buildChatWindow() : buildProjectWindow(projectById[activeId]);

    closeBtn.addEventListener("click", closeWindow);
    if (!isChat) wireProjectWindowInteractions(win);

    container.appendChild(win);

    if (focusTarget === "open-window") {
      closeBtn.focus({ preventScroll: true });
    }
  }
}

function buildProjectWindow(project) {
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
      <button type="button" class="tech-toggle" aria-expanded="false">▸ Tech-Stack anzeigen</button>
      <div class="tags" hidden>${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="btn-row">${actionHtml}${repoHtml}</div>
    </div>
  `;

  return { win, closeBtn: win.querySelector(".win-close") };
}

function wireProjectWindowInteractions(win) {
  const techToggle = win.querySelector(".tech-toggle");
  const tagsEl = win.querySelector(".tags");
  techToggle.addEventListener("click", () => {
    const expanding = tagsEl.hidden;
    tagsEl.hidden = !expanding;
    techToggle.setAttribute("aria-expanded", String(expanding));
    techToggle.textContent = expanding ? "▾ Tech-Stack verbergen" : "▸ Tech-Stack anzeigen";
  });
}

function buildChatWindow() {
  const win = document.createElement("div");
  win.className = "window window--chat";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "second-brain Chat");
  win.innerHTML = `
    <div class="win-title">
      <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
      <span class="win-name">app://second-brain — Terminal</span>
      <button type="button" class="win-close" aria-label="Fenster schließen">×</button>
    </div>
    <div class="win-body">
      <iframe class="chat-frame" src="${SECOND_BRAIN_CHAT_URL}" title="second-brain Chat" loading="lazy"></iframe>
    </div>
  `;

  return { win, closeBtn: win.querySelector(".win-close") };
}
