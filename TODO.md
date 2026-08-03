# marco-os — Offene Punkte

Stand: 2026-08-03. Punkte, die bewusst nicht sofort umgesetzt wurden — keine
Fehler im laufenden Betrieb, aber echte Verbesserungen. Jeder Punkt hat genug
Kontext, um ohne Kenntnis der Historie loszulegen.

Die vorherige Fassung dieser Liste bezog sich auf den Stand vor dem
v3-Umstieg (drei Projekte, Platzhalter mit `status: "planned"`, Zoom-Fix-Wave).
Sie ist gegenstandslos: es sind acht echte Projekte, die Platzhalter existieren
nicht mehr, und die Startseite ist eine andere.

## 1. Schlafende Demos lassen sich nicht automatisch wecken

`.github/workflows/keep-warm.yml` hält werktags 08:00–20:47 wach, was wach ist.
Eine bereits eingeschlafene Streamlit-App kann er **nicht** wecken: der
Aufweck-Knopf im Browser schickt `POST /api/v2/app/resume`, und der antwortet
ohne angemeldete Sitzung mit 403.

Außerhalb des Zeitfensters bleibt ein Kaltstart also möglich. Eine `400` auf
`/~/+/` im Workflow-Log heißt "diese Demo schläft".

**Ansatz, falls es stören sollte:** Ein Dienst mit echter Browser-Sitzung
(z.B. ein Playwright-Job, der den Aufweck-Knopf klickt) könnte das lösen —
das wäre aber deutlich mehr Maschinerie als das jetzige Sechs-Zeilen-curl.

## 2. v3: Rendering weiterhin nur im Browser prüfbar

`tests/terminal-v3.test.js` deckt seit 03.08.2026 den Terminal-Parser und die
aus `data/` abgeleiteten Daten ab (Projekte, Tour, Boot-Zeilen, Kurztitel).
Nicht abgedeckt ist alles, was eine Bühne braucht: Orbit-Layout,
Label-Kollisionen, Boot-Ablauf, Fenster.

Diese Logik steckt im `<script>`-Block von `index.html` und ist von außen nicht
importierbar. Sie testbar zu machen hieße, `layout()` und die
Label-Auflösung in ein eigenes Modul zu ziehen — machbar, aber ein Eingriff in
eine Datei, die sonst als Ganzes vom v3-Paket stammt.

## 3. Produkt-/Umfang-Themen (keine Code-Aufgabe)

- **`index-legacy.html`** ist derzeit nur Revert-Ziel. Wenn v3 dauerhaft
  bleibt, wäre irgendwann zu entscheiden, ob die alte Fassung samt ihrer
  Module und Tests verschwindet.
- **Branch `worktree-design-optimization`** liegt noch auf origin und in
  `.claude/worktrees/design-optimization`. Er stammt aus einer Sitzung vor dem
  v3-Umstieg und ist vermutlich gegenstandslos.

## Erledigt am 03.08.2026

- **`<h1>`**: v3 hatte keine Überschrift und begann bei `<h2>` im
  Projektfenster — der HUD-Name ist jetzt ein `<h1>` (mit `margin:0`, sonst
  verschiebt der Browser-Standardabstand das HUD). Die frühere Fassung dieser
  Liste behauptete, *beide* Frontends hätten kein `<h1>`; das war für
  `index-legacy.html` falsch, dort ist das Zentrums-Knotenlabel in
  `scene.js` seit jeher eines.
- **Label-Überlappung auf dem Handy**: gelöst über `shortTitle` in
  `data/projects.js`, das v3 unter 760 px statt des vollen Titels rendert.
  Die Labels schrumpften von 126–141 px auf 77–90 px, Kollisionen von 1 auf 0
  bei 375 und 414 px. Zwei andere Ansätze wurden vorher gemessen und
  verworfen: größerer Radius (zwei Labels liefen aus dem Bild) und ein
  Zusatzversatz für das Zentrums-Label (verschlimmerte die Überlappung, weil
  das ausweichende Label darunter und nicht darüber saß).
