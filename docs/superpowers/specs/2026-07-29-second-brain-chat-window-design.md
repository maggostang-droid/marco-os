# Second-Brain-Chat-Fenster — Design-Spec

Erstellt: 2026-07-29

## Was das hier ist

Bindet den second-brain-Chat (separates Repo, jetzt live unter
https://second-brain-projects.streamlit.app/) als eigenes Fenster in
marco-os ein — angekündigt im Abschnitt "Zukünftig geplant" der
Haupt-Spec (`2026-07-28-marco-os-design.md`). marco-os bleibt dabei
backend-frei: der Chat läuft komplett in second-brains eigenem Hosting,
marco-os bettet nur per `<iframe>` ein.

## Trigger

Der bisher rein dekorative, nicht fokussierbare "Marco Stang"-Zentrum-
Knoten wird ein echter `<button>` (analog zu Projekt-Knoten in
`scene.js`). Klick/Tap/Enter öffnet das Chat-Fenster über denselben
`state.activeProjectId`-Mechanismus, den auch Projekt-Fenster nutzen —
mit der synthetischen ID `"second-brain"`, die nicht in
`data/projects.js` steht.

Das ersetzt die bisherige Spec-Regel (Haupt-Spec, Abschnitt "Interaktion &
Navigation"): "Der Zentrum-Knoten ist rein dekorativ und bewusst nicht
fokussierbar" — diese Regel gilt ab jetzt nicht mehr.

## Fenster-Inhalt

`window-manager.js` bekommt einen Sonderfall für
`activeProjectId === "second-brain"`:

- Gleiche Fenster-Chrome wie Projekt-Fenster (Titelleiste mit 3 Dots,
  Close-Button), Titel `app://second-brain — Terminal`.
- Im `.win-body` statt Terminal-Prompt/Beschreibung/Tags ein
  `<iframe src="https://second-brain-projects.streamlit.app/?embed=true">`
  (der `?embed=true`-Parameter blendet Streamlits eigene Sidebar/Menü/
  Footer aus).
- Neue CSS-Modifier-Klasse `.window--chat`: Fenster wird breiter (~520px
  statt 380px), `.win-body` verliert für diesen Fall sein Padding, damit
  der iframe randlos sitzt.

## Tastatur/Fokus

Der Marco-Knoten wird als erster Stopp der Tab-Reihenfolge fokussierbar
(vor den Projekt-Knoten im Uhrzeigersinn), mit demselben sichtbaren
Fokus-Ring wie die anderen Knoten. `Escape` schließt das Chat-Fenster
genauso wie ein Projekt-Fenster — die bestehende Logik in
`window-manager.js` prüft nur `state.activeProjectId`, kein Sonderfall
nötig.

## Fehlerbehandlung

Kein spezielles Error-Handling — schlägt das iframe-Laden fehl oder
dauert der Streamlit-Cold-Start etwas, zeigt der Browser/das iframe
selbst seinen Ladezustand. Kein JS-seitiger Timeout/Fallback.

## Bewusst weggelassen

- Kein Resize/Drag des Fensters (marco-os hat generell keine
  Fenster-Verwaltung).
- Keine Anpassung der second-brain-App selbst (iframe-Tauglichkeit wurde
  bereits gegen die Live-URL verifiziert: kein `X-Frame-Options`-Header).
- Kein Ladeindikator/Spinner während des iframe-Ladens.

## Definition of Done

- Klick/Enter auf den Marco-Knoten öffnet das Chat-Fenster mit
  funktionierendem iframe.
- Marco-Knoten ist Tab-erreichbar, Fokus-Ring sichtbar, `Escape` schließt
  das Fenster.
- `node --check` für alle geänderten JS-Module.
- Manuelle Verifikation im Browser bei 375px und 1280px+ (bestehende
  Praxis).

## Addendum (2026-07-29)

Die Annahme oben im Abschnitt "Trigger" — die synthetische ID
`"second-brain"` stehe nicht in `data/projects.js` — war falsch. Es
existierte bereits ein echter `data/projects.js`-Eintrag mit `id:
"second-brain"` (eigener Planet, eigenes Fenster). Mit der ursprünglich
geplanten ID hätte das Öffnen des Chat-Fensters also den echten
`second-brain`-Projekt-Node "gekapert" (dessen Fokus-/Fenster-Zustand
überschrieben) statt ein eigenständiges Chat-Fenster zu öffnen — ein
echter Bug, der während der Implementierung gefunden und behoben wurde.

Fix: Die Sentinel-ID wurde auf `"__second-brain-chat__"`
(`SECOND_BRAIN_CHAT_ID` in `state.js`) geändert — bewusst kein gültiger
`data/projects.js`-Id-Formatstring, um jede künftige Kollision
auszuschließen. Alle Stellen, die oben noch `"second-brain"` als
Sentinel-Wert nennen (z. B. im Abschnitt "Fenster-Inhalt"), sind in
diesem Sinne zu lesen — der Code selbst ist die verbindliche Quelle.
