import { completeBoot } from "./state.js";

const BOOT_LINES = [
  "[ OK ] neural-link.service gestartet",
  "[ OK ] netzwerk-graph geladen",
  "[ .. ] warte auf Nutzereingabe_"
];

export function initBoot(overlay, { durationMs = 1800 } = {}) {
  overlay.innerHTML = BOOT_LINES.map((line) => `<div class="boot-line">${line}</div>`).join("");
  overlay.setAttribute("role", "status");

  const finish = () => {
    overlay.remove();
    completeBoot();
  };

  const timer = setTimeout(finish, durationMs);

  overlay.addEventListener("click", () => {
    clearTimeout(timer);
    finish();
  });
  document.addEventListener(
    "keydown",
    () => {
      clearTimeout(timer);
      finish();
    },
    { once: true }
  );
}
