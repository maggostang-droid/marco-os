# Demo-Styleguide, MARCO.OS-Portfolio

Verbindlicher Aufbau für alle Live-Demos der Portfolio-Projekte. Er ist das interaktive
Gegenstück zum [README-Styleguide](README-STYLEGUIDE.md) und folgt derselben Logik:
**oben der Null-Klick-Pfad, darunter die Tiefe auf Abruf.**

Die Demo hat zwei Zielgruppen gleichzeitig. Ein Recruiter will in zehn Sekunden sehen, dass
das Ding wirklich läuft, ohne zu wissen, was er eingeben soll. Ein Tech-Lead will sehen,
was darunter passiert. Beide werden bedient, indem der einfache Weg zuerst kommt und die
Tiefe genau eine Klickebene tiefer liegt.

**Schreibregel:** keine langen Gedankenstriche (kein `—`, kein `–`), auch nicht in
UI-Texten. Komma, Doppelpunkt, Klammer oder neuer Satz.

---

## Die häufigsten Fehler, die dieser Guide verhindert

1. **Falscher Produktname.** Die Demo muss exakt so heißen wie das Projekt in
   `marco-os/data/projects.js`. Ein Besucher, der im Portfolio auf „SQL Copilot" klickt und
   in einer App namens „Olist SQL-Agent" landet, hält den Link für kaputt.
2. **Leeres Eingabefeld als Startzustand.** Wer nicht weiß, was er tippen soll, klickt weg.
   Jede Demo braucht einen Weg zum ersten Ergebnis ohne Tastatur.
3. **Kein Rückweg.** Ohne Link zurück ins Portfolio ist die Demo eine Sackgasse.
4. **Technik entweder versteckt oder im Weg.** Sie gehört eingeklappt eine Ebene tiefer,
   nicht in einen anderen Tab und nicht in die Hauptansicht.

---

## Pflichtaufbau

Umgesetzt über `portfolio_ui.py`, das in jede Streamlit-Demo kopiert wird.

### 1. Seitentitel

```python
page_setup("SQL Copilot")           # Browser-Tab: "SQL Copilot · MARCO.OS"
```

Kein Emoji als `page_icon`, der Produktname soll im Tab lesbar sein.

### 2. Kopfbereich

```python
page_header(
    title="SQL Copilot",                       # exakt wie in projects.js
    claim="Beantwortet Fragen zu Firmendaten in normaler Sprache, ohne die "
          "Datenbank je einem LLM auszuliefern.",
    project_id="sql-agent",                    # LOKALE ID, der Router kennt nur die
    cluster="agentic-ai",
)
```

Der Claim ist derselbe Satz wie fett unter der README-Überschrift, ggf. leicht gekürzt.
Dadurch erkennt ein Besucher, der aus dem README kommt, dass er richtig ist.

### 3. Null-Klick-Einstieg

```python
gewaehlt = example_picker(
    "Beispiel ausprobieren, ohne etwas einzugeben:",
    {
        "Umsatz nach Kategorie": "einfache Aggregation",
        "Top-3 pro Kategorie": "Window Function, scheitert oft",
        "Nicht existierende Spalte": "löst den Selbstkorrektur-Loop aus",
    },
)
```

Zwei bis vier Beispiele, immer sichtbar, immer ein Klick. Mindestens eines davon sollte
eine **Schwäche oder einen Fehlerfall** zeigen, nicht nur den Glücksfall. Das ist derselbe
Ehrlichkeitsanspruch wie bei den Metriken im README, und es ist erfahrungsgemäß der
Moment, der technische Leser überzeugt.

Wo ein Upload nötig ist, müssen Beispieldateien direkt in der App auswählbar sein. Ein
leeres Upload-Feld ist kein Einstieg.

### 4. Die eigentliche Interaktion

Bleibt inhaltlich wie sie ist. Regeln: Ergebnisse erscheinen unter der Eingabe, nicht in
einem anderen Tab. Ladezustände werden angezeigt. Fehler werden im Klartext gezeigt statt
verschluckt, ein sichtbar behandelter Fehler ist ein Qualitätsmerkmal.

### 5. „Unter der Haube"

```python
with under_the_hood():
    st.code(generated_sql, language="sql")
    st.caption("Guardrail-Prüfungen: " + ", ".join(checks))
```

