// Hintergrund-Himmel für MARCO.OS v3: prozedurale Nebelwolken (fBm-Rauschen),
// drei Parallax-Sternschichten, Funkeln/Flares, Sternschnuppen,
// Cursor-Konstellationen und das Gesichts-Sternbild beim Hovern der Sonne.
// Alles auf EINEM Canvas, ein rAF-Loop.
import { FACE_CONSTELLATION } from "./face-constellation.js";

// Platzierung oben rechts. Eigene Fassung statt computeFacePlacement aus
// face-constellation.js: dessen MIN_SCENE_WIDTH von 960 px bezog sich auf die
// volle Desktop-Szene — hier ist das Canvas oft schmaler (Vorschau, kleinere
// Fenster), und das Sternbild wäre dann nie zu sehen.
// Platzierung oben links, direkt neben dem Namen im Identitäts-HUD (das
// Original setzte es oben rechts). Eigene Fassung statt computeFacePlacement:
// dessen MIN_SCENE_WIDTH von 960 px bezog sich auf die volle Desktop-Szene.
function facePlacement(sw, sh) {
  if (!sw || !sh || sw < 700) return null;
  // Höhe = Höhe des HUD-Textblocks (Kicker bis Stats-Zeile, ~22–146 px),
  // damit das Sternbild oben und unten bündig danebensteht.
  const height = Math.min(sh * 0.2, 124);
  if (height < 74) return null;
  const width = height * FACE_CONSTELLATION.aspect;
  return { x: Math.min(322, sw * 0.4), y: 56, width, height };
}

const STAR_RGB = [
  { rgb: [231, 228, 245], w: 0.4 },
  { rgb: [167, 139, 250], w: 0.22 },
  { rgb: [94, 234, 212], w: 0.2 },
  { rgb: [251, 191, 36], w: 0.18 }
];
const LAYERS = [
  { count: 240, size: [0.5, 1.0], alpha: 0.55, shift: 6, depth: 0.85 },
  { count: 140, size: [0.8, 1.5], alpha: 0.8, shift: 13, depth: 0.6 },
  { count: 70, size: [0.8, 1.5], alpha: 0.95, shift: 22, depth: 0.35 }
];
const TWINKLE_COUNT = 22;
const ANCHORS = 78;
const CURSOR_RADIUS = 190;
const LINK_DIST = 130;
const IDLE_MS = 1800;

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function noiseFactory(seed) {
  const r = rng(seed);
  const perm = new Uint8Array(512);
  const grad = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; grad[i] = r(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const fade = (t) => t * t * (3 - 2 * t);
  const val = (xi, yi) => grad[perm[(perm[xi & 255] + (yi & 255)) & 255]];
  return function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = fade(x - xi), yf = fade(y - yi);
    const a = val(xi, yi), b = val(xi + 1, yi), c = val(xi, yi + 1), d = val(xi + 1, yi + 1);
    return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
  };
}

function fbm(noise, x, y, oct, gain) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp; amp *= gain; freq *= 2.03;
  }
  return sum / norm;
}

