# Boot-Screen & Szenen-Aufbau — Design

**Status:** Approved
**Datum:** 2026-07-28

## Ziel

Der Boot-Screen (`assets/js/boot.js`) zeigt aktuell drei statische Zeilen für
1.8s, dann verschwindet er und die fertige Graph-Szene ist sofort komplett da
(harter Schnitt). Das soll vertieft werden: ein reichhaltigerer, code-artiger
Boot-Screen (mehr Zeilen, getippt statt sofort sichtbar) und danach ein
sichtbarer Aufbau der Graph-Szene (Knoten/Kanten erscheinen nacheinander)
statt eines harten Cuts.

## Teil 1: Reichhaltigerer Boot-Screen

### Architektur

`initBoot(overlay, projects, options)` bekommt zusätzlich die Projektliste
übergeben (`main.js` reicht `projects` durch, analog zu `initScene` und
`initWindowManager`). Die Zeilen werden dynamisch aus zwei Quellen gebaut:

- 3 generische System-Zeilen (wie bisher: `neural-link.service gestartet`,
  `netzwerk-graph geladen`, plus eine neue dritte generische Zeile passend
  zum erweiterten Umfang, z.B. `[ OK ] projekt-index initialisiert`).
- Eine Zeile pro Projekt aus `projects`, Format `[ OK ] Projekt geladen:
  ${project.title}`, **gedeckelt auf maximal 6** Projekt-Zeilen
  (`projects.slice(0, 6)`) als Sicherheitsnetz, falls die Projektliste später
  deutlich wächst — verhindert einen unbegrenzt langen Boot-Vorgang.
- Abschließend die bestehende Prompt-Zeile `[ .. ] warte auf
  Nutzereingabe_`.

### Typewriter-Effekt

Jede Zeile wird zeichenweise in ihr `.boot-line`-Element getippt:
`TYPE_INTERVAL_MS = 10` pro Zeichen, `LINE_PAUSE_MS = 80` Pause zwischen
abgeschlossenen Zeilen, per verschachteltem `setTimeout` (kein
`requestAnimationFrame` nötig, da die Zeitschritte fix und nicht an
Frame-Timing gebunden sind). Bei ca. 8 Zeilen ergibt das eine Gesamtdauer von
grob 3-4s bis zur letzten Zeile — bleibt wie bisher jederzeit per Klick auf
das Overlay oder beliebigen Tastendruck überspringbar (bestehendes
`AbortController`-Pattern bleibt erhalten). Die genauen Millisekunden-Werte
sind Startwerte und werden beim manuellen Browser-Test ggf. nachjustiert.

Nach Abschluss der letzten Zeile wird — wie im bisherigen Verhalten — nach
einer kurzen Pause automatisch `finish()` aufgerufen (kein Warten auf
tatsächliche Nutzereingabe erzwungen, das entspricht dem bestehenden
Verhalten, bei dem `warte auf Nutzereingabe_` ebenfalls nur behauptet, nicht
tatsächlich blockiert).

### Skip-Verhalten

Ein Klick auf das Overlay oder ein beliebiger Tastendruck ruft weiterhin
sofort `finish()` auf, unabhängig davon, welche Zeile gerade getippt wird —
identisch zum bisherigen `AbortController`/Event-Listener-Aufbau, nur dass
jetzt zusätzlich der Typewriter-Timer-Loop abgebrochen werden muss (über
denselben `AbortController` oder einen Guard-Flag, das die
`setTimeout`-Kette prüft, bevor sie den nächsten Schritt plant).

### Barrierefreiheit

Unter `prefers-reduced-motion: reduce` (Check via `matchMedia`, wie bereits
in `starfield.js` verwendet) wird der Typewriter-Effekt komplett
übersprungen: alle Zeilen werden sofort vollständig ins Overlay geschrieben,
keine Zeichen-für-Zeichen-Verzögerung. Der automatische `finish()`-Timer
danach bleibt (mit einer kurzen, festen Pause statt der typewriter-basierten
Dauer).

