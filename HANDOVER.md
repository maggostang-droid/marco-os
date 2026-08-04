# Handover — marco-os

Stand: 2026-08-03, Ende der Session. Für eine neue Session, die hier
weitermacht, ohne den Gesprächsverlauf zu kennen. Ersetzt die Fassung vom
2026-07-29 — die beschreibt einen Stand vor dem v3-Umstieg und warnt vor einem
Redesign-Branch, den es längst nicht mehr gibt.

## Was heute passiert ist

Die Startseite ist eine andere. Ein extern erstelltes Redesign ("v3") kam als
ZIP-Paket, wurde eingebaut, live geschaltet und danach überarbeitet.

| Commit | |
| --- | --- |
| `94f8aed` | v3 additiv als `/v3.html` |
| `2a5b063` | **Umstieg**: `index.html` → `index-legacy.html`, `v3.html` → `index.html` |
| `e9dbd6d` | eine Datenquelle für Projekte, Besucherzähler repariert |
| `75f2c09` | Ask-Marco als Chat erkennbar gemacht |
| `ec61a87` | Ausklapper auf `grid-template-rows`, Design-Ausnahmen dokumentiert |
| `a2dabd5` | `lang`-Attribut, Titel, Hintergrundklick, `#second-brain` |
| `72639a2` | Mobil-Durchgang 375–760 px |
| `ef4d785` | nebula raus, GitHub-Anfragen bedarfsgetrieben, Inhalte entdoppelt |
| `7786fd5` | Warmhalte-Workflow repariert |

**Rückbau:** `git revert 2a5b063` holt die alte Startseite zurück, ohne die
v3-Dateien zu entfernen — die tauchen dann wieder unter `/v3.html` auf.

## Ist-Zustand

- `npm test` → **78/78 grün**
- Live geprüft: beide Frontends laden fehlerfrei, keine 404er, keine
  Konsolenfehler, Schriften lokal
- Layout geprüft bei 375 / 414 / 768 / 1440 px

## Was beim Einbauen schiefging

Das ZIP war nicht lauffähig, und beide Fehler waren **still** — die Seite sah
aus, als funktioniere sie:

1. **Die Seite blieb leer.** Die dynamischen `import()` im Template-Block
   werden im Kontext von `dc-support.js` aufgelöst, nicht des Dokuments. Aus
   `./assets/js/x.js` wurde `/assets/js/assets/js/x.js`. Ein absolutes
   `/assets/…` wäre ebenfalls falsch, weil Pages unter `/marco-os/` ausliefert.
2. **Unter ~760 px fielen alle Planeten auf die Sonne.** `maxRx` wurde negativ,
   SVG verwirft Ellipsen mit negativem `rx`.

Später kam ein dritter dazu: **der Besucherzähler zählte nicht mehr.** v3 las
`TOTAL.json` und *zeigte* die Gesamtzahl an, lud aber nie das
GoatCounter-Script. Von außen unsichtbar, weil eine plausible Zahl dastand.

Und ein vierter, beim Aufräumen gefunden: **der Warmhalte-Workflow pingte ins
Leere.** Die Wurzel-URL einer Streamlit-App antwortet mit 303 in eine
Auth-Weiterleitungsschleife; curl brach nach 50 Redirects ab. Im Log stand
`303000` statt einer 200 — das ist kein HTTP-Code, sondern curls 303 plus die
000 aus dem Fehlerzweig.

**Lehre:** Bei diesem Runtime und bei allem, was über HTTP geht, reicht "sieht
richtig aus" nicht. Im Browser laden und die Netzwerk-Anfragen prüfen.

## Wo was liegt

**Alles Inhaltliche in `data/`, von beiden Frontends geteilt:**
`projects.js`, `resume.js`, `tour.js`, `boot.js`, dazu
`assets/js/analytics.js`. Nichts ist doppelt gepflegt — das war es bis heute
und wurde bewusst aufgelöst.

**v3** (`index.html`, live): Markup, CSS und Logik stecken alle in der einen
HTML-Datei; dazu `dc-support.js` (generiert, "do not edit"),
`portfolio-data-v3.js` (nur Darstellung), `sky-v3.js` (Canvas-Himmel).

