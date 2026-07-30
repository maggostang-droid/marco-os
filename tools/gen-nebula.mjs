// Generiert den Nebula-Block in assets/css/style.css (zwischen den Markern
// "Nebula (Start)" und "Nebula (Ende)"). Tuning: Werte unten in P anpassen,
// dann aus dem Repo-Root ausführen:  node tools/gen-nebula.mjs
// Hintergrund: die Wolken sind feTurbulence-SVGs als Data-URLs — von Hand
// unlesbar/uneditierbar, darum dieser Generator statt Direkt-Edits im CSS.
//
// Seit dem Animations-Ausbau (Atmen + Morphing + Aurora) rendern die Wolken
// in echten Kind-Divs statt in ::before/::after: pro Farbfamilie ZWEI
// Schichten mit unterschiedlichem Turbulenz-Seed, die sich gegenphasig
// überblenden — die Wolkenformen scheinen sich dadurch langsam zu
// verändern statt nur zu verschieben. Die Kinder legt starfield.js an
// (NEBULA_CHILD_CLASSES dort muss zu den Klassen hier passen).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CSS_PATH = fileURLToPath(new URL("../assets/css/style.css", import.meta.url));

// --- tuning ---------------------------------------------------------------
const P = {
  violet: {
    rgb: [167, 139, 250],
    baseFreq: "0.0052 0.0074",
    octaves: 5,
    seedA: 8,
    seedB: 41,
    alphaScale: 1.6,
    alphaOffset: -0.54,
    gamma: 1.35,
    // Gipfel-/Tal-Deckkraft des Atem-/Morph-Zyklus (vorher statisch 0.6).
    opacityPeak: 0.58,
    opacityTrough: 0.08,
    fadeDurS: 52,
    driftDurS: 74,
    mask: "radial-gradient(ellipse 67% 59% at 31% 33%, #000 0%, transparent 78%)"
  },
  teal: {
    rgb: [94, 234, 212],
    baseFreq: "0.0044 0.0066",
    octaves: 5,
    seedA: 27,
    seedB: 63,
    alphaScale: 1.5,
    alphaOffset: -0.52,
    gamma: 1.4,
    opacityPeak: 0.48,
    opacityTrough: 0.06,
    // Andere Zykluslängen als violet: die Farbfamilien atmen dadurch
    // gegeneinander versetzt statt im Gleichtakt.
    fadeDurS: 64,
    driftDurS: 88,
    mask: "radial-gradient(ellipse 69% 60% at 74% 72%, #000 0%, transparent 80%)"
  },
  // Aurora-Schleier: seidiges Gradient-Band im oberen Himmel, wandert sehr
  // langsam wellenförmig. Bewusst scheu (effektive Deckkraft ~.1) — einen
  // Tick zu stark und es kippt ins Kitschige.
  aurora: {
    opacity: 0.55,
    waveDurS: 150
  },
  amber: "radial-gradient(ellipse 22% 17% at 78% 22%, rgba(251, 191, 36, .07), transparent 70%)",
  // Die frueheren .graph-viewport-Washes, in Layer-Koordinaten umgerechnet
  // (Layer spannt -35%..135% des Viewports): beim Zoom-out endeten sie sonst
  // sichtbar als helles Rechteck an den Viewport-Elementkanten.
  washViolet: "radial-gradient(ellipse 60% 60% at 38% 38%, rgba(167, 139, 250, .26), transparent 65%)",
  washTeal: "radial-gradient(ellipse 50% 50% at 71% 71%, rgba(94, 234, 212, .18), transparent 60%)"
};
// --------------------------------------------------------------------------

