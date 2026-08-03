# Learning Path: MARCO.OS wirklich verstehen

**Zweck:** Du hast das Portfolio schnell hochgezogen (u.a. mit meiner Hilfe). Dieses
Dokument ist dein Weg zurück durch den Code — Station für Station — damit du in
einem Recruiter-/Tech-Interview jede Zeile erklären und begründen kannst, statt nur
"funktioniert" zu sagen. Kein Blabla, jede Station nennt konkrete Dateien/Zeilen,
ein Kernkonzept, eine Selbstkontrolle und eine Frage, die dir gestellt werden könnte.

**Wie du das nutzt:** Öffne die genannte Datei parallel, lies sie wirklich, beantworte
die Selbstkontrolle *ohne nachzuschauen*. Wenn du hängst: nochmal lesen, nicht
weiterblättern. Realistischer Zeitplan: 3–4 Sessions à 45–60 Min, in der
angegebenen Reihenfolge (sie folgt dem tatsächlichen Datenfluss der App, nicht der
Dateigröße).

---

## Station 0 — Der Elevator Pitch (auswendig lernen, zuerst)

> "MARCO.OS ist mein Portfolio als fiktives Betriebssystem: der Desktop-Hintergrund
> ist ein Neuronales-Netz-Graph mit mir als Zentralknoten und jedem Projekt als
> Satellit. Klick auf einen Knoten öffnet ein Terminal-Fenster mit Projektdetails
> und Live-Demo-Link. Bewusst kein klassisches Karten-Grid als Fallback — die
> Graph-Szene *ist* die Seite. Vanilla JS, ES Modules, kein Framework, kein
> Build-Schritt, gehostet auf GitHub Pages."

Wenn du diesen Satz nicht flüssig sagen kannst, ist das dein erstes Übungsziel.

---

## Station 1 — Projektdaten & HTML-Grundgerüst

**Dateien:** [data/projects.js](../data/projects.js), [index.html](../index.html)

**Konzept:** Daten und Rendering sind getrennt. `projects.js` exportiert ein
reines Array von Objekten (`id`, `title`, `summary`, `description`, `tags`,
`demoUrl`, `repoUrl`, `status`, `cluster`) — **keine** x/y-Position. Die Position
wird zur Laufzeit berechnet (siehe Station 5). `index.html` ist nur drei leere
Container (`#boot-overlay`, `#scene`, `#window-layer`, `#taskbar`) plus ein
einziges `<script type="module">`.

**Selbstkontrolle:** Wie fügst du ein neues Projekt hinzu? (Antwort: ein neues
Objekt in `projects.js`, sonst nichts — Layout, Graph, Boot-Zeilen, Taskbar-Tipps
ziehen sich alle automatisch aus diesem Array.)

**Mögliche Frage:** "Wie skaliert das auf 50 Projekte?" → Cluster-Ringe wachsen
mit (`RADIUS_STEP_PER_EXTRA_PROJECT` in graph-layout.js), aber ehrliche Antwort:
ab einer gewissen Dichte bräuchte es Filter/Suche, aktuell nicht nötig bei 8
Projekten.

---

## Station 2 — State Management

**Datei:** [assets/js/state.js](../assets/js/state.js)

**Konzept:** Ein einziges State-Objekt (`bootComplete`, `activeProjectId`,
`zoomLevel`) plus ein **Observer-/Pub-Sub-Pattern**: `subscribe(listener)` trägt
Listener in ein `Set` ein, jede Mutation (`focusProject`, `closeWindow`, `zoomIn`,
…) ruft danach `notify()`, das alle Listener mit dem aktuellen State aufruft.
Jedes UI-Modul (`scene.js`, `window-manager.js`, `taskbar.js`) abonniert sich
selbst und rendert bei jedem `notify()` neu.

**Warum kein Redux/Zustand/Signals?** Drei primitive Felder, ein Verzeichnis voll
Module — ein externes State-Management wäre Overengineering für diese Größe.
Genau das ist eine gute Interview-Antwort: du kennst die "großen" Patterns, hast
aber bewusst die einfachste Lösung gewählt, die die Anforderung erfüllt.

