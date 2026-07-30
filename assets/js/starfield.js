import { subscribe, state, resolveFocusedNodeId } from "./state.js";
import { FOCUS_ZOOM_BONUS } from "./scene.js";

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

// zoomExponent: wie stark die Schicht den Fokus-/Taskbar-Zoom GEGENLÄUFIG
// kompensiert (Kamera-Dolly statt Digitalzoom): 0 = zoomt 1:1 mit dem
// Graphen mit, 1 = bleibt exakt stehen. Ferne Schichten stehen fast still,
// nahe bewegen sich spürbar mit — das erzeugt echte Tiefe beim Fokussieren.
const LAYERS = [
  { className: "star-layer--far", count: 210, opacity: 0.6, maxShift: 6, zoomExponent: 0.85 },
  { className: "star-layer--mid", count: 130, opacity: 0.8, maxShift: 13, zoomExponent: 0.6 },
  { className: "star-layer--near", count: 65, opacity: 1, maxShift: 22, zoomExponent: 0.35 }
];

// Nebula-Parallax: kleiner als der fernste Sternlayer (maxShift 6), damit
// die Wolken als tiefste Ebene hinter allen Sternen lesen.
const NEBULA_MAX_SHIFT = 4;
const NEBULA_ZOOM_EXPONENT = 0.9;

// Funkel-Schicht: wenige individuelle Sterne mit eigenem Schimmern —
// bewusst sparsam (die dichte Kulisse liefern weiter die box-shadow-Layer,
// 405 Sterne in 3 DOM-Elementen; 15 animierte Divs sind billig, 405 nicht).
const TWINKLE_COUNT = 20;
const TWINKLE_MAX_SHIFT = 16;
const TWINKLE_ZOOM_EXPONENT = 0.5;
// Gelegentliches Aufflackern eines einzelnen Funkel-Sterns ("Pulsar").
const FLARE_MIN_GAP_MS = 16000;
const FLARE_MAX_GAP_MS = 34000;
const FLARE_DURATION_MS = 1300;

// Sternschnuppen: Abstand zufällig in diesem Fenster, damit sie als
// seltener Delight-Moment lesen und nicht als Dauer-Animation.
const SHOOTING_STAR_MIN_GAP_MS = 8000;
const SHOOTING_STAR_MAX_GAP_MS = 22000;

// Cursor-Konstellationen: unsichtbare Ankerpunkte, die sich in Maus-Nähe
// kurz zu einem flüchtigen Netz verbinden — Echo der Portfolio-Metapher.
const CONSTELLATION_ANCHORS = 72;
const CONSTELLATION_CURSOR_RADIUS = 190;
const CONSTELLATION_LINK_DIST = 130;
const CONSTELLATION_IDLE_MS = 1800;

