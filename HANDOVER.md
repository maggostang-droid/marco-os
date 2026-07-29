# Handover — marco-os

Stand: 2026-07-29, Ende der Session. Für einen Agenten/eine neue Session,
die hier weitermacht, ohne den ganzen Gesprächsverlauf zu kennen. Ersetzt
die vorherige Handover-Version (deren Inhalt größtenteils durch die
parallele orbit-clusters-Session und diese Session überholt ist).

## Was das hier ist

KI-Portfolio von Marco Stang als "MARCO.OS"-Desktop: Hintergrund ist ein
lebendiges neuronales Netz (Marco im Zentrum, Projekte als Satelliten-Knoten
= "Planeten", nach Skill-Cluster auf eigenen elliptischen Orbits gruppiert).
Klick auf einen Projekt-Knoten öffnet ein Terminal-Fenster mit
Projekt-Details. Plain HTML/CSS/Vanilla-JS (ES-Module), kein Build-Tool,
keine npm-Dependencies. Hosting: GitHub Pages.

## Ist-Zustand: voll funktionsfähig

- `npm test` → **39/39 Tests grün** (Node's `node:test`, keine
  Dependencies).
- Lokal starten: `python -m http.server 8000` im Repo-Root, dann
  `http://localhost:8000/`. Direktes Öffnen per `file://` geht **nicht**.
- **Cache-Falle:** `python -m http.server` schickt keine
  Cache-Busting-Header — nach JS/CSS-Änderungen Hard-Refresh
  (Strg+Shift+R) nötig.

## Neu in dieser Session: second-brain-Chat-Fenster

Der zentrale "Marco Stang"-Knoten war bisher rein dekorativ (kein
`<button>`, nicht fokussierbar). Er ist jetzt klickbar/fokussierbar und
öffnet ein Fenster, das den live second-brain-Chat
(https://second-brain-projects.streamlit.app/ — separates Repo, siehe
`../second-brain/`) per `<iframe src=".../?embed=true">` einbettet, über
denselben `state.activeProjectId`-Mechanismus, den Projekt-Fenster
verwenden (Sentinel-ID `SECOND_BRAIN_CHAT_ID` in `state.js`).

Vollständiger Brainstorming→Spec→Plan→SDD-Prozess (4 Tasks + finaler
Review + eine Fix-Welle):
- Spec: [`docs/superpowers/specs/2026-07-29-second-brain-chat-window-design.md`](docs/superpowers/specs/2026-07-29-second-brain-chat-window-design.md)
  (inkl. Addendum zur Sentinel-Kollision, siehe unten)
- Plan: [`docs/superpowers/plans/2026-07-29-second-brain-chat-window-implementation.md`](docs/superpowers/plans/2026-07-29-second-brain-chat-window-implementation.md)

### Zwei echte Bugs, nur durch Playwright-gestützte Browser-Verifikation gefunden

Beide waren aus reinem Code-Review nicht ersichtlich, weil `scene.js`/
`window-manager.js` keine Unit-Tests haben (DOM-lastig, kein jsdom im
Repo — etablierte Konvention, kein Gap):

1. **Sentinel-ID-Kollision mit einer echten Projekt-Karte.** Die
   Design-Spec nahm an, `SECOND_BRAIN_CHAT_ID = "second-brain"` kollidiere
   mit keiner echten `data/projects.js`-ID — falsch, `data/projects.js`
   hatte (durch die parallele orbit-clusters-Session synct) bereits eine
   echte Karte mit genau dieser ID. Klick auf den echten second-brain-
   Planeten öffnete dadurch den Chat statt seines eigenen Fensters. Fix:
   Sentinel auf `"__second-brain-chat__"` geändert (bewusst kein
   plausibler echter Projekt-ID-String).
2. **Fokus-Restaurations-Bug.** Escape schloss das Chat-Fenster, aber der
   Fokus landete auf `<body>` statt zurück auf dem Marco-Knoten — die
   generische Fokus-Restaurations-Logik nimmt an, `activeProjectId`
   entspreche immer dem `data-node-id`-Attribut des zugehörigen DOM-Knotens
   (stimmt für echte Projekte, aber nicht für den Chat: dessen DOM-Knoten
   trägt `data-node-id="center"`, ein anderer String als die Sentinel-ID).
   Fix: Mapping Sentinel → `"center"` an der `querySelector`-Stelle in
   `window-manager.js`.

