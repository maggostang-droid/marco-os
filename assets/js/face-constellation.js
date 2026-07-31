import { subscribe, state } from "./state.js";

// Easteregg (2026-07-31): Wer über die Sonne ("Marco Stang") hovert, sieht
// Marcos Gesicht als Sternbild — einmalig offline aus seinem Porträtfoto
// gewonnen: freistellen (Selfie-Segmentierung), kantenerhaltend glätten, per
// Difference-of-Gaussians in eine Strichzeichnung wandeln, diese skelettieren,
// in Polygonzüge zerlegen und mit Douglas-Peucker auf die Knickpunkte
// reduzieren — regionenweise fein (Augen/Brille, Haaransatz) bis grob
// (Kontur). Kinn und Kieferknochen kommen aus der Face-Mesh-Kontur, weil die
// abgewandte Gesichtshälfte im Foto im Schatten liegt. Ohne Hals und Sakko:
// der Umriss endet am Kiefer. 182 Sterne [x, y, größenGewicht 0..1], normiert
// auf die Bounding-Box (y nach unten), 155 Kanten [sternIndexA, sternIndexB].
export const FACE_CONSTELLATION = Object.freeze({
  aspect: 0.7255,
  stars: [
    [0.9503,0.9085,0.25],[0.8472,0.8222,0.55],[0.8544,0.6624,0.55],[0.8721,0.6353,0.85],[0.9343,0.6173,0.55],[0.9609,0.5928,0.55],
    [1,0.5026,0.55],[0.9876,0.4459,0.55],[0.9147,0.4008,0.55],[0.9254,0.2423,0.55],[0.8881,0.174,0.55],[0.7922,0.0825,0.55],
    [0.7069,0.0412,0.55],[0.6803,0.0399,0.55],[0.6679,0.0232,0.55],[0.5844,0,0.55],[0.3872,0.0013,0.55],[0.2753,0.0219,0.55],
    [0.1829,0.0619,0.55],[0.1528,0.0889,0.55],[0.1208,0.0941,0.55],[0.0835,0.1379,0.55],[0.0497,0.259,0.55],[0.0746,0.4149,0.55],
    [0.0746,0.4407,1],[0.048,0.4626,0.55],[0.0497,0.5838,0.55],[0.0746,0.643,0.55],[0.151,0.701,0.55],[0.1901,0.7848,0.55],
    [0.3126,0.9098,1],[0.3197,0.951,0.55],[0.1474,0.9601,0.85],[0,1,0.25],[0.8481,0.5071,0.55],[0.8508,0.6382,0.55],
    [0.8273,0.7108,0.55],[0.7826,0.7705,0.55],[0.7293,0.8151,0.55],[0.6098,0.8829,0.55],[0.4904,0.9258,0.55],[0.4181,0.9321,0.55],
    [0.3555,0.9264,0.55],[0.2225,0.829,0.55],[0.1709,0.7402,0.55],[0.1461,0.6749,0.55],[0.1184,0.5548,0.55],[0.4067,0.433,0.25],
    [0.3996,0.4781,0.55],[0.4174,0.5116,0.55],[0.4387,0.5335,0.55],[0.46,0.549,0.55],[0.4991,0.5631,0.55],[0.5524,0.5683,0.55],
    [0.5861,0.5657,0.25],[0.0728,0.1637,0.25],[0.071,0.2152,0.55],[0.0604,0.2281,0.55],[0.0586,0.3157,0.55],[0.0586,0.5039,0.55],
    [0.0782,0.5412,0.55],[0.1208,0.5747,0.85],[0.1741,0.5838,0.55],[0.2114,0.5812,0.55],[0.2327,0.5747,0.25],[0.238,0.4072,0.55],
    [0.1829,0.4021,0.55],[0.1297,0.4085,0.55],[0.5169,0.7152,0.25],[0.5062,0.7088,0.55],[0.4512,0.7088,0.55],[0.3073,0.7204,0.55],
    [0.2931,0.7281,0.25],[0.3215,0.4459,0.85],[0.3233,0.4832,0.55],[0.3162,0.5168,0.55],[0.2984,0.5451,0.55],[0.2789,0.5593,0.25],
    [0.2291,0.4304,0.55],[0.1652,0.4278,0.55],[0.1297,0.4343,0.55],[0.1226,0.4407,0.55],[0.1208,0.4613,0.25],[0.8881,0.4936,0.25],
    [0.881,0.5168,0.85],[0.8845,0.5567,0.55],[0.8686,0.576,0.25],[0.4547,0.3763,0.25],[0.4778,0.3827,0.55],[0.5702,0.3814,0.55],
    [0.6092,0.3866,0.55],[0.6359,0.3905,0.55],[0.659,0.4085,0.55],[0.6767,0.4124,0.55],[0.6945,0.4317,0.25],[0.2966,0.0747,0.25],
    [0.4387,0.1095,0.25],[0.5719,0.4291,0.55],[0.595,0.4317,0.55],[0.6394,0.4497,0.55],[0.6501,0.4485,0.55],[0.6501,0.4381,0.25],
    [0.286,0.4227,0.55],[0.7425,0.3119,0.25],[0.7442,0.3299,0.55],[0.7762,0.3673,0.25],[0.4476,0.75,0.25],[0.4174,0.7603,0.55],
    [0.3659,0.7603,0.55],[0.3428,0.7526,0.25],[0.4512,0.4253,0.25],[0.4281,0.4613,0.55],[0.4352,0.4781,0.25],[0.5826,0.0567,0.25],
    [0.698,0.0631,0.25],[0.6572,0.5013,0.25],[0.643,0.5271,0.55],[0.6163,0.5477,0.25],[0.8277,0.2732,0.25],[0.833,0.3235,0.55],
    [0.8455,0.3454,0.25],[0.7904,0.4137,0.25],[0.8384,0.4149,0.55],[0.8455,0.433,0.25],[0.8579,0.8595,0.25],[0.8544,0.9034,0.55],
    [0.8401,0.9278,0.25],[0.3108,0.9613,0.25],[0.286,0.8789,0.25],[0.325,0.9343,0.25],[0.2984,0.616,0.25],[0.3499,0.6392,0.55],
    [0.3766,0.6405,0.55],[0.7087,0.076,0.25],[0.7371,0.0941,0.55],[0.7975,0.1005,0.25],[0.5826,0.0851,0.25],[0.6625,0.1186,0.25],
    [0.2078,0.4459,0.25],[0.2007,0.4626,0.55],[0.2167,0.4678,0.55],[0.2327,0.4652,0.25],[0.7975,0.1495,0.25],[0.8206,0.1637,0.55],
    [0.8597,0.1701,0.55],[0.8721,0.183,0.25],[0.4813,0.6005,0.25],[0.4671,0.616,0.55],[0.4139,0.6237,0.55],[0.3801,0.442,0.25],
    [0.3464,0.4394,0.55],[0.524,0.4278,0.55],[0.5258,0.4394,0.55],[0.5364,0.4485,0.55],[0.5613,0.4485,0.25],[0.9361,0.6082,0.25],
    [0.9183,0.6198,0.55],[0.4103,0.0271,0.25],[0.4956,0.0296,0.25],[0.2629,0.4381,0.55],[0.2824,0.4485,0.25],[0.8668,0.2165,0.55],
    [0.8828,0.2655,0.25],[0.5808,0.3724,0.55],[0.595,0.3711,0.55],[0.0657,0.4652,0.25],[0.7247,0.1469,0.25],[0.7922,0.1688,0.25],
    [0.8686,0.8441,0.25],[0.8828,0.8492,0.55],[0.9041,0.8814,0.25],[0.833,0.4394,0.25],[0.8313,0.4652,0.55],[0.8206,0.4691,0.25],
    [0.4103,0.6418,0.55],[0.8455,0.2216,0.55],[0.8437,0.2564,0.25],[0.5471,0.4227,0.55],[0.3819,0.8235,0.25],[0.4423,0.8273,0.25],
    [0.8153,0.1327,0.25],[0.8721,0.1559,0.25]
  ],
  edges: [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],
    [14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],[27,28],
    [28,29],[29,30],[30,31],[31,32],[32,33],[34,35],[35,36],[36,37],[37,38],[38,39],[39,40],[40,41],[41,42],[30,42],
    [30,43],[43,44],[44,45],[45,46],[47,48],[48,49],[49,50],[50,51],[51,52],[52,53],[53,54],[55,56],[56,57],[57,58],
    [24,58],[59,60],[60,61],[61,62],[62,63],[63,64],[65,66],[66,67],[24,67],[68,69],[69,70],[70,71],[71,72],[73,74],
    [74,75],[75,76],[76,77],[78,79],[79,80],[80,81],[81,82],[83,84],[84,85],[85,86],[87,88],[88,89],[90,91],[91,92],
    [92,93],[93,94],[95,96],[97,98],[98,99],[99,100],[100,101],[65,102],[73,102],[103,104],[104,105],[106,107],[107,108],[108,109],
    [110,111],[111,112],[113,114],[115,116],[116,117],[118,119],[119,120],[121,122],[122,123],[124,125],[125,126],[32,127],[30,128],[30,129],
    [130,131],[131,132],[133,134],[134,135],[136,137],[138,139],[139,140],[140,141],[142,143],[143,144],[144,145],[146,147],[147,148],[149,150],
    [73,150],[151,152],[152,153],[153,154],[155,156],[3,156],[157,158],[78,159],[159,160],[161,162],[89,163],[163,164],[90,164],[59,165],
    [166,167],[168,169],[169,170],[171,172],[172,173],[148,174],[132,174],[161,175],[175,176],[151,177],[97,177],[178,179],[180,181],[34,84],
    [46,61]
  ]
});

