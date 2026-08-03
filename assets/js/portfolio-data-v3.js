// Darstellung + Terminal-Parser für MARCO.OS v3.
//
// Inhalte kommen NICHT mehr aus diesem File, sondern aus data/ — den
// einzigen Quellen für v3 und index-legacy.html gemeinsam. Wer einen Text
// ändern will, ändert ihn dort, nicht hier. Was hier bleibt, ist rein
// v3-Spezifisches: Cluster-Farben, Planetenbilder, Farbgebung der
// Boot-Zeilen und der Terminal-Parser.
import { projects } from "../../data/projects.js";
import { resume } from "../../data/resume.js";
import { tourWithResumeId } from "../../data/tour.js";
import { bootLogo, bootInfoLines, bootStatusLines, bootPromptLine } from "../../data/boot.js";

export const CHAT_ID = "__chat__", RESUME_ID = "__resume__", TERM_ID = "__terminal__";

export const CLUSTERS = {
  "agentic-ai": { label: "Agentic AI", color: "#f2b45c" },
  cloud: { label: "Cloud & Infrastruktur", color: "#4fd6c4" },
  "full-stack": { label: "Full-Stack & ML-Engineering", color: "#b48cf5" }
};
export const ORDER = ["agentic-ai", "cloud", "full-stack"];
export const PLANET_IMG = {
  "agentic-ai": "assets/img/planets/planet-amber.png",
  cloud: "assets/img/planets/planet-teal.png",
  "full-stack": "assets/img/planets/planet-violet.png"
};

// v3 nennt den Mond-Knoten `moon`, die Datenquelle `orbitsCenter` — gleiche
// Sache, nur anderer Name. Reihenfolge und Texte kommen unveraendert aus
// data/projects.js; hier wird nichts mehr dupliziert.
export const PROJECTS = projects.map((p) => ({ ...p, moon: Boolean(p.orbitsCenter) }));

// data/resume.js fuehrt die Stationen als Stichpunktliste (so rendert sie das
// Legacy-Fenster), v3 zeigt pro Station einen Fliesstext. Deshalb hier
// zusammengezogen statt doppelt gepflegt.
export const RESUME = {
  name: resume.name,
  headline: resume.headline,
  intro: resume.intro,
  email: resume.email,
  pdfUrl: resume.pdfUrl,
  linkedinUrl: resume.linkedinUrl,
  stations: resume.currentStations.map((s) => ({
    period: s.period,
    role: s.role,
    org: s.org,
    detail: s.bullets.join(". ") + "."
  })),
  extendedHistory: resume.extendedHistory,
  skills: resume.skills
};

export const TOUR = tourWithResumeId(RESUME_ID);

// Der Text kommt aus data/boot.js, die Farbgebung ist v3-eigen.
export const BOOT = [
  ...bootLogo.map((text) => ({ text, c: "#b48cf5" })),
  ...bootInfoLines(PROJECTS).map((text) => ({
    text,
    c: text === "marco@portfolio" ? "#e7e4f5" : text.startsWith("———") ? "#5e5a80" : "#8a86a8"
  })),
  ...bootStatusLines.map((text) => ({ text, c: "#4fd6c4" })),
  { text: bootPromptLine, c: "#f2b45c" }
];

export const COMMANDS = ["help", "ls", "open", "cat", "demo", "repo", "tour", "whoami", "clear", "exit"];
const HELP = [
  "Verfügbare Befehle:",
  "  help              diese Übersicht",
  "  ls                alle Projekte auflisten",
  "  open <id>         Projekt-Fenster öffnen",
  "  demo <id>         Live-Demo im neuen Tab starten",
  "  repo <id>         GitHub-Repo im neuen Tab öffnen",
  "  cat lebenslauf.txt  Kurzprofil anzeigen",
  "  tour              geführte Tour durch die Highlights",
  "  clear             Ausgabe leeren",
  "  exit              Terminal schließen",
  "Tab vervollständigt, Pfeil hoch und runter blättern durch die History."
];

const find = (id) => PROJECTS.find((p) => p.id === id) ?? null;
const unknown = (id) => [
  { text: `Projekt "${id}" nicht gefunden.`, kind: "error" },
  { text: "'ls' zeigt alle verfügbaren Projekt-IDs.", kind: "muted" }
];