**Selbstkontrolle:** Erkläre `notify()` aus dem Kopf. Was passiert technisch,
wenn du auf einen Planeten klickst — von `focusProject(id)` bis zum
DOM-Update? (`focusProject` setzt `state.activeProjectId`, ruft `notify()`,
das ruft `render()` in `scene.js` **und** in `window-manager.js` **und** in
`taskbar.js` auf — drei unabhängige Module reagieren auf ein Event, ohne dass
sie sich gegenseitig kennen.)

---

## Station 3 — Bootstrapping / Composition Root

**Datei:** [assets/js/main.js](../assets/js/main.js)

**Konzept:** Ein einziger Einstiegspunkt, der alle Module in einer bestimmten
Reihenfolge initialisiert. Der Kommentar im Code (Zeilen 10–13) ist wichtig:
`initScene` muss vor `initWindowManager` laufen (Fokus-Restore braucht die von
der Szene gerenderten `[data-node-id]`-Elemente) und vor `initStarfield`
(braucht `.graph-viewport`, das `initScene` erzeugt). Das nennt man einen
**Composition Root** — ein Ort, an dem die Abhängigkeiten zwischen Modulen
explizit sichtbar sind, statt implizit über Timing-Zufall zu funktionieren.

**Mögliche Frage:** "Was passiert, wenn du die Reihenfolge vertauschst?" →
`initStarfield` würde ein `null`-Element bekommen und crashen, weil
`.graph-viewport` noch nicht existiert. Genau deshalb steht der Kommentar da.

---

## Station 4 — Boot-Sequenz

**Datei:** [assets/js/boot.js](../assets/js/boot.js)

**Konzepte:**
- **Rekursive `setTimeout`-Ketten** für den Typewriter-Effekt (`typeNextChar` →
  `typeNextLine`) statt `setInterval` — erlaubt unterschiedliche Pausen zwischen
  Zeichen (`TYPE_INTERVAL_MS`) und Zeilen (`LINE_PAUSE_MS`).
- **`AbortController`** als sauberer Weg, *alle* offenen Timer und Event-Listener
  auf einen Schlag zu canceln, wenn der Nutzer die Boot-Animation per Klick/Taste
  überspringt (`finish()` ruft `controller.abort()`, jeder `typeNextChar`-Aufruf
  prüft `signal.aborted`).
- **`prefers-reduced-motion`**: kompletter alternativer Codepfad, der die Zeilen
  sofort statisch rendert statt zu tippen.
- Boot-Zeilen werden aus `projects` generiert (`buildBootLines`), nicht
  hartkodiert.

**Selbstkontrolle:** Warum reicht `finished = true` allein nicht aus, um
doppeltes Ausführen von `finish()` zu verhindern — wozu der `AbortController`
zusätzlich? (`finished`-Flag verhindert nur doppeltes `completeBoot()`; der
Controller stoppt tatsächlich laufende `setTimeout`-Ketten und entfernt Listener
— ohne ihn würden Timer im Hintergrund weiterlaufen und noch Zeichen tippen,
selbst nachdem das Overlay schon entfernt wurde.)

---

## Station 5 — Graph-Layout-Algorithmus (das Herzstück)

**Datei:** [assets/js/graph-layout.js](../assets/js/graph-layout.js)
**Tests:** [tests/graph-layout.test.js](../tests/graph-layout.test.js)

Das ist die Datei, die am meisten zeigt, dass du selbst nachgedacht hast — hier
lohnt sich die meiste Zeit.

**Konzept 1 — Pure Function.** `computeLayout(projects, viewportSize)` fasst
kein DOM an, hat keine Seiteneffekte, gibt nur `{ nodes, edges, rings }` zurück.
Deshalb ist sie ohne Browser/JSDOM testbar (`node --test` reicht).

**Konzept 2 — Trigonometrie.** Jeder Cluster (`agentic-ai`, `cloud`,
`full-stack`) bekommt seinen eigenen elliptischen Orbit. Für ein Projekt an
Index `i` von `n` Projekten im Cluster:
```
angle = 2π · i / n + clusterAngleOffset
x = cos(angle) · rx
y = sin(angle) · ry     // ry = rx · 0.62  → Ellipse, nicht Kreis
```
Das ist Standard-Polarkoordinaten-zu-kartesisch-Umrechnung, angewendet auf
mehrere konzentrische Ellipsen statt einen Kreis.

