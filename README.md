# marco-os

Ein futuristisches KI-Portfolio: die Seite präsentiert sich als "MARCO.OS"
Desktop, dessen Hintergrund ein lebendiges neuronales Netz aus Projekten
ist. Alternative Darstellung zu [stangfolio](https://github.com/maggostang-droid/stangfolio),
das unverändert bestehen bleibt.

Live: https://maggostang-droid.github.io/marco-os/

## Lokal ausprobieren

Kein Build-Schritt, aber ein einfacher lokaler HTTP-Server ist nötig —
`index.html` direkt per Doppelklick/`file://` öffnen funktioniert **nicht**
(Browser blockieren ES-Module-Skripte unter `file://`):

```bash
python -m http.server 8000
# dann im Browser: http://localhost:8000/
```

## Tests

```bash
npm test
```

Führt alle Dateien in `tests/` über Node's eingebauten Test-Runner aus
(keine Abhängigkeiten nötig): `graph-layout.test.js`, `state.test.js`
(inkl. Zoom-Clamping), `projects.test.js`, `html-utils.test.js`,
`focus-target.test.js`, `resume.test.js` und `terminal-commands.test.js`
(Terminal-Parser, Tour-Schrittdaten, GitHub-Datumsformatierung). `scene.js`/`window-manager.js`/`taskbar.js`/
`starfield.js` sind DOM-lastig und bleiben wie bisher manuell im Browser
verifiziert (375px/1280px+).

## Neues Projekt hinzufügen

Einen neuen Eintrag in `data/projects.js` ergänzen (gleiche Struktur wie
die bestehenden: `id`, `title`, `summary`, `description`, `tags`,
`demoUrl`, `repoUrl`, `status`). Die Position im Graph wird automatisch
berechnet — keine manuelle Koordinaten-Pflege nötig.

## Struktur

- `data/projects.js` — Projektdaten (einzige Quelle für Inhalte)
- `assets/js/graph-layout.js` — reine Layout-Funktion (unit-getestet),
  inkl. Viewport-abhängiger Radius-Skalierung und Fit-to-Viewport für
  schmale/Portrait-Viewports (Ellipsen hochkant, alles bleibt im Bild)
- `assets/js/state.js` — zentrales State-Modul (unit-getestet)
- `assets/js/focus-target.js` — reine Funktion für Fokus-Restore-Logik
  nach Fenster-Öffnen/-Wechsel/-Schließen (unit-getestet)
- `assets/js/html-utils.js` — `escapeHtml()`-Helfer für Projektdaten in
  Templates (unit-getestet)
- `assets/js/scene.js` — rendert Graph-Knoten & -Kanten, inkl. Zoom
  (Mausrad + `state.zoomLevel`, automatischer Fokus-Zoom-Bonus)
- `assets/js/window-manager.js` — Projekt-Detail-Fenster
- `assets/js/taskbar.js` — Uhr, aktive App, KI-Guide-Tipps, Zoom-Buttons
  (+/−)
- `assets/js/boot.js` — überspringbare Boot-Sequenz
- `assets/js/starfield.js` — parallaxender Sternfeld-Hintergrund
  (mausreaktiv, respektiert `prefers-reduced-motion`)
- `assets/js/menubar.js` — OS-Menüleiste oben (Tour, Lebenslauf,
  Ask-Marco, Terminal, Kontakt)
- `assets/js/terminal-commands.js` — Befehls-Parser des Terminals
  (pure Function, unit-getestet); Fenster-Wiring in window-manager.js,
  öffnen per Menüleiste, Taste T oder `#terminal`
- `assets/js/tour.js` — geführte Tour durch drei Highlight-Projekte,
  endet beim Lebenslauf/Kontakt (Menüleiste, `tour`-Befehl oder `#tour`)
- `assets/js/router.js` — Deep-Links per URL-Hash (`#sql-agent`,
  `#lebenslauf`, `#ask-marco`, `#terminal`, `#tour`)
- `assets/js/github-activity.js` — echte "letzter Commit …"-Zeile aus der
  öffentlichen GitHub-API (sessionStorage-Cache, stiller Fallback)
- `assets/js/hud.js` — Identitäts-Panel (oben links) + Orbit-Legende
  (unten links) über der Szene
- `assets/fonts/` — self-gehostete Webfonts (Space Grotesk + JetBrains
  Mono, via `@fontsource`-Pakete; kein Google-Fonts-CDN → DSGVO-sicher)

Details zu Design-Entscheidungen: [docs/superpowers/specs/2026-07-28-marco-os-design.md](docs/superpowers/specs/2026-07-28-marco-os-design.md)