// -> { lines: [{text, kind?}], action?: {type, id?, url?} }
export function executeCommand(rawInput) {
  const input = String(rawInput ?? "").trim();
  if (!input) return { lines: [] };
  const [cmdRaw, ...args] = input.split(/\s+/);
  const cmd = cmdRaw.toLowerCase(), arg = args[0] ?? null;

  switch (cmd) {
    case "help": return { lines: HELP.map((text) => ({ text })) };
    case "ls": {
      const rows = PROJECTS.map((p) => ({
        text: `  ${p.id.padEnd(26)} ${(p.status === "live" ? "● live" : "○ kein demo").padEnd(14)} ${p.cluster}`
      }));
      return { lines: [{ text: `${PROJECTS.length} Projekte:` }, ...rows, { text: "'open <id>' öffnet das Projekt-Fenster.", kind: "muted" }] };
    }
    case "open": {
      if (!arg) return { lines: [{ text: "Nutzung: open <id>, zum Beispiel open sql-agent", kind: "muted" }] };
      if (arg === "lebenslauf" || arg === "lebenslauf.txt")
        return { lines: [{ text: "Öffne Lebenslauf …", kind: "ok" }], action: { type: "open", id: RESUME_ID } };
      const p = find(arg);
      if (!p) return { lines: unknown(arg) };
      return { lines: [{ text: `Öffne ${p.title} …`, kind: "ok" }], action: { type: "open", id: p.moon ? CHAT_ID : p.id } };
    }
    case "cat": {
      if (arg === "lebenslauf.txt" || arg === "lebenslauf") return { lines: [
        { text: RESUME.name, kind: "ok" }, { text: RESUME.headline }, { text: "" }, { text: RESUME.intro },
        { text: `Aktuell: ${RESUME.stations[0].role} @ ${RESUME.stations[0].org} (${RESUME.stations[0].period})` }, { text: "" },
        { text: "'open lebenslauf' zeigt das vollständige Fenster mit PDF-Download.", kind: "muted" }
      ] };
      if (!arg) return { lines: [{ text: "Nutzung: cat lebenslauf.txt", kind: "muted" }] };
      return { lines: [{ text: `cat: ${arg}: Datei nicht gefunden`, kind: "error" }] };
    }
    case "demo": case "repo": {
      if (!arg) return { lines: [{ text: `Nutzung: ${cmd} <id>, zum Beispiel ${cmd} sql-agent`, kind: "muted" }] };
      const p = find(arg);
      if (!p) return { lines: unknown(arg) };
      if (cmd === "demo" && !p.demoUrl) return { lines: [{ text: `${p.title} hat noch keine Live-Demo. Status: ${p.status}.`, kind: "muted" }] };
      const url = cmd === "demo" ? p.demoUrl : p.repoUrl;
      // id/kind reisen mit, damit der Aufrufer einen Demo-Start als
      // GoatCounter-Event zaehlen kann (siehe trackDemo in index.html).
      return { lines: [{ text: `Öffne ${cmd === "demo" ? "Live-Demo" : "Repo"} von ${p.title} …`, kind: "ok" }], action: { type: "url", url, id: p.id, kind: cmd } };
    }
    case "tour": return { lines: [{ text: "Tour läuft. Lehn dich kurz zurück, ich zeige dir die Highlights.", kind: "ok" }], action: { type: "tour" } };
    case "whoami": return { lines: [{ text: "gast@marco-os" }, { text: "Berechtigungen: alle Live-Demos startbar, Lebenslauf lesbar. Viel Spaß.", kind: "muted" }] };
    case "sudo": return { lines: [{ text: "sudo: Zugriff verweigert. Root gehört Marco.", kind: "error" }] };
    case "clear": return { lines: [], action: { type: "clear" } };
    case "exit": return { lines: [{ text: "Bis gleich, schau dich gern weiter um.", kind: "muted" }], action: { type: "exit" } };
    default: return { lines: [
      { text: `marco-sh: ${cmd}: Befehl nicht gefunden`, kind: "error" },
      { text: "'help' zeigt alle Befehle.", kind: "muted" }
    ] };
  }
}

export function completeInput(rawInput) {
  const input = String(rawInput ?? "");
  const tokens = input.split(/\s+/);
  const endsWithSpace = /\s$/.test(input);
  if (tokens.length <= 1 && !endsWithSpace) {
    const prefix = (tokens[0] ?? "").toLowerCase();
    const matches = COMMANDS.filter((c) => c.startsWith(prefix));
    return { matches, replaceWith: matches.length === 1 ? `${matches[0]} ` : null };
  }
  const cmd = tokens[0].toLowerCase();
  if (!["open", "demo", "repo"].includes(cmd)) return { matches: [], replaceWith: null };
  const prefix = endsWithSpace ? "" : (tokens[tokens.length - 1] ?? "");
  const candidates = PROJECTS.map((p) => p.id).concat(cmd === "open" ? ["lebenslauf"] : []);
  const matches = candidates.filter((id) => id.startsWith(prefix));
  return { matches, replaceWith: matches.length === 1 ? `${cmd} ${matches[0]}` : null };
}
