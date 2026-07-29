# Projekt-Content-Rebrand — Design-Spec

Erstellt: 2026-07-29

## Was das hier ist

Alle 8 Projekte in `data/projects.js` bekommen marketing-taugliche Namen und
eine zweigeteilte Beschreibung, damit sowohl Recruiter (kein technischer
Hintergrund) als auch Fachexperten (Entwickler, technische Hiring-Manager) das
Projekt auf einen Blick verstehen — ohne dass eine der beiden Zielgruppen den
Text der anderen überspringen muss, um zu ihrem Teil zu kommen.

Aktueller Zustand: `description` ist der einzige gezeigte Text — dicht,
technisch, sofort sichtbar. Das Feld `summary` existiert bereits in den Daten,
wird aber von keiner Rendering-Datei genutzt (toter Code). Der Tech-Stack
(`tags`) ist per Toggle versteckt.

## Ziel-Struktur pro Projekt-Fenster

1. **Titel** (`h3`) — der neue Marketing-Name (Englisch, funktional/klar).
2. **Summary** (`p.summary`, neu, immer sichtbar) — ein bis zwei Sätze,
   Deutsch, allgemeinverständlich, beschreibt Nutzen/Ergebnis statt
   Implementierung.
3. **Tags** (`div.tags`, bestehend) — Tech-Stack, ab jetzt **immer
   ausgeklappt**, kein Toggle mehr.
4. **Toggle-Button** — Label wechselt von "Tech-Stack anzeigen/verbergen" zu
   "Technische Details anzeigen/verbergen"; steuert jetzt die Sichtbarkeit von:
5. **Description** (`p.description`, bestehend, standardmäßig `hidden`) — der
   bisherige technische Text, inhaltlich fast unverändert, nur hinter den
   Toggle verschoben statt permanent sichtbar.
6. Buttons (Demo/Repo) — unverändert.

Kein neues Datenfeld: `summary` und `description` werden umgenutzt, nicht
erweitert. Bestätigt per Mockup im Visual-Companion-Tool (vorher/nachher +
aufgeklappter Zustand am Beispiel SQL Copilot).

## Rendering-Änderungen (`window-manager.js`)

- Neues `<p class="summary">` zwischen `h3` und `div.tags`, immer gerendert
  (kein `hidden`).
- `div.tags` verliert das `hidden`-Attribut und das dazugehörige `[hidden]`-CSS
  greift nicht mehr — Tags sind Teil des permanent sichtbaren Bereichs.
- `p.description` bekommt `hidden` als Default-Zustand.
- Toggle-Wiring (`wireProjectWindowInteractions`) wird von `.tags` auf
  `.description` umgehängt; Button-Label-Strings ändern sich entsprechend
  ("▸ Technische Details anzeigen" / "▾ Technische Details verbergen").
- Neue CSS-Klasse `.summary` (ähnlich `.description`, aber etwas größer/fetter
  gesetzt — siehe Mockup: `font-size: 13px; font-weight: 500`), um sie optisch
  vom Deep-Dive-Text abzuheben.
- `.tags[hidden]`-Regel in `style.css` kann entfernt werden (nicht mehr
  erreichbar), ist aber nicht funktionsrelevant, wenn sie stehen bleibt.

## Content: Marketing-Namen

| id | Neuer Titel (`title`) |
|---|---|
| `sql-agent` | SQL Copilot |
| `ai-act-validation-toolkit` | AI Risk Classifier |
| `ai-analytics-portal` | Review Risk Predictor |
| `amalea` | Applied ML Course (KIT) |
| `cloud-native-pipeline` | Document Auto-Classifier |
| `goz-finetune-vs-rag` | Medical Coding Extractor |
| `second-brain` | Ask-Marco Assistant |
| `hr-interview-cockpit` | Interview Cockpit |

## Content: Summary (neu, High-Level, Deutsch)

