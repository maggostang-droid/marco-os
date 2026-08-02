# README-Styleguide, MARCO.OS-Portfolio

Verbindlicher Aufbau für alle Projekt-READMEs von `maggostang-droid`. Ziel: Ein Hiring
Manager beantwortet in unter 60 Sekunden vier Fragen (Was ist das? Kann ich es laufen
sehen? Kann der was? Ist das fertig gedacht?) und erkennt beim zweiten Repo sofort die
gleiche Handschrift.

Leitprinzipien: **Depth over Breadth**, also eine technische Entscheidung in der Tiefe
statt fünf oberflächlicher Features. Und **nur reale Zahlen**: Schwächen werden benannt,
nicht weggelassen. Das ist das stärkste Signal, das ein Portfolio senden kann.

**Schreibregel:** keine langen Gedankenstriche (kein `—`, kein `–`). Stattdessen Komma,
Doppelpunkt, Klammer oder ein neuer Satz. Als Trennzeichen in Aufzählungszeilen ist der
Mittelpunkt `·` erlaubt.

---

## Design-DNA aus MARCO.OS

Farben stammen aus `marco-os/assets/js/window-manager.js` (`CLUSTER_ACCENT`) und
`assets/css/style.css`. Jedes Repo erbt den Akzent seines Clusters aus `data/projects.js`:

| Cluster | Akzent | Projekte |
|---|---|---|
| `agentic-ai` | `#fbbf24` | sql-copilot, ai-risk-classifier, medical-coding-extractor, ask-marco-assistant |
| `cloud` | `#5eead4` | document-auto-classifier |
| `full-stack` | `#a78bfa` | review-risk-predictor, interview-cockpit, applied-ml-course |

Weitere Farben: Fensterhintergrund `#0a0716`, Panel `#140f24`, Text `#e7e4f5`, gedimmter
Text `#c9c5e8`, Linien/Violett `#a78bfa`, Ink-Outline `#06040d`. Neue Cluster nur anlegen,
wenn sie auch in `projects.js` existieren.

---

## Pflichtaufbau

Die Reihenfolge ist bindend, sie ist nach abnehmender Zugänglichkeit sortiert.

### 1. Titel und Claim

```markdown
# <Projektname wie in projects.js>

**<Was es tut>: <womit>, <und was daran nicht selbstverständlich ist>.**
```

Der dritte Teil des Claims ist der wichtigste, er unterscheidet das Projekt vom
Tutorial-Nachbau. Fett, maximal zwei Zeilen, keine Aufzählung.

### 2. Badge-Zeile

Maximal vier Badges, nur überprüfbare Fakten. `<ACCENT>` ist der Cluster-Akzent ohne `#`:

```markdown
![Python](https://img.shields.io/badge/Python-3.12-<ACCENT>?style=flat-square&labelColor=0a0716)
![<Kerntech>](https://img.shields.io/badge/<Kerntech>-<Rolle>-<ACCENT>?style=flat-square&labelColor=0a0716)
![Tests](https://img.shields.io/badge/Tests-<N>_passing-<ACCENT>?style=flat-square&labelColor=0a0716)
[![Live-Demo](https://img.shields.io/badge/▶_Live--Demo-<Host>-0a0716?style=flat-square&labelColor=<ACCENT>)](<DEMO_URL>)
```

Der Demo-Badge ist invertiert (Akzent als Label) und damit der visuelle Anker. Gibt es
keine Tests, wird der Test-Badge weggelassen, nie geschönt. Gibt es keine Demo, entfällt
der Demo-Badge und Abschnitt 3 erklärt in einem Satz, warum.

### 3. Demo-Block

```markdown
> **▶ [Demo ausprobieren](<DEMO_URL>)**
> <konkret: was soll der Besucher dort tun>
> *<Hosting-Hinweis, zum Beispiel Cold-Start>*
```

Immer mit Handlungsanweisung. „Demo ansehen" ist zu wenig, sag welchen Knopf der Besucher
drücken soll, damit das Projekt sein Kunststück zeigt.

### 4. Screenshot

`![<beschreibender Alt-Text>](docs/demo.png)`, Pfad immer `docs/demo.png`, bei
mehrstufigen Abläufen `docs/demo.gif`. Der Alt-Text beschreibt, was zu sehen ist
(Barrierefreiheit und Fallback, falls das Bild nicht lädt).

### 5. English summary

```markdown
<details>
<summary><b>🇬🇧 English summary</b></summary>

<3 bis 4 Sätze: was, womit, wichtigstes Ergebnis inklusive Schwäche.>
Full write-up in German below.
</details>
```

Eingeklappt. Kostet deutsche Leser eine Zeile, holt internationale Leser ab.

### 6. „In 30 Sekunden"

Zwei bis drei Sätze Fließtext: Problem, Lösung, warum es nicht trivial war. Keine Liste.

### 7. „Die zentrale Entscheidung: <Kurzform>"

Der wichtigste Abschnitt. Genau *eine* technische Entscheidung, Debugging-Reise oder
Guardrail-Wahl, mit der Begründung, warum die naheliegende Alternative schlechter war.
Fließtext, kein Feature-Katalog. Optional gefolgt von einem Deep Dive.

### 8. „Architektur"

Ein **SVG-Diagramm im MARCO.OS-Look**, erzeugt mit `tools/gen-diagram.mjs`:

```bash
node tools/gen-diagram.mjs docs/architecture.json docs/architecture.svg
```

