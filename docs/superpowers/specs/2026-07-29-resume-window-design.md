# Lebenslauf-Fenster beim Klick auf Marco Stang — Design

## Problem / Ziel

Der Klick auf den Marco-Stang-Zentralknoten öffnet aktuell den
second-brain-Chat (eingebettetes Iframe). Ein Recruiter, der sich für den
Lebenslauf interessiert, hat sonst keinen Weg innerhalb des OS-Erlebnisses,
ihn zu sehen. Ziel: den Lebenslauf so einbauen, dass er sich stimmig ins
Terminal/CRT-Konzept einfügt, statt als Fremdkörper (z. B. simpler
externer Link) zu wirken — ohne den second-brain-Chat zu verlieren.

## Architektur-Kontext (wichtig)

Dieses Repo hat zwei Branches mit unterschiedlichem Fenster-Modell: ein
`redesign/frontend-design-overhaul`-Branch mit einem (experimentellen)
Multi-Fenster-System, und `master`, der einzige Branch, auf dem
weitergearbeitet wird. `master` hat **ein einziges aktives Fenster**
(`state.activeProjectId`, kein `openWindows`-Array, kein Drag/Resize,
keine `window-geometry.js`). Dieses Design ist bewusst für dieses
Ein-Fenster-Modell entworfen — es öffnet nie zwei Fenster gleichzeitig.

## Kernidee

`data/projects.js` enthält bereits einen Eintrag `id: "second-brain"`,
`title: "Ask-Marco Assistant"`, `orbitsCenter: true` — er wird als kleiner
"Mond"-Knoten direkt um den Zentralknoten gerendert (`graph-layout.js`,
`tier: "moon"`). Aktuell öffnet ein Klick auf diesen Mond aber nur die
generische Projekt-Karte des Eintrags (Status-Badge, Summary, Tags,
externer Demo-Link) — **nicht** den echten eingebetteten Chat; der ist
bisher nur über den Zentralknoten selbst erreichbar.

Wir tauschen die beiden Ziele:

- **Marco Stang (Zentralknoten)** → öffnet neu das Lebenslauf-Fenster.
- **Ask-Marco Assistant (Mond-Knoten)** → öffnet neu den echten
  eingebetteten Chat (bisher exklusiv am Zentralknoten hängend).

Kein neuer Klick-Pfad nötig, keine Tabs, kein Multi-Fenster-Umbau — beide
Ziele nutzen weiterhin dasselbe Ein-Fenster-Modell, nur mit vertauschter
Zuordnung. Der Mond-Knoten war ohnehin schon visuell/inhaltlich als
"Ask-Marco" gebrandet — der Chat wandert an die Stelle, wo er dem Namen
nach sowieso hingehört.

## Fensterverhalten

- Neue Sentinel-ID `RESUME_ID` in `state.js`, analog zu
  `SECOND_BRAIN_CHAT_ID` (eigener String, kollidiert nicht mit einer
  echten `data/projects.js`-ID).
- `scene.js`, Zentralknoten-Klick-Handler (aktuell
  `el.addEventListener("click", () => focusProject(SECOND_BRAIN_CHAT_ID))`):
  ändert sich zu `focusProject(RESUME_ID)`. Das zugehörige
  `aria-expanded`-Attribut und `aria-label` werden entsprechend angepasst
  (Label z. B. "Marco Stang — Lebenslauf öffnen").
- `scene.js`, Klick-Handler für alle anderen Knoten (aktuell einheitlich
  `focusProject(node.id)`): für den Mond-Knoten mit `node.id ===
  "second-brain"` wird stattdessen `focusProject(SECOND_BRAIN_CHAT_ID)`
  aufgerufen — alle anderen Knoten (Planeten) bleiben beim bisherigen
  `focusProject(node.id)`.
- `window-manager.js` bekommt einen dritten Zweig neben `isChat`:
  `isResume = activeId === RESUME_ID`, mit eigener
  `buildResumeWindow()`-Funktion analog zu `buildChatWindow()`.
- `taskbar.js`: dieselbe Sonderbehandlung wie für `SECOND_BRAIN_CHAT_ID`
  (`isChatOpen`) kommt für `RESUME_ID` dazu, Label z. B.
  `lebenslauf.exe`.
- `data/projects.js`: der letzte Satz der `second-brain`-Beschreibung
  ("Live und erreichbar über den Marco-Zentrum-Knoten…") wird korrigiert,
  da er nicht mehr stimmt (jetzt: erreichbar über den Ask-Marco-Mond-Knoten).

## Inhalt & Struktur des Lebenslauf-Fensters

Terminal-Optik, konsistent mit den Projekt-Fenstern (`.prompt`,
`.win-body`, `.tag`-Chips, `.tech-toggle`/`.description`-Toggle-Klassen
werden 1:1 wiederverwendet, kein neues CSS-Pattern):

