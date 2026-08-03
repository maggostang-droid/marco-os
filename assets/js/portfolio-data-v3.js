// Darstellung + Terminal-Parser für MARCO.OS v3.
//
// Die Projektdaten kommen NICHT mehr aus diesem File, sondern aus
// data/projects.js — der einzigen Quelle für v3 und index-legacy.html.
// Wer einen Projekttext ändern will, ändert ihn dort, nicht hier.
// Was hier bleibt, ist rein v3-Spezifisches: Cluster-Farben, Planetenbilder,
// Boot-Zeilen, Tour und der Terminal-Parser.
import { projects } from "../../data/projects.js";

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

export const RESUME = {
  name: "Dr.-Ing. Marco Stang",
  headline: "KI-Spezialist & Data Scientist",
  intro: "Seit über 10 Jahren baue ich KI- und Data-Science-Lösungen, die nicht nur im Notebook funktionieren, sondern validiert in den Betrieb gehen. Zuhause bin ich in Machine Learning, Deep Learning und generativer KI, promoviert habe ich genau zu der Frage, wie man KI-Systeme belastbar prüft.",
  email: "stang.marco@t-online.de",
  stations: [
    { period: "10.2025–05.2026", role: "Solution Architect", org: "ILI.DIGITAL AG", detail: "Leitung von Projektteams, Requirements-Workshops, Lösungsarchitekturen. LLM-Datenextraktionspipelines auf AWS & Azure, Entwicklung von maika.digital (KI-Abrechnungsassistent, RAG-System)." },
    { period: "10.2019–05.2025", role: "Promotion Dr.-Ing., Note „sehr gut“", org: "KIT / ITIV", detail: "Dissertation: Validierung von KI-Systemen durch Verknüpfung von Szenarien und metamorphes Testen. Industriekooperation mit Mercedes-Benz AG (Autonomous Comfort)." }
  ],
  extendedHistory: [
    "Data Scientist FZI, Future Bus mit Daimler Trucks (09.2015–12.2016)",
    "Lehre: AMALEA-Kursentwicklung, Übungsleiter Software Engineering",
    "Studium: M.Sc. Elektro-/Informationstechnik KIT (Note 1,7), Auslandspraktikum INIT AG (USA)",
    "Sprachen: Deutsch (Muttersprache), Englisch (verhandlungssicher)",
    "Referenz: auf Anfrage"
  ],
  skills: ["Python", "Machine Learning", "Deep Learning", "LLM/RAG", "Agentische Workflows", "TensorFlow", "React", "FastAPI", "AWS", "Azure", "Docker", "n8n", "Power Automate", "C++", "Projektleitung"]
};

export const TOUR = [
  { id: "sql-agent", kicker: "Station 1/4 · Agentic AI", caption: "Los geht es mit dem SQL Copilot: ein Text-to-SQL-Agent mit harten Guardrails und Selbstkorrektur-Loop, ehrlich evaluiert mit 8 von 15 Referenzfragen und jederzeit selbst ausprobierbar." },
  { id: "cloud-native-pipeline", kicker: "Station 2/4 · Cloud", caption: "Weiter zur Cloud: Ein Upload genügt, dann laufen Klassifikation und Feldextraktion vollautomatisch durch S3, Lambda, Claude und DynamoDB. Serverlos auf AWS, per Terraform ausgerollt." },
  { id: "hr-interview-cockpit", kicker: "Station 3/4 · Full-Stack", caption: "Jetzt Full-Stack: Das Interview Cockpit führt komplette Bewerbungsgespräche mit Live-Bewertung und Radar-Auswertung, und das ganz ohne Backend, direkt im Browser." },
  { id: RESUME_ID, kicker: "Station 4/4 · Der Mensch dahinter", caption: "Und dahinter steckt ein Mensch: Dr.-Ing. Marco Stang, über 10 Jahre ML und Data Science, promoviert am KIT zur Validierung von KI-Systemen. Neugierig geworden? Der Kontakt-Button wartet gleich hier im Fenster.", last: true }
];

const live = PROJECTS.filter((p) => p.demoUrl).length;
export const BOOT = [
  { text: " __  __   _   ___  ___ ___     ___  ___ ", c: "#b48cf5" },
  { text: "|  \\/  | /_\\ | _ \\/ __/ _ \\   / _ \\/ __|", c: "#b48cf5" },
  { text: "| |\\/| |/ _ \\|   / (_| (_) | | (_) \\__ \\", c: "#b48cf5" },
  { text: "|_|  |_/_/ \\_\\_|_\\___\\___/ (_)___/|___/", c: "#b48cf5" },
  { text: "", c: "#8a86a8" },
  { text: "marco@portfolio", c: "#e7e4f5" },
  { text: "———————————————", c: "#5e5a80" },
  { text: "OS:      MARCO.OS v3.0", c: "#8a86a8" },
  { text: "Kernel:  Dr.-Ing. (KIT / ITIV)", c: "#8a86a8" },
  { text: "Uptime:  10+ Jahre ML & Data Science", c: "#8a86a8" },
  { text: "Shell:   marco-sh (KI-gestützt)", c: "#8a86a8" },
  { text: `Pakete:  ${PROJECTS.length} Projekte · ${live} Live-Demos`, c: "#8a86a8" },
  { text: "", c: "#8a86a8" },
  { text: "[ OK ] neural-link.service gestartet", c: "#4fd6c4" },
  { text: "[ OK ] netzwerk-graph geladen", c: "#4fd6c4" },
  { text: "[ .. ] bereit, leg los_", c: "#f2b45c" }
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
