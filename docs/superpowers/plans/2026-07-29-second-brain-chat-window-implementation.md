# Second-Brain-Chat-Fenster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der zentrale "Marco Stang"-Knoten wird klickbar/fokussierbar und öffnet ein Fenster, das den live second-brain-Chat per `<iframe>` einbettet — über denselben Ein-Fenster-Mechanismus, den Projekt-Fenster bereits nutzen.

**Architektur:** `state.js` bekommt eine geteilte Sentinel-ID-Konstante. `scene.js`s `buildNodeLayer()` macht den Zentrum-Knoten zu einem echten `<button>` mit Klick-Handler. `window-manager.js`s `render()` unterscheidet zwischen "Projekt-Fenster" und "Chat-Fenster" anhand dieser Sentinel-ID. `style.css` bekommt eine `.window--chat`-Modifier-Klasse für die breitere, randlose Darstellung.

**Tech Stack:** Plain Vanilla-JS (ES-Module), kein Build-Tool, Node's eingebauter Test-Runner (`node --test`), CSS ohne Präprozessor.

## Global Constraints

- Kein Build-Tool, kein Bundler — reines HTML/CSS/Vanilla-JS wie im restlichen Repo.
- Code-Kommentare in JS-Dateien auf Englisch, exakt im Stil der bestehenden Dateien (z.B. `scene.js`) — nicht auf Deutsch, obwohl die Doku-Prosa (Specs/Pläne) auf Deutsch ist.
- `node --check <file>.js` für jede geänderte JS-Datei.
- `npm test` muss danach weiterhin komplett grün sein (32/32 vor diesem Plan).
- Ausnahmsweise auf einem eigenen Branch/Worktree (`feature/second-brain-chat-window`, von `master` abgezweigt) statt der sonst üblichen direkten Arbeit auf `master` — mit Marco abgestimmt, da der Haupt-Checkout gerade durch eine andere Session belegt ist.
- Live-Chat-URL: `https://second-brain-projects.streamlit.app/?embed=true` (verifiziert erreichbar, kein `X-Frame-Options`-Header).
- Sentinel-ID für den Chat: `"second-brain"` — kollidiert mit keiner echten `data/projects.js`-ID.

---

### Task 1: Klickbarer Zentrum-Knoten (`state.js`, `scene.js`)

**Files:**
- Modify: `assets/js/state.js`
- Modify: `assets/js/scene.js`
- Test: `tests/state.test.js`

**Interfaces:**
- Consumes: nichts Neues.
- Produces: `SECOND_BRAIN_CHAT_ID` (exportierte String-Konstante aus `state.js`) — genutzt von Task 2 (`window-manager.js`). Klick/Enter auf den Zentrum-Knoten ruft `focusProject(SECOND_BRAIN_CHAT_ID)`.

- [ ] **Step 1: `SECOND_BRAIN_CHAT_ID` in `state.js` exportieren**

In `assets/js/state.js`, direkt vor `export const state = {`, einfügen:

```js
// Sentinel activeProjectId for the second-brain chat window — distinct from
// any real data/projects.js id, so window-manager.js can special-case it.
export const SECOND_BRAIN_CHAT_ID = "second-brain";
```

- [ ] **Step 2: Test für die Konstante schreiben**

In `tests/state.test.js`, am Ende der Datei ergänzen (Import-Zeile oben entsprechend erweitern: `import { state, subscribe, completeBoot, focusProject, closeWindow, resetState, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID } from "../assets/js/state.js";`):

```js
test("SECOND_BRAIN_CHAT_ID is a stable, non-empty identifier", () => {
  assert.equal(SECOND_BRAIN_CHAT_ID, "second-brain");
});

test("focusProject accepts the second-brain sentinel id like any other id", () => {
  resetState();
  focusProject(SECOND_BRAIN_CHAT_ID);
  assert.equal(state.activeProjectId, SECOND_BRAIN_CHAT_ID);
});
```

- [ ] **Step 3: Tests laufen lassen**

Run: `npm test`
Erwartet: alle bisherigen Tests weiterhin grün, plus die 2 neuen.

