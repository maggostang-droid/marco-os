# marco-os — Offene Punkte

Diese Liste enthält Punkte, die während Implementierung und Code-Review
identifiziert, aber bewusst nicht sofort umgesetzt wurden (kein Fehler im
laufenden Betrieb, aber echte Verbesserungen). Gedacht als Startpunkt für
einen Agenten/eine neue Session — jeder Punkt hat genug Kontext, um direkt
loszulegen, ohne die gesamte Historie zu kennen.

Hintergrund: `docs/superpowers/specs/2026-07-28-marco-os-design.md` (Design),
`docs/superpowers/plans/2026-07-28-marco-os-implementation.md` (Implementierungsplan,
bereits vollständig umgesetzt und gemerged).

## 1. Mobile Radius-Skalierung (größter Punkt, echtes UX-Problem)

**Problem:** `assets/js/graph-layout.js` verwendet feste Pixel-Radien
(`BASE_RADIUS = 150`, `IDEA_RADIUS_MULTIPLIER = 1.35`, `TAG_RADIUS = 85`),
die nicht mit der Viewport-Breite skalieren. Bei sehr schmalen Screens
(~375px) können die Tech-Stack-Tag-Knoten eines fokussierten Projekts über
den sichtbaren Bereich hinausragen und werden von `.desktop { overflow:
hidden }` (`assets/css/style.css`) abgeschnitten — kein Crash, aber die
Tag-Ansicht ist auf dem Handy teils unbrauchbar.

**Ansatz:** In `assets/js/scene.js` oder `graph-layout.js` die tatsächliche
Breite des `#scene`-Containers (bzw. `window.innerWidth`) einbeziehen und
`BASE_RADIUS`/`TAG_RADIUS` proportional dazu skalieren (z.B. Radius als
Anteil der kleineren Viewport-Dimension statt fixer Pixelwert). Da
`graph-layout.js` aktuell eine reine, unit-getestete Funktion ohne
DOM-Zugriff ist (bewusste Design-Entscheidung, siehe Spec), müsste die
Viewport-Größe als zusätzlicher Parameter reingereicht werden, statt die
Funktion DOM-abhängig zu machen — sonst geht die Testbarkeit verloren.

**Bereits vorhandene Tests als Vorbild:** `tests/graph-layout.test.js` zeigt
das Testmuster (reine Eingabe/Ausgabe-Assertions ohne DOM).

## 2. Fokus-Entscheidungslogik als reine Funktion auslagern + testen

**Kontext:** Die Tastatur-Fokus-Logik in `assets/js/window-manager.js`
(`hadFocusInWindow` Zeile 18, `closingProjectId`/`isNewlyOpenedOrSwitched`,
Fokus-Restore Zeile 26 und Zeile 65-66) ist korrekt, aber komplett
ungetestet — sie kam erst durch mehrere Runden manuellen Code-Tracings
während des Reviews zustande, nicht durch automatisierte Tests. Das ist
laut Abschluss-Review "das eine DOM-nahe Ding, das eigentlich testbar
gewesen wäre".

**Ansatz:** Die Entscheidung "wohin soll der Fokus nach diesem
State-Übergang wandern" aus `window-manager.js` in eine reine Funktion
extrahieren, z.B.:

```js
function nextFocusTarget(prevProjectId, nextProjectId, focusWasInWindow) {
  if (nextProjectId && nextProjectId !== prevProjectId) return "open-window";
  if (nextProjectId && focusWasInWindow) return "open-window";
  if (!nextProjectId && focusWasInWindow && prevProjectId) return `graph-node:${prevProjectId}`;
  return "unchanged";
}
```

(Exakte Signatur nach Bedarf anpassen.) Diese Funktion wäre wie
`graph-layout.js` pur und mit `node:test` testbar — die drei Szenarien
(frisch öffnen, zwischen Projekten wechseln, schließen) plus der
Nicht-Diebstahl-Fall (unrelated re-render beim gleichen Projekt) sollten
je einen Testfall bekommen.

## 3. Tag-Winkel-Spreizung skaliert nicht mit Tag-Anzahl

**Problem:** `assets/js/graph-layout.js:5,27`: `TAG_ANGLE_SPREAD = 0.35`
ist fix. Bei aktuell max. 5 Tags (sql-agent) sieht das gut aus, aber bei
~10 Tags würde der Fächer ±1.575rad (~±90°) aufspannen — Tags würden dann
Richtung Zentrum zeigen und mit den Haupt-Kanten überlappen.

