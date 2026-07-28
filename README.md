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
(keine Abhängigkeiten nötig): `graph-layout.test.js`, `state.test.js`,
`projects.test.js`, `html-utils.test.js` und `focus-target.test.js`.

## Neues Projekt hinzufügen

Einen neuen Eintrag in `data/projects.js` ergänzen (gleiche Struktur wie
die bestehenden: `id`, `title`, `summary`, `description`, `tags`,
`demoUrl`, `repoUrl`, `status`). Die Position im Graph wird automatisch
berechnet — keine manuelle Koordinaten-Pflege nötig.

## Struktur

- `data/projects.js` — Projektdaten (einzige Quelle für Inhalte)
- `assets/js/graph-layout.js` — reine Layout-Funktion (unit-getestet),
  inkl. Viewport-abhängiger Radius-Skalierung
- `assets/js/state.js` — zentrales State-Modul (unit-getestet)
- `assets/js/focus-target.js` — reine Funktion für Fokus-Restore-Logik
  nach Fenster-Öffnen/-Wechsel/-Schließen (unit-getestet)
- `assets/js/html-utils.js` — `escapeHtml()`-Helfer für Projektdaten in
  Templates (unit-getestet)
- `assets/js/scene.js` — rendert Graph-Knoten & -Kanten
- `assets/js/window-manager.js` — Projekt-Detail-Fenster
- `assets/js/taskbar.js` — Uhr, aktive App, KI-Guide-Tipps
- `assets/js/boot.js` — überspringbare Boot-Sequenz

Details zu Design-Entscheidungen: [docs/superpowers/specs/2026-07-28-marco-os-design.md](docs/superpowers/specs/2026-07-28-marco-os-design.md)