Bewusst kein Mermaid: GitHub rendert Mermaid im Default-Stil, der nichts mit der
Portfolio-Optik zu tun hat. SVG wird dagegen als ganz normales Bild angezeigt und kann
exakt wie ein Terminal-Fenster der Seite aussehen (Fensterleiste mit Ampel-Punkten,
Cluster-Akzent, Mono-Typo). HTML und CSS scheiden aus, GitHub filtert beides im README weg.

Konventionen: Ablauf von links nach rechts, der Knoten mit der zentralen Entscheidung
bekommt `"emphasis": true` (Akzentfüllung), Fehler- und Rückwege gestrichelt als Bogen
(`arc` negativ oben, positiv unten). Titel der Fensterleiste immer
`app://<PROJEKT_ID> · architecture`. Unter dem Bild zwei bis drei Sätze, die es einordnen.

### 9. „Was es kann, und was nicht"

Metriken **und** Grenzen in einem Block, bewusst nicht getrennt. Getrennt wirken Zahlen wie
Werbung und Grenzen wie Kleingedrucktes, zusammen wirken sie wie Urteilsvermögen.

Erst die Zahlen (Tabelle, wenn es mehr als zwei sind, mit Quelle im Repo), dann ein Absatz
„Was dieses Projekt nicht ist" mit den echten Limitierungen und den naheliegenden nächsten
Schritten. Keine erfundenen Zahlen, keine Zahl ohne Messmethode.

### 10. „Selbst ausprobieren"

Einmaliges Setup als Fließtext, danach ein Codeblock mit **maximal drei Befehlen**. Nie ein
Shell-Prompt-Zeichen (`$` oder `marco@portfolio:~$`) in kopierbare Blöcke schreiben, das
wird beim Kopieren mitgenommen und bricht den Befehl.

### 11. Footer

````markdown
---

```console
marco@portfolio:~$ open marco-os --project <PROJEKT_ID>
```

**[▸ Dieses Projekt in MARCO.OS öffnen](https://maggostang-droid.github.io/marco-os/#<PROJEKT_ID>)**,
dem interaktiven Portfolio von Marco Stang.

**Schwesterprojekte:** <drei thematisch nächste Projekte mit Klammer-Einordnung, · getrennt>

<sub>Marco Stang · Dr.-Ing. · [LinkedIn](https://www.linkedin.com/in/marco-stang) · stang.marco@t-online.de · MIT-Lizenz</sub>
````

`<PROJEKT_ID>` ist die **lokale** ID aus `projects.js` (zum Beispiel `sql-agent`, nicht
`sql-copilot`). Der Deep-Link-Router in `router.js` löst nur diese auf.

---

## Deep Dives

Alles, was über die Recruiter-Sicht hinausgeht, kommt in aufklappbare Blöcke statt in den
Fließtext:

```markdown
<details>
<summary><b>▸ Deep Dive: <Thema></b></summary>

<Inhalt>
</details>
```

Faustregel: Das README bleibt unter etwa 150 sichtbaren Zeilen, alles Weitere klappt auf
oder wandert nach `docs/` und wird verlinkt. Deep Dives sind der Ort für
Implementierungsdetails, Eval-Methodik, Datenmodelle und Schwächen im Detail.

---

## Sprache und Ton

Durchgehend Deutsch (Zielmarkt DACH), englische Fachbegriffe bleiben englisch. Es wird über
das Projekt geschrieben, nicht zum Leser gesprochen. Keine Superlative („state of the art",
„hochmodern"), keine Emojis außer den festgelegten Markern `▶`, `▸` und `🇬🇧`. Schwächen
werden aktiv benannt, nicht relativiert. Und keine langen Gedankenstriche, siehe oben.

---

## Repo-Metadaten

Gehört zum Stil, weil es in der GitHub-Suche und auf dem Profil erscheint:

- **About-Beschreibung:** der Claim aus Abschnitt 1, gekürzt auf etwa 120 Zeichen.
- **Website:** der Deep-Link `https://maggostang-droid.github.io/marco-os/#<PROJEKT_ID>`.
- **Topics:** Cluster und Kerntechnologien, kleingeschrieben, zum Beispiel `langgraph`,
  `llm-agents`, `text-to-sql`, `portfolio`.
- **LICENSE:** MIT in jedem eigenen Repo. Forks behalten die Lizenz des Originals.

---

## Checkliste vor dem Commit

- [ ] Claim enthält den „nicht selbstverständlich"-Teil
- [ ] Badges: maximal 4, Cluster-Akzent korrekt, keine geschönten Zahlen
- [ ] Demo-Block mit konkreter Handlungsanweisung
- [ ] `docs/demo.png` vorhanden, mit beschreibendem Alt-Text eingebunden
- [ ] English summary eingeklappt vorhanden
- [ ] Genau **eine** zentrale Entscheidung ausführlich erzählt
- [ ] `docs/architecture.svg` aus `gen-diagram.mjs`, Akzent und Fenstertitel korrekt
- [ ] Metriken und Grenzen im selben Abschnitt, jede Zahl mit Quelle im Repo
- [ ] Quickstart mit maximal 3 Befehlen, kein Prompt-Zeichen im Codeblock
- [ ] Footer mit korrekter lokaler Projekt-ID im Deep-Link
- [ ] Sichtbare Länge unter etwa 150 Zeilen
- [ ] Keine langen Gedankenstriche im Text
- [ ] About, Website, Topics und LICENSE auf GitHub gesetzt