**Konzept 3 — Datengetriebenes Clustering.** `projectsByCluster` gruppiert
Projekte per `Map`; die Reihenfolge in `CLUSTER_ORDER` bestimmt, welcher Ring
innen/außen liegt. `status: "planned"`-Projekte bekommen zusätzlich
`IDEA_ORBIT_MULTIPLIER`, damit "noch nicht gebaut" auch visuell sofort erkennbar
ist.

**Konzept 4 — Responsive Design ohne CSS Media Queries.** `viewportScale()`
skaliert den Radius direkt in der Berechnung (`Math.min(1, Math.max(0.58,
viewportSize / 1280))`), nicht per CSS — weil die Positionen ohnehin in JS
berechnet werden müssen.

**Selbstkontrolle:** Nimm ein Blatt Papier, keine IDE. Zeichne drei
konzentrische Ellipsen und platziere 2 Punkte auf der innersten. Leite `x`/`y`
für beide von Hand her. Wenn das klappt, kannst du diesen Algorithmus im
Interview an ein Whiteboard zeichnen.

**Testdatei lesen, nicht nur Layout-Code:** Jeder Testfall in
`graph-layout.test.js` beweist eine bewusste Design-Entscheidung — lies jeden
Test und formuliere in einem Satz, *welche Anforderung* er absichert (z.B. der
Test "narrow viewports shrink the project radius" beweist, dass die App auf
Mobile nicht aus dem Viewport läuft).

---

## Station 6 — Rendering & Reveal-Choreografie

**Datei:** [assets/js/scene.js](../assets/js/scene.js)

Die komplexeste Datei im Projekt — hier zeigst du im Interview am meisten
"Senior-Judgement", weil die Kommentare im Code selbst schon Trade-offs
erklären.

**Konzept 1 — Rebuild-Vermeidung via `contentKey`.** `render()` läuft bei
*jedem* `notify()` (auch bei jedem Zoom-Tick!), aber der DOM wird nur neu
gebaut, wenn sich `focusedProjectId` oder `viewportSize` ändern
(`contentKey === lastContentKey` → early return). Grund: würde man bei jedem
Mausrad-Tick den DOM neu aufbauen, würden CSS-Animationen (die Edge-Runner-
Lichter) jedes Mal von vorne starten und sichtbar ruckeln. Zoom wird stattdessen
rein über `transform: translate() scale()` auf dem `.graph-viewport` gelöst —
Geometrie und Zoom sind bewusst entkoppelt.

**Konzept 2 — Gestaffelte Reveal-Phasen mit berechneten Timings.** Vier Phasen
(Planeten → Ringe+Linien → Runner-Lichter, siehe Kommentar Zeile 7–20): jede
Phase startet erst, wenn die *tatsächliche* Endzeit der vorherigen Phase erreicht
ist (`startDelay + fadeDuration`, nicht nur die Stagger-Reihenfolge — siehe
`edgePhaseStart()`). Diese `*_MS`-Konstanten müssen mit den
`transition-duration`-Werten in `style.css` übereinstimmen; das ist bewusst
manuell synchronisiert, nicht aus CSS ausgelesen, weil man Phasengrenzen
*vorausberechnen* muss, bevor das Element überhaupt existiert.

**Konzept 3 — SVG per DOM-API.** `buildOrbitLayer()` erzeugt SVG-Elemente mit
`document.createElementNS(SVG_NS, "ellipse")` statt Template-Strings — nötig,
weil SVG-Elemente einen eigenen Namespace haben und `innerHTML = "<ellipse>"`
im SVG-Kontext nicht zuverlässig funktioniert.

**Konzept 4 — Wheel-Events mit Akkumulator.** Statt jedes `wheel`-Event 1:1 in
einen Zoom-Schritt zu übersetzen, akkumuliert `wheelAccumulator` `deltaY` und
löst erst nach Erreichen eines Schwellwerts (`WHEEL_STEP_THRESHOLD`) einen
Zoom-Step aus — das glättet Trackpad-Events, die viele kleine Deltas pro Geste
feuern.

