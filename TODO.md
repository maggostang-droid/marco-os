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

## 1. Produkt-/Umfang-Themen (keine Code-Aufgabe)

- **Nur 3 Projekte in `data/projects.js`** (sql-agent + 2 Platzhalter mit
  `status: "planned"`). Weitere echte Projekte (z.B. `goz-finetune-vs-rag`,
  siehe `02_Portfolio/goz-finetune-vs-rag`) könnten als Karten/Knoten
  ergänzt werden.
- **Verhältnis zu `stangfolio`** (klassische Karten-Ansicht, unverändert
  bestehend) **und `stangverse`** (begehbare isometrische Welt, entsteht
  parallel in einer anderen Session) — noch keine Entscheidung, welches
  Konzept langfristig bleibt oder ob alle drei parallel existieren.