// Sichtbarkeits-Schwellen: unterhalb ist der Himmel oben rechts zu knapp
// (Mobile/Tablet haben ohnehin kein hover — siehe Media-Query in init).
const MIN_SCENE_WIDTH = 960;
const MIN_FACE_HEIGHT = 190;

// Obergrenze der Gesichts-Unterkante als Anteil der Szenenhöhe: hält das
// Sternbild oberhalb des Bands, in dem der äußerste Ring seinen rechten
// Planeten platziert (full-stack, Winkel 0° = exakt rechts auf halber Höhe).
const BOTTOM_CAP = 0.46;

// Intro-Timing (ms): Sterne staffeln über STAGGER_SPREAD, jeder blüht in
// STAR_BLOOM auf; eine Linie zeichnet sich, sobald beide Endsterne größten-
// teils da sind. Gesamtdauer ~1.5s — bewusst gemächlich, wie ein Sternbild.
const STAGGER_SPREAD_MS = 900;
const STAR_BLOOM_MS = 420;
const LINE_DRAW_MS = 260;
const LINE_START_AT = 0.55; // Anteil der Stern-Bloom-Dauer, ab dem die Linie startet

const FADE_IN_RATE = 0.14; // Energie-Easing pro Frame (Ein-/Ausblenden)
const FADE_OUT_RATE = 0.11;