**Konzept 5 — Fokus-Erhalt über Rebuilds hinweg.** Vor dem `innerHTML = ""`
wird das aktuell fokussierte Element gemerkt (`previouslyFocusedId`), nach dem
Neuaufbau wieder fokussiert. Ohne das würde jeder Tastatur-Nutzer bei jedem
Re-Render den Fokus verlieren.

**Selbstkontrolle:** Warum reicht `state.bootComplete` als Bedingung für
`.is-revealed` nicht auch für den `contentKey`-Check darüber? (Weil Geometrie
und Reveal-Status unabhängig sind — die Klasse muss bei jedem Notify gesetzt
werden können, aber der teure DOM-Rebuild nur bei echten Geometrie-Änderungen.)

---

## Station 7 — Fenster-Verwaltung & Fokus-Logik

**Dateien:** [assets/js/window-manager.js](../assets/js/window-manager.js),
[assets/js/focus-target.js](../assets/js/focus-target.js),
[assets/js/html-utils.js](../assets/js/html-utils.js)

**Konzept 1 — Accessible Dialog ohne `<dialog>`.** Das Fenster bekommt
`role="dialog"`, `aria-label`; die Planeten-Buttons `aria-haspopup="dialog"` und
`aria-expanded`. Bewusste Entscheidung gegen das native `<dialog>`-Element (kein
Modal-Overlay-Verhalten gewollt, da das Fenster neben der Graph-Szene sichtbar
bleiben soll).

**Konzept 2 — Fokus-Logik als reine, testbare Funktion.** `nextFocusTarget()`
in `focus-target.js` ist nur 6 Zeilen pure Logik (kein DOM), komplett aus
`window-manager.js` herausgezogen, damit sie isoliert testbar ist
(`tests/focus-target.test.js`). Das ist ein gutes Beispiel für "Logik von
DOM-Kram trennen" — dieselbe Idee wie bei `graph-layout.js`.

**Konzept 3 — XSS-Schutz.** `escapeHtml()` wird überall dort verwendet, wo
Projektdaten (`title`, `description`, `tags`) in `innerHTML`-Strings landen.
Zwar sind die Daten hier selbst nicht nutzergeneriert, aber die Disziplin,
*jede* Interpolation in HTML-Strings zu escapen, ist die richtige Grundhaltung.

**Selbstkontrolle:** Was passiert mit dem Tastatur-Fokus, wenn du ein Fenster
per Escape schließt, während der Fokus *im* Fenster war? Lies `focus-target.js`
Zeile 4 und `window-manager.js` Zeile 30–41 und erkläre den Pfad zurück zum
Graph-Knoten.

---

## Station 8 — Taskbar & Starfield (kleinere, aber lehrreiche Details)

**Dateien:** [assets/js/taskbar.js](../assets/js/taskbar.js),
[assets/js/starfield.js](../assets/js/starfield.js)

**Konzept 1 — Minuten-ausgerichteter Uhr-Tick.** Statt jede Sekunde neu zu
rendern, berechnet `taskbar.js` die Millisekunden bis zur nächsten vollen Minute
(`60000 - (Date.now() % 60000)`) und synct erst dann auf ein
`setInterval(…, 60000)`. Kleiner, aber echter Performance-Gedanke: die Uhr zeigt
eh nur Minuten an, warum 60x öfter rendern als nötig?

**Konzept 2 — Sterne ohne DOM-Knoten.** `starfield.js` erzeugt hunderte
"Sterne" nicht als einzelne `<div>`s, sondern als ein einziger
`box-shadow`-String pro Layer (`randomStarShadow`). Ein Element, hunderte
Schatten — massiv günstiger als hunderte echte DOM-Knoten, die alle einzeln
Layout/Paint kosten würden.

**Selbstkontrolle:** Warum gibt es drei Stern-Layer (`far`/`mid`/`near`) statt
einem? (Parallax-Effekt: unterschiedliche `maxShift`-Werte pro Layer erzeugen
den Eindruck von Tiefe bei Mausbewegung.)

