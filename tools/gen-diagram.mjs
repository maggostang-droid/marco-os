#!/usr/bin/env node
/**
 * gen-diagram.mjs — erzeugt Architektur-Diagramme im MARCO.OS-Look als SVG.
 *
 * Warum SVG statt Mermaid: GitHub filtert HTML/CSS in READMEs weg, rendert aber
 * repo-relative SVGs als Bild. So sehen die Diagramme in allen Repos exakt wie
 * die Terminal-Fenster der Portfolio-Seite aus (Fensterleiste, Ampel-Punkte,
 * Cluster-Akzent, Mono-Typo) statt wie GitHub-Default.
 *
 * Aufruf:  node gen-diagram.mjs <spec.json> <out.svg>
 *
 * Spec-Format (Positionen bewusst manuell — kleine Diagramme sehen von Hand
 * gesetzt besser aus als jedes Auto-Layout):
 * {
 *   "title": "app://sql-agent — architecture",
 *   "accent": "#fbbf24",
 *   "width": 900,
 *   "nodes": [ { "id": "a", "x": 40, "y": 90, "w": 150, "h": 52,
 *                "label": "get_schema", "sub": "live aus der DB" } ],
 *   "edges": [ { "from": "a", "to": "b", "label": "" },
 *              { "from": "c", "to": "b", "label": "Fehler", "arc": -46, "dashed": true } ]
 * }
 * arc: Bogenhöhe in px (negativ = oberhalb, positiv = unterhalb) für Rückkanten.
 */

import { readFileSync, writeFileSync } from "node:fs";

// Farben aus marco-os/assets/css/style.css bzw. window-manager.js — hier bewusst
// dupliziert, damit der Generator ohne Import aus dem Portfolio-Repo läuft.
const BG = "#0a0716";
const PANEL = "#140f24";
const TEXT = "#e7e4f5";
const TEXT_DIM = "#c9c5e8";
const LINE = "#a78bfa";
const INK = "#06040d";
const MONO = "JetBrains Mono, SFMono-Regular, Consolas, monospace";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Schnittpunkt der Verbindungslinie mit dem Rand der Box (statt Mittelpunkt). */
function anchor(node, towards) {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const dx = towards.x - cx;
  const dy = towards.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const sx = dx === 0 ? Infinity : node.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : node.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

function renderNode(n, accent) {
  const rx = 10;
  const hasSub = Boolean(n.sub);
  const labelY = hasSub ? n.y + n.h / 2 - 3 : n.y + n.h / 2 + 5;
  const accentFill = n.emphasis ? accent : PANEL;
  const labelFill = n.emphasis ? INK : TEXT;
  return `
  <g>
    <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}"
          fill="${accentFill}" stroke="${INK}" stroke-width="3"/>
    <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}"
          fill="none" stroke="${n.emphasis ? INK : accent}" stroke-width="1.5" opacity="${n.emphasis ? 1 : 0.85}"/>
    <text x="${n.x + n.w / 2}" y="${labelY}" fill="${labelFill}" font-family="${MONO}"
          font-size="14" font-weight="600" text-anchor="middle">${esc(n.label)}</text>
    ${
      hasSub
        ? `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 15}" fill="${
            n.emphasis ? INK : TEXT_DIM
          }" font-family="${MONO}" font-size="11" text-anchor="middle" opacity="0.85">${esc(
            n.sub
          )}</text>`
        : ""
    }
  </g>`;
}

function renderEdge(e, byId) {
  const a = byId[e.from];
  const b = byId[e.to];
  if (!a || !b) throw new Error(`Kante verweist auf unbekannten Knoten: ${e.from} -> ${e.to}`);
  const dash = e.dashed ? ` stroke-dasharray="6 5"` : "";

  let d;
  let labelPos;
  if (e.arc) {
    // Rueckkante: Anker mittig oben (arc negativ) bzw. unten (arc positiv), nicht
    // an der zugewandten Seite. Sonst kollabiert der Bogen bei kurzen Distanzen
    // zu einer Mini-Schleife zwischen zwei benachbarten Boxen.
    const above = e.arc < 0;
    const p1 = { x: a.x + a.w / 2, y: above ? a.y : a.y + a.h };
    const p2 = { x: b.x + b.w / 2, y: above ? b.y : b.y + b.h };
    const mx = (p1.x + p2.x) / 2;
    const cy = (above ? Math.min(p1.y, p2.y) : Math.max(p1.y, p2.y)) + e.arc * 2;
    d = `M ${p1.x} ${p1.y} Q ${mx} ${cy} ${p2.x} ${p2.y}`;
    // Scheitel der quadratischen Bezierkurve bei t=0.5.
    const apexY = 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y;
    labelPos = { x: mx, y: apexY + (above ? -7 : 15) };
  } else {
    const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    const p1 = anchor(a, bc);
    const p2 = anchor(b, ac);
    d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    labelPos = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 9 };
  }

  // Label bekommt ein Chip hinter sich, damit die Linie nicht durch die Schrift laeuft.
  const chipW = e.label ? e.label.length * 6.7 + 14 : 0;
  return `
  <path d="${d}" fill="none" stroke="${LINE}" stroke-width="1.8"${dash}
        marker-end="url(#arrow)" opacity="0.9"/>
  ${
    e.label
      ? `<rect x="${labelPos.x - chipW / 2}" y="${labelPos.y - 12}" width="${chipW}" height="17"
             rx="5" fill="${BG}" opacity="0.92"/>
         <text x="${labelPos.x}" y="${labelPos.y}" fill="${TEXT_DIM}" font-family="${MONO}"
          font-size="11" text-anchor="middle">${esc(e.label)}</text>`
      : ""
  }`;
}

export function buildSvg(spec) {
  const accent = spec.accent ?? "#5eead4";
  const width = spec.width ?? 900;
  const nodes = spec.nodes ?? [];
  const edges = spec.edges ?? [];
  const bottom = nodes.reduce((m, n) => Math.max(m, n.y + n.h), 0);
  const height = spec.height ?? bottom + 34;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"
     width="${width}" height="${height}" role="img" aria-label="${esc(spec.alt ?? spec.title ?? "Architektur")}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7"
            orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${LINE}"/>
    </marker>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14"
        fill="${BG}" stroke="${accent}" stroke-width="1" opacity="1"/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="36" rx="14" fill="${PANEL}"/>
  <rect x="0.5" y="22" width="${width - 1}" height="14" fill="${PANEL}"/>
  <line x1="0.5" y1="36" x2="${width - 0.5}" y2="36" stroke="${accent}" stroke-width="1" opacity="0.45"/>
  <circle cx="20" cy="18" r="5" fill="#ff5f57"/>
  <circle cx="38" cy="18" r="5" fill="#febc2e"/>
  <circle cx="56" cy="18" r="5" fill="#28c840"/>
  <text x="76" y="23" fill="${TEXT_DIM}" font-family="${MONO}" font-size="12"
        opacity="0.9">${esc(spec.title ?? "")}</text>
${edges.map((e) => renderEdge(e, byId)).join("")}
${nodes.map((n) => renderNode(n, accent)).join("")}
</svg>
`;
}

const [, , specPath, outPath] = process.argv;
if (specPath && outPath) {
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  writeFileSync(outPath, buildSvg(spec), "utf8");
  console.log(`${outPath} geschrieben (${spec.nodes?.length ?? 0} Knoten).`);
}
