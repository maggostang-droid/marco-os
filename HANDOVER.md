# Handover — marco-os

Stand: 2026-07-29, Ende der Session. Für einen Agenten/eine neue Session,
die hier weitermacht, ohne den ganzen Gesprächsverlauf zu kennen. Ersetzt
die vorherige Handover-Version (second-brain-Chat-Fenster-Session).

## Was das hier ist

KI-Portfolio von Marco Stang als "MARCO.OS"-Desktop: Hintergrund ist ein
lebendiges neuronales Netz (Marco im Zentrum, Projekte als Satelliten-Knoten
= "Planeten", nach Skill-Cluster auf eigenen elliptischen Orbits gruppiert).
Klick auf einen Projekt-Knoten öffnet ein Terminal-Fenster mit
Projekt-Details. Plain HTML/CSS/Vanilla-JS (ES-Module), kein Build-Tool,
keine npm-Dependencies. Hosting: GitHub Pages, deployt von `master`.

## Ist-Zustand auf `master`: voll funktionsfähig

- `npm test` → **39/39 Tests grün** (Node's `node:test`, keine
  Dependencies).
- Lokal starten: `python -m http.server 8000` im Repo-Root, dann
  `http://localhost:8000/`. Direktes Öffnen per `file://` geht **nicht**.
- **Cache-Falle:** `python -m http.server` schickt keine
  Cache-Busting-Header — nach JS/CSS-Änderungen Hard-Refresh
  (Strg+Shift+R) nötig.

## ⚠️ Wichtig: paralleler Redesign-Branch existiert, ist NICHT Teil von master

Während dieser Session lief (offenbar automatisiert/durch einen anderen
Prozess, nicht durch mich) auf demselben Checkout ein kompletter Frontend-
Umbau auf dem lokalen Branch `redesign/frontend-design-overhaul` — 20+
Commits: Vite als Build-Tool, WebGL/PixiJS-Renderer statt SVG,
Multi-Window-Fenstermanager (Drag/Resize/Z-Order), Command Palette
(Strg/Cmd+K), CRT/Synthwave-Design-Token-System, umgeschriebene Taskbar,
CI/gh-pages-Deploy-Workflow. **Dieser Branch wurde nie nach `origin`
gepusht und ist auf Nutzerwunsch nicht weiterverfolgt worden** — er
existiert weiterhin lokal in diesem Checkout, wuchs aber noch während
dieser Session in Echtzeit weiter (Branch wechselte mehrfach unter der
Hand, neue Commits erschienen ungefragt).

**Für die nächste Session:** Vor dem Arbeiten `git branch -vv` prüfen. Falls
der Checkout wieder auf `redesign/frontend-design-overhaul` steht statt
`master`: das ist nicht dein Branch, nicht committen/pushen ohne
Rücksprache mit Marco — er hat entschieden, dass der Inhalt (Stand dieser
Session) nicht weiterverfolgt wird. Ein versehentlicher Commit auf diesen
Branch ist mir selbst in dieser Session passiert (kleiner Fix-Commit,
danach dort belassen, siehe unten) — die Dateien, die er berührt
(`command-palette.js`, die CRT-Boot-Transition in `boot.js`/`style.css`)
existieren auf `master` gar nicht, ein Cherry-Pick schlägt entsprechend
fehl (ausprobiert, abgebrochen).

## Neu in dieser Session (alles auf `master`)

### 1. Projekt-Content-Rebrand

Alle 8 Projekte bekamen marketing-taugliche Namen, eine zweigeteilte
Beschreibung (immer sichtbares High-Level-`summary` + technisches
`description` hinter Toggle, vorher nur ein einziger dichter Text), und die
zugehörigen GitHub-Repos wurden umbenannt (alte URLs redirecten via GitHub,
außer bei `hr-interview-cockpit`/`interview-cockpit` — dessen GitHub-Pages-
Demo-Link musste manuell aktualisiert werden, GitHub redirected Pages-URLs
nicht automatisch).