**Legacy** (`index-legacy.html`): handgeschriebenes Vanilla-JS aus
`assets/js/*`. Alle 78 Tests decken diese Seite und `data/` ab, **nicht** v3.

Die vier Runtime-Fallen von v3 stehen ausführlich in [CLAUDE.md](CLAUDE.md).

## Bekannte offene Punkte

Siehe [TODO.md](TODO.md). Die wichtigsten: kein `<h1>` auf der Seite, eine
Label-Überlappung bei 375/414 px, keine Testabdeckung für v3, und schlafende
Streamlit-Demos lassen sich nicht automatisch wecken.

## Zwei Dinge, die von außen abhängen

**Streamlit-Demos schlafen ein.** Beim Prüfen lag "Document Auto-Classifier"
schlafend — das ist Station 2 der geführten Tour, ein Recruiter wäre dort auf
einer "Zzzz"-Seite gelandet. Der Warmhalte-Workflow läuft werktags 08:00–20:47
und hält wach, was wach ist; wecken kann er nicht (`POST /api/v2/app/resume`
antwortet ohne Sitzung mit 403). Vor dem Verschicken des Links lohnt ein
kurzer Blick.

**Der Chat im Fenster ist eine fremde App.** `second-brain-projects.streamlit.app`
liegt im Repo `ask-marco-assistant`. Texte darin — etwa die Vorschlagsfragen —
ändert man dort, nicht hier. Community Cloud deployt nach einem Push verzögert,
bei eingefrorener Instanz erst beim Aufwachen. Nicht vorschnell einen manuellen
Reboot empfehlen, sondern abwarten.

## Arbeitsweise

- Größere Features: `superpowers:brainstorming` → `writing-plans` →
  `subagent-driven-development`, Spec und Plan unter `docs/superpowers/`.
  Kleine visuelle Anpassungen direkt und im Browser verifizieren.
- Neue Branches in einem eigenen Worktree.
- **Vor jeder Aktion `git branch -vv` prüfen**, besonders nach längerer Pause.
- Playwright liegt lokal im Scratchpad-Verzeichnis, nie als Projekt-Abhängigkeit
  (Prinzip "keine Dependencies"). Für einen lokalen Server unter Git-Bash
  braucht `--directory` einen **Windows-Pfad** (`C:\Users\…`); ein MSYS-Pfad
  (`/c/Users/…`) liefert ein leeres Verzeichnislisting.
- Bei Hover-/Fokus-CSS-Prüfung per Playwright immer ein volles
  `page.screenshot()` (ohne `clip`) vor `getComputedStyle()` einschieben —
  sonst können `scale`/`filter`-Werte falsch-negativ erscheinen.
- Testzusicherungen misstrauen, wenn sie überraschen: In dieser Session meldete
  ein Test die Tour als kaputt, weil er `Station 1/4` suchte und das Element
  per `text-transform:uppercase` `STATION 1/4` rendert. Zwei weitere
  Fehlalarme kamen von Klickkoordinaten, die auf einem Knoten-Button lagen.
  Im Zweifel einen Screenshot ansehen.
- Der Impeccable-Design-Hook meldet acht Befunde in `index.html`. Vier liegen
  mit Begründung als bestätigt-gewollt in `.impeccable/config.json`, zwei waren
  echte Probleme und sind behoben. Der Hook bleibt scharf: ohne die Config
  meldet er sechs Befunde, mit Config null.

## Links

- Live: https://marco-stang.github.io/
- Legacy: https://marco-stang.github.io/index-legacy.html
- Repo: https://github.com/marco-stang/marco-stang.github.io
- Chat-App (eigenes Repo): [`../ask-marco-assistant/HANDOVER.md`](../ask-marco-assistant/HANDOVER.md)
- Portfolio-Backlog: [`../PORTFOLIO_BACKLOG.md`](../PORTFOLIO_BACKLOG.md)
- Ablauf-Anleitung für Agenten-Sessions: [`../PORTFOLIO_AGENT_GUIDE.md`](../PORTFOLIO_AGENT_GUIDE.md)