// Eine Nebelschicht als Offscreen-Canvas (halbe Auflösung, wird beim Zeichnen
// weich hochskaliert — spart ~4x Rechenzeit und sieht wolkiger aus).
function buildNebula(w, h, seed, palette, opts) {
  const scale = opts.res || 0.42;
  const cw = Math.max(2, Math.round(w * scale)), ch = Math.max(2, Math.round(h * scale));
  const cv = document.createElement("canvas");
  cv.width = cw; cv.height = ch;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(cw, ch);
  const base = noiseFactory(seed), warp = noiseFactory(seed + 977), tint = noiseFactory(seed + 4231);
  const freq = opts.freq || 2.6;
  const thresh = opts.thresh ?? 0.44;
  const soft = opts.soft ?? 0.34;
  const maxA = opts.alpha ?? 210;
  const cx = opts.cx ?? 0.5, cy = opts.cy ?? 0.5, falloff = opts.falloff ?? 1.15;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const u = x / cw, v = y / ch;
      // Domain-Warping: verdreht das Rauschen zu filamentartigen Schwaden
      const wx = fbm(warp, u * freq * 0.7 + 11.3, v * freq * 0.7 + 4.1, 3, 0.55) - 0.5;
      const wy = fbm(warp, u * freq * 0.7 + 31.7, v * freq * 0.7 + 19.9, 3, 0.55) - 0.5;
      let d = fbm(base, u * freq + wx * 1.9, v * freq * 1.35 + wy * 1.9, 6, 0.55);
      // Radiale Abschwächung: Wolken ballen sich, statt die Fläche zu fluten
      const dx = (u - cx) / (opts.rx ?? 0.62), dy = (v - cy) / (opts.ry ?? 0.55);
      const rad = Math.sqrt(dx * dx + dy * dy);
      d *= Math.max(0, 1 - Math.pow(rad, falloff));
      let a = (d - thresh) / soft;
      a = a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a);
      const i = (y * cw + x) * 4;
      if (a <= 0.004) { img.data[i + 3] = 0; continue; }
      const t = fbm(tint, u * freq * 1.6 + 7.7, v * freq * 1.6 + 2.2, 4, 0.5);
      const mix = Math.min(1, Math.max(0, (t - 0.34) / 0.34));
      const core = Math.min(1, Math.max(0, (d - thresh - soft * 0.55) / (soft * 0.8)));
      const c0 = palette[0], c1 = palette[1], c2 = palette[2];
      const r = c0[0] + (c1[0] - c0[0]) * mix + (c2[0] - c0[0]) * core * 0.85;
      const g = c0[1] + (c1[1] - c0[1]) * mix + (c2[1] - c0[1]) * core * 0.85;
      const b = c0[2] + (c1[2] - c0[2]) * mix + (c2[2] - c0[2]) * core * 0.85;
      img.data[i] = Math.min(255, r);
      img.data[i + 1] = Math.min(255, g);
      img.data[i + 2] = Math.min(255, b);
      img.data[i + 3] = Math.min(255, a * maxA);
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

function pickColor(r) {
  let roll = r(), acc = 0;
  for (const s of STAR_RGB) { acc += s.w; if (roll < acc) return s.rgb; }
  return STAR_RGB[0].rgb;
}

