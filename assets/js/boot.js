import { completeBoot } from "./state.js";

const GENERIC_LINES = [
  "[ OK ] neural-link.service gestartet",
  "[ OK ] netzwerk-graph geladen",
  "[ OK ] projekt-index initialisiert"
];

const MAX_PROJECT_LINES = 6;
const PROMPT_LINE = "[ .. ] warte auf Nutzereingabe_";

const TYPE_INTERVAL_MS = 10;
const LINE_PAUSE_MS = 80;
const FINISH_PAUSE_MS = 500;

function buildBootLines(projects) {
  const projectLines = projects
    .slice(0, MAX_PROJECT_LINES)
    .map((project) => `[ OK ] Projekt geladen: ${project.title}`);
  return [...GENERIC_LINES, ...projectLines, PROMPT_LINE];
}

export function initBoot(overlay, projects) {
  const lines = buildBootLines(projects);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  overlay.innerHTML = "";
  overlay.setAttribute("role", "status");

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
  document.addEventListener("keydown", finish, { signal: controller.signal });

  if (prefersReducedMotion) {
    lines.forEach((line) => {
      const lineEl = document.createElement("div");
      lineEl.className = "boot-line";
      lineEl.textContent = line;
      overlay.appendChild(lineEl);
    });
    setTimeout(finish, FINISH_PAUSE_MS);
    return;
  }

  typeLines(overlay, lines, controller.signal, finish);
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

    const lineEl = document.createElement("div");
    lineEl.className = "boot-line";
    overlay.appendChild(lineEl);

    const text = lines[lineIndex];
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
