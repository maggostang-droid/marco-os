# Parallax-Sternfeld — Design

**Status:** Approved
**Datum:** 2026-07-28

## Ziel

Der `.desktop`-Hintergrund ist aktuell ein statischer Radial-/Linear-Gradient
(`assets/css/style.css`, `.desktop`-Regel). Das soll "weltall-artiger" wirken:
ein Sternfeld mit Tiefe, das sich per Mausbewegung leicht parallaxt bewegt.

## Architektur

Neues Modul `assets/js/starfield.js`, analog zu den bestehenden `init*`-Modulen
(`initScene`, `initTaskbar`, `initBoot`). Exportiert `initStarfield(container)`.

- Rendert 2-3 `<div class="star-layer star-layer--{far,mid,near}">`-Elemente
  in `.desktop`, positioniert hinter `#scene` (niedrigerer `z-index` bzw. vor
  `#scene` im DOM, da `#scene` keinen eigenen Hintergrund hat).
- Jede Ebene bekommt ihre Sternpunkte über eine einzige `box-shadow`-Liste
  (kein DOM-Node pro Stern) — Sternpositionen werden bei Init einmalig
  zufällig generiert und als Inline-Style gesetzt. Keine Persistenz zwischen
  Reloads nötig (Zufall reicht, kein fester Seed).
- Sternanzahl/-größe nimmt von `far` → `near` zu (mehr, kleinere Punkte weit
  weg; weniger, größere Punkte nah), Deckkraft ebenso (fern = dezenter).

## Parallax-Verhalten

- Ein `mousemove`-Listener auf `.desktop` berechnet die Cursor-Position
  relativ zur Container-Mitte (normalisiert auf ±1).
- Jede Ebene bekommt einen Multiplikator (z.B. far: 4px, mid: 9px,
  near: 16px max. Verschiebung) und wird per `element.style.transform =
  translate(x, y)` aktualisiert — reines CSS-Transform-Update, kein Bezug zu
  `state.js`, kein Re-Render der Graph-Szene.
- Kein `touchmove`-Handling: auf Touch-Geräten bleiben die Sterne sichtbar,
  aber statisch (kein Cursor vorhanden — kein Verlust ggü. heute).
- `@media (prefers-reduced-motion: reduce)`: Transform-Übergänge werden
  deaktiviert (Sterne bleiben an ihrer Ausgangsposition), analog zum
  bestehenden `edgePulse`-Pattern in `style.css`.

## Integration

- `assets/js/main.js`: `initStarfield(document.querySelector(".desktop"))`
  wird vor `initScene` aufgerufen (Sterne sollen unter der Graph-Szene
  liegen).
- `assets/css/style.css`: neue Regeln für `.star-layer` (Positionierung,
  `pointer-events: none` damit Klicks durch zu den Graph-Nodes gehen) und die
  `prefers-reduced-motion`-Ausnahme.

## Testing

- `starfield.js` ist DOM-lastig (Canvas/Style-Manipulation, `mousemove`) —
  wie `scene.js`/`window-manager.js` nicht unit-getestet, sondern manuell im
  Browser verifiziert (375px und 1280px+, plus Maus-Bewegungstest für den
  Parallax-Effekt und ein Check mit aktivierter "reduzierte Bewegung"
  Systemeinstellung).
- Kein neuer `node --test`-Test nötig, da keine reine Logik-Funktion mit
  sinnvoll isolierbarem Input/Output entsteht (die Sternpositionen sind
  zufällig, die Parallax-Berechnung ist eine triviale lineare Skalierung).

## Out of Scope (YAGNI)

- Keine Nebel-Wolken (bewusst abgewählt zugunsten von Parallax-Fokus).
- Keine Shooting-Stars-Animation.
- Kein Bild-Asset — bleibt reines CSS/JS ohne externe Dependencies, passend
  zum "kein Build-Tool"-Constraint des Projekts.
- Kein `touchmove`-basiertes Mobile-Parallax (Sterne bleiben dort statisch).
