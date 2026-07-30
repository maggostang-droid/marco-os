import { subscribe, state } from "./state.js";
import { escapeHtml } from "./html-utils.js";

// Anzeigenamen der Cluster — einzige Stelle, an der die kebab-case-Keys aus
// data/projects.js in lesbare Namen übersetzt werden. Reihenfolge = Anzeige-
// Reihenfolge in der Legende (innerster Orbit zuerst, wie CLUSTER_ORDER in
// graph-layout.js).
const CLUSTER_LEGEND = [
  { key: "agentic-ai", label: "Agentic AI", colorClass: "legend-dot--amber" },
  { key: "cloud", label: "Cloud", colorClass: "legend-dot--teal" },
  { key: "full-stack", label: "Full-Stack", colorClass: "legend-dot--violet" }
];

// Statisches HUD über der Graph-Szene: Identitäts-Panel oben links (wer ist
// das hier, in 3 Sekunden erfassbar) und Orbit-Legende unten links (was
// bedeuten die drei Farben). Beides rein informativ und pointer-events: none
// (bis auf nichts — keine Links), damit es keine Szene-Klicks schluckt.
// Es rendert einmal; subscribe wird nur genutzt, um das HUD nach Abschluss
// der Boot-Sequenz einzublenden.
export function initHud(container, projects, resume) {
  const liveCount = projects.filter((p) => p.status === "live").length;
  const clustersPresent = new Set(projects.filter((p) => p.cluster).map((p) => p.cluster));

  const legendItems = CLUSTER_LEGEND.filter((c) => clustersPresent.has(c.key))
    .map(
      (c) =>
        `<span class="legend-item"><span class="legend-dot ${c.colorClass}" aria-hidden="true"></span>${escapeHtml(c.label)}</span>`
    )
    .join("");

  container.innerHTML = `
    <div class="hud hud-identity">
      <p class="hud-kicker">// portfolio-system v2.0</p>
      <p class="hud-name">${escapeHtml(resume.name)}</p>
      <p class="hud-role">${escapeHtml(resume.headline)}</p>
      <p class="hud-meta">${projects.length} Projekte · ${liveCount} Live-Demos · ${clustersPresent.size} Cluster</p>
    </div>
    <div class="hud hud-legend" aria-label="Orbit-Legende">
      <p class="hud-kicker">// orbits</p>
      ${legendItems}
    </div>
  `;

  const reveal = () => {
    if (state.bootComplete) container.classList.add("is-visible");
  };
  reveal();
  subscribe(reveal);
}
