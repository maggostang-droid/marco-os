import { subscribe, state, focusProject, SECOND_BRAIN_CHAT_ID, RESUME_ID } from "./state.js";
import { escapeHtml } from "./html-utils.js";

// OS-Menüleiste am oberen Rand — ersetzt das frühere Fake-Browser-Chrome
// (Ampel-Dots + Fake-URL), das die OS-Metapher gedoppelt hat: ein OS hat
// eine Menüleiste, kein Browser-Chrome über sich. Die Einträge sind echte
// Shortcuts zu den wichtigsten Zielen (Lebenslauf, Ask-Marco-Chat, Kontakt),
// keine Dekoration.
export function initMenubar(container, resume) {
  render();
  subscribe(render);

  function render() {
    const isResumeOpen = state.activeProjectId === RESUME_ID;
    const isChatOpen = state.activeProjectId === SECOND_BRAIN_CHAT_ID;
    // Fokus über den Rebuild retten (gleiches Muster wie taskbar.js):
    // container.innerHTML = "" würde einen fokussierten Menü-Button sonst
    // kommentarlos aus dem Tab-Fluss werfen.
    const focusedApp = container.contains(document.activeElement)
      ? document.activeElement.dataset.app
      : null;

    container.innerHTML = `
      <span class="mb-brand">◆ MARCO.OS</span>
      <nav class="mb-nav" aria-label="Schnellzugriff">
        <button type="button" class="mb-item${isResumeOpen ? " is-active" : ""}" data-app="resume" aria-pressed="${isResumeOpen}">Lebenslauf</button>
        <button type="button" class="mb-item${isChatOpen ? " is-active" : ""}" data-app="chat" aria-pressed="${isChatOpen}">Ask-Marco</button>
        <a class="mb-item" data-app="contact" href="mailto:${escapeHtml(resume.email)}">Kontakt</a>
      </nav>
      <span class="mb-spacer"></span>
      <span class="mb-status"><span class="mb-status-dot" aria-hidden="true"></span>alle Systeme online</span>
    `;

    container.querySelector('[data-app="resume"]').addEventListener("click", () => focusProject(RESUME_ID));
    container.querySelector('[data-app="chat"]').addEventListener("click", () => focusProject(SECOND_BRAIN_CHAT_ID));

    if (focusedApp) {
      container.querySelector(`[data-app="${focusedApp}"]`)?.focus();
    }
  }
}
