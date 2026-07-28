# marco-os — Design Spec

## What This Is

marco-os ist eine futuristische Alternative zu **stangfolio** (bleibt
unverändert als eigenständiges Repo bestehen — kein Löschen, kein Ersetzen).
Statt eines Karten-Grids präsentiert sich die Seite als **fiktives
Betriebssystem**, dessen Desktop-Hintergrund selbst ein lebendiges
**neuronales Netz** ist: Marco steht als Zentrum, jedes Projekt hängt als
Knoten daran, verbunden über seinen Tech-Stack. Ein Klick auf einen Knoten
öffnet ein Terminal-Fenster mit den Projektdetails.

Hinweis: Parallel dazu entsteht in einem separaten Repo (`stangverse`, von
einer anderen Session/einem anderen Agenten betreut) eine zweite, komplett
andere futuristische Richtung (begehbare isometrische Comic-Welt mit
Phaser). marco-os ist davon unabhängig und verfolgt bewusst die
OS+Graph-Fusion.

## Core Value (übernommen von stangfolio, Darstellung geändert)

Ein Recruiter kann ein Projekt (z.B. sql-agent) direkt im Browser entdecken
und ausprobieren, ohne zu installieren — eingebettet in eine futuristische
"KI-Betriebssystem"-Optik statt einer klassischen Liste.

**Bewusste Entscheidung:** Es gibt **keinen** klassischen Fallback/Skip-Link
zu einer einfachen Listenansicht. Die Szene *ist* die Seite — volles Setzen
auf das Erlebnis (siehe "Risiken & Trade-offs").

## Konzept: MARCO.OS-Rahmen + Agent-Graph als Desktop

Ein einziges System statt zweier nebeneinander existierender Modi:

- **OS-Rahmen bleibt bestehen:** Browser-Chrome-Leiste (dekorativ), kurze
  Boot-Zeilen-Sequenz beim Laden, Uhr (echte Systemzeit), Taskbar mit
  Start-Label, aktivem Fenster und einer rotierenden KI-Guide-Tippzeile.
- **Desktop-Hintergrund = Graph:** Keine separate Icon-Spalte. Die
  Projekt-Knoten im neuronalen Netz *sind* die Icons. Marco ist der
  zentrale Knoten, jedes Projekt ein Satelliten-Knoten, verbunden über
  Kanten. Ein Projekt-Knoten verzweigt zusätzlich zu kleinen
  Tech-Stack-Knoten (aus `tags`).
- **Ein Fenster gleichzeitig:** Klick/Tap auf einen Projekt-Knoten öffnet
  dessen Terminal-Fenster (Titel, Status-Badge, Beschreibung, Tags,
  Demo-/Repo-Aktion). Ein zweiter Klick auf einen anderen Knoten ersetzt
  das offene Fenster; es wird keine Mehrfenster-Verwaltung gebraucht.
- **Visuelle Verbindung Knoten↔Fenster:** Eine kurze animierte
  Verbindungslinie ("Datenstrahl") zeigt sichtbar, aus welchem Knoten das
  aktuell offene Fenster stammt.

## Datenmodell

`data/projects.js`, Struktur identisch zu stangfolio (`id`, `title`,
`summary`, `description`, `tags`, `demoUrl`, `repoUrl`, `status`, optional
`coldStartNote`) — initial durch Kopie aus stangfolio befüllt, danach
unabhängig gepflegt (keine Laufzeit-Synchronisation zwischen den beiden
Repos).

**Kein Positions-Feld nötig.** Die Knoten-Position wird zur Laufzeit aus
Anzahl + `status` berechnet (siehe Layout-Algorithmus) — neue Projekte
brauchen nur einen neuen Dateneintrag, keine manuelle Koordinaten-Pflege.

## Layout-Algorithmus (radial, automatisch)

- Marco-Knoten fest im Zentrum der Szene.
- Projekt-Knoten radial verteilt: Winkel = `360° / Anzahl Projekte`,
  fortlaufend ab einem festen Startwinkel.
- Radius je nach `status`: `live`/`coming-soon`-Projekte etwas näher am
  Zentrum und größer/heller dargestellt, `planned`-Projekte weiter außen,
  kleiner und gedimmt (visualisiert Reifegrad, wie im Mockup gezeigt).
- Tech-Stack-Knoten eines Projekts werden nur für das aktuell fokussierte
  Projekt gerendert, radial um dessen Knoten herum (nicht dauerhaft für
  alle Projekte gleichzeitig, sonst überladen sich Szenen mit vielen
  Projekten optisch).
- Wächst die Projektzahl über die aktuell erwarteten ~3–10, vergrößert sich
  der Basisradius proportional mit — kein Kollisions-Solver nötig für den
  erwarteten Umfang.

## Komponenten (Vanilla JS, ein Modul pro Datei unter `assets/js/`)

1. **`state.js`** — zentrales State-Objekt (`activeProjectId`,
   `bootComplete`) plus eine einfache `render()`-Funktion, die bei
   State-Änderungen Graph, Fenster und Taskbar synchron aktualisiert. Kein
   externes Framework/keine Abhängigkeit.
2. **`boot.js`** — zeigt die Boot-Zeilen-Animation beim Laden (kurz,
   überspringbar per Klick/Taste), setzt danach `state.bootComplete = true`.
3. **`graph-layout.js`** — reine Funktion: nimmt Projektliste (+ optional
   fokussiertes Projekt für Tech-Stack-Knoten), gibt Knoten-Koordinaten
   zurück. Kein DOM-Zugriff, gut isoliert testbar.
4. **`scene.js`** — rendert SVG-Kanten + Knoten-Elemente aus den
   Layout-Koordinaten, hängt Klick-/Tastatur-Handler an, aktualisiert
   `state.activeProjectId` bei Interaktion.