Vollständiger Brainstorming→Spec→Plan→SDD-Prozess:
- Spec: [`docs/superpowers/specs/2026-07-29-project-content-rebrand-design.md`](docs/superpowers/specs/2026-07-29-project-content-rebrand-design.md)
- Plan: [`docs/superpowers/plans/2026-07-29-project-content-rebrand-implementation.md`](docs/superpowers/plans/2026-07-29-project-content-rebrand-implementation.md)

**Zwei echte Bugs während der SDD-Ausführung:**

1. **Task-1-Brief hatte veraltete Description-Texte.** Der Plan wurde aus
   einem sehr frühen Read von `data/projects.js` geschrieben, aber
   `sql-agent` und `goz-finetune-vs-rag` waren zwischenzeitlich (außerhalb
   dieser Konversation) mit neuen Eval-Zahlen/einer anderen Ergebnis-
   Erzählung aktualisiert worden. Der Task-Reviewer fand das als Critical
   Finding; Marco bestätigte, welche Version aktuell/korrekt ist; Fix-Runde
   1 stellte den richtigen Text wieder her. **Lehre:** Ein Plan, der
   vollständigen Dateiinhalt vorschreibt, ist nur so aktuell wie der Moment
   seines letzten Reads — bei einer länger laufenden Session lohnt sich ein
   Diff-Check gegen den tatsächlichen Dateiinhalt direkt vor Ausführung,
   nicht nur Vertrauen in den zu Beginn gelesenen Stand.
2. **Implementer committete in den Haupt-Checkout statt in den isolierten
   Worktree**, obwohl explizit angewiesen. Per Cherry-Pick auf den
   korrekten Worktree-Branch übertragen, Haupt-Checkout zurückgesetzt.
   **Lehre:** Nach jedem Implementer-Report prüfen, auf welchem Branch der
   Commit tatsächlich gelandet ist (`git log --oneline -3` im Report
   verlangen oder selbst nachprüfen), nicht nur den Report-Status
   vertrauen.

### 2. Edge-Reveal-Batching pro Cluster

Verbindungslinien (Kanten) zum selben Skill-Cluster erscheinen jetzt
gleichzeitig als eine Gruppe, statt einzeln nacheinander gestaffelt zu
werden (`assets/js/scene.js`, `buildEdgeLayer`) — spiegelt das bestehende
Node-Batching-Muster aus `buildNodeLayer`.

### 3. Ask-Marco Assistant als kleiner Mond von Marco

`second-brain`-Projekt bekam `orbitsCenter: true` in `data/projects.js` und
umgeht damit das Cluster-Ring-System komplett (`graph-layout.js`): eigener
kleiner, fixer Orbit direkt neben dem Zentrum-Knoten statt im
agentic-ai-Ring, kleinerer neutral-weißer Knoten statt Cluster-Farbe, dünne
statische Verbindungslinie statt gepulster Cluster-Kante, erscheint sofort
mit Marcos eigenem Reveal-Batch. Klick öffnet weiterhin das normale
Projekt-Fenster (keine Änderung an diesem Verhalten).

Iteratives Tuning bei `MOON_RADIUS`/`MOON_ANGLE_OFFSET_DEG` nötig — erste
Werte ließen Mond-Knoten und -Label mit Marcos eigener Sphäre bzw. mit dem
nächsten Cluster-Planeten kollidieren; per Playwright-Screenshot-Vergleich
iteriert bis überlappungsfrei.

### 4. Hover-/Fokus-Effekt auf Planeten: sofort und stärker

`scale`/`filter`-Transition-Dauer von .18s auf .05s (fühlt sich jetzt
"sofort" an), Effekt selbst verstärkt (Scale 1.15→1.4, Brightness 1.3→1.8,
zusätzlicher weißer Drop-Shadow-Glow), und die Node-Label leuchtet jetzt
mit auf (skaliert, wird weiß/fett, bekommt eigenen Text-Shadow-Glow) statt
unverändert zu bleiben.

