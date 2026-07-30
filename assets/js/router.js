import { subscribe, state, focusProject, SECOND_BRAIN_CHAT_ID, RESUME_ID } from "./state.js";

// Deep-Links: URL-Hash <-> aktives Fenster (siehe Spec 2026-07-30-wow-
// features-design.md). Damit kann Marco in Bewerbungen/LinkedIn direkt auf
// ein Projekt verlinken (…/marco-os/#sql-agent) und der Recruiter landet
// nach dem Boot unmittelbar im richtigen Fenster.
//
// Sentinel-Fenster bekommen sprechende Hashes statt ihrer internen
// "__…__"-IDs. SPECIAL_HASHES ist die einzige Stelle dieser Zuordnung;
// Paket 1/2 (Terminal, Tour) erweitern sie hier.
const SPECIAL_HASHES = new Map([
  ["lebenslauf", RESUME_ID],
  ["ask-marco", SECOND_BRAIN_CHAT_ID]
]);

const idToHash = new Map([...SPECIAL_HASHES].map(([hash, id]) => [id, hash]));

export function registerSpecialHash(hash, id) {
  SPECIAL_HASHES.set(hash, id);
  idToHash.set(id, hash);
}

function resolveHash(rawHash, projectIds) {
  const hash = decodeURIComponent(rawHash.replace(/^#/, "")).trim();
  if (!hash) return null;
  if (SPECIAL_HASHES.has(hash)) return SPECIAL_HASHES.get(hash);
  return projectIds.has(hash) ? hash : null;
}

export function initRouter(projects, { onHashAction = null } = {}) {
  const projectIds = new Set(projects.map((p) => p.id));
  // Aktionen wie #tour öffnen kein Fenster, sondern starten etwas — der
  // Aufrufer (main.js) reicht dafür einen Handler durch.
  const pendingHash = window.location.hash;

  let applied = false;
  const applyInitialHash = () => {
    if (applied || !state.bootComplete) return;
    applied = true;
    if (onHashAction && onHashAction(pendingHash)) return;
    const targetId = resolveHash(pendingHash, projectIds);
    if (targetId) focusProject(targetId);
  };
  applyInitialHash();
  subscribe(applyInitialHash);

  // Fensterwechsel -> Hash. replaceState statt location.hash-Zuweisung:
  // keine History-Einträge pro Klick, kein Scroll-Sprung.
  let lastWritten = null;
  const writeHash = () => {
    if (!applied) return; // vor Boot-Ende nichts überschreiben
    const activeId = state.activeProjectId;
    const hash = activeId ? (idToHash.get(activeId) ?? (projectIds.has(activeId) ? activeId : null)) : null;
    const target = hash ? `#${hash}` : window.location.pathname + window.location.search;
    if (target === lastWritten) return;
    lastWritten = target;
    history.replaceState(null, "", target);
  };
  subscribe(writeHash);
}