- **SQL Copilot**: „Beantwortet Fragen zu Firmendaten in normaler Sprache,
  ganz ohne SQL-Kenntnisse — und kann Daten nur lesen, nie verändern."
- **AI Risk Classifier**: „Ordnet eine beschriebene KI-Anwendung automatisch
  einer EU-AI-Act-Risikoklasse zu und erklärt die Einstufung in normaler
  Sprache — inklusive fertiger Compliance-Checkliste für Hochrisiko-Fälle."
- **Review Risk Predictor**: „Schätzt für jede Bestellung das Risiko einer
  schlechten Kundenbewertung — und erklärt in einem Satz warum, statt nur eine
  Zahl zu zeigen."
- **Applied ML Course (KIT)**: „Sechs Kurswochen praktisches Machine Learning
  für den KI-Campus — Marco hat die Inhalte am KIT mitentwickelt und den Kurs
  als Co-Dozent begleitet."
- **Document Auto-Classifier**: „Dokument hochladen — Typ und relevante Felder
  werden automatisch erkannt, komplett serverlos auf AWS, ohne selbst
  betriebenen Server."
- **Medical Coding Extractor**: „Extrahiert automatisch Abrechnungsziffern aus
  zahnärztlichen Behandlungsnotizen — und beantwortet nebenbei, ob Finetuning
  oder RAG hier besser funktioniert."
- **Ask-Marco Assistant**: „Ein Chat, der alle Projekte in diesem Portfolio
  kennt und Fragen direkt beantwortet — z. B. ‚welche Projekte zeigen
  Cloud-Erfahrung?'"
- **Interview Cockpit**: „Ein strukturiertes Werkzeug für Bewerbungsgespräche —
  Fragenpool, Live-Bewertung während des Interviews, automatische
  Zusammenfassung als Radar-Chart."

## Content: Description (Deep-Dive, bestehender Text bleibt fast unverändert)

Für 7 der 8 Projekte bleibt der aktuelle `description`-Text wie er ist — er
war ohnehin schon für ein technisches Publikum geschrieben, wird nur nicht
mehr erzwungen an alle ausgeliefert.

**`id` bleibt unangetastet.** Die interne, technische `id` je Projekt
(`sql-agent`, `hr-interview-cockpit`, ...) ändert sich nicht — sie steuert
`data-node-id`, die Terminal-Strings im Fenster (`app://sql-agent —
Terminal`, `open sql-agent --info`) und die Taskbar (`sql-agent.exe`). Nur
`title` (Marketing-Name), `summary` (neu) und `repoUrl` (neuer Repo-Slug)
ändern sich. Das führt bewusst zu einer Diskrepanz zwischen der intern
sichtbaren `id` und dem extern verlinkten Repo-Namen (z. B. Fenstertitel
zeigt `app://sql-agent`, aber „Repo öffnen" verlinkt auf
`github.com/.../sql-copilot`) — passt zum Terminal-Aesthetic (interner
Prozessname vs. Anzeigename) und vermeidet einen Breaking-Change an allen
Stellen, die `id` referenzieren.

Einzige inhaltliche Änderung: **second-brain** (`Ask-Marco Assistant`). Die
second-brain-Chat-App ist inzwischen live (siehe
`docs/superpowers/specs/2026-07-29-second-brain-chat-window-design.md`,
erreichbar über den Marco-Zentrum-Knoten). Der `data/projects.js`-Eintrag mit
`id: "second-brain"` sagt aktuell noch "noch in Arbeit" — das wird korrigiert:

- `status`: `"planned"` → `"live"`
- `demoUrl`: `null` → `"https://second-brain-projects.streamlit.app/"`
- `description`: Verweis auf "noch in Arbeit... Design-Spec und
  Implementierungsplan stehen" entfernen, stattdessen den fertigen Zustand
  beschreiben (Context-Stuffing-Ansatz, MCP-Server-Exposition bleiben als
  technische Kernaussagen erhalten).