**Lehre für künftige Sessions:** Bei "reuse existing state field mit einer
neuen Sentinel-ID"-Features immer alle Konsumenten des Felds greppen
(`grep -rn "activeProjectId" assets/js/`) — der finale Review fand einen
dritten, übersehenen Konsumenten (`taskbar.js`, zeigte keinen Chip, wenn
der Chat offen war; inzwischen gefixt).

### Kollision mit einer parallelen Session mitten in der Arbeit

Während dieser Session lief **noch eine zweite Session** parallel am
selben Haupt-Checkout und baute ein großes orbit-clusters-Feature
(Skill-Cluster-Orbits, SVG-Ring-Layer, Projekt-Neusortierung) — inklusive
eigener finaler Review-Fix-Runde. Deshalb wurde für second-brain **bewusst
ein isolierter Git-Worktree** verwendet (`git worktree add
.worktrees/second-brain-chat-window master -b
feature/second-brain-chat-window`) statt direkt auf `master` zu arbeiten —
mit Marco abgestimmt, bevor der Worktree angelegt wurde. Die andere Session
hatte aus demselben Grund selbst schon einen Branch (`feature/orbit-
clusters`) benutzt und **die "kein Worktree/Branch"-Regel aus `CLAUDE.md`
bereits entfernt** (Commit `52c251f`), bevor diese Session überhaupt
begann — Worktrees/Branches sind in diesem Repo jetzt also grundsätzlich
akzeptiert, wenn Isolation gebraucht wird, nicht mehr nur "direkt auf
master".

Master wurde zweimal in den Feature-Branch gemerged, während die andere
Session weiterarbeitete (`git merge master` in den eigenen Worktree, nicht
umgekehrt) — beide Male von git automatisch konfliktfrei aufgelöst
(`scene.js`/`style.css` betroffen). **Auto-Merge garantiert nur textuelle
Nicht-Überlappung, keine semantische Korrektheit** — nach jedem Merge
wurde deshalb die komplette Test-Suite plus eine frische
Playwright-Verifikation erneut durchlaufen, nicht nur angenommen, dass es
passt.

### Finaler Review fand zusätzlich

- `taskbar.js` zeigte keinen aktiven-Fenster-Chip, wenn der Chat offen war
  (dritter, übersehener `activeProjectId`-Konsument, siehe oben) — gefixt.
- `CLAUDE.md` und die Design-Spec behaupteten noch den alten,
  überholten Stand ("noch nicht implementiert" bzw. die falsche
  Kollisions-Annahme) — korrigiert.
- Center-Knoten hatte einen Fokus-Ring, aber kein Hover-Feedback wie
  Projekt-Knoten — Selektor erweitert.
- Emergentes, unbeabsichtigtes aber korrektes Verhalten dokumentiert statt
  "gefixt": Öffnen des Chats wendet den Fokus-Zoom-Bonus an, aber der
  Sentinel matcht keinen echten Knoten, wodurch die Translation bei `(0,0)`
  bleibt — sieht durch Zufall korrekt aus, weil der Zentrum-Knoten selbst
  bei `(0,0)` sitzt. Ein-Zeilen-Kommentar in `scene.js` ergänzt, damit ein
  künftiger Refactor das nicht "verschlimmbessert".
- **Bewusst nicht angefasst:** iframe-`sandbox`/`referrerpolicy`-Härtung
  (sinnvoll, aber braucht eigene Verifikation gegen die Live-App, kein
  Drive-by-Fix) und die echte second-brain-Projektkarte in
  `data/projects.js` (siehe nächster Abschnitt — die haben wir separat auf
  Nutzeranfrage angefasst).

### second-brain-Planet aktualisiert (separater Nutzerwunsch, nach dem Feature-Merge)

Die echte `data/projects.js`-Karte für `second-brain` war stehen
geblieben auf `status: "planned"`, `demoUrl: null`, Beschreibung "noch in
Arbeit" — obwohl second-brain inzwischen fertig und live ist. Auf
Brainstorming mit Marco: Karte korrigiert (`status: "live"`, echte
Demo-/Repo-Links), Beschreibung verweist jetzt zusätzlich explizit auf den
Marco-Knoten-Shortcut ("Psst: du kannst mich auch direkt hier fragen —
klick auf Marco im Zentrum"), statt die Doppel-Rolle (eigener Planet +
Sonderfunktion am Zentrum) unerklärt nebeneinander stehen zu lassen.

### Push-Vorfall (Prozess-Lehre, kein Code-Problem)

