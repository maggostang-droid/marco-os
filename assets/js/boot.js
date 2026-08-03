import { completeBoot } from "./state.js";
import { bootLogo, bootInfoLines, bootStatusLines, bootPromptLine, countDemos } from "../../data/boot.js";

// ASCII-Logo + Neofetch-artiger Systeminfo-Block (siehe docs/superpowers/
// specs/2026-07-30-wow-features-design.md). Der Text liegt in data/boot.js,
// weil das v3-Frontend denselben Boot fährt; hier steht nur noch, WIE die
// Zeilen gerendert werden. Logo/Info erscheinen zeilenweise "instant" (kein
// Typewriter pro Zeichen), damit die Boot-Dauer nicht wächst.
//
// Nebenbei behoben durch die Zusammenlegung: die frühere Fassung dieses
// Files hatte in der vierten Logo-Zeile einen Backslash zu viel, wodurch das
// ASCII-Logo ab dort um ein Zeichen verschoben war.

// Timing gestrafft (Feedback: Boot dauerte ~5,5s — zu lang für Recruiter).
// Statt einer [ OK ]-Zeile pro Projekt gibt es eine Sammelzeile; zusammen
// mit schnellerem Typewriter und kürzeren Pausen landet der Boot bei ~1,5s,
// bleibt aber jederzeit per Klick/Taste überspringbar (Hinweis unten im
// Overlay, siehe .boot-skip-hint).
const TYPE_INTERVAL_MS = 4;
const LINE_PAUSE_MS = 40;
const INSTANT_LINE_PAUSE_MS = 25;
const FINISH_PAUSE_MS = 300;

// Zeilen sind {text, className?, instant?} — Logo/Info rendern instant
// (eine Zeile pro Tick), die [ OK ]-Zeilen behalten den Typewriter.
function buildBootLines(projects) {
  const logo = bootLogo.map((text) => ({ text, className: "boot-line boot-line--logo", instant: true }));
  const info = bootInfoLines(projects).map((text) => ({ text, className: "boot-line boot-line--info", instant: true }));
  const projectSummary = { text: `[ OK ] ${projects.length} Projekte geladen · ${countDemos(projects)} Live-Demos bereit` };
  const generic = bootStatusLines.map((text) => ({ text }));
  return [...logo, ...info, ...generic, projectSummary, { text: bootPromptLine }];
}

export function initBoot(overlay, projects) {
  const lines = buildBootLines(projects);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  overlay.innerHTML = "";
  overlay.setAttribute("aria-hidden", "true");

  // Sichtbarer Skip-Hinweis von der ersten Millisekunde an — der Boot war
  // schon immer überspringbar, aber niemand wusste es, bevor die letzte
  // Zeile ("warte auf Nutzereingabe_") erschien.
  const skipHint = document.createElement("div");
  skipHint.className = "boot-skip-hint";
  skipHint.textContent = "▸ Klick oder Taste überspringt";
  overlay.appendChild(skipHint);

  // Let the initial opaque background paint first, then trigger the
  // background-color transition to transparent (see .boot-overlay.is-fading
  // in style.css) so the desktop behind the overlay gradually becomes
  // visible while the boot lines are still typing.
  requestAnimationFrame(() => overlay.classList.add("is-fading"));

  const controller = new AbortController();
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    controller.abort();
    overlay.remove();
    completeBoot();
  };

  overlay.addEventListener("click", finish, { signal: controller.signal });
  document.addEventListener(
    "keydown",
    (event) => {
      // Der Skip-Tastendruck gehört dem Boot allein: ohne
      // stopImmediatePropagation liefe z.B. ein Escape anschließend in den
      // Escape-Handler des window-managers und würde ein per Deep-Link
      // (#projekt-id) gerade geöffnetes Fenster sofort wieder schließen.
      // Funktioniert, weil initBoot vor initWindowManager registriert
      // (main.js-Reihenfolge) und der Listener nach dem Boot abgemeldet ist.
      event.stopImmediatePropagation();
      finish();
    },
    { signal: controller.signal }
  );

  if (prefersReducedMotion) {
    lines.forEach((line) => {
      overlay.appendChild(makeLineEl(line));
    });
    setTimeout(finish, FINISH_PAUSE_MS);
    return;
  }

  typeLines(overlay, lines, controller.signal, finish);
}

function makeLineEl(line) {
  const lineEl = document.createElement("div");
  lineEl.className = line.className ?? "boot-line";
  lineEl.textContent = line.text;
  return lineEl;
}

function typeLines(overlay, lines, signal, finish) {
  let lineIndex = 0;

  typeNextLine();

  function typeNextLine() {
    if (signal.aborted) return;
    if (lineIndex >= lines.length) {
      setTimeout(finish, FINISH_PAUSE_MS);
      return;
    }

    const line = lines[lineIndex];

    if (line.instant) {
      overlay.appendChild(makeLineEl(line));
      lineIndex += 1;
      setTimeout(typeNextLine, INSTANT_LINE_PAUSE_MS);
      return;
    }

    const lineEl = document.createElement("div");
    lineEl.className = line.className ?? "boot-line";
    overlay.appendChild(lineEl);

    const text = line.text;
    let charIndex = 0;
    typeNextChar();

    function typeNextChar() {
      if (signal.aborted) return;
      if (charIndex >= text.length) {
        lineIndex += 1;
        setTimeout(typeNextLine, LINE_PAUSE_MS);
        return;
      }
      lineEl.textContent += text[charIndex];
      charIndex += 1;
      setTimeout(typeNextChar, TYPE_INTERVAL_MS);
    }
  }
}
