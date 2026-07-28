# Handover — marco-os

Stand: 2026-07-28, Ende der Session. Für einen Agenten/eine neue Session,
die hier weitermacht, ohne den ganzen Gesprächsverlauf zu kennen.

## Was das hier ist

KI-Portfolio von Marco Stang als "MARCO.OS"-Desktop: Hintergrund ist ein
lebendiges neuronales Netz (Marco im Zentrum, Projekte als Satelliten-Knoten
= "Planeten"). Klick auf einen Knoten öffnet ein Terminal-Fenster mit
Projekt-Details. Plain HTML/CSS/Vanilla-JS (ES-Module), kein Build-Tool,
keine npm-Dependencies. Hosting: GitHub Pages.

**Wichtig:** `CLAUDE.md` im Repo-Root behauptet "No source code exists
yet, only spec/plan" — das ist **veraltet**. Der komplette Code existiert
und funktioniert. Nicht darauf hereinfallen.

## Ist-Zustand: voll funktionsfähig

- `npm test` → 37/37 Tests grün (Node's `node:test`, keine Dependencies).
  (`node --test tests/` mit Verzeichnis-Pfad funktioniert auf diesem
  Node-Build **nicht** — entweder `npm test` oder
  `node --test "tests/*.test.js"` benutzen.)
- Lokal starten: `python -m http.server 8000` im Repo-Root, dann
  `http://localhost:8000/`. Direktes Öffnen per `file://` geht **nicht**
  (Browser blockieren ES-Module-Skripte dort).
- **Cache-Falle beim manuellen Testen:** `python -m http.server` schickt
  keine Cache-Busting-Header. Nach JS/CSS-Änderungen ggf. Hard-Refresh
  (Strg+Shift+R) nötig, sonst sieht man die alte Version — ist in dieser
  Session schon einmal für Verwirrung gesorgt.

## Architektur (kurz)

Zentrales State-Modul (`assets/js/state.js`, subscribe/notify) treibt drei
unabhängige Renderer: `scene.js` (Graph), `window-manager.js`
(Projekt-Fenster), `taskbar.js` (Uhr/Tipps/Zoom-Buttons). Reine,
unit-getestete Logik ist bewusst von DOM-Rendering getrennt:
`graph-layout.js` (Layout-Berechnung), `focus-target.js`
(Fokus-Restore-Entscheidung), `html-utils.js` (`escapeHtml`). Details:
[docs/superpowers/specs/2026-07-28-marco-os-design.md](docs/superpowers/specs/2026-07-28-marco-os-design.md).

## Was in dieser Session dazugekommen ist (chronologisch)

1. **Backlog aus `TODO.md` abgearbeitet** (war vor Session-Start schon als
   offene Punkte dokumentiert): Viewport-abhängige Radius-Skalierung,
   Tag-Winkel-Spreizung, `escapeHtml`-Schutz, `nextFocusTarget`-Extraktion,
   diverse kleine Fixes. Alles per TDD, 13→29 Tests.
2. **Parallax-Sternfeld** (`assets/js/starfield.js`, neu): 3
   Tiefenebenen aus Sternen (CSS `box-shadow`-Trick, kein Bild-Asset),
   parallaxen per Mausbewegung, respektieren `prefers-reduced-motion`.
   Spec: [docs/superpowers/specs/2026-07-28-parallax-starfield-design.md](docs/superpowers/specs/2026-07-28-parallax-starfield-design.md).
3. **Graph-Zoom**: Mausrad + zwei Taskbar-Buttons (barrierefrei), Zoom
   geclampt 0.6–1.8 (`state.zoomLevel`), automatischer Fokus-Zoom-Bonus
   beim Öffnen eines Projekts (aktuell **1.6×**, nach Nutzer-Feedback von
   ursprünglich 1.15× erhöht). Kein Pan — Zentrum bleibt immer fix.
   Spec: [docs/superpowers/specs/2026-07-28-graph-zoom-design.md](docs/superpowers/specs/2026-07-28-graph-zoom-design.md).
   - Whole-Branch-Review deckte ein cross-cutting Problem auf: Zoom feuerte
     `notify()` so oft, dass `window-manager.js` das offene Projekt-Fenster
     bei jedem Tick neu aufbaute — Fokus sprang vom Demo-/Repo-Link zurück
     zum ×-Button, Scroll-Position resettete. Gefixt per Early-Out in
     `render()`, wenn dasselbe Projekt weiterhin aktiv ist (`window-manager.js`
     Zeile ~22). Dazu: No-Op-Guard in `zoomIn`/`zoomOut` am Zoom-Anschlag,
     `preventScroll: true` an allen `.focus()`-Aufrufen, Mausrad-Delta-
     Akkumulation (Schwellwert 100px) gegen abruptes Trackpad-Zoomen.
4. **Tech-Stack im Projekt-Fenster eingeklappt**: Tags-Pillen starten
   hinter einem "Tech-Stack anzeigen"-Toggle versteckt
   (`window-manager.js`), klappen erst per Klick auf.
5. **"Planeten"-Optik für die Knoten** (`assets/js/scene.js` +
   `style.css`): Zentrum- und Projekt-Knoten bekommen eine von drei
   Textur-Varianten (Schlagschatten / Saturn-Ring / Wolkenwirbel-Flecken),
   **round-robin nach Render-Reihenfolge verteilt** (nicht per Hash — ein
   erster Versuch mit einem schwachen Summen-Hash ließ zufällig alle 4
   Knoten auf derselben Variante landen; das war ein echter Bug, jetzt
   gefixt). Tag-Knoten (8px) bleiben unverändert schlicht.

## Bekannte offene Punkte (Details in `TODO.md`)

- **`taskbar.js` hat denselben Fokus-/Rebuild-Bug wie Punkt 3 oben, aber
  bewusst nicht mitgefixt** (war außerhalb des Fix-Wave-Scopes): baut bei
  jedem `notify()` komplett neu, Zoom-Buttons haben kein `preventScroll`.
  Kein Early-Out möglich wie bei `window-manager.js`, da die Taskbar auch
  Uhrzeit/Tipp zeigt, die sich unabhängig ändern.
- **Nur 3 Projekte in `data/projects.js`** (sql-agent aktiv, 2 Platzhalter).
- **Verhältnis zu `stangfolio`/`stangverse`** ungeklärt (Produktentscheidung,
  keine Code-Aufgabe).

## Workflow-Hinweise für die nächste Session

- **Direkt auf `master`, kein Worktree/Branch** — das ist in dieser Session
  explizit vom Nutzer so gewählt worden (bewusste Entscheidung, kein
  Versehen). Bei neuen Feature-Anfragen erst nachfragen, ob das weiterhin
  gilt, bevor man einen Worktree aufmacht.
- Größere Features liefen über `superpowers:brainstorming` →
  `superpowers:writing-plans` → `superpowers:subagent-driven-development`
  (Spec + Plan unter `docs/superpowers/`, dann Task-für-Task per
  Subagent + Review). Kleinere visuelle Tweaks (Zoom-Stärke, Planeten-
  Textur) liefen direkt mit Playwright-gestützter Browser-Verifikation
  statt des vollen SDD-Prozesses — passendes Maß an Prozess für die
  Größe der Änderung wählen.
- Manuelle Browser-Verifikation lief in dieser Session über ein
  lokal installiertes `playwright` (npm-Paket + Chromium-Browser,
  installiert im Scratchpad-Verzeichnis, **nicht** im Projekt selbst, um
  das "keine Dependencies"-Prinzip von marco-os nicht zu verletzen). Bei
  Bedarf erneut so aufsetzen, nicht `playwright` als Projekt-Dependency
  hinzufügen.
- Nutzer testet parallel selbst im Browser und gibt kurzes, direktes
  Feedback (oft knapp/mit Tippfehlern) — bei Unklarheit lieber kurz
  nachfragen (z.B. per `AskUserQuestion`) als zu raten, besonders bei
  visuellen/Geschmacksfragen.
