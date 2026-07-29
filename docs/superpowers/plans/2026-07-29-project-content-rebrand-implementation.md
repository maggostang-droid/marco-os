# Project Content Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 8 marco-os projects marketing-friendly names and a two-tier
description (always-visible high-level summary + collapsible technical
deep-dive), with the tech-stack tags always expanded.

**Architecture:** Reuse existing `data/projects.js` fields — `title` becomes
the marketing name, the currently-dead `summary` field becomes the
always-visible recruiter-facing line, `description` (currently the only text
shown) moves behind the existing toggle mechanism in `window-manager.js`
(retargeted from gating `.tags` to gating `.description`). No new data
fields, no schema changes.

**Tech Stack:** Vanilla JS (ES modules), plain CSS, `node --test` for the
existing unit-test suite. No build step.

## Global Constraints

- No new fields on project objects — only `title`, `summary`, `repoUrl`,
  and (for `second-brain` only) `status`/`demoUrl`/`description` change.
- The `id` field of every project is unchanged (spec:
  `docs/superpowers/specs/2026-07-29-project-content-rebrand-design.md`,
  section "Content: Description").
- `description` text is preserved verbatim for 7 of 8 projects — only
  `second-brain`'s description content changes.
- Toggle button label: `"▸ Technische Details anzeigen"` /
  `"▾ Technische Details verbergen"` (replaces the old
  `"Tech-Stack anzeigen/verbergen"` strings).
- `npm test` must stay green throughout (existing suite in `tests/*.test.js`
  already asserts every project has `title`/`summary`/`description`/`tags`/
  `demoUrl`/`repoUrl`/`status`/`cluster` — schema is unchanged so these must
  keep passing without modification).
- `node --check <file>.js` must pass for every JS file touched.
- Verify manually in a browser at 375px and 1280px+ widths (project
  convention, see `CLAUDE.md`).

---

### Task 1: Update project content in `data/projects.js`

**Files:**
- Modify: `data/projects.js` (entire file — replacing all 8 project objects)