```
marco@portfolio:~$ cat lebenslauf.txt

DR.-ING. MARCO STANG — KI-Spezialist & Data Scientist
Dr.-Ing. mit über 10 Jahren Erfahrung in Entwicklung, Validierung und
Operationalisierung von KI- und Data-Science-Lösungen. Fokus auf Machine
Learning, Deep Learning und generative KI.

── AKTUELLE STATIONEN ──
Solution Architect | ILI.DIGITAL AG — 10.2025–05.2026
  ▸ Leitung von Projektteams, Requirements-Workshops, Lösungsarchitekturen
  ▸ LLM-Datenextraktionspipelines auf AWS & Azure
  ▸ Entwicklung von maika.digital (KI-Abrechnungsassistent, RAG-System)

Promotion Dr.-Ing., Note "Sehr gut" | KIT / ITIV — 10.2019–05.2025
  ▸ Dissertationsthema: Validierung von KI-Systemen durch Szenarien-
    Verknüpfung und metamorphes Testen
  ▸ Industriekooperation mit Mercedes-Benz AG (Autonomous Comfort)

[SKILLS: Python · Machine Learning · Deep Learning · LLM/RAG ·
 Agentische Workflows · TensorFlow · React · FastAPI · AWS · Azure ·
 Docker · n8n · Power Automate · C++ · Projektleitung]

▸ Vollständigen Werdegang anzeigen
  → Data-Scientist FZI, Future Bus mit Daimler Trucks (09.2015–12.2016)
  → Lehre: AMALEA-Kursentwicklung, Übungsleiter Software Engineering
  → Studium: M.Sc. Elektro-/Informationstechnik KIT (Note 1.7),
    Auslandspraktikum INIT AG (USA)
  → Sprachen: Deutsch (Muttersprache), Englisch (verhandlungssicher)
  → Referenz: auf Anfrage

[Vollständigen Lebenslauf laden (PDF)]
```

- Nur die zwei aktuellsten Stationen sind offen sichtbar; alles Ältere
  (FZI, Lehre, Studium, Sprachen, Referenz-Hinweis) sitzt hinter einem
  "▸ Vollständigen Werdegang anzeigen"-Toggle — dieselbe
  Auf/Zu-Interaktion wie `tech-toggle`/`description` bei Projekt-Fenstern
  (`wireProjectWindowInteractions` wird für das Resume-Fenster
  mitverwendet, keine neue Toggle-Logik).
- Skills als `.tag`-Chips, gleiche CSS-Klasse wie bei Projekten.
- **Keine** rohe Telefonnummer/E-Mail (weder deine eigene noch die des
  Referenzgebers Prof. Sax) im gerenderten Text — Datenschutz-Grund:
  öffentliche GitHub-Pages-Seite, Scraper/Spam-Bots lesen HTML-Text
  passiv mit. Der "Vollständigen Lebenslauf laden (PDF)"-Button ist der
  bewusste Kontaktweg: das PDF selbst enthält Telefonnummer/E-Mail, das
  ist unproblematisch, weil es ein gezielter, aktiver Download ist statt
  passiv gecrawlter Seiteninhalt.
- Kein separater "Kontakt aufnehmen"-Button — der jetzt über den
  Ask-Marco-Mond erreichbare Chat übernimmt diese Rolle.
- Kein Typewriter-Intro — Inhalt steht beim Öffnen sofort fertig da.

## Daten & Dateien

- `data/resume.js` (neu) — strukturierte CV-Daten, analog zu
  `data/projects.js`: Profil-Intro, aktuelle Stationen (Titel, Firma,
  Zeitraum, Bullet-Punkte), ältere Stationen/Lehre/Studium/Sprachen für
  den Toggle-Bereich, Skills-Liste.
- `assets/docs/lebenslauf-marco-stang.pdf` (neu, kopiert aus
  `..\Unterlagen_Marco\Lebenslauf_Marco_Stang.pdf`). Da diese Seite ohne
  Build-Schritt direkt als statische Dateien ausgeliefert wird (GitHub
  Pages "Deploy from branch"), reicht ein relativer Link
  `assets/docs/lebenslauf-marco-stang.pdf` im Download-Button — kein
  Kopierschritt in einen `dist/`-Ordner nötig.

## Betroffene Dateien

- `data/resume.js` (neu)
- `assets/docs/lebenslauf-marco-stang.pdf` (neu, kopiert)
- `data/projects.js` — Korrektur der veralteten Erreichbarkeits-Aussage
  im `second-brain`-Eintrag
- `assets/js/state.js` — `RESUME_ID`-Sentinel
- `assets/js/scene.js` — Zentralknoten öffnet `RESUME_ID`, Mond-Knoten
  `"second-brain"` öffnet `SECOND_BRAIN_CHAT_ID`
- `assets/js/window-manager.js` — dritter Fenstertyp-Branch
  (`buildResumeWindow`)
- `assets/js/taskbar.js` — Sonderbehandlung + Label für `RESUME_ID`
- `assets/css/style.css` — ggf. kleine Ergänzung falls das
  Resume-Fenster eigene Layout-Anpassungen braucht (z. B. mehr Zeilen
  Text als ein Projekt-Fenster)

Kein neues npm-Package, keine Server-Logik — bleibt statisch wie der Rest
der Seite.

## Testing / Verifikation

- `npm test` weiterhin grün (`tests/state.test.js` bekommt Fälle für
  `RESUME_ID`, analog zu den bestehenden `SECOND_BRAIN_CHAT_ID`-Tests).
- Manuelle Prüfung im Browser bei 375px und 1280px+ Breite (Projekt-
  Konvention): Klick auf Marco Stang öffnet das Lebenslauf-Fenster, Klick
  auf den Ask-Marco-Mond öffnet den echten Chat, Toggle klappt korrekt
  auf/zu, PDF-Download funktioniert, Escape/Hintergrundklick schließen
  beide Fenstertypen wie jedes andere Fenster.