5. **`window-manager.js`** — rendert/aktualisiert das Terminal-Fenster für
   `state.activeProjectId` (Inhalt aus `data/projects.js`), rendert nichts,
   wenn kein Projekt aktiv ist.
6. **`taskbar.js`** — echte Systemzeit (`setInterval`), Anzeige des aktiven
   Fensters als "laufende App", rotierende KI-Guide-Tipp-Sätze (feste
   Liste, kein Backend/keine echte KI).

## Interaktion & Navigation

- **Maus/Touch:** Klick/Tap auf einen Knoten öffnet/wechselt das Fenster.
- **Tastatur (Pflicht, da kein Fallback existiert):** Jeder Knoten ist ein
  fokussierbares Element mit sichtbarem Fokus-Ring, erreichbar per Tab in
  logischer Reihenfolge (Zentrum → Projekte im Uhrzeigersinn). `Enter`/
  `Space` öffnet das Fenster des fokussierten Knotens, `Escape` schließt das
  aktuell offene Fenster.
- **Mobile:** Radiale Anordnung bleibt, skaliert per SVG-`viewBox`
  responsiv mit; das Fenster nimmt auf kleinen Screens die volle Breite
  ein statt frei zu floaten (siehe `@media`-Anpassung im Mockup).

## Error Handling / Edge Cases

- Keine Projekte vorhanden → nur der Marco-Zentrum-Knoten sichtbar, kein
  Crash, kein leerer Fehlertext.
- `demoUrl: null` (aktueller Zustand von sql-agent) → Fenster zeigt
  "Demo folgt"-Status statt "Demo starten"-Button, identisch zum
  bestehenden Verhalten in stangfolio.
- Sehr viele Projekte (>8) → Basisradius wächst automatisch mit; kein
  spezieller Kollisions-Algorithmus für den erwarteten Umfang nötig.

## Tech-Architektur

- **Kein Build-Tool:** Plain HTML/CSS/Vanilla-JS, wie bisher bei
  stangfolio — bewusst gewählt trotz gestiegener Interaktions-Komplexität,
  da der zusätzliche Zustand (aktiver Knoten/Fenster) über ein einziges
  zentrales State-Objekt (`state.js`) sauber handhabbar bleibt, ohne
  Reaktivitäts-Library.
- **Rendering:** Echte DOM-/SVG-Elemente für Knoten und Kanten (kein
  Canvas/WebGL) — Begründung: reale DOM-Elemente liefern Tastatur-Fokus
  und Screenreader-Zugänglichkeit praktisch geschenkt, was bei Canvas
  komplett manuell nachgebaut werden müsste. Für die erwartete Knotenzahl
  (~3–10 + Tech-Stack-Satelliten) ist DOM/SVG performant genug.
- **Hosting:** GitHub Pages, "Deploy from branch" wie bei stangfolio — kein
  Build-Schritt, keine GitHub-Actions-Pipeline nötig.
- **Repo:** Eigenständiges neues Repo `marco-os`, lokal unter
  `02_Portfolio/marco-os` angelegt, GitHub-Repo wird separat erstellt
  (nicht Teil dieser Spec-Phase).

## Testing / Verifikation

- Rein statisch, kein Server nötig für lokale Entwicklung.
- Manuelle Verifikation im Browser bei mobiler Breite (375px) und Desktop
  (1280px+), analog zur bisherigen Praxis in stangfolio.
- Tastatur-Navigation manuell durchklicken (Tab-Reihenfolge, Enter/Escape).
- `node --check` für Syntax-Prüfung der JS-Module (wie bisher in
  stangfolio praktiziert).

## Out of Scope

- Klassische Listen-Fallback-Ansicht (bewusst nicht Teil dieses Konzepts).
- Mehrere gleichzeitig geöffnete Fenster / Drag&Drop von Fenstern.
- Echte KI-Funktionalität hinter dem "KI-Guide" (rotierende Tipps sind
  statischer Text, kein LLM-Call).
- Sound/Musik.
- Deployment der einzelnen Projekt-Demos selbst (bleibt wie in stangfolio
  außerhalb des Scopes).
- Migration/Redirect-Strategie von stangfolio zu marco-os (DNS, Verlinkung
  zwischen beiden Seiten) — spätere Entscheidung.
- Abstimmung/Vergleich mit dem parallelen `stangverse`-Konzept — beide
  Repos entstehen unabhängig voneinander.

## Risiken & Trade-offs

- **Kein klassischer Fallback:** Explizit gewählt. Mitigation: vollständige
  Tastatur-Bedienbarkeit der Graph-Szene selbst (siehe Interaktion &
  Navigation), kurze/überspringbare Boot-Sequenz statt erzwungener
  Wartezeit.
- **Radiales Auto-Layout bei wachsender Projektzahl:** Bleibt lesbar durch
  mitwachsenden Radius; kein Anspruch auf perfekte Kollisionsfreiheit bei
  sehr großer Projektzahl (aktuell nicht erwartet).
- **Zwei parallele futuristische Konzepte (marco-os und stangverse):**
  Bewusst in Kauf genommen, da unterschiedliche Sessions/Agenten daran
  arbeiten; eine Entscheidung, welches (falls nicht beide) langfristig
  bleibt, ist nicht Teil dieser Spec.

## Verhältnis zu stangfolio

stangfolio bleibt unverändert als eigenständiges Repo bestehen und wird
nicht gelöscht oder überschrieben. marco-os ist ein komplett neues,
eigenständiges Repo mit eigenem Lebenszyklus. Eine spätere Entscheidung,
ob stangfolio offline geht, verlinkt bleibt oder parallel weiterläuft, ist
nicht Teil dieser Spec.
