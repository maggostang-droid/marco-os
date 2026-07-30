import { subscribe, state, closeWindow, SECOND_BRAIN_CHAT_ID, RESUME_ID, resolveFocusedNodeId } from "./state.js";
import { escapeHtml } from "./html-utils.js";
import { nextFocusTarget } from "./focus-target.js";

const SECOND_BRAIN_CHAT_URL = "https://second-brain-projects.streamlit.app/?embed=true";

// Akzentfarbe je Cluster (identisch zu den --amber/--teal/--violet Tokens in
// style.css) — als CSS-Custom-Property aufs Fenster gesetzt, damit Primary-
// Button, Tags und Fensterrahmen die Cluster-Farbe des Projekts tragen und
// das Fenster sichtbar zu "seinem" Orbit gehört.
const CLUSTER_ACCENT = {
  "agentic-ai": "#fbbf24",
  cloud: "#5eead4",
  "full-stack": "#a78bfa"
};

export function initWindowManager(container, projects, resume) {
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
    // Steuert den Scrim (abdunkeln + blur der Szene hinter dem Fenster,
    // siehe .window-layer.has-window in style.css) — die Szene bleibt
    // klickbar (pointer-events: none auf dem Layer), tritt aber visuell
    // zurück, damit der Fensterinhalt ungestört lesbar ist.
    container.classList.toggle("has-window", Boolean(activeId));
    lastRenderedId = activeId;

    if (!activeId) {
      if (focusTarget.startsWith("graph-node:")) {
        const graphNodeId = focusTarget.slice("graph-node:".length);
        // Sentinel ids (SECOND_BRAIN_CHAT_ID, RESUME_ID) aren't real graph
        // node ids — resolveFocusedNodeId (state.js) is the single source of
        // truth for mapping a sentinel to the real [data-node-id] it lives at.
        const domNodeId = resolveFocusedNodeId(graphNodeId);
        document.querySelector(`[data-node-id="${CSS.escape(domNodeId)}"]`)?.focus({ preventScroll: true });
      }
      return;
    }

    const isChat = activeId === SECOND_BRAIN_CHAT_ID;
    const isResume = activeId === RESUME_ID;
    const { win, closeBtn } = isChat
      ? buildChatWindow()
      : isResume
        ? buildResumeWindow(resume)
        : buildProjectWindow(projectById[activeId]);

    closeBtn.addEventListener("click", closeWindow);
    if (isResume) wireResumeWindowInteractions(win);
    if (!isChat && !isResume) wireProjectWindowInteractions(win);

    container.appendChild(win);

    if (focusTarget === "open-window") {
      closeBtn.focus({ preventScroll: true });
    }
  }
}