function nebulaSvgUrl({ rgb, baseFreq, octaves, alphaScale, alphaOffset, gamma }, seed) {
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

// Eine Wolken-Familie = zwei Schichten (Seed A/B), die per nebulaFade
// gegenphasig überblenden (B startet mit halbem Zyklus Versatz) und leicht
// unterschiedlich driften — zusammen liest sich das als morphender Nebel,
// der zugleich "atmet".
function cloudFamilyCss(name, cfg, driftA, driftB) {
  return `.nebula-cloud--${name}-a,
.nebula-cloud--${name}-b {
  background-repeat: no-repeat;
  background-size: 100% 100%;
  -webkit-mask-image: ${cfg.mask};
  mask-image: ${cfg.mask};
  --fade-peak: ${cfg.opacityPeak};
  --fade-trough: ${cfg.opacityTrough};
  opacity: var(--fade-peak);
}
.nebula-cloud--${name}-a {
  background-image: ${nebulaSvgUrl(cfg, cfg.seedA)};
}
.nebula-cloud--${name}-b {
  background-image: ${nebulaSvgUrl(cfg, cfg.seedB)};
  /* Ohne Animation (reduced-motion) bleibt nur Schicht A sichtbar. */
  opacity: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .nebula-cloud--${name}-a {
    animation:
      nebulaFade ${cfg.fadeDurS}s ease-in-out infinite,
      ${driftA} ${cfg.driftDurS}s ease-in-out infinite alternate;
  }
  .nebula-cloud--${name}-b {
    animation:
      nebulaFade ${cfg.fadeDurS}s ease-in-out ${-cfg.fadeDurS / 2}s infinite,
      ${driftB} ${cfg.driftDurS}s ease-in-out ${-cfg.driftDurS / 2}s infinite alternate;
    opacity: var(--fade-trough);
  }
}`;
}

const block = `/* --- Nebula (Start) — wolkige Nebelschwaden hinter dem Sternfeld ---------
   Vom starfield.js als unterste Ebene in .graph-viewport geprepended und mit
   der kleinsten Maus-Parallax bewegt. Pro Farbfamilie (Violett oben links,
   Teal unten rechts) ZWEI feTurbulence-Schichten mit verschiedenem Seed als
   Kind-Divs (angelegt von starfield.js, NEBULA_CHILD_CLASSES): sie blenden
   gegenphasig ineinander (nebulaFade) und driften leicht unterschiedlich —
   die Wolkenformen morphen und "atmen", statt sich nur zu verschieben.
   Dazu ein seidiger Aurora-Schleier im oberen Himmel (nebulaAuroraWave)
   und ein statischer Hauch Amber. Alle Animationen nur transform/opacity
   (compositor-freundlich) und hinter prefers-reduced-motion — ohne
   Animation bleibt je Familie Schicht A statisch sichtbar.
   NICHT von Hand editieren: Block wird von tools/gen-nebula.mjs generiert
   (Tuning-Werte dort). */
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
.nebula-layer > div {
  content: "";
  position: absolute;
  inset: -8%;
  pointer-events: none;
}
${cloudFamilyCss("violet", P.violet, "nebulaDriftA", "nebulaDriftB")}
${cloudFamilyCss("teal", P.teal, "nebulaDriftB", "nebulaDriftA")}
.nebula-cloud--teal-a,
.nebula-cloud--teal-b {
  mix-blend-mode: screen;
}
.nebula-aurora {
  background: linear-gradient(
    100deg,
    transparent 30%,
    rgba(94, 234, 212, .14) 44%,
    rgba(167, 139, 250, .13) 56%,
    transparent 70%
  );
  -webkit-mask-image: radial-gradient(ellipse 85% 42% at 50% 16%, #000 0%, transparent 75%);
  mask-image: radial-gradient(ellipse 85% 42% at 50% 16%, #000 0%, transparent 75%);
  mix-blend-mode: screen;
  opacity: ${P.aurora.opacity};
}
@media (prefers-reduced-motion: no-preference) {
  .nebula-layer {
    /* 0.15s wie .graph-viewport und die Sternlayer — ungleiche Dauern
       ließen Hintergrund und Graph beim Zoomen gegeneinander schwimmen,
       was sich wie Ruckeln anfühlte. */
    transition: transform 0.15s ease-out;
    will-change: transform;
  }
  .nebula-aurora {
    animation: nebulaAuroraWave ${P.aurora.waveDurS}s ease-in-out infinite alternate;
  }
}
/* Gemeinsamer Atem-/Morph-Zyklus: Gipfel -> Tal -> Gipfel. Schicht B läuft
   mit halbem Zyklus Versatz (animation-delay), dadurch die Überblendung. */
@keyframes nebulaFade {
  0%, 100% { opacity: var(--fade-peak, .6); }
  50% { opacity: var(--fade-trough, .1); }
}
@keyframes nebulaDriftA {
  from { transform: translate3d(-4%, -2.6%, 0) scale(1); }
  to { transform: translate3d(4%, 2.6%, 0) scale(1.07); }
}
@keyframes nebulaDriftB {
  from { transform: translate3d(3.4%, 2.2%, 0) scale(1.06); }
  to { transform: translate3d(-3.4%, -2.2%, 0) scale(1); }
}
@keyframes nebulaAuroraWave {
  from { transform: translate3d(-5%, -1%, 0) skewX(-2deg); }
  50% { transform: translate3d(2%, 1.2%, 0) skewX(1.5deg); }
  to { transform: translate3d(6%, -0.6%, 0) skewX(-1deg); }
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
