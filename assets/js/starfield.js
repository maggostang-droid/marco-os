import { subscribe, state } from "./state.js";

const FIELD_WIDTH = 2200;
const FIELD_HEIGHT = 1400;

// Sternschnuppen: Abstand zufällig in diesem Fenster, damit sie als
// seltener Delight-Moment lesen und nicht als Dauer-Animation.
const SHOOTING_STAR_MIN_GAP_MS = 8000;
const SHOOTING_STAR_MAX_GAP_MS = 22000;

// Mostly the original pale white, with occasional tinted stars picked from
// the UI accent palette (violet/teal/amber) so the field reads as colorful
// without looking like confetti.
const STAR_COLORS = [
  { rgb: "231, 228, 245", weight: 0.4 },
  { rgb: "167, 139, 250", weight: 0.22 },
  { rgb: "94, 234, 212", weight: 0.2 },
  { rgb: "251, 191, 36", weight: 0.18 }
];

const LAYERS = [
  { className: "star-layer--far", count: 210, opacity: 0.6, maxShift: 6 },
  { className: "star-layer--mid", count: 130, opacity: 0.8, maxShift: 13 },
  { className: "star-layer--near", count: 65, opacity: 1, maxShift: 22 }
];

export function initStarfield(container) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const layers = LAYERS.map((layer) => {
    const el = document.createElement("div");
    el.className = `star-layer ${layer.className}`;
    el.style.boxShadow = randomStarShadow(layer.count, layer.opacity);
    container.prepend(el);
    return { el, maxShift: layer.maxShift };
  });

  if (prefersReducedMotion) return;

  container.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    layers.forEach(({ el, maxShift }) => {
      const x = (relX * 2 * maxShift).toFixed(1);
      const y = (relY * 2 * maxShift).toFixed(1);
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
  });

  initShootingStars(container);
}

// Gelegentliche Sternschnuppe: ein Streak-Div mit einmaliger CSS-Animation
// (Entfernen bei animationend), gestartet erst nach der Boot-Sequenz und
// nie in versteckten Tabs. Läuft im selben zoom/pan-Container wie die
// Sternlayer, wirkt also als Teil des Himmels, nicht als UI-Overlay.
function initShootingStars(container) {
  let scheduled = false;

  const scheduleNext = () => {
    const gap =
      SHOOTING_STAR_MIN_GAP_MS + Math.random() * (SHOOTING_STAR_MAX_GAP_MS - SHOOTING_STAR_MIN_GAP_MS);
    setTimeout(spawn, gap);
  };

  const spawn = () => {
    if (document.hidden) {
      scheduleNext();
      return;
    }
    const star = document.createElement("div");
    star.className = "shooting-star";
    // Start irgendwo im oberen/mittleren Bereich, Flugrichtung schräg nach
    // unten rechts (Winkel via CSS-Var, damit die Keyframes generisch bleiben).
    const startX = Math.random() * 70 + 5; // 5–75 % Breite
    const startY = Math.random() * 45 + 5; // 5–50 % Höhe
    const angle = 20 + Math.random() * 25; // 20–45 Grad
    star.style.left = `${startX}%`;
    star.style.top = `${startY}%`;
    star.style.setProperty("--star-angle", `${angle}deg`);
    star.addEventListener("animationend", () => star.remove());
    container.appendChild(star);
    scheduleNext();
  };

  const startWhenRevealed = () => {
    if (scheduled || !state.bootComplete) return;
    scheduled = true;
    scheduleNext();
  };

  startWhenRevealed();
  subscribe(startWhenRevealed);
}

function randomStarShadow(count, opacity) {
  const shadows = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(Math.random() * FIELD_WIDTH) - FIELD_WIDTH / 2;
    const y = Math.floor(Math.random() * FIELD_HEIGHT) - FIELD_HEIGHT / 2;
    shadows.push(`${x}px ${y}px 0 rgba(${randomStarColor()}, ${opacity})`);
  }
  return shadows.join(", ");
}

function randomStarColor() {
  const roll = Math.random();
  let cumulative = 0;
  for (const { rgb, weight } of STAR_COLORS) {
    cumulative += weight;
    if (roll < cumulative) return rgb;
  }
  return STAR_COLORS[0].rgb;
}
