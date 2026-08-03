import { subscribe, state, focusProject, RESUME_ID } from "./state.js";
import { escapeHtml } from "./html-utils.js";
import { tourWithResumeId } from "../../data/tour.js";

// Geführte Tour (Paket 2, Spec 2026-07-30-wow-features-design.md). Die
// Schrittliste liegt in data/tour.js, weil das v3-Frontend dieselbe Tour
// fährt; hier wird nur der lokale RESUME_ID-Sentinel eingesetzt.
const TOUR_STEPS = tourWithResumeId(RESUME_ID);

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
