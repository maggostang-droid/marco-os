# Graph-Zoom-Funktion — Design

**Status:** Approved
**Datum:** 2026-07-28

## Ziel

Bei mehr Projekten (oder einfach zur Exploration) soll man in die Graph-Szene
rein-/rauszoomen können — manuell per Mausrad und per Taskbar-Buttons, plus
ein automatischer, leichter Zoom-in-Effekt, sobald ein Projekt fokussiert ist.

## State (`assets/js/state.js`)

- Neues Feld `state.zoomLevel`, Startwert `1`.
- `zoomIn()` / `zoomOut()`: verändern `zoomLevel` in Schritten von `0.1`,
  geclampt auf `[MIN_ZOOM, MAX_ZOOM] = [0.6, 1.8]`. Rufen wie alle anderen
  State-Mutatoren `notify()` auf.
- `resetState()` setzt `zoomLevel` zurück auf `1`.

## Anwendung (`assets/js/scene.js`)

- Knoten- und Kanten-Layer werden in einen gemeinsamen Wrapper gestellt, der
  `transform: scale(effectiveZoom)` bekommt, `transform-origin: center`.
- `effectiveZoom = state.zoomLevel * (state.activeProjectId ? FOCUS_ZOOM_BONUS : 1)`
  mit `FOCUS_ZOOM_BONUS = 1.15` als Konstante in `scene.js`.
- Der Zoom ist eine rein visuelle Transform-Anwendung — `graph-layout.js`
  und die dort berechneten `x`/`y`-Koordinaten bleiben unverändert. Keine
  Pan-Logik: das Zentrum (Marco-Node, `(0,0)`) bleibt bei jedem Zoom-Level
  und in beiden Fällen (manuell wie Auto-Fokus) fix in der Mitte.

## Bedienung

- **Mausrad:** `wheel`-Listener auf `.desktop` (in `scene.js` oder einem neuen
  kleinen Teil von `main.js`), `event.preventDefault()`, Vorzeichen von
  `event.deltaY` bestimmt `zoomIn()` vs. `zoomOut()`.
- **Taskbar-Buttons:** zwei neue, fokussierbare `<button>`-Elemente
  ("−" / "+") in `assets/js/taskbar.js`, rufen dieselben `zoomIn()`/
  `zoomOut()`-Funktionen auf. Das macht Zoom auch per Tab/Enter erreichbar
  und funktioniert auf Touch-Geräten ohne Scrollrad.

## Testing

- `zoomIn()`/`zoomOut()`/Clamping-Verhalten: neue Tests in
  `tests/state.test.js` (TDD) — Schrittgröße, oberes/unteres Clamp-Limit,
  `resetState()`-Rücksetzung, Notify-Verhalten (analog zu den bestehenden
  State-Tests).
- Wheel-Listener, Taskbar-Buttons und die visuelle Transform-Anwendung sind
  DOM-seitig — manuell im Browser verifiziert: Scrollrad zoomt, Buttons sind
  per Tab erreichbar und lösen denselben Effekt aus, Fokus-Zoom beim
  Projekt-Öffnen ist sichtbar, 375px-Layout hat weiterhin kein horizontales
  Scrollen mit den zwei zusätzlichen Taskbar-Buttons.

## Out of Scope (YAGNI)

- Kein Pan/Drag (siehe Entscheidung oben — Zentrum bleibt immer fix).
- Kein Pinch-to-Zoom-Handling (Taskbar-Buttons decken Touch-Geräte ab).
- Keine Persistenz des Zoom-Levels über Reloads hinweg.
