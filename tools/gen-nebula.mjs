// Generiert den Nebula-Block in assets/css/style.css (zwischen den Markern
// "Nebula (Start)" und "Nebula (Ende)"). Tuning: Werte unten in P anpassen,
// dann aus dem Repo-Root ausführen:  node tools/gen-nebula.mjs
// Hintergrund: die Wolken sind feTurbulence-SVGs als Data-URLs — von Hand
// unlesbar/uneditierbar, darum dieser Generator statt Direkt-Edits im CSS.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CSS_PATH = fileURLToPath(new URL("../assets/css/style.css", import.meta.url));

// --- tuning ---------------------------------------------------------------
const P = {
  violet: {
    rgb: [167, 139, 250],
    baseFreq: "0.0052 0.0074",
    octaves: 5,
    seed: 8,
    alphaScale: 1.6,
    alphaOffset: -0.54,
    gamma: 1.35,
    opacity: 0.6,
    mask: "radial-gradient(ellipse 67% 59% at 31% 33%, #000 0%, transparent 78%)"
  },
  teal: {
    rgb: [94, 234, 212],
    baseFreq: "0.0044 0.0066",
    octaves: 5,
    seed: 27,
    alphaScale: 1.5,
    alphaOffset: -0.52,
    gamma: 1.4,
    opacity: 0.5,
    mask: "radial-gradient(ellipse 69% 60% at 74% 72%, #000 0%, transparent 80%)"
  },
  amber: "radial-gradient(ellipse 22% 17% at 78% 22%, rgba(251, 191, 36, .07), transparent 70%)",
  // Die frueheren .graph-viewport-Washes, in Layer-Koordinaten umgerechnet
  // (Layer spannt -35%..135% des Viewports): beim Zoom-out endeten sie sonst
  // sichtbar als helles Rechteck an den Viewport-Elementkanten.
  washViolet: "radial-gradient(ellipse 60% 60% at 38% 38%, rgba(167, 139, 250, .26), transparent 65%)",
  washTeal: "radial-gradient(ellipse 50% 50% at 71% 71%, rgba(94, 234, 212, .18), transparent 60%)"
};
// --------------------------------------------------------------------------

function nebulaSvgUrl({ rgb, baseFreq, octaves, seed, alphaScale, alphaOffset, gamma }) {
  const [r, g, b] = rgb.map((v) => (v / 255).toFixed(3));
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='620'>` +
    `<filter id='n' x='-10%' y='-10%' width='120%' height='120%' color-interpolation-filters='sRGB'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${baseFreq}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix type='matrix' values='0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 ${alphaScale} ${alphaOffset}'/>` +
    `<feComponentTransfer><feFuncA type='gamma' amplitude='1' exponent='${gamma}' offset='0'/></feComponentTransfer>` +
    `</filter>` +
    `<rect width='100%' height='100%' filter='url(%23n)'/>` +
    `</svg>`;
  const encoded = svg
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E")
    .replaceAll("#", "%23")
    .replaceAll(" ", "%20");
  return `url("data:image/svg+xml,${encoded}")`;
}

const block = `/* --- Nebula (Start) — wolkige Nebelschwaden hinter dem Sternfeld ---------
   Vom starfield.js als unterste Ebene in .graph-viewport geprepended und mit
   der kleinsten Maus-Parallax bewegt. Zwei feTurbulence-Wolkenschichten als
   Inline-SVG-Data-URLs (Violett oben links, Teal unten rechts) — wie der
   Grain auf .desktop: keine Bild-Assets, kein CDN, aufloesungsunabhaengig.
   CSS-Masken begrenzen jede Schicht auf ihre Ecke, damit die Bildmitte
   (Zentrum, Labels) ruhig bleibt; ein Hauch Amber liegt statisch oben
   rechts auf dem Layer selbst. Der ultra-langsame Drift (~2,5 min bzw.
   ~3 min pro Halbzyklus, gegenlaeufig) sitzt auf den Pseudo-Elementen,
   die Parallax-Translation auf dem Layer-Div — so ueberschreiben sich
   Keyframe-Transform und Inline-Transform aus starfield.js nicht.
   Drift nur hinter prefers-reduced-motion. NICHT von Hand editieren:
   Block wird von tools/gen-nebula.mjs generiert (Tuning-Werte dort). */
.nebula-layer {
  position: absolute;
  /* -35% statt z.B. -22%: die Taskbar erlaubt Zoom-out bis 0.6 (MIN_ZOOM in
     state.js), und der Layer skaliert als Viewport-Kind mit. 170% Kantenlaenge
     x 0.6 = 102% — deckt den Bildschirm auch voll ausgezoomt noch ab, sonst
     staenden die Turbulence-Kanten als Saum im Bild. */
  inset: -35%;
  pointer-events: none;
  background:
    ${P.amber},
    ${P.washViolet},
    ${P.washTeal};
}
.nebula-layer::before,
.nebula-layer::after {
  content: "";
  position: absolute;
  inset: -8%;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
.nebula-layer::before {
  background-image: ${nebulaSvgUrl(P.violet)};
  opacity: ${P.violet.opacity};
  -webkit-mask-image: ${P.violet.mask};
  mask-image: ${P.violet.mask};
}
.nebula-layer::after {
  background-image: ${nebulaSvgUrl(P.teal)};
  opacity: ${P.teal.opacity};
  mix-blend-mode: screen;
  -webkit-mask-image: ${P.teal.mask};
  mask-image: ${P.teal.mask};
}
@media (prefers-reduced-motion: no-preference) {
  .nebula-layer {
    transition: transform 0.3s ease-out;
  }
  .nebula-layer::before {
    animation: nebulaDriftA 150s ease-in-out infinite alternate;
  }
  .nebula-layer::after {
    animation: nebulaDriftB 190s ease-in-out infinite alternate;
  }
}
@keyframes nebulaDriftA {
  from { transform: translate3d(-1.4%, -1%, 0) scale(1); }
  to { transform: translate3d(1.4%, 1%, 0) scale(1.06); }
}
@keyframes nebulaDriftB {
  from { transform: translate3d(1.2%, 0.8%, 0) scale(1.05); }
  to { transform: translate3d(-1.2%, -0.8%, 0) scale(1); }
}
/* --- Nebula (Ende) ------------------------------------------------------ */`;

const css = readFileSync(CSS_PATH, "utf8");
const START = "/* --- Nebula (Start)";
const END = "/* --- Nebula (Ende) ------------------------------------------------------ */";
let next;
if (css.includes(START)) {
  const a = css.indexOf(START);
  const b = css.indexOf(END) + END.length;
  next = css.slice(0, a) + block + css.slice(b);
} else {
  const anchor = ".graph-viewport {";
  const a = css.indexOf(anchor);
  if (a === -1) throw new Error("anchor not found");
  next = css.slice(0, a) + block + "\n\n" + css.slice(a);
}
writeFileSync(CSS_PATH, next);
console.log("nebula block written, css bytes:", next.length);