export function initStarfield(container) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const layers = LAYERS.map((layer) => {
    const el = document.createElement("div");
    el.className = `star-layer ${layer.className}`;
    el.style.boxShadow = randomStarShadow(layer.count, layer.opacity);
    container.prepend(el);
    return { el, maxShift: layer.maxShift, zoomExponent: layer.zoomExponent, parallaxX: 0, parallaxY: 0 };
  });

  // Funkel-Schicht liegt über den statischen Sternlayern (nach ihnen
  // geprepended wäre sie dahinter — darum append vor dem Nebula-Prepend
  // unkritisch; sie soll ohnehin über far/mid lesen).
  const twinkle = buildTwinkleLayer(prefersReducedMotion);
  container.prepend(twinkle.el);
  layers.push({ el: twinkle.el, maxShift: TWINKLE_MAX_SHIFT, zoomExponent: TWINKLE_ZOOM_EXPONENT, parallaxX: 0, parallaxY: 0 });

  // Nach den Sternlayern geprepended → DOM-Index 0 → wird zuerst gemalt,
  // liegt also hinter allen Sternen. Bewusst VOR dem reduced-motion-Return
  // erzeugt: auch ohne Animationen soll die (dann statische) Nebula sichtbar
  // sein — ihre Drift-/Fade-Keyframes sind separat in CSS hinter
  // prefers-reduced-motion gegated (siehe .nebula-layer in style.css).
  // Die Kind-Klassen müssen zum von tools/gen-nebula.mjs generierten
  // CSS-Block passen: je Farbfamilie zwei Morph-Schichten + Aurora.
  const NEBULA_CHILD_CLASSES = [
    "nebula-cloud nebula-cloud--violet-a",
    "nebula-cloud nebula-cloud--violet-b",
    "nebula-cloud nebula-cloud--teal-a",
    "nebula-cloud nebula-cloud--teal-b",
    "nebula-aurora"
  ];
  const nebula = document.createElement("div");
  nebula.className = "nebula-layer";
  for (const className of NEBULA_CHILD_CLASSES) {
    const child = document.createElement("div");
    child.className = className;
    nebula.appendChild(child);
  }
  container.prepend(nebula);

  // Vordergrund-Schwaden: VOR den Sternen, aber HINTER dem Graphen —
  // darum vor .graph-content eingefügt statt geprepended. Höchster
  // Parallax-Shift (näher als die nächste Sternschicht) und kleinster
  // Zoom-Exponent: die vorderste Ebene bewegt sich am stärksten mit.
  const foreground = document.createElement("div");
  foreground.className = "nebula-foreground";
  const graphContent = container.querySelector(".graph-content");
  if (graphContent) {
    container.insertBefore(foreground, graphContent);
  } else {
    container.appendChild(foreground);
  }
  layers.push({ el: foreground, maxShift: 30, zoomExponent: 0.2, parallaxX: 0, parallaxY: 0 });
  layers.push({ el: nebula, maxShift: NEBULA_MAX_SHIFT, zoomExponent: NEBULA_ZOOM_EXPONENT, parallaxX: 0, parallaxY: 0 });

  // Ein gemeinsamer Transform pro Schicht: Maus-Parallax (translate) ×
  // Zoom-Kompensation (scale). Beides in einer Funktion, damit sich die
  // Inline-Transforms nicht gegenseitig überschreiben.
  const applyLayerTransforms = () => {
    const effectiveZoom = currentEffectiveZoom();
    layers.forEach((layer) => {
      const scale = Math.pow(effectiveZoom, -layer.zoomExponent).toFixed(4);
      layer.el.style.transform = `translate(${layer.parallaxX}px, ${layer.parallaxY}px) scale(${scale})`;
    });
  };
  applyLayerTransforms();
  subscribe(applyLayerTransforms);

  if (prefersReducedMotion) return;

  container.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    layers.forEach((layer) => {
      layer.parallaxX = Number((relX * 2 * layer.maxShift).toFixed(1));
      layer.parallaxY = Number((relY * 2 * layer.maxShift).toFixed(1));
    });
    applyLayerTransforms();
  });

  initFlares(twinkle.stars);
  initShootingStars(container);
  initConstellations(container);
}

// Effektiver Zoom wie in scene.js: Taskbar-Zoom × Fokus-Bonus, sobald ein
// echter Graph-Knoten fokussiert ist (Terminal -> resolveFocusedNodeId null).
function currentEffectiveZoom() {
  const focused = resolveFocusedNodeId(state.activeProjectId);
  return state.zoomLevel * (focused ? FOCUS_ZOOM_BONUS : 1);
}

function buildTwinkleLayer(prefersReducedMotion) {
  const el = document.createElement("div");
  el.className = "twinkle-layer";
  const stars = [];
  for (let i = 0; i < TWINKLE_COUNT; i += 1) {
    const star = document.createElement("div");
    star.className = "twinkle-star";
    const x = Math.floor(Math.random() * FIELD_WIDTH) - FIELD_WIDTH / 2;
    const y = Math.floor(Math.random() * FIELD_HEIGHT) - FIELD_HEIGHT / 2;
    const size = 3 + Math.random() * 2.5;
    star.style.width = `${size.toFixed(1)}px`;
    star.style.height = `${size.toFixed(1)}px`;
    star.style.translate = `${x}px ${y}px`;
    star.style.setProperty("--tw-rgb", randomStarColor());
    if (!prefersReducedMotion) {
      star.style.setProperty("--tw-dur", `${(2.8 + Math.random() * 3.4).toFixed(1)}s`);
      star.style.setProperty("--tw-delay", `${(-Math.random() * 6).toFixed(1)}s`);
    }
    el.appendChild(star);
    stars.push(star);
  }
  return { el, stars };
}