Immer gleich benannt, immer eingeklappt. Hier hinein gehört, was ein Tech-Lead sehen will
und ein Recruiter nicht braucht: generiertes SQL, Prompts, Retrieval-Kandidaten,
SHAP-Werte, Guardrail-Verlauf, Rohantworten des Modells, Latenzen.

### 6. Fußzeile

```python
portfolio_footer(
    repo="sql-copilot",
    project_id="sql-agent",
    caveats=["Free-Tier-Demo, schläft nach Inaktivität ein",
             "read-only Datenbank, Schreibzugriffe sind blockiert"],
)
```

Die `caveats` sind Teil des Produktversprechens, nicht Kleingedrucktes: synthetische Daten,
Stichprobe statt Vollbestand, Kaltstart, fehlende Authentifizierung.

---

## Theme

Jede Streamlit-Demo bekommt eine `.streamlit/config.toml` nach diesem Muster, `primaryColor`
ist der Cluster-Akzent des Projekts:

```toml
# Theme im MARCO.OS-Look. Farbtoken identisch zu marco-os/assets/css/style.css,
# primaryColor ist der Cluster-Akzent aus window-manager.js (CLUSTER_ACCENT).
[theme]
base = "dark"
primaryColor = "#fbbf24"              # agentic-ai; cloud #5eead4, full-stack #a78bfa
backgroundColor = "#0a0716"
secondaryBackgroundColor = "#140f24"
textColor = "#e7e4f5"
font = "sans serif"
```

| Cluster | primaryColor | Projekte |
|---|---|---|
| `agentic-ai` | `#fbbf24` | SQL Copilot, AI Risk Classifier, Medical Coding Extractor, Ask-Marco Assistant |
| `cloud` | `#5eead4` | Document Auto-Classifier |
| `full-stack` | `#a78bfa` | Review Risk Predictor, HR Interview Cockpit |

Keine Google-Fonts einbinden (DSGVO, siehe Portfolio-Entscheidung). Streamlit bringt mit
`sans serif` und `monospace` genug mit; Code-Blöcke werden ohnehin monospace gesetzt.

**Immer `font = "sans serif"`, auch bei terminalnahen Demos.** Mit `monospace` zeichnet
Streamlit die Seitenüberschrift nicht: Der Platz bleibt reserviert, der Text fehlt. Der
Terminal-Charakter entsteht ohnehin über die Kopfzeile und die Code-Blöcke.

Für Nicht-Streamlit-Demos (React beim Review Risk Predictor, statisches HTML beim Interview
Cockpit) gelten dieselben Farbtoken als CSS-Variablen, und derselbe Pflichtaufbau in der
jeweiligen Technik.

---

## Emojis

Keine Emojis in Überschriften, Titeln oder Buttons. Erlaubt sind Symbole, die
*Information* tragen und nicht Dekoration sind: Ampelfarben für Risikoklassen, Häkchen und
Kreuz für bestanden und durchgefallen. Die Marker `▶` und `▸` werden wie im README für
Demo- und Aufklapp-Hinweise verwendet.

---

## Kaltstart

Free-Tier-Hosting schläft nach Inaktivität ein, und 50 Sekunden Wartezeit kosten den
Besucher. Zwei Maßnahmen:

1. Ein Warmhalte-Workflow (`.github/workflows/keep-warm.yml` im Portfolio-Repo) pingt die
   Demos werktags regelmäßig an.
2. Die Fußzeile benennt den Kaltstart trotzdem, denn außerhalb der Ping-Zeiten kann er
   auftreten.

---

## Checkliste vor dem Deploy

- [ ] Produktname exakt wie in `projects.js`, auch im Browser-Tab
- [ ] Claim identisch zum README-Claim
- [ ] Rücklink ins Portfolio im Kopfbereich, Deep-Link mit lokaler Projekt-ID
- [ ] Erstes Ergebnis ohne Tastatureingabe erreichbar
- [ ] Mindestens ein Beispiel zeigt eine Schwäche oder einen Fehlerfall
- [ ] „Unter der Haube" vorhanden, eingeklappt, gleich benannt
- [ ] Fußzeile mit ehrlichen Einschränkungen, Repo- und Portfolio-Link
- [ ] `.streamlit/config.toml` mit dem Cluster-Akzent des Projekts
- [ ] Keine Emojis in Titeln, keine langen Gedankenstriche
- [ ] Demo auf einem schmalen Fenster geprüft, nichts bricht um