**Playwright-Testfalle, die hier auftrat:** `page.screenshot({ clip: ... })`
(zugeschnittener Ausschnitt) gefolgt von `getComputedStyle()` las
wiederholt und reproduzierbar **veraltete Werte** für compositor-lastige
Properties (`scale`, `filter`) — ein normales Property in derselben Regel
(`font-weight`) zeigte dagegen korrekt den Hover-Wert. Ein **volles,
nicht zugeschnittenes** `page.screenshot()` direkt vor `getComputedStyle()`
lieferte dagegen zuverlässig korrekte Werte, jedes Mal. Vermutlich erzwingt
nur ein vollständiger Seiten-Screenshot den kompletten Style-/Compositor-
Flush, den ein geclipptes Screenshot nicht auslöst. **Für künftige
Sessions:** Bei Hover-/Fokus-CSS-Verifikation per Playwright IMMER ein
volles `page.screenshot()` (kein `clip`) vor jedem `getComputedStyle()`-Read
einschieben, sonst können `scale`/`filter`-Werte falsch-negativ erscheinen.

## Bekannte offene Punkte

- **Redesign-Branch** (siehe Warnhinweis oben) — Entscheidung über dessen
  Zukunft (verwerfen, weiterführen, teilweise übernehmen) steht noch aus,
  ist eine Produktentscheidung für Marco, keine Code-Aufgabe.
- **second-brain-Planet vs. Marco-Zentrum-Chat-Zugang** — zwei Wege zum
  selben Chat (eigener Planet + Zentrum-Knoten-Shortcut) bestehen weiterhin
  nebeneinander, bewusst nicht in dieser Session aufgelöst (siehe Design-
  Spec des Rebrands, Abschnitt "Bekannter Nebeneffekt").
- **Verhältnis zu `stangfolio`/`stangverse`** weiterhin ungeklärt
  (Produktentscheidung, keine Code-Aufgabe).

## Workflow-Hinweise für die nächste Session

- **Vor jeder Aktion `git branch -vv` prüfen**, besonders nach einer
  längeren Pause im Gespräch — diese Session wurde mehrfach ohne eigenes
  Zutun auf einen anderen Branch versetzt (siehe Warnhinweis oben).
- Kleinere visuelle/Timing-Tweaks: direkt mit Playwright-gestützter
  Browser-Verifikation, kein voller Brainstorming→Spec→Plan-Prozess nötig
  (Edge-Batching, Mond-Feature, Hover-Effekt liefen alle so). Größere
  Content-/Datenmodell-Änderungen (wie der Rebrand): voller Prozess über
  `superpowers:brainstorming` → `superpowers:writing-plans` →
  `superpowers:subagent-driven-development`.
- Bei SDD-Ausführung: Implementer-Reports nicht blind vertrauen, welcher
  Branch/Verzeichnis tatsächlich committet wurde — selbst nachprüfen.
- Playwright läuft lokal installiert im Scratchpad-Verzeichnis, erreichbar
  über den `NODE_PATH`-Trick auf den npx-Cache
  (`AppData/Local/npm-cache/_npx/<hash>/node_modules`), falls kein
  eigenständiges `npm install playwright` gemacht wurde. Für einen lokalen
  HTTP-Server unter Windows/Git-Bash: `--directory` braucht einen
  **Windows-Pfad** (`C:\Users\...`), ein MSYS-Pfad (`/c/Users/...`) liefert
  ein leeres Directory-Listing statt der echten Dateien.
- Nutzer testet oft selbst parallel und gibt kurzes, direktes Feedback —
  bei Unklarheit lieber kurz nachfragen (`AskUserQuestion`) als zu raten,
  besonders bevor auf `origin` gepusht wird.

## Links

- Repo: https://github.com/maggostang-droid/marco-os
- second-brain-Integration (Details zum Chat selbst): [`../second-brain/HANDOVER.md`](../second-brain/HANDOVER.md)
- Portfolio-Backlog: [`../PORTFOLIO_BACKLOG.md`](../PORTFOLIO_BACKLOG.md)
- Ablauf-Anleitung für Agenten-Sessions: [`../PORTFOLIO_AGENT_GUIDE.md`](../PORTFOLIO_AGENT_GUIDE.md)