// Ab diesem Taskbar-Zoom wandern die äußeren Planeten in die Gesichtszone
// oben rechts — das Sternbild bleibt dann aus (passt zur Tiefen-Metapher:
// wer nah an die Planeten heranfährt, sieht den fernen Himmel nicht mehr).
const MAX_ZOOM_FOR_FACE = 1.4;

const PARALLAX_SHIFT = 9; // px, zwischen star-layer far (6) und mid (13)

const STAR_RGB = "231, 228, 245"; // wie der häufigste STAR_COLORS-Ton
const LINE_ALPHA = 0.36;

// Platzierung oben rechts, rein aus der Szenengröße — pure Funktion, damit
// sie DOM-frei testbar bleibt. Gibt null zurück, wenn die Szene zu klein
// ist, um das Gesicht frei (ohne Planeten-Kollision) zu zeigen.
export function computeFacePlacement(sceneWidth, sceneHeight) {
  if (!sceneWidth || !sceneHeight || sceneWidth < MIN_SCENE_WIDTH) return null;

  const marginRight = Math.max(28, sceneWidth * 0.035);
  const top = Math.max(48, sceneHeight * 0.07);
  const height = Math.min(sceneHeight * 0.42, sceneHeight * BOTTOM_CAP - top, 430);
  if (height < MIN_FACE_HEIGHT) return null;

  const width = height * FACE_CONSTELLATION.aspect;
  return {
    x: sceneWidth - marginRight - width,
    y: top,
    width,
    height
  };
}