## Teil 2: Sichtbarer Szenen-Aufbau nach dem Boot

### Architektur

Kein zusätzlicher DOM-Rebuild in `scene.js`. Knoten und Kanten werden wie
bisher einmalig beim initialen `render()`-Durchlauf gebaut. Jedes Element
bekommt zusätzlich eine inline CSS-Custom-Property `--reveal-order`
(Ganzzahl), gesetzt beim Bauen:

- Center-Knoten (Marco): `--reveal-order: 0`.
- Pro Projekt (in Array-Reihenfolge, Index `i` ab 0): die zugehörige Kante
  bekommt `--reveal-order: ${i * 2 + 1}`, der zugehörige Projekt-Knoten
  `--reveal-order: ${i * 2 + 2}` — Kante kommt also immer unmittelbar vor
  ihrem Knoten in der Reveal-Reihenfolge.

Sobald `state.bootComplete` auf `true` wechselt (das passiert bereits heute
einmalig über `completeBoot()` in `state.js`, inklusive Notify an alle
Subscriber), fügt `scene.js`s `render()`-Funktion der Klasse des `#scene`-
Containers `is-revealed` hinzu. Diese eine Zeile steht **vor** dem kürzlich
eingeführten `contentKey`-Early-Return (siehe `assets/js/scene.js`s
Zoom-Stutter-Fix), damit der Boot-Übergang nicht versehentlich durch den
Zoom-Rebuild-Guard geskippt wird — der Klassenwechsel ist idempotent
(`classList.add` mehrfach aufrufen ist unschädlich), muss also nicht selbst
gegen Mehrfachausführung geschützt werden.

### Reveal-Optik (reines CSS, keine Konflikte mit bestehenden Inline-Transforms)

Bestehende Inline-Transforms bleiben unverändert (Positionierung der Knoten
via `translate(calc(-50% + x), calc(-50% + y))`, Kanten via
`translate(fx,fy) rotate(angle)`) — die Reveal-Animation greift auf andere
Properties/Elemente zu, um Konflikte zu vermeiden:

- **Kanten:** `.edge` selbst animiert `opacity` von 0 auf 1 (keine
  Transform-Kollision, da nur `opacity` betroffen ist).
- **Planeten:** `.node-dot` (das innere Element, das *keinen* eigenen
  Inline-Transform trägt — nur der äußere `.node` hat den
  Positions-Transform) animiert `transform: scale(0) → scale(1)` plus
  `opacity: 0 → 1`.
- **Label:** `.node-label` (seit dem Center-Fix bereits absolut positioniert,
  siehe aktueller Code) faded mit `opacity: 0 → 1`, leicht zeitversetzt nach
  dem Dot (z.B. zusätzliche 60ms über denselben `--reveal-order`-Wert plus
  Konstante).

Transition-Delay pro Element wird per CSS berechnet:
`transition-delay: calc(var(--reveal-order) * 90ms);` — kein JS-seitiges
Delay-String-Building nötig, die Reihenfolge steckt komplett in der
CSS-Custom-Property.

Vor dem Reveal (`#scene` ohne `.is-revealed`) sind betroffene Elemente über
eine scoped Selector-Regel (`.scene:not(.is-revealed) .node-dot`,
`.scene:not(.is-revealed) .edge`) unsichtbar/skaliert-auf-0 und zusätzlich
`pointer-events: none` — verhindert, dass noch unsichtbare Knoten während
der kurzen Aufbauphase anklickbar sind.

Bei 3 Projekten läuft die komplette Sequenz (letzter `--reveal-order`-Wert
`3*2+2=8`, macht `8 * 90ms = 720ms` Start-Delay des letzten Elements, plus
dessen eigene ~250-300ms Transition-Dauer) in ca. 1s durch.

### Skip-Verhalten

