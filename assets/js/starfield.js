const STAR_COLOR_RGB = "231, 228, 245";
const FIELD_WIDTH = 2200;
const FIELD_HEIGHT = 1400;

const LAYERS = [
  { className: "star-layer--far", count: 90, opacity: 0.45, maxShift: 4 },
  { className: "star-layer--mid", count: 55, opacity: 0.65, maxShift: 9 },
  { className: "star-layer--near", count: 28, opacity: 0.85, maxShift: 16 }
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
    shadows.push(`${x}px ${y}px 0 rgba(${STAR_COLOR_RGB}, ${opacity})`);
  }
  return shadows.join(", ");
}