// Alle 16–34s flackert ein zufälliger Funkel-Stern kurz hell auf.
function initFlares(stars) {
  const scheduleNext = () => {
    const gap = FLARE_MIN_GAP_MS + Math.random() * (FLARE_MAX_GAP_MS - FLARE_MIN_GAP_MS);
    setTimeout(flare, gap);
  };
  const flare = () => {
    if (!document.hidden && state.bootComplete) {
      const star = stars[Math.floor(Math.random() * stars.length)];
      star.classList.add("is-flaring");
      setTimeout(() => star.classList.remove("is-flaring"), FLARE_DURATION_MS);
    }
    scheduleNext();
  };
  scheduleNext();
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

// --- Cursor-Konstellationen ------------------------------------------------
// Eigenes Canvas-Overlay ÜBER der Szene (Position siehe .constellation-canvas
// in style.css), das eigene, sonst unsichtbare Ankerpunkte in Maus-Nähe
// aufleuchten lässt und paarweise verbindet. Bewusst NICHT an die echten
// box-shadow-Sterne gekoppelt: die leben in gezoomten/parallaxten Layern,
// deren Screen-Positionen hier nachzurechnen hieße, die halbe scene.js zu
// duplizieren — zwischen hunderten echten Sternen fällt nicht auf, dass die
// verbundenen Punkte eigene sind. Nur Desktop (mousemove), nie bei offenem
// Fenster (Scrim), rAF-Loop läuft nur solange Energie im System ist.
function initConstellations(container) {
  const scene = container.parentElement;
  if (!scene) return;

  const canvas = document.createElement("canvas");
  canvas.className = "constellation-canvas";
  scene.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // Anker als Viewport-BRUCHTEILE — überleben jeden Resize ohne Neuberechnung.
  const anchors = Array.from({ length: CONSTELLATION_ANCHORS }, () => ({
    fx: Math.random(),
    fy: Math.random()
  }));

  let width = 0;
  let height = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    width = scene.clientWidth;
    height = scene.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  let mouseX = -9999;
  let mouseY = -9999;
  let lastMove = 0;
  let energy = 0;
  let rafId = null;

  const tick = () => {
    rafId = null;
    const idle = performance.now() - lastMove > CONSTELLATION_IDLE_MS;
    const windowOpen = Boolean(state.activeProjectId);
    const target = idle || windowOpen || !state.bootComplete ? 0 : 1;
    energy += (target - energy) * 0.12;

    ctx.clearRect(0, 0, width, height);

    if (energy > 0.01) {
      const near = [];
      for (const anchor of anchors) {
        const ax = anchor.fx * width;
        const ay = anchor.fy * height;
        const d = Math.hypot(ax - mouseX, ay - mouseY);
        if (d < CONSTELLATION_CURSOR_RADIUS) near.push({ ax, ay, proximity: 1 - d / CONSTELLATION_CURSOR_RADIUS });
      }
      for (const point of near) {
        ctx.beginPath();
        ctx.arc(point.ax, point.ay, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 234, 212, ${(0.85 * point.proximity * energy).toFixed(3)})`;
        ctx.fill();
      }
      for (let i = 0; i < near.length; i += 1) {
        for (let j = i + 1; j < near.length; j += 1) {
          const a = near[i];
          const b = near[j];
          const d = Math.hypot(a.ax - b.ax, a.ay - b.ay);
          if (d > CONSTELLATION_LINK_DIST) continue;
          const alpha = 0.65 * (1 - d / CONSTELLATION_LINK_DIST) * Math.min(a.proximity, b.proximity) * energy;
          ctx.beginPath();
          ctx.moveTo(a.ax, a.ay);
          ctx.lineTo(b.ax, b.ay);
          ctx.strokeStyle = `rgba(231, 228, 245, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      rafId = requestAnimationFrame(tick);
    }
  };

  const wake = () => {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  };

  scene.addEventListener("mousemove", (event) => {
    const rect = scene.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    lastMove = performance.now();
    wake();
  });
  scene.addEventListener("mouseleave", () => {
    lastMove = 0;
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
