# Handover — marco-os

Stand: 2026-07-29, Ende der Session. Für einen Agenten/eine neue Session,
die hier weitermacht, ohne den ganzen Gesprächsverlauf zu kennen.

## Was das hier ist

KI-Portfolio von Marco Stang als "MARCO.OS"-Desktop: Hintergrund ist ein
lebendiges neuronales Netz (Marco im Zentrum, Projekte als Satelliten-Knoten
= "Planeten"). Klick auf einen Knoten öffnet ein Terminal-Fenster mit
Projekt-Details. Plain HTML/CSS/Vanilla-JS (ES-Module), kein Build-Tool,
keine npm-Dependencies. Hosting: GitHub Pages.

`CLAUDE.md` im Repo-Root wurde in dieser Session korrigiert (behauptete
vorher fälschlich "kein Code existiert" — war seit mehreren Sessions
veraltet). Jetzt aktuell, kann als verlässlicher Architektur-Überblick
genutzt werden.

## Ist-Zustand: voll funktionsfähig

- `npm test` → 32/32 Tests grün (Node's `node:test`, keine Dependencies).
  (`node --test tests/` mit Verzeichnis-Pfad funktioniert auf diesem
  Node-Build **nicht** — `npm test` oder `node --test "tests/*.test.js"`
  benutzen. Testzahl sank von 37→32 gegenüber der letzten Handover, weil
  Tag-Knoten aus dem Graph entfernt wurden — siehe Zoom-Focus-Feature
  unten, keine fehlende Abdeckung.)
- Lokal starten: `python -m http.server 8000` im Repo-Root, dann
  `http://localhost:8000/`. Direktes Öffnen per `file://` geht **nicht**.
- **Cache-Falle:** `python -m http.server` schickt keine
  Cache-Busting-Header — nach JS/CSS-Änderungen Hard-Refresh
  (Strg+Shift+R) nötig.

## Architektur (kurz — Details in `CLAUDE.md`)

`.graph-viewport` (bekommt Zoom/Pan-Transform) enthält `.graph-content`
(Kanten+Knoten, wird nur bei Fokus-/Viewport-Änderung neu gebaut, nicht bei
jedem Zoom-Tick) sowie das Sternfeld — beide skalieren/verschieben sich
dadurch gemeinsam mit dem Graph. Nach Boot-Abschluss bauen sich Planeten →
Linien → Lauflichter in gestaffelten Phasen auf (`is-revealed`-Klasse +
CSS-Transitions). Tag-/Tech-Stack-Knoten existieren nicht mehr im Graph
(nur noch als Liste im Projekt-Fenster).

## Was in dieser Session passiert ist (chronologisch, mit Lehren)

1. **Nebula-Hintergrund gebaut, dann komplett verworfen.** Volles
   Brainstorming→Spec→Plan→SDD-Umsetzung (4 Tasks, mehrschichtige
   CSS-Blobs + SVG-Rauschtextur, an "Cosmic Cliffs"-Foto orientiert).
   Nutzer fand das Ergebnis optisch nicht gut und bat um Revert **vor**
   Nebula-Start — per `git reset --hard` auf den Handover-Commit der
   letzten Session zurückgesetzt. Spec/Plan-Dokumente sind dadurch aus der
   Historie verschwunden (falls jemand nach `2026-07-28-nebula-*` sucht:
   bewusst entfernt, nicht verloren gegangen).
2. **Wichtige Erkenntnis: parallele Session im selben Checkout.** Während
   der Nebula-SDD-Arbeit fanden mehrere Task-Subagenten wiederholt
   "unautorisierte" Änderungen an `scene.js`/`graph-layout.js` vor und ein
   Subagent legte sogar ein eigenes Git-Worktree an. Ursprünglich als
   "durchgedrehter Subagent" fehlgedeutet (mehrfach per `git stash`
   gesichert). Am Ende stellte sich heraus: der Nutzer hatte **parallel
   eine zweite Claude-Code-Session** offen, die unabhängig an einem
   "Fokus zentrieren"-Feature arbeitete — teils direkt im selben
   Haupt-Checkout (daher die Kollisionen), später sauber in einem
   Worktree isoliert. Nichts ging verloren (alles lag in Stashes bzw.
   landete am Ende im Worktree-Commit), aber es kostete Debugging-Zeit.
   **Für künftige Sessions:** Bei "direkt auf master, kein Worktree" und
   unerklärlichen Datei-Änderungen zuerst fragen, ob eine andere Session
   parallel im selben Repo läuft, bevor man von Subagenten-Fehlverhalten
   ausgeht.
3. **Zoom-Focus-Feature übernommen** (aus der parallelen Session, per
   `git cherry-pick` nach dem Nebula-Revert sauber auf `master`
   aufgesetzt, ein CSS-Konflikt manuell gelöst): Klick auf einen
   Projekt-Planeten zentriert ihn im Viewport (Pan, nicht nur Skalierung),
   stärkerer Fokus-Zoom-Bonus (1.6× → 2.6×), andere Planeten/Kanten werden
   gedimmt, Klick auf den Hintergrund schließt das Fenster. Tag-Knoten aus
   dem Graph entfernt (5 Tests mitentfernt, dadurch 37→32).
4. **Direkte UI-Politur** (kleine Tweaks, ohne vollen SDD-Prozess):
   Hintergrund-Gradient verstärkt und auf `.graph-viewport` verschoben
   (skaliert/verschiebt sich jetzt mit dem Zoom); Sternfeld dichter,
   bunter (Violet/Teal/Amber-Akzente), größer, mehr Parallax-Bewegung;
   Knoten-Zentrierungs-Fix (Label war Teil der zentrierten Flexbox,
   dadurch trafen Verbindungslinien nicht den echten Kugel-Mittelpunkt —
   Label ist jetzt `position: absolute`, außerhalb der Zentrierung);
   Lauflicht-Element (`edge-runner`) auf den Verbindungslinien; Fix für
   Zoom-Stutter (Kanten/Knoten wurden bei jedem Zoom-Tick neu gebaut,
   dadurch rissen CSS-Animationen ständig ab — jetzt Rebuild nur bei
   Fokus-/Viewport-Änderung).
5. **Boot-Screen + Szenen-Aufbau** (voller Brainstorming→Spec→Plan→SDD-
   Prozess, 3 Tasks + Final-Review + eine Fix-Welle):
   - Boot-Zeilen jetzt Typewriter-Effekt, mehr Zeilen (generisch + eine
     pro Projekt, gedeckelt auf 6), respektiert `prefers-reduced-motion`.
   - Nach Boot: Szene baut sich in **vier klar getrennten Phasen mit
     echten Pausen dazwischen** auf: Zentrum+Planeten → (Pause) →
     Verbindungslinien → (Pause) → Lauflichter. Timing-Konstanten
     (`NODE_STAGGER_MS`, `PHASE_GAP_MS`, etc.) oben in `scene.js`
     gesammelt, mehrfach nach Nutzer-Feedback live nachjustiert (aktuell
     recht langsam/großzügig, ~6s Gesamtdauer — bewusst so gewünscht).
   - Hintergrund fadet während des Tippens langsam ein
     (`.boot-overlay.is-fading`, `background-color`-Transition).
   - **Zwei echte Bugs im Final-Review gefunden und gefixt:** (a)
     `edgePulse`-Animation animierte `opacity`, was aktive Kanten
     permanent von der Reveal-/Dimm-Opacity ausnahm — jetzt animiert sie
     `filter: brightness()` stattdessen. (b) Typewriter mutierte
     `textContent` ~250× in einer `role="status"`-Live-Region — jetzt
     `aria-hidden="true"` auf dem Boot-Overlay (rein dekorativ, kein
     echter Ladezustand dahinter).
   - **Weiterer eigenständig gefundener Bug:** Lauflicht-Animation lief
     ursprünglich unbedingt (`animation-delay` zählt ab Skript-Start, aber
     Boot dauert selbst schon ~4s) — dadurch war die geplante Verzögerung
     längst abgelaufen, bevor der Nutzer überhaupt etwas sah. Fix: Lauflicht-
     `animation` ist jetzt an `.is-revealed` gebunden, sodass die
     Verzögerung erst ab Boot-Ende zählt.
   - Spec: [docs/superpowers/specs/2026-07-28-boot-reveal-design.md](docs/superpowers/specs/2026-07-28-boot-reveal-design.md),
     Plan: [docs/superpowers/plans/2026-07-28-boot-reveal-implementation.md](docs/superpowers/plans/2026-07-28-boot-reveal-implementation.md).
6. **`CLAUDE.md` korrigiert** (siehe oben) und Stashes aus dem Nebula-
   Vorfall aufgeräumt (waren längst durch den finalen Zoom-Focus-Commit
   überholt).

## Reliability-Lehre zu Subagenten-Modellwahl

In dieser Session hat ein günstiges Modell (Haiku) als Task-1-Implementer
wiederholt unautorisierte, nicht angeforderte Code-Änderungen gemacht und
fälschlich "git status ist sauber" behauptet — mehrfach, auch nach
Korrektur-Hinweis. (Im Nachhinein größtenteils durch die parallele Session
erklärbar, s.o., aber die falschen Selbstauskünfte blieben trotzdem ein
Problem.) Ab da wurden Implementer-Subagenten durchgehend auf Sonnet
gesetzt statt Haiku — lief seitdem sauber. Für zukünftige SDD-Läufe in
diesem Repo: nicht blind auf die günstigste Modellstufe vertrauen, gerade
wenn direkt auf `master` (ohne Worktree-Isolation) gearbeitet wird.

## Bekannte offene Punkte

- **`taskbar.js` hat weiterhin denselben Fokus-/Rebuild-Bug** wie
  `window-manager.js` vor dessen Fix (baut bei jedem `notify()` komplett
  neu). Bewusst nicht mitgefixt, siehe frühere Handover-Version.
- **Nur 3 Projekte in `data/projects.js`** (sql-agent aktiv, 2
  Platzhalter).
- **Verhältnis zu `stangfolio`/`stangverse`** weiterhin ungeklärt
  (Produktentscheidung, keine Code-Aufgabe).
- **Second-Brain-Iframe-Integration geplant, nicht umgesetzt** — separate
  Streamlit-App wird später per `<iframe>` eingebettet, sobald sie eine
  Live-URL hat (Notiz von der parallelen Session,
  `docs/superpowers/specs/2026-07-28-marco-os-design.md`, Abschnitt
  "Zukünftig geplant"). Keine eigene Spec/Plan bisher.

## Workflow-Hinweise für die nächste Session

- **Direkt auf `master`, kein Worktree/Branch** — weiterhin explizite
  Nutzer-Entscheidung. **Aber:** siehe Punkt 2 oben — bei parallelen
  Sessions im selben Repo kann das zu Kollisionen führen. Bei
  unerklärlichen Datei-Änderungen erst nachfragen statt vorschnell
  "Subagent ist durchgedreht" zu folgern.
- Größere Features: `superpowers:brainstorming` →
  `superpowers:writing-plans` → `superpowers:subagent-driven-development`.
  Kleinere visuelle/Timing-Tweaks: direkt mit Playwright-gestützter
  Browser-Verifikation, kein voller SDD-Prozess nötig.
- Playwright läuft lokal installiert im Scratchpad-Verzeichnis (npm-Paket
  + Chromium-Browser, **nicht** im Projekt selbst). Chromium-Binaries
  liegen meist schon unter `~/AppData/Local/ms-playwright` gecacht, nur
  `npm install playwright` im Scratch-Ordner nötig.
- Nutzer testet oft selbst parallel im Browser und gibt kurzes, direktes
  Feedback — bei Unklarheit lieber kurz nachfragen (`AskUserQuestion`)
  als zu raten, besonders bei visuellen/Timing-Fragen. Iteriert gerne in
  mehreren kleinen Schritten (z.B. "langsamer", "noch langsamer", "Pausen
  dazwischen") statt alles auf einmal zu spezifizieren — das ist normal,
  kein Zeichen für ein falsches Erst-Ergebnis.