export function initFaceConstellation(scene) {
  if (!scene) return;
  // Nur echte Hover-Geräte: auf Touch feuert mouseover erst beim Tap — das
  // Sternbild würde gleichzeitig mit dem Lebenslauf-Fenster aufpoppen.
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.className = "face-constellation-canvas";
  canvas.setAttribute("aria-hidden", "true");
  scene.appendChild(canvas);
  const ctx = canvas.getContext("2d");

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

  const { stars, edges } = FACE_CONSTELLATION;

  // Deterministische Reihenfolge/Phase pro Stern (Goldener Schnitt statt
  // Math.random): stabil über Re-Hovers, fühlt sich trotzdem gestreut an.
  const order = stars.map((_, i) => (i * 0.618034) % 1);
  const twinklePhase = stars.map((_, i) => ((i * 2.399963) % (Math.PI * 2)));
  const twinkleSpeed = stars.map((_, i) => 0.9 + ((i * 7) % 10) / 12);

  // Linien zeichnen sich vom früher erscheinenden Stern zum späteren —
  // Punkte-verbinden-Effekt. Start/Dauer einmal vorberechnet.
  const lineMeta = edges.map(([a, b]) => {
    const from = order[a] <= order[b] ? a : b;
    const to = from === a ? b : a;
    const start =
      Math.max(order[a], order[b]) * STAGGER_SPREAD_MS + STAR_BLOOM_MS * LINE_START_AT;
    return { from, to, start };
  });

  let visible = false;
  let energy = 0;
  let revealStart = 0; // performance.now() beim Einblenden; 0 = zurückgesetzt
  let rafId = null;
  let parallaxX = 0;
  let parallaxY = 0;

  scene.addEventListener("mousemove", (event) => {
    const rect = scene.getBoundingClientRect();
    parallaxX = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * PARALLAX_SHIFT;
    parallaxY = ((event.clientY - rect.top) / rect.height - 0.5) * 2 * PARALLAX_SHIFT;
  });

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  // Leichter Overshoot beim Aufblühen (easeOutBack, gezähmt).
  const bloomScale = (t) => {
    const c = 1.4;
    const u = t - 1;
    return 1 + (c + 1) * u * u * u + c * u * u;
  };

  const draw = () => {
    rafId = null;
    const now = performance.now();
    const target = visible ? 1 : 0;
    energy += (target - energy) * (visible ? FADE_IN_RATE : FADE_OUT_RATE);

    ctx.clearRect(0, 0, width, height);

    if (energy <= 0.005 && !visible) {
      energy = 0;
      revealStart = 0; // nächstes Hover spielt das Intro erneut
      return;
    }

    const place = computeFacePlacement(width, height);
    if (!place) {
      if (visible || energy > 0.005) rafId = requestAnimationFrame(draw);
      return;
    }

    // Reduced motion: kein Bloom/Draw-Sweep, das fertige Sternbild blendet
    // nur per Energie-Easing ein und aus (reiner Opacity-Fade).
    const revealT = prefersReducedMotion
      ? Number.MAX_SAFE_INTEGER
      : now - revealStart;

    const px = place.x + parallaxX;
    const py = place.y + parallaxY;
    const sizeScale = Math.max(0.85, Math.min(2.2, place.height / 380));

    for (const { from, to, start } of lineMeta) {
      const p = Math.min(1, Math.max(0, (revealT - start) / LINE_DRAW_MS));
      if (p <= 0) continue;
      const [x1, y1] = stars[from];
      const [x2, y2] = stars[to];
      const t = easeOutCubic(p);
      const ax = px + x1 * place.width;
      const ay = py + y1 * place.height;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + (x2 - x1) * place.width * t, ay + (y2 - y1) * place.height * t);
      ctx.strokeStyle = `rgba(${STAR_RGB}, ${(LINE_ALPHA * Math.min(1, p * 1.5) * energy).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < stars.length; i += 1) {
      const start = order[i] * STAGGER_SPREAD_MS;
      const p = Math.min(1, Math.max(0, (revealT - start) / STAR_BLOOM_MS));
      if (p <= 0) continue;
      const [fx, fy, rw] = stars[i];
      const x = px + fx * place.width;
      const y = py + fy * place.height;
      const twinkle = prefersReducedMotion
        ? 1
        : 0.82 + 0.18 * Math.sin((now / 1000) * twinkleSpeed[i] + twinklePhase[i]);
      const alpha = easeOutCubic(p) * twinkle * energy;
      const radius = (1.05 + rw * 1.55) * sizeScale * (prefersReducedMotion ? 1 : bloomScale(p));

      // weicher Glow + Kern — zwei Kreise sind billiger als shadowBlur
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${STAR_RGB}, ${(0.12 * alpha).toFixed(3)})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${STAR_RGB}, ${Math.min(1, alpha).toFixed(3)})`;
      ctx.fill();
    }

    if (visible || energy > 0.005) rafId = requestAnimationFrame(draw);
  };

  const wake = () => {
    if (rafId === null) rafId = requestAnimationFrame(draw);
  };

  const show = () => {
    if (!state.bootComplete || state.activeProjectId) return;
    if (state.zoomLevel > MAX_ZOOM_FOR_FACE) return;
    if (!visible && revealStart === 0) revealStart = performance.now();
    visible = true;
    wake();
  };
  const hide = () => {
    visible = false;
    wake();
  };

  // Delegation statt direktem Listener: scene.js baut die Node-Schicht bei
  // jedem Fokus-/Resize-Rebuild neu, der Sonnen-Button ist also kurzlebig.
  const isCenter = (el) =>
    el instanceof Element && el.closest(".node--center") !== null;
  scene.addEventListener("mouseover", (event) => {
    if (isCenter(event.target) && !isCenter(event.relatedTarget)) show();
  });
  scene.addEventListener("mouseout", (event) => {
    if (isCenter(event.target) && !isCenter(event.relatedTarget)) hide();
  });

  // Öffnet ein Fenster (Klick auf die Sonne → Lebenslauf) oder zoomt Marco
  // über die Schwelle, verschwindet das Sternbild sofort mit — der Scrim
  // bzw. die herangezoomten Planeten übernehmen die Bühne.
  subscribe(() => {
    if (visible && (state.activeProjectId || state.zoomLevel > MAX_ZOOM_FOR_FACE)) hide();
  });
}