**Bekannter Nebeneffekt, bewusst nicht in diesem Spec gelöst:** Es gibt jetzt
zwei Wege zum second-brain-Chat — den eigenen Planeten/Knoten in der Graph
(`data/projects.js`-Eintrag) und den Marco-Zentrum-Knoten (der direkt das
Chat-Fenster via `SECOND_BRAIN_CHAT_ID` öffnet, siehe
`window-manager.js:51`). Ob der separate Planet dadurch redundant wird oder
bewusst als "Projekt-Steckbrief" neben dem direkten Chat-Zugang bestehen
bleibt, ist eine UX-Frage für ein separates Gespräch — hier wird nur der
Content des bestehenden Planeten-Eintrags korrigiert, nicht die
Graph-Struktur verändert.

## GitHub-Repo-Umbenennung — erledigt (2026-07-29)

Alle 8 Repos wurden per `gh repo rename` bereits umbenannt (gh CLI war unter
`C:\Program Files\GitHub CLI\gh.exe` installiert und authentifiziert):

| Repo (alt) | → Neuer Slug | Verifiziert |
|---|---|---|
| `sql-agent` | `sql-copilot` | ✓ umbenannt, kein Live-Demo betroffen |
| `ai-act-validation-toolkit` | `ai-risk-classifier` | ✓ umbenannt; Streamlit-Demo (`ai-act-validation-toolkit.streamlit.app`) läuft unverändert weiter (Slug ist unabhängig vom Repo-Namen) |
| `ai-analytics-portal` | `review-risk-predictor` | ✓ umbenannt, kein Live-Demo betroffen |
| `AMALEA` | `applied-ml-course` | ✓ umbenannt, kein Demo-Link |
| `cloud-native-pipeline` | `document-auto-classifier` | ✓ umbenannt; Streamlit-Demo (`cloud-native-pipeline.streamlit.app`) läuft unverändert weiter |
| `goz-finetune-vs-rag` | `medical-coding-extractor` | ✓ umbenannt, kein Live-Demo betroffen |
| `second-brain` | `ask-marco-assistant` | ✓ umbenannt; Streamlit-Demo (`second-brain-projects.streamlit.app`) läuft unverändert weiter |
| `hr-interview-cockpit` | `interview-cockpit` | ✓ umbenannt — **Risiko bestätigt**: die alte GitHub-Pages-URL (`maggostang-droid.github.io/hr-interview-cockpit/`) liefert jetzt 404, die neue (`.../interview-cockpit/`) liefert 200. Der Repo-Rename-Redirect greift bei GitHub Pages also *nicht*. `demoUrl` in `data/projects.js` **muss** auf die neue Pages-URL aktualisiert werden. |

Damit ist `repoUrl` (und für `hr-interview-cockpit`/`interview-cockpit` auch
`demoUrl`) in `data/projects.js` jetzt gefahrlos auf die neuen Slugs
aktualisierbar — kein Warten auf externe Bestätigung mehr nötig.

## Definition of Done

- Alle 8 Projekte in `data/projects.js` haben neuen `title`, neue `summary`,
  unveränderte/korrigierte `description`.
- `second-brain`-Eintrag: `status: "live"`, `demoUrl` gesetzt, Text korrigiert.
- `window-manager.js`: Summary immer sichtbar, Tags immer ausgeklappt,
  Description hinter umbenanntem Toggle.
- Neue `.summary`-CSS-Klasse in `style.css`.
- `node --check` für alle geänderten JS-Dateien, `npm test` weiterhin grün.
- Manuelle Verifikation im Browser bei 375px und 1280px+ (bestehende Praxis) —
  insbesondere: Toggle-Zustand nach Klick, Tags immer sichtbar auch ohne
  Klick.
- Alle `repoUrl`-Werte in `data/projects.js` zeigen auf die neuen Repo-Slugs
  (Rename bereits erledigt, siehe oben); `hr-interview-cockpit`s `demoUrl`
  zeigt auf die neue GitHub-Pages-URL.