- [ ] **Step 4: `scene.js` — Zentrum-Knoten zum `<button>` machen**

In `assets/js/scene.js`, den Import erweitern:

```js
import { subscribe, state, focusProject, closeWindow, zoomIn, zoomOut, SECOND_BRAIN_CHAT_ID } from "./state.js";
```

In `buildNodeLayer()`, die Zeile

```js
  nodes.forEach((node, nodeIndex) => {
    const isProject = node.type === "project";
    const el = document.createElement(isProject ? "button" : "div");
```

ersetzen durch:

```js
  nodes.forEach((node, nodeIndex) => {
    const isProject = node.type === "project";
    const isCenter = node.type === "center";
    const el = document.createElement(isProject || isCenter ? "button" : "div");
```

Den bestehenden Center-Zweig

```js
    if (node.type === "center") {
      el.classList.add(nextPlanetVariant());
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><h1 class="node-label" style="transition-delay: ${labelDelay}">Marco Stang</h1>`;
    } else {
```

ersetzen durch:

```js
    if (node.type === "center") {
      el.classList.add(nextPlanetVariant());
      el.type = "button";
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", String(state.activeProjectId === SECOND_BRAIN_CHAT_ID));
      el.setAttribute("aria-label", "Marco Stang — Chat mit second-brain öffnen");
      el.innerHTML = `<span class="node-dot" style="transition-delay: ${dotDelay}"></span><h1 class="node-label" style="transition-delay: ${labelDelay}">Marco Stang</h1>`;
      el.addEventListener("click", () => focusProject(SECOND_BRAIN_CHAT_ID));
    } else {
```

- [ ] **Step 5: Klick-außerhalb-schließt-Fenster-Handler erweitern**

Der Zentrum-Knoten trägt (unverändert) die Klasse `node--center`. Der bestehende dokumentweite Klick-Handler in `initScene()` schließt aktuell jedes offene Fenster, wenn außerhalb von `.node--project` geklickt wird — das würde das gerade geöffnete Chat-Fenster im selben Klick sofort wieder schließen (Klick auf den Zentrum-Knoten bubbelt zum `container`-Listener, der `.node--project` nicht matcht). Diese Zeile:

```js
  container.addEventListener("click", (event) => {
    if (state.activeProjectId && !event.target.closest(".node--project")) {
      closeWindow();
    }
  });
```

ersetzen durch:

```js
  container.addEventListener("click", (event) => {
    if (state.activeProjectId && !event.target.closest(".node--project, .node--center")) {
      closeWindow();
    }
  });
```

- [ ] **Step 6: Syntax-Check**

Run: `node --check assets/js/state.js && node --check assets/js/scene.js`
Erwartet: keine Ausgabe (Exit-Code 0).

- [ ] **Step 7: Commit**

```bash
git add assets/js/state.js assets/js/scene.js tests/state.test.js
git commit -m "feat: make center node clickable, open second-brain chat"
```

---

### Task 2: Chat-Fenster im `window-manager.js`

**Files:**
- Modify: `assets/js/window-manager.js`

**Interfaces:**
- Consumes: `SECOND_BRAIN_CHAT_ID` aus Task 1 (`state.js`).
- Produces: nichts Neues für andere Tasks — `window-manager.js` bleibt der einzige Konsument dieser Fenster-Bau-Logik.

Der bisherige `render()` geht davon aus, dass `state.activeProjectId` entweder `null` oder eine echte `data/projects.js`-ID ist (`projectById[state.activeProjectId]`). Mit der Sentinel-ID `"second-brain"` liefert `projectById[...]` `undefined` — `render()` muss diesen Fall vor dem Projekt-Lookup abfangen.

- [ ] **Step 1: `window-manager.js` komplett ersetzen**

Kompletten Inhalt von `assets/js/window-manager.js` durch folgenden ersetzen:

```js
import { subscribe, state, closeWindow, SECOND_BRAIN_CHAT_ID } from "./state.js";
import { escapeHtml } from "./html-utils.js";
import { nextFocusTarget } from "./focus-target.js";

const SECOND_BRAIN_CHAT_URL = "https://second-brain-projects.streamlit.app/?embed=true";

export function initWindowManager(container, projects) {
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  let lastRenderedId = null;

  render();
  subscribe(render);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeProjectId) {
      closeWindow();
    }
  });

  function render() {
    const activeId = state.activeProjectId;
    const prevRenderedId = lastRenderedId;

    if (activeId && activeId === prevRenderedId) {
      // Window content depends only on which window is active, not on
      // other state fields (e.g. zoomLevel) — skip the rebuild so
      // unrelated notifies (zoom ticks) don't steal focus back to the
      // close button or reset .win-body's scroll position.
      return;
    }

    const hadFocusInWindow = container.contains(document.activeElement);
    const focusTarget = nextFocusTarget(prevRenderedId, activeId, hadFocusInWindow);

    container.innerHTML = "";
    lastRenderedId = activeId;

    if (!activeId) {
      if (focusTarget.startsWith("graph-node:")) {
        const graphNodeId = focusTarget.slice("graph-node:".length);
        document.querySelector(`[data-node-id="${CSS.escape(graphNodeId)}"]`)?.focus({ preventScroll: true });
      }
      return;
    }

    const isChat = activeId === SECOND_BRAIN_CHAT_ID;
    const { win, closeBtn } = isChat ? buildChatWindow() : buildProjectWindow(projectById[activeId]);

    closeBtn.addEventListener("click", closeWindow);
    if (!isChat) wireProjectWindowInteractions(win);

    container.appendChild(win);

    if (focusTarget === "open-window") {
      closeBtn.focus({ preventScroll: true });
    }
  }
}

