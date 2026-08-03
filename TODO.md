# marco-os — Offene Punkte

Stand: 2026-08-03. Punkte, die bewusst nicht sofort umgesetzt wurden — keine
Fehler im laufenden Betrieb, aber echte Verbesserungen. Jeder Punkt hat genug
Kontext, um ohne Kenntnis der Historie loszulegen.

Die vorherige Fassung dieser Liste bezog sich auf den Stand vor dem
v3-Umstieg (drei Projekte, Platzhalter mit `status: "planned"`, Zoom-Fix-Wave).
Sie ist gegenstandslos: es sind acht echte Projekte, die Platzhalter existieren
nicht mehr, und die Startseite ist eine andere.

## 1. Keine Überschriften-Struktur

Beide Frontends bauen ihre Texte per JavaScript und setzen **kein `<h1>`**. v3
hat ein `<h2>` im Projektfenster, aber kein `<h1>` darüber — für Screenreader
und Suchmaschinen ist das eine echte Lücke.

**Ansatz:** In v3 den HUD-Namen ("Dr.-Ing. Marco Stang", `index.html`, Klasse
`hud-name`) von `<div>` auf `<h1>` heben und das `<h2>` im Fenster
beibehalten. Optisch ändert sich nichts, wenn die Schriftwerte inline bleiben.
Vorsicht: Der Standard-`margin` von Überschriften muss auf `0` gesetzt werden,
sonst verschiebt sich das HUD.

## 2. Eine Label-Überlappung auf dem Handy

Bei 375 und 414 px überlappt genau ein Knoten-Label ("AI Act Evidence Toolkit")
das Zentrums-Label. Bei 768 px und darüber sind es null.

Ursache ist Platzmangel, kein Fehler in der Kollisionsauflösung: der Radius ist
dort durch die Breite begrenzt (`padX`), nicht durch die Höhe. Ein größerer
Radius wurde versucht (`padX` 42 → 28) und wieder verworfen, weil dann zwei
Labels aus dem Bild liefen — siehe Kommentar an der Stelle in `index.html`.

**Ansatz:** Statt am Radius zu drehen, die Labels auf schmalen Viewports
kürzen (z.B. nur der Projekttitel ohne Zusatz) oder das Label des jeweils
fokussierten Knotens hervorheben und die übrigen ausblenden.

## 3. Schlafende Demos lassen sich nicht automatisch wecken

`.github/workflows/keep-warm.yml` hält werktags 08:00–20:47 wach, was wach ist.
Eine bereits eingeschlafene Streamlit-App kann er **nicht** wecken: der
Aufweck-Knopf im Browser schickt `POST /api/v2/app/resume`, und der antwortet
ohne angemeldete Sitzung mit 403.

Außerhalb des Zeitfensters bleibt ein Kaltstart also möglich. Eine `400` auf
`/~/+/` im Workflow-Log heißt "diese Demo schläft".

**Ansatz, falls es stören sollte:** Ein Dienst mit echter Browser-Sitzung
(z.B. ein Playwright-Job, der den Aufweck-Knopf klickt) könnte das lösen —
das wäre aber deutlich mehr Maschinerie als das jetzige Sechs-Zeilen-curl.

## 4. v3 hat keine Testabdeckung

`npm test` deckt die Legacy-Module und die geteilten Daten in `data/` ab. Die
gesamte v3-Logik — Layout, Terminal-Parser, Boot, Tour — steckt in
`index.html` bzw. `portfolio-data-v3.js` und wird nur im Browser verifiziert.

Der Terminal-Parser in `portfolio-data-v3.js` (`executeCommand`,
`completeInput`) ist eine reine Funktion und ließe sich testen wie sein
Legacy-Gegenstück in `tests/terminal-commands.test.js`.

## 5. Produkt-/Umfang-Themen (keine Code-Aufgabe)

- **`index-legacy.html`** ist derzeit nur Revert-Ziel. Wenn v3 dauerhaft
  bleibt, wäre irgendwann zu entscheiden, ob die alte Fassung samt ihrer
  Module und Tests verschwindet — dann verlöre man allerdings die einzige
  Testabdeckung im Repo (siehe Punkt 4).
- **Branch `worktree-design-optimization`** liegt noch auf origin und in
  `.claude/worktrees/design-optimization`. Er stammt aus einer Sitzung vor dem
  v3-Umstieg und ist vermutlich gegenstandslos.
