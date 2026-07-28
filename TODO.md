# marco-os — Offene Punkte

Diese Liste enthält Punkte, die während Implementierung und Code-Review
identifiziert, aber bewusst nicht sofort umgesetzt wurden (kein Fehler im
laufenden Betrieb, aber echte Verbesserungen). Gedacht als Startpunkt für
einen Agenten/eine neue Session — jeder Punkt hat genug Kontext, um direkt
loszulegen, ohne die gesamte Historie zu kennen.

Hintergrund: `docs/superpowers/specs/2026-07-28-marco-os-design.md` (Design),
`docs/superpowers/plans/2026-07-28-marco-os-implementation.md` (Implementierungsplan,
bereits vollständig umgesetzt und gemerged).

**Update:** Die Punkte 1–5 der vorherigen Fassung dieser Liste (mobile
Radius-Skalierung, Fokus-Entscheidungslogik als reine Funktion, Tag-Winkel-
Spreizung, HTML-Injection-Schutz, sowie die kleineren Einzelpunkte) wurden
umgesetzt, per TDD getestet (`node --test tests/`, 29 Tests) und manuell im
Browser bei 375px/1280px verifiziert. Eine Ausnahme: das
`AbortController`-Teardown für den `keydown`-Listener in
`window-manager.js` wurde bewusst **nicht** nachgezogen — `initWindowManager`
wird nur einmal pro Seitenleben aufgerufen, es gibt keinen Aufrufer, der
jemals abbricht/aufräumt, daher wäre ein `AbortController` ohne je
aufgerufenes `abort()` toter Code. Nur relevant, falls `window-manager.js`
künftig mehrfach initialisiert werden soll (z.B. bei einem Hot-Reload-Setup).

**Update 2:** Parallax-Sternfeld-Hintergrund (`assets/js/starfield.js`) und
Graph-Zoom (Mausrad + Taskbar-Buttons, `state.zoomLevel`) wurden per
Subagent-Driven Development umgesetzt und final reviewed (Specs:
`docs/superpowers/specs/2026-07-28-parallax-starfield-design.md` und
`docs/superpowers/specs/2026-07-28-graph-zoom-design.md`). Die Zoom-Arbeit
deckte ein cross-cutting Problem auf und wurde in einem Fix-Wave behoben:
`window-manager.js` baute das Projekt-Fenster bei jedem Zoom-Tick komplett
neu auf, was Fokus vom Demo-/Repo-Link zurück auf den ×-Button riss und die
Scroll-Position der Beschreibung resettete — jetzt per Early-Out
unterdrückt, wenn dasselbe Projekt weiterhin offen ist. Ein Punkt aus
diesem Fix-Wave wurde bewusst **nicht** mit erledigt (siehe Punkt 2 unten).

## 1. Produkt-/Umfang-Themen (keine Code-Aufgabe)

- **Nur 3 Projekte in `data/projects.js`** (sql-agent + 2 Platzhalter mit
  `status: "planned"`). Weitere echte Projekte (z.B. `goz-finetune-vs-rag`,
  siehe `02_Portfolio/goz-finetune-vs-rag`) könnten als Karten/Knoten
  ergänzt werden.
- **Verhältnis zu `stangfolio`** (klassische Karten-Ansicht, unverändert
  bestehend) **und `stangverse`** (begehbare isometrische Welt, entsteht
  parallel in einer anderen Session) — noch keine Entscheidung, welches
  Konzept langfristig bleibt oder ob alle drei parallel existieren.

## 2. Taskbar hat denselben Fokus-/Rebuild-Bug wie das Projekt-Fenster hatte

**Kontext:** Der finale Review der Zoom-Funktion fand, dass
`window-manager.js`'s `render()` bei jedem `notify()` (auch reinen
Zoom-Ticks ohne Projektwechsel) das komplette Fenster neu aufbaute und
dabei Fokus/Scroll-Position zerstörte — das wurde gefixt (Early-Out bei
gleichbleibendem Projekt, siehe Update 2 oben). `assets/js/taskbar.js`s
`renderTaskbar()` (Zeile ~25) hat exakt dasselbe Muster: kompletter
`innerHTML`-Rebuild bei jedem `notify()`, inklusive reiner Zoom-Ticks, und
die beiden Zoom-Buttons rufen `.focus()` ohne `preventScroll: true` auf
(Zeile ~48). War explizit außerhalb des Zoom-Fix-Waves (dieser hat nur
Dateien angefasst, die tatsächlich Findings hatten) — `taskbar.js` selbst
wurde nicht verändert.

**Symptom:** Fokussiert man einen Zoom-Button per Tastatur und zoomt dann
weiter (Mausrad oder derselbe Button erneut), wird der Button bei jedem
Tick neu erzeugt und der Fokus zwar wiederhergestellt (dank der in Task 3
bereits vorhandenen `focusedZoomDirection`-Logik), aber ohne
`preventScroll` — bei genügend hohem Zoom-Level könnte das theoretisch ein
Scrollen von `.desktop` auslösen (dasselbe Risiko wie das gefixte
`preventScroll`-Finding in `scene.js`/`window-manager.js`).

**Ansatz:** Analog zum bereits gefixten Muster —
`[data-zoom="..."]?.focus({ preventScroll: true })` in `taskbar.js`
ergänzen. Ein Early-Out ist hier weniger offensichtlich lohnend als bei
`window-manager.js` (die Taskbar zeigt zusätzlich Uhrzeit und
KI-Guide-Tipp, die sich unabhängig von Zoom ändern — ein pauschales
"gleicher Zustand → skip" würde diese Updates mit unterdrücken), aber
zumindest der `preventScroll`-Fix ist eine risikofreie Ergänzung.