function buildProjectWindow(project) {
  const isLive = Boolean(project.demoUrl);
  const statusLabel = isLive ? "● LIVE" : "● DEMO FOLGT";
  const actionHtml = isLive
    ? `<a class="btn primary" href="${project.demoUrl}" target="_blank" rel="noopener">Demo starten</a>`
    : `<button type="button" class="btn primary" disabled>Demo folgt</button>`;
  const repoHtml = project.repoUrl
    ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noopener">Repo öffnen</a>`
    : "";

  const win = document.createElement("div");
  win.className = "window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", project.title);
  win.innerHTML = `
    <div class="win-title">
      <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
      <span class="win-name">app://${escapeHtml(project.id)} — Terminal</span>
      <button type="button" class="win-close" aria-label="Fenster schließen">×</button>
    </div>
    <div class="win-body">
      <p class="prompt">marco@portfolio:~$ open ${escapeHtml(project.id)} --info</p>
      <p class="status-badge">${statusLabel}</p>
      <h3>${escapeHtml(project.title)}</h3>
      <p class="description">${escapeHtml(project.description)}</p>
      <button type="button" class="tech-toggle" aria-expanded="false">▸ Tech-Stack anzeigen</button>
      <div class="tags" hidden>${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="btn-row">${actionHtml}${repoHtml}</div>
    </div>
  `;

  return { win, closeBtn: win.querySelector(".win-close") };
}

function wireProjectWindowInteractions(win) {
  const techToggle = win.querySelector(".tech-toggle");
  const tagsEl = win.querySelector(".tags");
  techToggle.addEventListener("click", () => {
    const expanding = tagsEl.hidden;
    tagsEl.hidden = !expanding;
    techToggle.setAttribute("aria-expanded", String(expanding));
    techToggle.textContent = expanding ? "▾ Tech-Stack verbergen" : "▸ Tech-Stack anzeigen";
  });
}