export function createSky(canvas, getState) {
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = rng(20260803);
  let w = 0, h = 0, nebA = null, nebB = null, nebC = null, bgGrad = null, calmGrad = null, sheetsDirty = true;
  let mx = -9999, my = -9999, lastMove = 0, energy = 0;
  let px = 0, py = 0, tpx = 0, tpy = 0;
  let faceEnergy = 0, faceStart = 0;

  const stars = LAYERS.map((L) => Array.from({ length: L.count }, () => ({
    fx: r(), fy: r(), s: L.size[0] + r() * (L.size[1] - L.size[0]), c: pickColor(r), a: 0.4 + r() * 0.6
  })));
  const twinkles = Array.from({ length: TWINKLE_COUNT }, () => ({
    fx: r(), fy: r(), s: 0.85 + r() * 0.85, c: pickColor(r), ph: r() * 6.283, sp: 0.9 + r() * 0.9, flare: 0
  }));
  const anchors = Array.from({ length: ANCHORS }, () => ({ fx: r(), fy: r() }));
  let shooting = null, nextShot = performance.now() + 6000 + r() * 9000;
  let nextFlare = performance.now() + 9000 + r() * 12000;

  // Sternbild-Reihenfolge (goldener Schnitt) wie im Original: deterministisch
  const fStars = FACE_CONSTELLATION.stars;
  const fOrder = fStars.map((_, i) => (i * 0.618034) % 1);
  const fLines = FACE_CONSTELLATION.edges.map(([a, b]) => ({
    a, b, start: Math.max(fOrder[a], fOrder[b]) * 900 + 420 * 0.55
  }));

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (Math.abs(rect.width - w) < 2 && Math.abs(rect.height - h) < 2) return;
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Wolkenmassen sitzen bewusst außerhalb der Bildmitte (links oben /
    // rechts unten), damit die Planeten im Zentrum frei im Vordergrund stehen.
    nebA = buildNebula(w, h, 7, [[58, 20, 112], [148, 52, 178], [236, 176, 250]],
      { freq: 2.1, thresh: 0.385, soft: 0.34, alpha: 250, cx: 0.17, cy: 0.26, rx: 0.62, ry: 0.6, falloff: 1.15 });
    nebB = buildNebula(w, h, 913, [[12, 60, 96], [30, 140, 158], [168, 250, 238]],
      { freq: 2.9, thresh: 0.455, soft: 0.3, alpha: 205, cx: 0.85, cy: 0.78, rx: 0.5, ry: 0.5, falloff: 1.25 });
    nebC = buildNebula(w, h, 5501, [[92, 30, 70], [186, 84, 110], [255, 226, 202]],
      { freq: 4.4, thresh: 0.53, soft: 0.22, alpha: 150, res: 0.5, cx: 0.88, cy: 0.16, rx: 0.46, ry: 0.44, falloff: 1.15 });
    bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.8);
    bgGrad.addColorStop(0, "#0d0a1e"); bgGrad.addColorStop(0.55, "#080613"); bgGrad.addColorStop(1, "#040309");
    calmGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.min(w, h) * 0.52);
    calmGrad.addColorStop(0, "rgba(5,4,11,0.62)");
    calmGrad.addColorStop(0.55, "rgba(5,4,11,0.34)");
    calmGrad.addColorStop(1, "rgba(5,4,11,0)");
    sheetsDirty = true;
  };
  resize();
  window.addEventListener("resize", resize);

  // Vorgerendertes Glow-Sprite: ein drawImage pro Funkelstern statt eines
  // neuen createRadialGradient pro Stern und Frame (das war der teuerste
  // Posten im Frame-Budget und machte das Zoomen zäh).
  const glowSprite = (() => {
    const s = 64, cv = document.createElement("canvas");
    cv.width = s; cv.height = s;
    const c = cv.getContext("2d");
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    return cv;
  })();

  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left; my = e.clientY - rect.top;
    lastMove = performance.now();
    tpx = (mx / Math.max(rect.width, 1) - 0.5) * 2;
    tpy = (my / Math.max(rect.height, 1) - 0.5) * 2;
  };
  window.addEventListener("mousemove", onMove);

  // Sternschichten werden EINMAL in Offscreen-Canvases gerendert und pro
  // Frame nur skaliert geblittet (3 drawImage statt ~450 arc-Fills) —
  // spürbar günstiger, vor allem während des Zoomens.
  let starSheets = [];
  const buildStarSheets = () => {
    starSheets = LAYERS.map((L, li) => {
      const sw = Math.max(2, Math.round(w * 1.6)), sh = Math.max(2, Math.round(h * 1.6));
      const cv = document.createElement("canvas");
      cv.width = sw; cv.height = sh;
      const c = cv.getContext("2d");
      for (const s of stars[li]) {
        c.beginPath();
        c.arc((s.fx - 0.5) * w + sw / 2, (s.fy - 0.5) * h + sh / 2, s.s, 0, 6.2832);
        c.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${(s.a * L.alpha).toFixed(3)})`;
        c.fill();
      }
      return cv;
    });
  };

  const drawLayerStars = (list, L, zoomComp, t, li) => {
    const sheet = starSheets[li];
    if (!sheet) return;
    const sc = Math.pow(zoomComp, 1 - L.depth * 0.72);
    const ww = sheet.width * sc, hh = sheet.height * sc;
    ctx.drawImage(sheet, w / 2 - ww / 2 + px * L.shift, h / 2 - hh / 2 + py * L.shift, ww, hh);
  };

  // Grundbild (Gradient + Nebelschichten + Ruhezone) — wird gecacht.
  function drawBase(c, zoomComp, drift) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, w, h);
    c.fillStyle = bgGrad; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "screen";
    const nebDraw = (img, sc, dx, dy, alpha) => {
      if (!img) return;
      c.globalAlpha = alpha;
      const ww = w * sc, hh = h * sc;
      c.drawImage(img, (w - ww) / 2 + dx, (h - hh) / 2 + dy, ww, hh);
    };
    const zc = Math.pow(zoomComp, 0.34);
    nebDraw(nebA, 1.22 * zc, Math.sin(drift * 0.017) * 26 + px * 4, Math.cos(drift * 0.013) * 18 + py * 4, 1);
    nebDraw(nebA, 1.55 * zc, Math.sin(drift * 0.011 + 1.4) * 40 - px * 7, Math.cos(drift * 0.009 + 2.2) * 26 - py * 7, 0.45);
    nebDraw(nebB, 1.3 * Math.pow(zoomComp, 0.5), Math.sin(drift * 0.022 + 2) * 34 + px * 9, Math.cos(drift * 0.019 + 1) * 22 + py * 9, 0.95);
    nebDraw(nebC, 1.45 * Math.pow(zoomComp, 0.78), Math.sin(drift * 0.031 + 4) * 52 + px * 20, Math.cos(drift * 0.027 + 3) * 30 + py * 20, 0.75);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    c.fillStyle = calmGrad; c.fillRect(0, 0, w, h);
  }

  const baseCv = document.createElement("canvas");
  const baseCtx = baseCv.getContext("2d");
  let baseSig = "", baseTick = 0;

  let raf = null;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    resize();
    if (!w || !h) return;
    if (sheetsDirty) { buildStarSheets(); sheetsDirty = false; }
    const st = getState();
    const now = performance.now();
    const t = now / 1000;
    px += (tpx - px) * 0.06; py += (tpy - py) * 0.06;
    const zoomComp = Math.max(0.35, st.zoom * (st.focused ? 1.25 : 1));

    ctx.clearRect(0, 0, w, h);
    // Nebel + Grundgradient in ein Offscreen-Canvas cachen: sie ändern sich
    // nur langsam (Drift) bzw. beim Zoom — pro Frame reicht ein Blit statt
    // fünf bildschirmgroßer Composites. Das war die Zoom-Bremse.
    const wantSig = `${Math.round(w)}x${Math.round(h)}|${zoomComp.toFixed(3)}|${Math.floor(t / 0.25)}`;
    if (wantSig !== baseSig) {
      baseSig = wantSig;
      if (baseCv.width !== Math.round(w) || baseCv.height !== Math.round(h)) {
        baseCv.width = Math.round(w); baseCv.height = Math.round(h);
      }
      drawBase(baseCtx, zoomComp, reduced ? 0 : t);
    }
    ctx.drawImage(baseCv, 0, 0, w, h);
    ctx.globalCompositeOperation = "screen";

    // Sterne
    LAYERS.forEach((L, i) => drawLayerStars(stars[i], L, zoomComp, t, i));

    // Funkelsterne + gelegentlicher Flare
    if (now > nextFlare) {
      twinkles[Math.floor(r() * twinkles.length)].flare = now;
      nextFlare = now + 16000 + r() * 18000;
    }
    const tsc = Math.pow(zoomComp, 0.62);
    for (const s of twinkles) {
      const x = (s.fx - 0.5) * w * tsc + w / 2 + px * 16;
      const y = (s.fy - 0.5) * h * tsc + h / 2 + py * 16;
      let a = reduced ? 0.85 : 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
      let size = s.s;
      if (s.flare) {
        const p = (now - s.flare) / 1300;
        if (p >= 1) s.flare = 0; else { const e = Math.sin(p * Math.PI); a = Math.min(1, a + e * 0.7); size = s.s * (1 + e * 1.1); }
      }
      const g2 = ctx.globalAlpha;
      ctx.globalAlpha = a * 0.5;
      const gs = size * 8.4;
      ctx.drawImage(glowSprite, x - gs / 2, y - gs / 2, gs, gs);
      ctx.globalAlpha = g2;
      ctx.beginPath(); ctx.arc(x, y, size, 0, 6.2832);
      ctx.fillStyle = `rgba(255,255,255,${(a * 0.75).toFixed(3)})`; ctx.fill();
    }

    // Sternschnuppen
    if (!reduced) {
      if (!shooting && now > nextShot && st.booted) {
        shooting = { x: w * (0.05 + r() * 0.7), y: h * (0.05 + r() * 0.45), a: (20 + r() * 25) * Math.PI / 180, t: now, life: 900 + r() * 500, len: 140 + r() * 120 };
      }
      if (shooting) {
        const p = (now - shooting.t) / shooting.life;
        if (p >= 1) { shooting = null; nextShot = now + 8000 + r() * 14000; }
        else {
          const dist = p * (w * 0.55);
          const hx = shooting.x + Math.cos(shooting.a) * dist, hy = shooting.y + Math.sin(shooting.a) * dist;
          const tx = hx - Math.cos(shooting.a) * shooting.len, ty = hy - Math.sin(shooting.a) * shooting.len;
          const grad = ctx.createLinearGradient(tx, ty, hx, hy);
          const fade = Math.sin(p * Math.PI);
          grad.addColorStop(0, "rgba(231,228,245,0)");
          grad.addColorStop(1, `rgba(231,228,245,${(0.9 * fade).toFixed(3)})`);
          ctx.strokeStyle = grad; ctx.lineWidth = 1.6; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";

    // Cursor-Konstellationen: Anker in Mausnähe leuchten auf und verbinden sich
    const idle = now - lastMove > IDLE_MS;
    const target = idle || st.windowOpen || !st.booted ? 0 : 1;
    energy += (target - energy) * 0.12;
    if (energy > 0.01) {
      const near = [];
      for (const a of anchors) {
        const ax = a.fx * w, ay = a.fy * h;
        const d = Math.hypot(ax - mx, ay - my);
        if (d < CURSOR_RADIUS) near.push({ ax, ay, p: 1 - d / CURSOR_RADIUS });
      }
      for (const pt of near) {
        ctx.beginPath(); ctx.arc(pt.ax, pt.ay, 1.9, 0, 6.2832);
        ctx.fillStyle = `rgba(94,234,212,${(0.9 * pt.p * energy).toFixed(3)})`; ctx.fill();
      }
      for (let i = 0; i < near.length; i++) {
        for (let j = i + 1; j < near.length; j++) {
          const a = near[i], b = near[j];
          const d = Math.hypot(a.ax - b.ax, a.ay - b.ay);
          if (d > LINK_DIST) continue;
          const alpha = 0.65 * (1 - d / LINK_DIST) * Math.min(a.p, b.p) * energy;
          ctx.beginPath(); ctx.moveTo(a.ax, a.ay); ctx.lineTo(b.ax, b.ay);
          ctx.strokeStyle = `rgba(231,228,245,${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.2; ctx.stroke();
        }
      }
    }

    // Gesichts-Sternbild beim Hovern der Sonne
    const faceTarget = st.faceVisible ? 1 : 0;
    if (faceTarget && !faceStart) faceStart = now;
    faceEnergy += (faceTarget - faceEnergy) * (faceTarget ? 0.14 : 0.11);
    if (faceEnergy <= 0.005) { faceEnergy = 0; faceStart = 0; }
    if (faceEnergy > 0.005) {
      const place = facePlacement(w, h - 70);
      if (place) {
        const fx0 = place.x + px * 9, fy0 = place.y + py * 9;
        const revealT = reduced ? 1e9 : now - faceStart;
        const ease = (t2) => 1 - Math.pow(1 - t2, 3);
        for (const ln of fLines) {
          const p = Math.min(1, Math.max(0, (revealT - ln.start) / 260));
          if (p <= 0) continue;
          const [x1, y1] = fStars[ln.a], [x2, y2] = fStars[ln.b];
          const ax = fx0 + x1 * place.width, ay = fy0 + y1 * place.height;
          const tt = ease(p);
          ctx.beginPath(); ctx.moveTo(ax, ay);
          ctx.lineTo(ax + (x2 - x1) * place.width * tt, ay + (y2 - y1) * place.height * tt);
          ctx.strokeStyle = `rgba(231,228,245,${(0.3 * Math.min(1, p * 1.5) * faceEnergy).toFixed(3)})`;
          ctx.lineWidth = 0.85; ctx.stroke();
        }
        const sizeScale = Math.max(0.7, Math.min(1.6, place.height / 380));
        for (let i = 0; i < fStars.length; i++) {
          const p = Math.min(1, Math.max(0, (revealT - fOrder[i] * 900) / 420));
          if (p <= 0) continue;
          const [sx, sy, rw] = fStars[i];
          const x = fx0 + sx * place.width, y = fy0 + sy * place.height;
          const tw = reduced ? 1 : 0.82 + 0.18 * Math.sin(t * (0.9 + (i % 10) / 12) + i * 2.4);
          // Gewichtete Sterne (Augen/Brille/Haaransatz) deutlich heller und
          // größer als die Konturpunkte — damit bleibt das Gesicht auch klein
          // erkennbar statt zu einem gleichförmigen Punktnebel zu werden.
          const alpha = ease(p) * tw * faceEnergy * (0.45 + rw * 0.75);
          const radius = (0.75 + rw * 1.5) * sizeScale;
          ctx.beginPath(); ctx.arc(x, y, radius * 2.6, 0, 6.2832);
          ctx.fillStyle = `rgba(231,228,245,${(0.12 * alpha).toFixed(3)})`; ctx.fill();
          ctx.beginPath(); ctx.arc(x, y, radius, 0, 6.2832);
          ctx.fillStyle = `rgba(231,228,245,${Math.min(1, alpha).toFixed(3)})`; ctx.fill();
        }
      }
    }
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMove);
  };
}