**Interfaces:**
- Consumes: nothing (this task only changes data, no code).
- Produces: `projects` array where every object has an updated `title`
  (marketing name), a real `summary` (previously dead data, now consumed by
  Task 2's rendering change), and updated `repoUrl` values pointing at the
  renamed GitHub repos. `second-brain`'s `status`, `demoUrl`, and
  `description` also change. Every other field (`id`, `tags`, `cluster`,
  `status`, `demoUrl`, `repoUrl` for `ai-analytics-portal`) stays exactly as
  today.

- [ ] **Step 1: Replace the full contents of `data/projects.js`**

Write this exact content to `data/projects.js`:

```js
export const projects = [
  {
    id: "sql-agent",
    title: "SQL Copilot",
    summary:
      "Beantwortet Fragen zu Firmendaten in normaler Sprache, ganz ohne " +
      "SQL-Kenntnisse — und kann Daten nur lesen, nie verändern.",
    description:
      "Fachabteilungen brauchen schnelle Antworten aus Firmendaten, aber die wenigsten " +
      "können SQL schreiben. sql-agent ist ein LangGraph-basierter Text-to-SQL-Agent, der " +
      "natürlichsprachige Fragen gegen eine echte PostgreSQL-Datenbank (Olist E-Commerce, " +
      "~100.000 Bestellungen) beantwortet — inklusive Schema-Exploration, SQL-Guardrails " +
      "(Whitelist statt Blacklist, nur lesende SELECT-Queries, read-only DB-User) und einem " +
      "Selbstkorrektur-Loop bei fehlerhaften Queries. Die Streamlit-Oberfläche macht " +
      "Guardrails und Selbstkorrektur sichtbar statt sie nur im Code zu verstecken, " +
      "inklusive Live-Button, der den Korrektur-Loop provoziert. Eval-Ergebnis: 8/15 " +
      "Referenzfragen korrekt beantwortet, mit klarem Muster nach Schwierigkeit " +
      "(Grundlagen 5/5, Joins 3/4, Window Functions 0/6).",
    tags: ["LangGraph", "LangChain", "Python", "PostgreSQL", "Streamlit"],
    demoUrl: null,
    repoUrl: "https://github.com/maggostang-droid/sql-copilot",
    status: "coming-soon",
    cluster: "agentic-ai"
  },
  {
    id: "ai-act-validation-toolkit",
    title: "AI Risk Classifier",
    summary:
      "Ordnet eine beschriebene KI-Anwendung automatisch einer EU-AI-Act-Risikoklasse zu " +
      "und erklärt die Einstufung in normaler Sprache — inklusive fertiger " +
      "Compliance-Checkliste für Hochrisiko-Fälle.",
    description:
      "Ordnet einen beschriebenen KI-Use-Case per deterministischem Regelbaum einer " +
      "EU-AI-Act-Risikoklasse (Annex III) zu — ein LLM formuliert nur die Begründung in " +
      "Klartext, beeinflusst die Klassifizierung selbst aber nicht. Für den Automotive-" +
      "Use-Case führt das Tool einen echten metamorphen Test (Temperatur-Monotonie-" +
      "Relation) gegen ein simuliertes Komfortsystem aus, statt eine Testmethodik nur zu " +
      "behaupten — eine anwendbare Miniatur-Version von Marcos Promotionsthema (Dr.-Ing., " +
      "KIT/ITIV: Validierung von KI-Systemen durch Verknüpfung von Szenarien und " +
      "metamorphes Testen). Für Hochrisiko-Fälle generiert es zusätzlich ein Governance-" +
      "Artefakt (Risk Assessment + Konformitätscheckliste nach Art. 9–15) als Markdown-" +
      "Download.",
    tags: ["Python", "LangChain", "Streamlit", "pytest"],
    demoUrl: "https://ai-act-validation-toolkit.streamlit.app/",
    repoUrl: "https://github.com/maggostang-droid/ai-risk-classifier",
    status: "live",
    cluster: "agentic-ai"
  },
  {
    id: "ai-analytics-portal",
    title: "Review Risk Predictor",
    summary:
      "Schätzt für jede Bestellung das Risiko einer schlechten Kundenbewertung — und " +
      "erklärt in einem Satz warum, statt nur eine Zahl zu zeigen.",
    description:
      "Für jede Bestellung im Olist-Marktplatz schätzt ein erklärbarer " +
      "GradientBoostingClassifier (scikit-learn) das Risiko einer schlechten Bewertung; " +
      "SHAP bestimmt die wichtigsten Treiber, ein LLM übersetzt sie anschließend in " +
      "verständlichen Klartext statt nur eine Zahl auszugeben. Full-Stack-Umsetzung mit " +
      "React/TypeScript-Frontend und FastAPI-Backend — schließt bewusst die React/FastAPI-" +
      "Full-Stack-Lücke neben sql-agent (Agentic AI) und goz-finetune-vs-rag (LLM-" +
      "Finetuning). Modell-Metriken (zeitlicher Train/Test-Split): ROC-AUC 0,706, " +
      "konservativ kalibriert (hohe Precision, niedrigerer Recall).",
    tags: ["React", "TypeScript", "FastAPI", "scikit-learn", "SHAP"],
    demoUrl: null,
    repoUrl: null,
    status: "coming-soon",
    cluster: "full-stack"
  },
  {
    id: "amalea",
    title: "Applied ML Course (KIT)",
    summary:
      "Sechs Kurswochen praktisches Machine Learning für den KI-Campus — Marco hat die " +
      "Inhalte am KIT mitentwickelt und den Kurs als Co-Dozent begleitet.",
    description:
      "Praktische Jupyter-Notebook-Übungen für den KI-Campus-Kurs AMALEA (Angewandte " +
      "Machine Learning Algorithmen), von Pandas-Grundlagen über Klassifikation, " +
      "Clustering und Regression bis zu CNNs und generativen Modellen. Marco hat die " +
      "Kursinhalte als Mitarbeiter des ITIV am KIT mitgeschrieben und den Kurs als Co-" +
      "Dozent begleitet — dieser Fork ist die persönliche Kopie zu Portfolio-Zwecken, das " +
      "Original wird vom KI-Campus gehostet und versioniert.",
    tags: ["Python", "Jupyter", "Machine Learning", "Deep Learning"],
    demoUrl: null,
    repoUrl: "https://github.com/maggostang-droid/applied-ml-course",
    status: "coming-soon",
    cluster: "full-stack"
  },
  {
    id: "cloud-native-pipeline",
    title: "Document Auto-Classifier",
    summary:
      "Dokument hochladen — Typ und relevante Felder werden automatisch erkannt, " +
      "komplett serverlos auf AWS, ohne selbst betriebenen Server.",
    description:
      "Ein Dokument-Upload (Rechnung, Visitenkarte, Vertragsschnipsel) landet in S3 und " +
      "triggert automatisch eine Lambda, die den Dokumenttyp erkennt und die relevanten " +
      "Felder extrahiert — komplett serverlos und event-getrieben (S3 → Lambda → Claude → " +
      "DynamoDB → API Gateway), kein selbst betriebener Server. Ein einziger Claude-API-" +
      "Call klassifiziert und extrahiert gleichzeitig, die Antwort wird gegen typ-" +
      "spezifische Pydantic-Schemas validiert; Fehlerfälle werden sichtbar statt " +
      "verschluckt. Komplett per Terraform als Infrastructure-as-Code deployed und gegen " +
      "ein echtes AWS-Konto verifiziert.",
    tags: ["AWS Lambda", "Terraform", "DynamoDB", "Streamlit", "Claude API"],
    demoUrl: "https://cloud-native-pipeline.streamlit.app/",
    repoUrl: "https://github.com/maggostang-droid/document-auto-classifier",
    status: "live",
    cluster: "cloud"
  },
  {
    id: "goz-finetune-vs-rag",
    title: "Medical Coding Extractor",
    summary:
      "Extrahiert automatisch Abrechnungsziffern aus zahnärztlichen Behandlungsnotizen — " +
      "und beantwortet nebenbei, ob Finetuning oder RAG hier besser funktioniert.",
    description:
      "Ein LoRA-feingetuntes Llama-3.2-3B-Instruct extrahiert GOZ-Abrechnungsziffern aus " +
      "zahnärztlichen Behandlungsnotizen (Multi-Label, 10 Kern-Codes) und tritt gegen eine " +
      "RAG-Baseline (BM25 + Embeddings) auf demselben, unveränderten Basismodell an — eine " +
      "konkrete, messbare Antwort auf 'schlägt Finetuning RAG?' statt nur eine Behauptung. " +
      "Systematisches Debugging deckte bei schwachen Finetune-Ergebnissen klassisches " +
      "Exposure Bias auf (gesunde Trainings-Loss-Kurve, aber kollabierende freie " +
      "Generierung) statt eines Daten- oder Trainingsbugs — ein ehrliches, dokumentiertes " +
      "Negativergebnis statt geschönter Zahlen. Trainingsdaten sind komplett synthetisch " +
      "generiert, kein Abgleich mit realen Praxisfällen im großen Stil.",
    tags: ["PyTorch", "LoRA", "RAG", "Llama 3.2", "Python"],
    demoUrl: null,
    repoUrl: "https://github.com/maggostang-droid/medical-coding-extractor",
    status: "coming-soon",
    cluster: "agentic-ai"
  },
  {
    id: "second-brain",
    title: "Ask-Marco Assistant",
    summary:
      "Ein Chat, der alle Projekte in diesem Portfolio kennt und Fragen direkt " +
      "beantwortet — z. B. 'welche Projekte zeigen Cloud-Erfahrung?'",
    description:
      "Ein 'second brain', das README/CLAUDE.md/HANDOVER aller anderen Portfolio-Repos zu " +
      "einem Snapshot verarbeitet und Fragen dazu direkt im Chat beantwortet (Context-" +
      "Stuffing statt Vektor-RAG, reicht bei der aktuellen Projektzahl locker ins Prompt) " +
      "— z.B. 'welche Projekte zeigen Cloud-Erfahrung?'. Dasselbe Wissen wird zusätzlich " +
      "über einen MCP-Server exponiert, sodass Claude Code/Desktop direkt danach fragen " +
      "kann. Live und erreichbar über den Marco-Zentrum-Knoten in der Graph-Ansicht.",
    tags: ["Python", "LangChain", "MCP", "Streamlit"],
    demoUrl: "https://second-brain-projects.streamlit.app/",
    repoUrl: "https://github.com/maggostang-droid/ask-marco-assistant",
    status: "live",
    cluster: "agentic-ai"
  },
  {
    id: "hr-interview-cockpit",
    title: "Interview Cockpit",
    summary:
      "Ein strukturiertes Werkzeug für Bewerbungsgespräche — Fragenpool, Live-Bewertung " +
      "während des Interviews, automatische Zusammenfassung als Radar-Chart.",
    description:
      "Ein Single-File-Tool für strukturierte Bewerbungsgespräche: Stellenanzeige/CV-Intake, " +
      "ein importierbarer Fragenpool (xlsx) mit Cluster- und Verhaltensanker-Bewertung, " +
      "Terminplanung per Kalender, ein Live-Interview-Cockpit mit Timer/Phasen-Tracking und " +
      "4-stufiger Bewertungsskala, sowie eine KPI/Radar-Chart-Zusammenfassung je Kandidat:in. " +
      "Kein Backend, kein Build-Schritt — auch der optionale KI-Copilot ruft " +
      "api.anthropic.com direkt aus dem Browser mit einem selbst eingegebenen Key auf. " +
      "Entstanden als privates Projekt während eines Bewerbungsprozesses bei Festo (kein " +
      "Anstellungsverhältnis); diese Version ist bereinigt und umbenannt, nur mit " +
      "synthetischen Beispieldaten (fiktive Stellenanzeige, fiktiver Beispiel-Kandidat, " +
      "selbst verfasster generischer Fragenpool) — keine echten Kandidatendaten, " +
      "Stellenausschreibungen oder Drittanbieter-Kompetenzmodelle.",
    tags: ["JavaScript", "HTML/CSS", "Chart.js", "Claude API"],
    demoUrl: "https://maggostang-droid.github.io/interview-cockpit/",
    repoUrl: "https://github.com/maggostang-droid/interview-cockpit",
    status: "live",
    cluster: "full-stack"
  }
];
```

- [ ] **Step 2: Run the existing test suite to confirm nothing broke**

Run: `npm test`
Expected: all existing suites pass, including `tests/projects.test.js`'s
"every project has the required fields" and "every project has a valid
cluster" tests — the schema didn't change, only content, so no test edits
are needed here.

- [ ] **Step 3: Syntax-check the file**

Run: `node --check data/projects.js`
Expected: no output (success).

- [ ] **Step 4: Commit**

```bash
git add data/projects.js
git commit -m "content: rebrand all 8 projects with marketing names and recruiter-facing summaries

Updates title/summary/repoUrl per docs/superpowers/specs/2026-07-29-project-content-rebrand-design.md.
second-brain also flips from planned to live (chat is now reachable via the
center node) with a corrected description and demoUrl/repoUrl set."
```

---

### Task 2: Render the summary always-visible, tags always-expanded, description behind the toggle

**Files:**
- Modify: `assets/js/window-manager.js:65-108` (the `buildProjectWindow` and
  `wireProjectWindowInteractions` functions)
- Modify: `assets/css/style.css` (add `.summary` rule, remove the now-dead
  `.tags[hidden]` rule)

**Interfaces:**
- Consumes: `project.summary` (now populated by Task 1), `project.description`,
  `project.tags` — same project object shape as before, no new fields.
- Produces: no new exports; `buildProjectWindow`'s returned `win` DOM
  structure changes (new `.summary` element, `.tags` no longer starts
  `hidden`, `.description` now starts `hidden`). `wireProjectWindowInteractions`
  now toggles `.description` instead of `.tags`.

- [ ] **Step 1: Update `buildProjectWindow`'s markup**

In `assets/js/window-manager.js`, replace this block (currently lines 79-94):

```js
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
```

with:

```js
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
      <p class="summary">${escapeHtml(project.summary)}</p>
      <div class="tags">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      <button type="button" class="tech-toggle" aria-expanded="false">▸ Technische Details anzeigen</button>
      <p class="description" hidden>${escapeHtml(project.description)}</p>
      <div class="btn-row">${actionHtml}${repoHtml}</div>
    </div>
  `;
```

- [ ] **Step 2: Retarget the toggle wiring from `.tags` to `.description`**

In `assets/js/window-manager.js`, replace `wireProjectWindowInteractions`
(currently lines 99-108):

```js
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
```

with:

```js
function wireProjectWindowInteractions(win) {
  const techToggle = win.querySelector(".tech-toggle");
  const descriptionEl = win.querySelector(".description");
  techToggle.addEventListener("click", () => {
    const expanding = descriptionEl.hidden;
    descriptionEl.hidden = !expanding;
    techToggle.setAttribute("aria-expanded", String(expanding));
    techToggle.textContent = expanding ? "▾ Technische Details verbergen" : "▸ Technische Details anzeigen";
  });
}
```

- [ ] **Step 3: Add the `.summary` CSS rule and remove the dead `.tags[hidden]` rule**

In `assets/css/style.css`, find this block:

```css
.description {
  font-size: 12px;
  line-height: 1.6;
  color: #c9c5e8;
  margin: 6px 0 12px;
}
```

Insert immediately before it:

```css
.summary {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
  color: #eae7fb;
  margin: 8px 0 10px;
}
```

Then find and delete this now-unreachable rule (tags are never given the
`hidden` attribute anymore):

```css
.tags[hidden] {
  display: none;
}
```

- [ ] **Step 4: Syntax-check the modified JS file**

Run: `node --check assets/js/window-manager.js`
Expected: no output (success).

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all tests still pass (no test in `tests/*.test.js` touches
`window-manager.js` or `style.css` — this is a DOM-rendering change verified
manually per project convention, not by the unit-test suite).

- [ ] **Step 6: Manual browser verification**

Run: `python -m http.server 8000` in the repo root, then open
`http://localhost:8000/` (hard refresh with Ctrl+Shift+R to bypass the
no-cache-headers trap documented in `CLAUDE.md`).

Check, for at least one project per cluster (e.g. SQL Copilot,
Document Auto-Classifier, Interview Cockpit):
- The window title (`h3`) shows the new marketing name.
- A short summary sentence is visible immediately below the title, with no
  click needed.
- The tech-stack tags are visible immediately below the summary, with no
  click needed.
- The toggle button reads "▸ Technische Details anzeigen" and, before
  clicking, the old dense technical paragraph is not visible.
- Clicking the toggle reveals the technical paragraph and flips the label to
  "▾ Technische Details verbergen"; clicking again hides it.

Repeat this check at both 375px and 1280px+ viewport widths.

- [ ] **Step 7: Commit**

```bash
git add assets/js/window-manager.js assets/css/style.css
git commit -m "feat: always show summary and tech stack, move deep-dive text behind toggle

Reworks the project window so a short, plain-language summary and the tech
stack are always visible, while the existing dense technical description
moves behind the (renamed) toggle instead of the tags."
```

---

## Self-Review Notes

- **Spec coverage:** Marketing names (Task 1), two-tier summary/description
  split with always-open tech stack (Task 1 content + Task 2 rendering),
  `second-brain` status/demoUrl/description correction (Task 1), `repoUrl`
  updates to the already-renamed GitHub repos (Task 1) — all covered. The
  GitHub repo renames themselves are already done (see spec) and are not a
  task here since there's no repo-side code in this project to change.
- **Placeholder scan:** No TBD/TODO; every step has literal file content or
  exact before/after code blocks.
- **Type/name consistency:** `.summary`/`.description`/`.tags`/`.tech-toggle`
  class names and the `descriptionEl`/`techToggle` variable names are used
  consistently between Step 1 and Step 2 of Task 2.
