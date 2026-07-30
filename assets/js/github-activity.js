// Echte GitHub-Aktivität für Projekte mit repoUrl (siehe Spec
// 2026-07-30-wow-features-design.md): pro Repo ein unauthentifizierter
// Call auf api.github.com (Feld pushed_at). Rate-Limit-Schutz über einen
// sessionStorage-Cache (1 h TTL) — ein Fetch-Durchlauf pro Sitzung.
// Der Fehlerpfad ist konsequent still: ohne Daten erscheint schlicht
// keine Aktivitätszeile, nie ein Spinner oder Fehlertext.

const CACHE_KEY = "marco-os:gh-activity:v1";
const CACHE_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;

// project.id -> { pushedAt: ISO-String }
const activityByProject = new Map();
const listeners = new Set();

export function getGithubActivity(projectId) {
  return activityByProject.get(projectId) ?? null;
}

// Ein Listener pro Interessent (window-manager patcht damit ein bereits
// offenes Fenster nachträglich) — bewusst NICHT über state.js notify,
// damit eintreffende Netzwerkdaten keine Fenster-/Szene-Rebuilds anstoßen.
export function onGithubActivity(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function formatRelativeDe(isoDate, now = new Date()) {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return null;
  const days = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 45) return `vor ${days} Tagen`;
  const months = Math.round(days / 30);
  return `vor ${months} Monaten`;
}

function repoPathFromUrl(repoUrl) {
  const match = /github\.com\/([^/]+\/[^/]+?)(?:\.git|\/)?$/.exec(repoUrl ?? "");
  return match ? match[1] : null;
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data }));
  } catch {
    /* Cache ist nur Optimierung — Fehler (z.B. Storage voll/blockiert) egal. */
  }
}

function applyData(data) {
  for (const [projectId, entry] of Object.entries(data)) {
    if (entry?.pushedAt) activityByProject.set(projectId, entry);
  }
  for (const listener of listeners) listener();
}

async function fetchRepo(repoPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.pushed_at ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function initGithubActivity(projects) {
  const cached = readCache();
  if (cached) {
    applyData(cached);
    return;
  }

  const targets = projects
    .map((p) => ({ id: p.id, repoPath: repoPathFromUrl(p.repoUrl) }))
    .filter((t) => t.repoPath);

  Promise.all(
    targets.map(async ({ id, repoPath }) => {
      const pushedAt = await fetchRepo(repoPath);
      return pushedAt ? [id, { pushedAt }] : null;
    })
  ).then((entries) => {
    const data = Object.fromEntries(entries.filter(Boolean));
    if (Object.keys(data).length === 0) return; // still bleiben, nicht cachen
    writeCache(data);
    applyData(data);
  });
}
