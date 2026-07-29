# hr-interview-cockpit: sanitized portfolio version of a private HR interview tool

## Context

Marco built a private, single-file client-side tool ("Festo Hire Guide") while going
through an application/interview process with Festo — no employment relationship, purely
a personal project. It's a structured interview cockpit: job-ad/CV intake, a
question-pool import (xlsx), a scheduling calendar, a live interview cockpit with
timer/phase tracking and 4-point behavioral-anchor ratings, and a KPI/radar-chart
summary. Architecturally it's a strong portfolio fit for marco-os's "no build step"
philosophy.

The source folder (`02_Portfolio/Festo/`, outside this repo, never committed) also
contains material that must never reach a public repo:

- Real candidate interview transcripts with real names and ratings
  (`Interview_Kevin_Woelke_*.json`, `Interview_Mirco_Fröschle_*.json`,
  `Interview_Thorsten_*.json`, Marco's own practice runs).
- Real Festo job postings tied to live requisition IDs (`Stelle_*.json`).
- Festo's actual internal competency framework (Core/Leadership Competences, Future
  Skills, "Potentialindikatoren") reproduced in an info tab, plus a large real question
  bank (`Library of questions.xlsx`) and reference images.
- Festo's logo (linked live from festo.com) and brand color palette.
- Marco's CV PDF.

Inspection of `Festo_Hire_Guide.html` (2010 lines) found the actual interview-engine
question set already baked in as a fallback (`DEFAULT_POOL` / `ANKER_TPL`, ~lines
648-668: Führungsstärke, Kommunikationsfähigkeit, Problemlösungskompetenz,
Teamfähigkeit & Zusammenarbeit, Motivation & Veränderungsbereitschaft) — this is
Marco's own generic, synthetic authoring, unrelated to Festo's internal framework, and
is safe to keep. The Festo-specific material is narrower than the whole file:

- The "Kompetenzmodell" info tab (`view-concepts` section, `showConcepts()` button) —
  optional reference content, not required for the interview flow.
- Two `<img>` tags loading Festo's real logo from festo.com.
- An embedded real job posting (`EXAMPLE_AD` constant, sourced from jobs.festo.com with
  a real AdCode) plus its "Beispiel: echte Festo-Anzeige" button.
- App title "Festo Hire Guide", the phase label "Diagnostik & Festo-Kompetenzen", the
  `festo-api-key` localStorage key, and the Festo-blue (`#0091DC`) color palette.

## Goals

- Produce a sanitized, standalone version of the tool with zero real personal data,
  zero Festo-proprietary content, and no Festo branding, safe to publish in a public
  GitHub repo + GitHub Pages.
- Use only Marco's own synthetically-authored question content (the existing
  `DEFAULT_POOL`) — never adapt or reference Festo's real question library or
  competency framework, even loosely.
- Ship a working live demo: a visitor sees the interview cockpit and a filled-in
  summary/radar chart immediately, without needing to upload anything.
- Add a new project entry to marco-os's `data/projects.js` pointing at the new repo's
  demo and source.

## Non-goals

- Not touching, deleting, or reorganizing anything in the original
  `02_Portfolio/Festo/` folder — it stays exactly as-is, untouched, private.
- Not preserving the "Kompetenzmodell" info tab in any form (not even genericized) —
  it's optional and simplest to drop entirely.
- Not building a backend or persistence layer — stays fully client-side, matching the
  original.

## Design

### New repository: `hr-interview-cockpit`

A new standalone repo, sibling to Marco's other portfolio project repos, containing a
single self-contained `index.html` (mirroring the original's single-file, no-build-step
style) plus a short `README.md`. Hosted via GitHub Pages. Follows the same
demoUrl/repoUrl pattern already used by `ai-act-validation-toolkit` and
`cloud-native-pipeline`.

### Sanitization of the HTML

Starting from a copy of `Festo_Hire_Guide.html`, apply these changes:

1. **Delete** the "Kompetenzmodell" button (`showConcepts()`) and the entire
   `view-concepts` section (Festo's real Core/Leadership Competences, Future Skills,
   Potentialindikatoren).
2. **Remove** both `<img>` tags pointing at `festo.com` logo assets; replace with a
   plain text app name in the header/brand slot.
3. **Replace** `EXAMPLE_AD` (the real Festo job posting) with one fictional job posting
   authored from scratch (invented company, invented role), and rename its button/
   status text accordingly (no "echte Festo-Anzeige" wording).
4. **Rename** the app throughout: title → "HR Interview Cockpit", strip "Festo" from
   every UI string (e.g. phase label "Diagnostik & Festo-Kompetenzen" →
   "Diagnostik & Kernkompetenzen"), rename the `festo-api-key` localStorage key to
   something generic (e.g. `hr-cockpit-api-key`).
5. **Recolor**: replace the Festo-blue (`#0091DC` family) CSS custom properties with a
   neutral accent color; keep the existing multi-color `CLUSTER_COLORS` palette
   structure but swap the first (brand-derived) entry.
6. **Keep unchanged**: `DEFAULT_POOL`/`ANKER_TPL` (already generic/synthetic — this is
   the only question content the sanitized tool will ever use), the calendar, rating
   cockpit, timer/phase engine, summary/radar-chart view, xlsx/CV upload flow, and the
   "AI copilot" feature (bring-your-own Anthropic API key, direct browser →
   `api.anthropic.com` call — no secret is baked into the file, so this carries over
   safely).

### Demo data

Bake in one fully synthetic example candidate (invented name, e.g. "Alex Beispiel")
with a pre-filled interview session using only `DEFAULT_POOL` questions, so the summary
view (KPIs + radar chart) renders immediately on page load without requiring any
upload. No real names, no real ratings, no connection to any real person.

### marco-os integration

Add one entry to `data/projects.js`:

- `id: "hr-interview-cockpit"`, `title: "HR Interview Cockpit"`
- `summary`/`description` (German, matching the file's existing style): describes the
  tool and notes it was built during an application/interview process with Festo (no
  employment relationship), entirely as a private project.
- `tags`: something like `["JavaScript", "HTML/CSS", "Chart.js", "Claude API"]`
- `demoUrl`: the new repo's GitHub Pages URL
- `repoUrl`: the new repo's GitHub URL
- `status: "live"` once the repo is pushed and Pages is confirmed serving.

### Verification

- `node --check` (or manual open in browser) on the sanitized `index.html` before
  publishing.
- Manually exercise the full flow in a browser: load default question pool → build an
  interview guide → run through the synthetic example candidate → confirm summary/
  radar chart renders — with no network requests to festo.com and no Festo strings
  anywhere in view-source.
- `npm test` in marco-os after the `data/projects.js` change (existing test suite must
  still pass; no test currently covers project data, so this is a no-regression check).
- Manual visual check of the new project card/window in marco-os at 375px and
  1280px+, per existing project convention.

### Risks / open questions

- Creating a new public GitHub repo and enabling Pages are visible, hard-to-quietly-
  reverse actions — do this only with explicit confirmation at that step, not
  automatically as part of plan execution.
- Marco should give the sanitized `index.html` a final read-through himself before it's
  pushed publicly, since he has context (what "sounds like" Festo's real framework)
  that isn't fully visible from the file alone.