**Ansatz:** Spreizung invers zur Tag-Anzahl skalieren, z.B.
`const spread = Math.min(0.35, MAX_TOTAL_SPREAD / tagCount)` mit einer
sinnvollen `MAX_TOTAL_SPREAD`-Konstante. Nur relevant, sobald ein Projekt
in `data/projects.js` deutlich mehr als 5 Tags bekommt — aktuell kein
akutes Problem.

## 4. HTML-Injection-Schutz (defensiv, aktuell kein echtes Risiko)

**Kontext:** `assets/js/scene.js:60,67,70` und `assets/js/window-manager.js`
schreiben `project.title`, `project.description`, `node.label` etc. direkt
per Template-String in `innerHTML`. Da `data/projects.js` aktuell die
einzige Datenquelle ist und von Hand gepflegt wird (kein User-Input, kein
CMS), ist das kein akutes Sicherheitsproblem — aber ein `<` in einer
zukünftigen Projektbeschreibung würde das Fenster stillschweigend kaputt
rendern.

**Ansatz:** Kleiner `escapeHtml(str)`-Helfer (3-4 Zeilen, ersetzt
`&`, `<`, `>`, `"` durch Entities), an den paar Interpolationsstellen in
`scene.js` und `window-manager.js` angewendet.

## 5. Kleinere, unabhängige Punkte (jeweils < 10 Minuten Aufwand)

- **`tests/projects.test.js`**: Prüft nur Feld-Präsenz, nicht die Typen —
  `demoUrl`/`repoUrl` sollten `string | null` sein, `status` ein
  nicht-leerer String. Ergänzende Assertions wären eine dünne, aber echte
  Verbesserung der Datenkontrakt-Absicherung.
- **`assets/js/graph-layout.js:25`**: `project.tags.length` geht davon
  aus, dass `tags` immer ein Array ist (Brief/Spec garantiert das, aber
  kein Laufzeit-Fallback). Optional: `project.tags ?? []`.
- **`assets/js/state.js:35-39`**: `resetState()` (nur für Tests gedacht)
  setzt `listeners = new Set()` neu statt `listeners.clear()`. Funktional
  aktuell unproblematisch, aber ein `unsubscribe`-Handle, das *vor* einem
  `resetState()`-Aufruf geholt wurde, würde danach ins Leere greifen.
  `.clear()` vermeidet die Falle strukturell.
- **`assets/js/window-manager.js:10-14`**: Der `document`-weite
  `keydown`-Listener für Escape hat kein Teardown (`AbortController`) wie
  `boot.js` es inzwischen hat. Aktuell unproblematisch, da
  `initWindowManager` nur einmal pro Seitenleben aufgerufen wird — aber
  inkonsistent zum jetzt saubereren `boot.js`-Muster.
- **Unescaped ID in CSS-Attribut-Selektor**: `window-manager.js`
  interpoliert `closingProjectId` direkt in
  `document.querySelector(\`[data-node-id="${id}"]\`)` — sicher, solange
  alle `id`-Werte in `data/projects.js` anführungszeichenfreie Slugs sind
  (aktuell der Fall). Würde bei einer zukünftigen ID mit `"` eine
  `DOMException` werfen.
- **"Demo folgt"-Darstellung**: `window-manager.js` rendert den
  deaktivierten Zustand als `<span class="btn primary disabled"
  aria-disabled="true">` statt als `<button disabled>`. Nicht fokussierbar
  in beiden Fällen, also keine kaputte Interaktion — aber unkonventionell.

## 6. Produkt-/Umfang-Themen (keine Code-Aufgabe)

- **Nur 3 Projekte in `data/projects.js`** (sql-agent + 2 Platzhalter mit
  `status: "planned"`). Weitere echte Projekte (z.B. `goz-finetune-vs-rag`,
  siehe `02_Portfolio/goz-finetune-vs-rag`) könnten als Karten/Knoten
  ergänzt werden.
- **Verhältnis zu `stangfolio`** (klassische Karten-Ansicht, unverändert
  bestehend) **und `stangverse`** (begehbare isometrische Welt, entsteht
  parallel in einer anderen Session) — noch keine Entscheidung, welches
  Konzept langfristig bleibt oder ob alle drei parallel existieren.
