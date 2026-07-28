const FIELD_WIDTH = 2200;
const FIELD_HEIGHT = 1400;

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