Ein routinemäßig wirkender, kleiner Commit (die second-brain-Karten-
Korrektur) wurde gepusht, ohne vorher zu prüfen, wie viele unpushte
Commits bereits lokal auf `master` lagen. Ergebnis: **28 Commits auf
einmal live** — sowohl das komplette second-brain-Chat-Feature dieser
Session als auch die komplette, bereits lokal gemergte orbit-clusters-
Arbeit der anderen Session, die beide seit Sitzungsbeginn nur lokal
committet, aber nie gepusht worden waren. Inhaltlich unproblematisch (alles
getestet, beide Features durch ihren jeweils eigenen finalen Review
gelaufen), aber die Entscheidung "jetzt live schalten" wurde damit ungefragt
getroffen statt bewusst vom Nutzer freigegeben. **Für künftige Sessions:**
vor einem `git push`, der beiläufig wirkt, `git log origin/master..HEAD
--oneline` prüfen — ein kleiner eigener Commit kann einen großen,
unpushten Rucksack mitreißen.

## Bekannte offene Punkte

- **`taskbar.js` hatte weiterhin denselben Fokus-/Rebuild-Bug** wie
  `window-manager.js` vor dessen Fix (baut bei jedem `notify()` komplett
  neu) — unverändert aus der letzten Handover-Version übernommen, nicht
  Teil dieser Session.
- **iframe-Sandboxing** — siehe oben, bewusst zurückgestellt.
- **`list_projects()`/Datenmodell in second-brain selbst** haben keine
  `demo_url`/`repo_url`/`status` (Detail lebt in `second-brain/HANDOVER.md`,
  nicht hier — betrifft nur den MCP-Server/Chat, nicht marco-os).
- **Verhältnis zu `stangfolio`/`stangverse`** weiterhin ungeklärt
  (Produktentscheidung, keine Code-Aufgabe).

## Workflow-Hinweise für die nächste Session

- **Worktrees/Branches sind jetzt grundsätzlich akzeptiert**, wenn
  Isolation von paralleler Arbeit gebraucht wird (die alte "immer direkt
  auf master"-Regel wurde aus `CLAUDE.md` entfernt). Bei Unsicherheit
  trotzdem kurz nachfragen, bevor ein Worktree angelegt wird.
- Bei unerklärlichen Datei-Änderungen im Haupt-Checkout: erst prüfen, ob
  eine andere Session parallel am selben Repo arbeitet (`git status`,
  `git branch -vv`), bevor man von Subagenten-Fehlverhalten ausgeht.
- Größere Features: `superpowers:brainstorming` →
  `superpowers:writing-plans` → `superpowers:subagent-driven-development`.
  Kleinere visuelle/Timing-Tweaks: direkt mit Playwright-gestützter
  Browser-Verifikation, kein voller SDD-Prozess nötig.
- Playwright läuft lokal installiert im Scratchpad-Verzeichnis (npm-Paket
  + Chromium-Browser, **nicht** im Projekt selbst). Chromium-Binaries
  liegen meist schon unter `~/AppData/Local/ms-playwright` gecacht, nur
  `npm install playwright` im Scratch-Ordner nötig. Für Fokus-/Tab-Order-
  Checks: jeden Check auf einer frischen `page`/`context` laufen lassen,
  nicht mehrere Interaktionen in derselben Seite verketten — sonst
  verfälscht der Fokus-Zustand aus dem vorherigen Check das Ergebnis
  (ist dieser Session passiert, siehe Diagnose-Skripte in der
  Zusammenfassung des Chatverlaufs).
- Merges gegen eine schnell laufende `master` während eigener Arbeit: nach
  jedem Merge komplette Test-Suite **und** eine frische
  Playwright-Verifikation laufen lassen, nicht nur auf konfliktfreiem
  Auto-Merge vertrauen.
- Nutzer testet oft selbst parallel im Browser und gibt kurzes, direktes
  Feedback — bei Unklarheit lieber kurz nachfragen (`AskUserQuestion`)
  als zu raten.

## Links

- Repo: https://github.com/maggostang-droid/marco-os
- second-brain-Integration (Details zum Chat selbst): [`../second-brain/HANDOVER.md`](../second-brain/HANDOVER.md)
- Portfolio-Backlog: [`../PORTFOLIO_BACKLOG.md`](../PORTFOLIO_BACKLOG.md)
- Ablauf-Anleitung für Agenten-Sessions: [`../PORTFOLIO_AGENT_GUIDE.md`](../PORTFOLIO_AGENT_GUIDE.md)