function buildChatWindow() {
  const win = document.createElement("div");
  win.className = "window window--chat";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "second-brain Chat");
  win.innerHTML = `
    <div class="win-title">
      <span class="dot dot--1"></span><span class="dot dot--2"></span><span class="dot dot--3"></span>
      <span class="win-name">app://second-brain — Terminal</span>
      <button type="button" class="win-close" aria-label="Fenster schließen">×</button>
    </div>
    <div class="win-body">
      <iframe class="chat-frame" src="${SECOND_BRAIN_CHAT_URL}" title="second-brain Chat" loading="lazy"></iframe>
    </div>
  `;

  return { win, closeBtn: win.querySelector(".win-close") };
}
```

- [ ] **Step 2: Syntax-Check**

Run: `node --check assets/js/window-manager.js`
Erwartet: keine Ausgabe.

- [ ] **Step 3: `npm test` laufen lassen**

Run: `npm test`
Erwartet: weiterhin alle Tests grün (kein Test deckt `window-manager.js` direkt ab, aber `state.js`/`focus-target.js`-Tests dürfen nicht brechen).

- [ ] **Step 4: Commit**

```bash
git add assets/js/window-manager.js
git commit -m "feat: render second-brain chat iframe as its own window type"
```

---

### Task 3: Styling für das Chat-Fenster

**Files:**
- Modify: `assets/css/style.css`

**Interfaces:** keine — reines Styling für die in Task 2 erzeugten Klassen `.window--chat`/`.chat-frame`.

- [ ] **Step 1: `.window--chat`/`.chat-frame`-Regeln ergänzen**

Direkt nach der bestehenden `.window { ... }`-Regel (Selektor `.window`, gefolgt von `width: 380px; max-width: 100%; ...`) einfügen:

```css
.window--chat {
  width: 520px;
}
.window--chat .win-body {
  padding: 0;
}
.chat-frame {
  display: block;
  width: 100%;
  height: 480px;
  border: 0;
}
```

Die bestehende `@media (max-width: 720px) { .window { width: 100%; ... } }`-Regel greift automatisch auch für `.window--chat`-Elemente (beide Klassen sitzen auf demselben Element, die Media-Query-Regel kommt später im Stylesheet und gewinnt bei gleicher Spezifität) — keine zusätzliche mobile Anpassung nötig.

- [ ] **Step 2: Commit**

```bash
git add assets/css/style.css
git commit -m "style: add .window--chat modifier for the second-brain chat window"
```

---

### Task 4: Manuelle Verifikation

**Files:** keine — Browser-Verifikation.

**Interfaces:** keine.

- [ ] **Step 1: Lokalen Server starten**

```bash
python -m http.server 8000
```

Im Browser `http://localhost:8000/` öffnen (nicht `file://`, siehe Haupt-Spec). Hard-Refresh (Ctrl+Shift+R) wegen fehlender Cache-Busting-Header.

- [ ] **Step 2: Klick-Interaktion prüfen (1280px+)**

- Klick auf den "Marco Stang"-Zentrum-Knoten → Chat-Fenster öffnet sich, iframe lädt den second-brain-Chat sichtbar.
- Im Chat-Fenster eine Testfrage stellen (z.B. "was macht sql-agent?") → Antwort erscheint im eingebetteten Chat.
- Klick auf `×` schließt das Fenster.
- Danach einen Projekt-Knoten anklicken → normales Projekt-Fenster öffnet sich wie bisher (keine Regression).
- Bei offenem Chat-Fenster auf den Hintergrund (nicht auf einen Knoten) klicken → Fenster schließt sich (bestehendes Verhalten, jetzt auch für den Chat).

- [ ] **Step 3: Tastatur-Navigation prüfen**

- Tab drücken, bis der Marco-Knoten fokussiert ist (sollte der allererste Tab-Stopp sein) → sichtbarer Fokus-Ring.
- Enter/Space → Chat-Fenster öffnet sich, Fokus springt auf den Close-Button.
- `Escape` → Fenster schließt sich, Fokus kehrt zum Marco-Knoten zurück.
- Weiter tabben → Projekt-Knoten sind wie bisher erreichbar.

- [ ] **Step 4: Responsive-Check (375px)**

Browser-DevTools auf 375px Breite stellen, Schritte 2-3 wiederholen. Chat-Fenster soll wie Projekt-Fenster volle Breite einnehmen (untere Bildschirmkante).

- [ ] **Step 5: `npm test` final**

Run: `npm test`
Erwartet: alle Tests grün.