function buildProjectWindow(project) {
  const isLive = Boolean(project.demoUrl);
  const isComingSoon = !isLive && project.status === "coming-soon";
  const statusBadgeHtml = isLive
    ? `<p class="status-badge">● LIVE</p>`
    : isComingSoon
      ? `<p class="status-badge">● DEMO FOLGT</p>`
      : "";
  const actionHtml = isLive
    ? `<a class="btn primary" href="${project.demoUrl}" target="_blank" rel="noopener">Demo starten</a>`
    : isComingSoon
      ? `<button type="button" class="btn primary" disabled>Demo folgt</button>`
      : "";
  const repoHtml = project.repoUrl
    ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noopener">Repo öffnen</a>`
    : "";
  // Echte Metriken (aus data/projects.js, optional) als eigene Stat-Zeile —
  // ehrliche Zahlen sind das stärkste Material der Projekte und verdienen
  // visuelles Gewicht, statt im Fließtext der Beschreibung unterzugehen.
  const statsHtml = Array.isArray(project.stats) && project.stats.length
    ? `<div class="stats">${project.stats
        .map(
          (stat) =>
            `<div class="stat"><span class="stat-value">${escapeHtml(stat.value)}</span><span class="stat-label">${escapeHtml(stat.label)}</span></div>`
        )
        .join("")}</div>`
    : "";

  const win = document.createElement("div");
  win.className = "window";
  win.style.setProperty("--accent", CLUSTER_ACCENT[project.cluster] ?? "#5eead4");
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
      ${statusBadgeHtml}
      <h3>${escapeHtml(project.title)}</h3>
      <p class="summary">${escapeHtml(project.summary)}</p>
      ${statsHtml}
      <div class="tags">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      <button type="button" class="tech-toggle" aria-expanded="false">▸ Technische Details anzeigen</button>
      <div class="description-wrap"><p class="description" aria-hidden="true">${escapeHtml(project.description)}</p></div>
      <div class="btn-row">${actionHtml}${repoHtml}</div>
    </div>
  `;

  return { win, closeBtn: win.querySelector(".win-close") };
}

function wireProjectWindowInteractions(win) {
  const techToggle = win.querySelector(".tech-toggle");
  const descriptionWrap = win.querySelector(".description-wrap");
  const descriptionEl = win.querySelector(".description");
  techToggle.addEventListener("click", () => {
    const expanding = !descriptionWrap.classList.contains("is-expanded");
    descriptionWrap.classList.toggle("is-expanded", expanding);
    descriptionEl.setAttribute("aria-hidden", String(!expanding));
    techToggle.setAttribute("aria-expanded", String(expanding));
    techToggle.textContent = expanding ? "▾ Technische Details verbergen" : "▸ Technische Details anzeigen";
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

function buildResumeWindow(resume) {
  const stationsHtml = resume.currentStations
    .map(
      (station) => `
        <div class="resume-station">
          <p class="resume-station-header">${escapeHtml(station.role)} | ${escapeHtml(station.org)}</p>
          <p class="resume-station-period">${escapeHtml(station.period)}</p>
          <ul class="resume-bullets">${station.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>
        </div>
      `
    )
    .join("");
  const skillsHtml = resume.skills.map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`).join("");
  const extraHtml = resume.extendedHistory.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const win = document.createElement("div");
  win.className = "window window--resume";
  // Violett = die Farbe des Zentrums/der Person, nicht eines Clusters.
  win.style.setProperty("--accent", "#a78bfa");
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "Lebenslauf");
  win.innerHTML = `
    <div class="win-title">
      <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
      <span class="win-name">app://lebenslauf — Terminal</span>
      <button type="button" class="win-close" aria-label="Fenster schließen">×</button>
    </div>
    <div class="win-body">
      <p class="prompt">marco@portfolio:~$ cat lebenslauf.txt</p>
      <h3>${escapeHtml(resume.name)}</h3>
      <p class="resume-headline">${escapeHtml(resume.headline)}</p>
      <p class="resume-intro">${escapeHtml(resume.intro)}</p>
      ${stationsHtml}
      <div class="tags">${skillsHtml}</div>
      <button type="button" class="resume-toggle" aria-expanded="false">▸ Vollständigen Werdegang anzeigen</button>
      <div class="resume-extra-wrap"><ul class="resume-extra" aria-hidden="true">${extraHtml}</ul></div>
      <div class="btn-row">
        <a class="btn primary" href="mailto:${resume.email}">Kontakt aufnehmen</a>
        <a class="btn ghost" href="${resume.linkedinUrl}" target="_blank" rel="noopener">LinkedIn</a>
        <a class="btn ghost" href="${resume.pdfUrl}" download>Lebenslauf laden (PDF)</a>
      </div>
    </div>
  `;

  return { win, closeBtn: win.querySelector(".win-close") };
}

function wireResumeWindowInteractions(win) {
  const wrap = win.querySelector(".resume-extra-wrap");
  const extra = win.querySelector(".resume-extra");
  const toggle = win.querySelector(".resume-toggle");
  toggle.addEventListener("click", () => {
    const expanding = !wrap.classList.contains("is-expanded");
    wrap.classList.toggle("is-expanded", expanding);
    extra.setAttribute("aria-hidden", String(!expanding));
    toggle.setAttribute("aria-expanded", String(expanding));
    toggle.textContent = expanding ? "▾ Vollständigen Werdegang verbergen" : "▸ Vollständigen Werdegang anzeigen";
  });
}
