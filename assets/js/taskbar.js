import { subscribe, state } from "./state.js";

const TIPS = [
  "KI-Guide: „Klick auf sql-agent, um Details zu sehen“",
  "KI-Guide: „Neue Projekte erscheinen automatisch als neue Knoten“",
  "KI-Guide: „Tab + Enter funktioniert genauso wie ein Klick“"
];

export function initTaskbar(container, projects, { tipIntervalMs = 6000 } = {}) {
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  let tipIndex = 0;

  renderTaskbar();
  subscribe(renderTaskbar);
  setInterval(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    renderTaskbar();
  }, tipIntervalMs);
  setInterval(renderTaskbar, 1000);

  function renderTaskbar() {
    const project = state.activeProjectId ? projectById[state.activeProjectId] : null;
    const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    container.innerHTML = `
      <span class="tb-start">◆ MARCO.OS</span>
      ${project ? `<span class="tb-app active">${project.id}.exe</span>` : ""}
      <span class="tb-spacer"></span>
      <span class="tb-guide">${TIPS[tipIndex]}</span>
      <span class="tb-clock">${time}</span>
    `;
  }
}