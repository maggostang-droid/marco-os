import { subscribe, state, focusProject, RESUME_ID } from "./state.js";
import { escapeHtml } from "./html-utils.js";

// Geführte Tour (Paket 2, Spec 2026-07-30-wow-features-design.md): fliegt
// drei kuratierte Projekte an — eines pro Cluster, alle mit Live-Demo bzw.
// echter Metrik — und endet im Lebenslauf mit Kontakt-CTA. Die Captions
// nennen ausschließlich reale, nachprüfbare Fakten.
const TOUR_STEPS = [
  {
    id: "sql-agent",
    kicker: "Station 1/4 · Agentic AI",
    caption:
      "SQL Copilot: Text-to-SQL-Agent mit Guardrails und Selbstkorrektur-Loop — ehrlich evaluiert (8/15 Referenzfragen korrekt) und live ausprobierbar."
  },
  {
    id: "cloud-native-pipeline",
    kicker: "Station 2/4 · Cloud",
    caption:
      "Document Auto-Classifier: Upload → Klassifikation + Feldextraktion, komplett serverlos auf AWS (S3 → Lambda → Claude → DynamoDB), per Terraform deployt."
  },
  {
    id: "hr-interview-cockpit",
    kicker: "Station 3/4 · Full-Stack",
    caption:
      "Interview Cockpit: strukturierte Bewerbungsgespräche mit Live-Bewertung und Radar-Chart-Auswertung — läuft ohne Backend direkt im Browser."
  },
  {
    id: RESUME_ID,
    kicker: "Station 4/4 · Der Mensch dahinter",
    caption:
      "Dr.-Ing. Marco Stang — 10+ Jahre ML & Data Science, Promotion zu KI-Validierung (KIT). Überzeugt? Der Kontakt-Button ist gleich hier im Fenster.",
    last: true
  }
];

const STEP_MS = 9000;

let active = false;
let stepIndex = 0;
let timer = null;
let overlayEl = null;
let unsubscribe = null;

export function startTour() {
  if (active) return;
  active = true;
  stepIndex = -1;
  document.querySelector(".desktop")?.classList.add("tour-active");
  buildOverlay();
  // Erst abonnieren, dann zum ersten Schritt: watchState sieht so schon den
  // notify des eigenen focusProject-Aufrufs und erkennt ihn als erwartet.
  unsubscribe = subscribe(watchState);
  goToStep(0);
}

export function stopTour() {
  if (!active) return;
  active = false;
  clearTimeout(timer);
  timer = null;
  unsubscribe?.();
  unsubscribe = null;
  overlayEl?.remove();
  overlayEl = null;
  document.querySelector(".desktop")?.classList.remove("tour-active");
}

// Weicht das aktive Fenster vom erwarteten Tour-Schritt ab, hat der Nutzer
// selbst eingegriffen (Esc, Klick auf anderen Planeten, Fenster zu) — die
// Tour beendet sich dann leise, statt gegen den Nutzer zu steuern.
function watchState() {
  if (!active || stepIndex < 0) return;
  if (state.activeProjectId !== TOUR_STEPS[stepIndex].id) stopTour();
}

function goToStep(index) {
  if (index >= TOUR_STEPS.length) {
    stopTour();
    return;
  }
  stepIndex = index;
  const step = TOUR_STEPS[index];
  focusProject(step.id);
  renderCaption(step, index);
  clearTimeout(timer);
  // Der letzte Schritt (Lebenslauf + Kontakt) bleibt stehen, bis der Nutzer
  // selbst weitermacht — eine sich selbst schließende Kontaktseite wäre
  // das Gegenteil des Ziels.
  timer = step.last ? null : setTimeout(() => goToStep(index + 1), STEP_MS);
}

function buildOverlay() {
  overlayEl = document.createElement("div");
  overlayEl.className = "tour-overlay";
  document.querySelector(".desktop")?.appendChild(overlayEl);
}

function renderCaption(step, index) {
  if (!overlayEl) return;
  const dots = TOUR_STEPS.map(
    (_, i) => `<span class="tour-dot${i === index ? " is-active" : ""}" aria-hidden="true"></span>`
  ).join("");
  overlayEl.innerHTML = `
    <div class="tour-caption" role="status">
      <p class="tour-kicker">${escapeHtml(step.kicker)}</p>
      <p class="tour-text">${escapeHtml(step.caption)}</p>
      <div class="tour-controls">
        <span class="tour-dots">${dots}</span>
        <span class="tour-spacer"></span>
        ${step.last
          ? `<button type="button" class="tour-btn tour-btn--primary" data-tour="end">Tour beenden ✓</button>`
          : `<button type="button" class="tour-btn tour-btn--primary" data-tour="next">Weiter →</button>`}
        <button type="button" class="tour-btn" data-tour="stop" aria-label="Tour abbrechen">×</button>
      </div>
    </div>
  `;
  overlayEl.querySelector('[data-tour="next"]')?.addEventListener("click", () => goToStep(stepIndex + 1));
  overlayEl.querySelector('[data-tour="end"]')?.addEventListener("click", stopTour);
  overlayEl.querySelector('[data-tour="stop"]').addEventListener("click", stopTour);
}

// Für Unit-Tests: die Schrittliste ist Daten, keine UI.
export { TOUR_STEPS };
