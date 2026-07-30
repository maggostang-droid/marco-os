import { subscribe, state, zoomIn, zoomOut, focusProject, SECOND_BRAIN_CHAT_ID, RESUME_ID, TERMINAL_ID } from "./state.js";
import { fetchVisitorCount } from "./analytics.js";

export function initTaskbar(container, projects, { tipIntervalMs = 6000 } = {}) {
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  // Besucherzahl (GoatCounter-Counter-Endpoint) einmal beim Start holen;
  // bis dahin — und bei jedem Fehler — zeigt die Taskbar schlicht nichts an.
  let visitorCount = null;
  fetchVisitorCount().then((count) => {
    if (!count) return;
    visitorCount = count;
    renderTaskbar();
  });
  const TIPS = [
    `KI-Guide: „Klick auf ${projects[0]?.id ?? "einen Knoten"}, um Details zu sehen“`,
    "KI-Guide: „Neue Projekte erscheinen automatisch als neue Knoten“",
    "KI-Guide: „Tab + Enter funktioniert genauso wie ein Klick“",
    "KI-Guide: „Klick mich — hinter mir steckt ein echter Chat“"
  ];
  let tipIndex = 0;
  let lastRenderKey = null;

  renderTaskbar();
  subscribe(renderTaskbar);
  setInterval(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    renderTaskbar();
  }, tipIntervalMs);
  // Only the clock changes minute-to-minute, so align the tick to the next
  // minute boundary instead of re-rendering every second.
  setTimeout(() => {
    renderTaskbar();
    setInterval(renderTaskbar, 60000);
  }, 60000 - (Date.now() % 60000));

  function renderTaskbar() {
    // The chat/résumé windows' activeProjectId is a sentinel, not a real
    // data/projects.js id, so it never matches projectById — special-case
    // both here rather than letting the chip silently disappear.
    const isChatOpen = state.activeProjectId === SECOND_BRAIN_CHAT_ID;
    const isResumeOpen = state.activeProjectId === RESUME_ID;
    const isTerminalOpen = state.activeProjectId === TERMINAL_ID;
    const project =
      state.activeProjectId && !isChatOpen && !isResumeOpen && !isTerminalOpen
        ? projectById[state.activeProjectId]
        : null;
    const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    // Nur neu bauen, wenn sich sichtbarer Inhalt geändert hat — notify()
    // feuert auch bei jedem Zoom-Tick, und der innerHTML-Rebuild pro
    // Mausrad-Raste (inkl. Listener-Neuverdrahtung) trug zum Zoom-Ruckeln
    // bei. Nebeneffekt: Fokus auf den Zoom-Buttons bleibt jetzt von selbst
    // erhalten, weil die Buttons gar nicht mehr ersetzt werden.
    const renderKey = `${state.activeProjectId}|${tipIndex}|${time}|${visitorCount}`;
    if (renderKey === lastRenderKey) return;
    lastRenderKey = renderKey;

    const focusedZoomDirection = container.contains(document.activeElement)
      ? document.activeElement.dataset.zoom
      : null;

    container.innerHTML = `
      <span class="tb-start">◆ MARCO.OS</span>
      ${isChatOpen ? `<span class="tb-app">second-brain.exe</span>` : isResumeOpen ? `<span class="tb-app">lebenslauf.exe</span>` : isTerminalOpen ? `<span class="tb-app">terminal.exe</span>` : project ? `<span class="tb-app">${project.id}.exe</span>` : ""}
      <span class="tb-spacer"></span>
      <button type="button" class="tb-guide" aria-label="Ask-Marco-Chat öffnen">${TIPS[tipIndex]}</button>
      ${visitorCount ? `<span class="tb-visitors" title="Besucher insgesamt (GoatCounter, cookielos)">◉ ${visitorCount} Besucher</span>` : ""}
      <div class="tb-zoom">
        <button type="button" class="tb-zoom-btn" data-zoom="out" aria-label="Rauszoomen">−</button>
        <button type="button" class="tb-zoom-btn" data-zoom="in" aria-label="Reinzoomen">+</button>
      </div>
      <span class="tb-clock">${time}</span>
    `;

    // Der KI-Guide ist kein Fake-Chatbot-Dekor: Klick öffnet den echten
    // Ask-Marco-Chat (Streamlit-Embed) — auf einem KI-Portfolio soll keine
    // Fake-KI sitzen (siehe Spec 2026-07-30-wow-features-design.md).
    container.querySelector(".tb-guide").addEventListener("click", () => focusProject(SECOND_BRAIN_CHAT_ID));
    container.querySelector('[data-zoom="out"]').addEventListener("click", zoomOut);
    container.querySelector('[data-zoom="in"]').addEventListener("click", zoomIn);

    if (focusedZoomDirection) {
      container.querySelector(`[data-zoom="${focusedZoomDirection}"]`)?.focus();
    }
  }
}
