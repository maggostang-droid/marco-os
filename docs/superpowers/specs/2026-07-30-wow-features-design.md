# Wow-Features: Lebendiges System, Live-Daten, Terminal, Guided Tour

**Datum:** 2026-07-30
**Ziel:** Wow-Effekt beim Recruiter — für die eilige HR-Recruiterin (Tour),
den prüfenden Hiring Manager (Terminal, Live-Daten) und den Ersteindruck
aller Besucher (lebendiges System). Alle Features bleiben im Rahmen der
Produkt-Prinzipien: kein Build-Step, Vanilla JS, nichts Erfundenes,
`prefers-reduced-motion` respektiert, der Graph bleibt die Bühne.

## Paket 3 — Lebendiges System

- **Planeten-Drift:** Planeten-Dots schweben mit einer kleinen
  `translate`-Keyframe-Animation (±3–4px, per-Node desynchronisierte
  Dauer/Delay über Inline-Styles). Bewusst *kein* echtes Orbit-Advancement:
  das würde pro Frame Layout + Kanten neu berechnen (DOM-Rebuild, siehe
  contentKey-Kommentar in scene.js) — der Schwebe-Effekt liefert die
  „lebt"-Wirkung ohne diese Kosten. Kanten bleiben an den berechneten
  Koordinaten verankert; die Amplitude liegt deutlich unter dem
  Planetenradius, darum reißt nichts sichtbar ab.
- **Planeten-Rotation:** langsame Rotation der Dot-Elemente über die
  standalone `rotate`-Property (60–140s, per-Node variiert; Sonne 180s).
  Standalone-Property statt `transform`, weil `transform` bereits von der
  Reveal-Transition (scale 0→1) belegt ist.
- **Sternschnuppen:** starfield.js spawnt alle 8–22s einen Streak-Div mit
  einmaliger CSS-Animation (Entfernen bei `animationend`). Nur nach dem
  Boot, nie bei `document.hidden`, nie bei reduced-motion.
- **Boot-Upgrade:** ASCII-„MARCO.OS"-Logo + Neofetch-artiger Systeminfo-
  Block (OS/Kernel/Uptime/Pakete — alles reale Fakten) vor den [ OK ]-
  Zeilen. Logo-/Info-Zeilen erscheinen zeilenweise „instant" statt per
  Typewriter, damit die Boot-Dauer nicht wächst. Weiterhin jederzeit
  skippbar; reduced-motion-Pfad unverändert (alles sofort).

## Paket 4 — Echte Live-Daten

- **GitHub-Aktivität:** `assets/js/github-activity.js` holt beim Start für
  jedes Projekt mit `repoUrl` die öffentlichen Repo-Daten
  (`api.github.com/repos/<owner>/<repo>`, Feld `pushed_at`). Kein Token.
  Rate-Limit-Schutz: sessionStorage-Cache (1 h TTL), ein Fetch-Durchlauf
  pro Sitzung. Fehlerpfad ist still — ohne Daten erscheint schlicht keine
  Aktivitätszeile (kein Spinner, kein Fehlertext).
- **Anzeige:** im Projektfenster als Zeile „● letzter Commit heute/gestern/
  vor N Tagen" unter der Prompt-Zeile. Bewusst keine Stars (bei jungen
  Repos wirkt „0 ★" gegenteilig). Nachträglich eintreffende Daten patchen
  per `[data-gh-slot]` direkt ins offene Fenster statt über einen
  State-Rebuild (window-manager überspringt Rebuilds bei gleicher activeId).
- **Deep-Links:** URL-Hash ↔ Fenster. `#<projekt-id>`, `#lebenslauf`,
  `#ask-marco`, `#terminal`, `#tour`. Beim Laden wird der Hash nach
  Boot-Abschluss angewendet; Fensterwechsel schreiben den Hash via
  `history.replaceState` (keine History-Einträge, kein Scroll-Jump).
- **KI-Guide:** der Tipp-Text in der Taskbar wird klickbar und öffnet den
  echten Ask-Marco-Chat — auf einem KI-Portfolio soll keine Fake-KI sitzen.

## Paket 1 — Echtes Terminal

- **Fenster:** eigener Sentinel `TERMINAL_ID` (state.js, kollisionsfrei wie
  RESUME_ID). `resolveFocusedNodeId` liefert dafür `null`: das Terminal
  gehört zu keinem Graph-Knoten, darum kein Fokus-Zoom und kein Dimmen —
  scene.js koppelt den Zoom-Bonus jetzt an „fokussierter Knoten existiert"
  statt an „irgendein Fenster offen".
- **Befehle** (Parser als pure Function in `terminal-commands.js`,
  unit-getestet): `help`, `ls`, `open <id>`, `cat lebenslauf.txt`,
  `demo <id>`, `repo <id>`, `tour`, `whoami`, `clear`, `exit`.
  Unbekannte Eingaben antworten freundlich mit Verweis auf `help`.
- **Komfort:** Tab-Vervollständigung (Befehle + Projekt-IDs),
  Pfeil-hoch/-runter-History, Fokus liegt nach dem Öffnen im Input.
- **Zugänge:** Menüleisten-Eintrag, Taste `~`/`` ` `` (nur wenn kein
  Input fokussiert ist), KI-Guide-Tipp, `#terminal`-Deep-Link.

## Paket 2 — Guided Tour

- **Ablauf:** „Tour" (Menüleiste, `tour`-Befehl, `#tour`) fliegt
  nacheinander drei kuratierte Projekte an — eines pro Cluster, alle mit
  Live-Demo (sql-agent → cloud-native-pipeline → hr-interview-cockpit) —
  und endet im Lebenslauf-Fenster mit Kontakt-CTA.
- **Caption-Overlay:** unten zentriert, pro Schritt ein Satz + echte
  Metrik/Beweis, Fortschritts-Punkte, „Weiter"-Button, Auto-Advance nach
  8 s. Abbruch über ×, Esc oder jede manuelle Fenster-Interaktion (die
  Tour beobachtet `activeProjectId` — weicht er vom erwarteten Schritt ab,
  beendet sie sich selbst, statt gegen den Nutzer zu steuern).
- **Nicht-Ziel:** kein Autoplay beim ersten Besuch — die Tour ist ein
  Angebot (Hinweis via KI-Guide-Tipp), keine Bevormundung.

## Test-/Verifikationsstrategie

Parser- und Datenlogik (terminal-commands, Tour-Schrittdaten gegen
projects.js) unit-getestet via `npm test`; alles Visuelle wie gehabt
manuell/per Playwright-Screenshot bei 375px und 1280px+ verifiziert.
GitHub-API-Ausfall wird durch Blockieren des Hosts simuliert (Erwartung:
keine sichtbare Änderung außer fehlender Aktivitätszeile).