Bricht man den Boot-Screen per Klick/Taste vorzeitig ab, läuft der
Szenen-Aufbau danach trotzdem normal (mit voller Staffelung) ab — nur die
Boot-Zeilen selbst werden abgekürzt. `completeBoot()` wird in beiden Fällen
(Auto-Finish nach letzter Zeile, oder Skip) identisch aufgerufen, `scene.js`
unterscheidet nicht zwischen beiden Auslösern.

### Barrierefreiheit

Unter `prefers-reduced-motion: reduce` erscheint die Szene sofort vollständig
sichtbar, ohne Staffelung oder Skalierungsanimation — die
`.scene:not(.is-revealed) ...`-Verstecken-Regeln und die
`transition-delay`/`transform: scale(0)`-Übergänge werden komplett in einen
`@media (prefers-reduced-motion: no-preference)`-Block verschoben, analog
zum bestehenden Muster bei `.edge--active`/`edgePulse`, `.star-layer` und
`.nebula`-artigen Animationen in diesem Projekt. Unter `reduce` gilt also:
alle Knoten/Kanten sind von Anfang an voll sichtbar (kein Pre-Reveal-Hiding
überhaupt aktiv).

## Integration

- `assets/js/main.js`: `initBoot(document.querySelector("#boot-overlay"),
  projects)` — `projects` zusätzlich übergeben.
- `assets/js/boot.js`: Zeilen-Generierung aus `projects` + generischen
  Zeilen, Typewriter-Rendering, reduced-motion-Zweig.
- `assets/js/scene.js`: `--reveal-order` beim Bauen von Knoten/Kanten
  setzen, `is-revealed`-Klasse auf `container` bei `state.bootComplete`.
- `assets/css/style.css`: neue Regeln für `.scene:not(.is-revealed)
  .node-dot`, `.scene:not(.is-revealed) .edge`, `.node-label`-Fade,
  `transition-delay`-Berechnung, alles unter
  `@media (prefers-reduced-motion: no-preference)`.

## Testing

Wie bei Sternfeld/Nebula/Zoom: kein neuer `node --test`-Test, da reine
DOM-/Timing-/Animationslogik ohne sinnvoll isolierbare Kernfunktion. Manuelle
Browser-Verifikation (Playwright, wie in dieser Session bereits etabliert):

- Boot-Screen beobachten: mehr Zeilen, sichtbarer Typewriter-Effekt,
  Skip-per-Klick/Taste funktioniert weiterhin sofort.
- Nach Boot-Abschluss (sowohl durchlaufen als auch geskippt): Szene baut
  sich sichtbar auf (Marco zuerst, dann Kante+Knoten pro Projekt
  nacheinander), keine anklickbaren unsichtbaren Knoten während der
  Aufbauphase.
- `prefers-reduced-motion: reduce` aktivieren: Boot-Zeilen erscheinen
  sofort komplett, Szene ist von Anfang an voll sichtbar ohne Staffelung.
- Regressionscheck: bestehende Zoom-Stutter-Fix-Logik (Content-Rebuild nur
  bei Fokus-/Viewport-Änderung) bleibt unangetastet, `is-revealed`-Klasse
  wird unabhängig davon gesetzt.
- `npm test` bleibt bei 32/32 grün (keine der bestehenden Testdateien
  berührt boot.js/scene.js-DOM-Verhalten).

## Out of Scope (YAGNI)

- Keine Kopplung des Boot-Textinhalts an echte Ladezustände (Assets sind
  bereits alle synchron eingebettet, es gibt nichts "echtes" zu warten —
  der Boot-Screen bleibt reine Inszenierung, wie im Design-Spec des
  Gesamtprojekts bereits festgehalten).
- Keine Wiederholung der Reveal-Animation bei späterem Fokussieren/Zoomen
  — sie läuft genau einmal pro Seitenaufruf, unmittelbar nach Boot.
- Keine Anpassung der Boot-Zeilen-Liste bei Änderungen an `data/projects.js`
  zur Laufzeit (die Liste wird einmal beim Seitenaufruf gelesen, wie der
  Rest der App auch).