---

## Station 9 — CSS (überfliegen, nicht auswendig lernen)

**Datei:** [assets/css/style.css](../assets/css/style.css)

Du musst nicht jede Zeile kennen, aber diese Klassen tauchen in JS auf — wisse,
wo und warum:
- `.is-revealed` — wird von `scene.js` gesetzt, sobald `state.bootComplete`
  wahr ist; gated alle Reveal-Transitions.
- `.is-fading` — von `boot.js` gesetzt, steuert den Übergang von opakem zu
  transparentem Boot-Overlay.
- `.is-dimmed` — auf Knoten/Kanten/Ringen, wenn ein anderes Projekt fokussiert
  ist.
- Die `transition-duration`-Werte, die zu `NODE_FADE_MS`/`EDGE_FADE_MS` in
  `scene.js` passen müssen (siehe Station 6, Konzept 2) — wenn du hier einen
  Wert änderst, musst du ihn in `scene.js` mitändern, sonst brechen die
  Phasen-Berechnungen.

---

## Station 10 — Tests

**Dateien:** [tests/*.test.js](../tests)

**Konzept:** `node --test`, kein externes Test-Framework (passt zur
"keine Dependencies"-Philosophie des Projekts). Getestet werden ausschließlich
**pure Funktionen ohne DOM** (`graph-layout.js`, `focus-target.js`,
`html-utils.js`, `state.js`, `projects.js`-Struktur). DOM-lastiger Code
(`scene.js`, `window-manager.js`, `boot.js`) wird bewusst **nicht**
unit-getestet, sondern manuell im Browser verifiziert (siehe CLAUDE.md:
Playwright-gestützte manuelle Checks bei 375px/1280px).

**Mögliche Frage:** "Warum keine 100% Coverage?" → Gute Antwort: Testbarkeit
wurde durch *Architektur* erkauft (Logik aus DOM-Code herausgezogen), nicht
durch nachträgliches Mocken von `document`. Der DOM-Code selbst ist dünn genug,
dass manuelles Verifizieren im Browser günstiger ist als ihn mit
jsdom/Testing-Library aufwendig zu simulieren — bewusste Kosten-Nutzen-
Entscheidung, kein Versäumnis.

---

## Konzepte-Glossar (zieht sich durchs ganze Projekt)

| Konzept | Wo im Code | Warum wichtig für dich zu erklären |
|---|---|---|
| ES Modules (`import`/`export`) | überall | Kein Bundler nötig, Browser lädt Module nativ |
| Observer-/Pub-Sub-Pattern | `state.js` | Zeigt Verständnis von Reactivity ohne Framework |
| Pure Functions & Testability | `graph-layout.js`, `focus-target.js` | Zentrales Software-Engineering-Prinzip |
| `AbortController` | `boot.js` | Moderner, sauberer Weg Listener/Timer zu canceln |
| CSS-Transition-Orchestrierung aus JS | `scene.js` | Timing-Berechnungen, die zu CSS passen müssen |
| SVG via DOM-API (`createElementNS`) | `scene.js` | Namespace-Besonderheit von SVG |
| ARIA / Accessibility | `window-manager.js`, `scene.js` | Zeigt, dass du nicht nur "sichtbar", sondern "nutzbar" denkst |
| XSS-Escaping | `html-utils.js` | Sicherheitsbewusstsein auch bei "eigenen" Daten |
| `prefers-reduced-motion` | `boot.js`, `starfield.js` | Progressive Enhancement |
| Performance-Tricks (box-shadow-Sterne, minutengetakteter Tick) | `starfield.js`, `taskbar.js` | Zeigt Bewusstsein für Render-Kosten |

---

## Die Architektur-Entscheidungen, die du begründen können musst

- **Warum kein React/Vue?** Bewusste Entscheidung: kein Build-Schritt, keine
  Dependencies, Hosting via GitHub Pages "Deploy from branch" ohne CI. Bei der
  Größe des Projekts (11 Module, ~1600 Zeilen) ist ein Framework-Overhead nicht
  gerechtfertigt.
- **Warum kein klassisches Karten-Grid als Fallback?** Design-Entscheidung laut
  Spec: die Graph-Szene *ist* die Seite — sie soll sich von einer klassischen
  Karten-Portfolio-Seite abheben.
- **Warum State als simples Objekt + Pub-Sub statt Redux/Zustand/Signals?**
  Drei Felder, überschaubare Modulanzahl — die einfachste Lösung, die die
  Anforderung erfüllt, ist hier die richtige.
- **Warum ist `graph-layout.js` komplett DOM-frei?** Damit die
  Positionsberechnung isoliert unit-testbar ist, unabhängig vom Rendering.
- **Warum keine Tag-/Tech-Stack-Knoten mehr im Graph?** (Aus dem CLAUDE.md-
  Kontext: früher gab es die, jetzt zeigt sich Tech-Stack nur noch im
  aufklappbaren Bereich im Projektfenster — bewusste Vereinfachung des visuellen
  Graphen.)

---

## Recruiter-Simulation: Fragen, die realistisch kommen

1. **"Erklär mir kurz, was das hier ist."** → Station 0.
2. **"Warum kein Framework?"** → siehe oben.
3. **"Wie fügst du ein neues Projekt hinzu?"** → nur `projects.js` erweitern.
4. **"Was passiert technisch, wenn ich auf einen Planeten klicke?"** →
   `focusProject(id)` → `notify()` → `scene.js` zoomt/zentriert per CSS-
   Transform, `window-manager.js` rendert das Terminal-Fenster, `taskbar.js`
   zeigt `<id>.exe`.
5. **"Wie stellst du sicher, dass das barrierefrei nutzbar ist?"** → ARIA-
   Attribute, Tab+Enter funktioniert wie Klick, Fokus-Erhalt über Re-Renders,
   `prefers-reduced-motion` respektiert.
6. **"Wie ist die Positionierung der Planeten berechnet?"** → Station 5,
   im Zweifel an ein Whiteboard zeichnen können.
7. **"Was hast du unit-getestet und was nicht, und warum?"** → Station 10.
8. **"Größte technische Herausforderung?"** → ehrliche Antwort: die
   gestaffelte Reveal-Choreografie in `scene.js`, bei der CSS-Timings und
   JS-Konstanten synchron gehalten werden müssen, plus das Vermeiden von
   DOM-Rebuilds bei jedem Zoom-Tick, damit Animationen nicht neu starten.
9. **"Was würdest du beim nächsten Mal anders machen?"** → z.B. CSS-Timings
   nicht doppelt (CSS + JS-Konstanten) pflegen müssen, evtl. über CSS
   Custom Properties synchronisieren.
10. **"Wie skaliert das auf mehr Projekte?"** → Cluster-Ringe wachsen mit,
    aber ab gewisser Dichte bräuchte es Suche/Filter — aktuell bewusst nicht
    gebaut, weil nicht nötig.

---

## Checkliste: Bist du bereit?

- [ ] Elevator Pitch (Station 0) sitzt ohne Stocken.
- [ ] Du kannst den Klick-Ereignispfad (State → Notify → 3 Module reagieren)
      frei erklären.
- [ ] Du kannst die x/y-Formel aus `graph-layout.js` herleiten, ohne den Code
      zu öffnen.
- [ ] Du kannst erklären, warum `contentKey` in `scene.js` existiert.
- [ ] Du kannst zeigen, wo im Code der Boot-Skip funktioniert und warum
      `AbortController` dafür nötig ist.
- [ ] Du kannst mindestens 3 der 5 Architektur-Entscheidungen oben aus dem Kopf
      begründen.
- [ ] Du kannst sagen, was du unit-getestet hast und *warum genau das und
      nicht mehr*.
- [ ] Du hast die App mindestens einmal bei 375px und bei 1280px+ im Browser
      selbst durchgeklickt und dir dabei bewusst die Reveal-Phasen angeschaut.

Wenn alle Haken gesetzt sind, bist du nicht nur in der Lage zu sagen "ich hab
das gebaut" — du kannst es auch verteidigen, wenn nachgefragt wird.
