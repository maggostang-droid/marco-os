// Befehls-Parser des Terminals — bewusst eine pure Function ohne DOM/State
// (unit-getestet in tests/terminal-commands.test.js). Das Terminal-Fenster
// (window-manager.js) rendert `lines` und führt `action` aus.
//
// executeCommand(input, { projects, resume }) ->
//   { lines: [{ text, kind? }], action?: { type, id?, url? } }
// kind: "cmd" (Echo), "error", "ok", "muted" — Styling siehe style.css.

const COMMANDS = ["help", "ls", "open", "cat", "demo", "repo", "tour", "whoami", "clear", "exit"];

const HELP_LINES = [
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
  "Tab vervollständigt, Pfeil hoch/runter blättert die History."
];

function line(text, kind) {
  return kind ? { text, kind } : { text };
}

function findProject(projects, id) {
  return projects.find((p) => p.id === id) ?? null;
}

function unknownProjectLines(id) {
  return [
    line(`Projekt "${id}" nicht gefunden.`, "error"),
    line("'ls' zeigt alle verfügbaren Projekt-IDs.", "muted")
  ];
}

function lsLines(projects) {
  const rows = projects.map((p) => {
    const status = p.status === "live" ? "● live" : p.status === "coming-soon" ? "○ demo folgt" : "○ kein demo";
    return line(`  ${p.id.padEnd(26)} ${status.padEnd(14)} ${p.cluster ?? ""}`);
  });
  return [line(`${projects.length} Projekte:`), ...rows, line("'open <id>' öffnet das Projekt-Fenster.", "muted")];
}

function catResumeLines(resume) {
  const station = resume.currentStations?.[0];
  return [
    line(resume.name, "ok"),
    line(resume.headline),
    line(""),
    line(resume.intro),
    station ? line(`Aktuell: ${station.role} @ ${station.org} (${station.period})`) : null,
    line(""),
    line("'open lebenslauf' zeigt das vollständige Fenster mit PDF-Download.", "muted")
  ].filter(Boolean);
}

export function executeCommand(rawInput, { projects, resume }) {
  const input = String(rawInput ?? "").trim();
  if (!input) return { lines: [] };

  const [cmd, ...args] = input.split(/\s+/);
  const arg = args[0] ?? null;

  switch (cmd.toLowerCase()) {
    case "help":
      return { lines: HELP_LINES.map((text) => line(text)) };

    case "ls":
      return { lines: lsLines(projects) };

    case "open": {
      if (!arg) return { lines: [line("Nutzung: open <id> — z.B. open sql-agent", "muted")] };
      if (arg === "lebenslauf" || arg === "lebenslauf.txt") {
        return { lines: [line("Öffne Lebenslauf …", "ok")], action: { type: "open-resume" } };
      }
      const project = findProject(projects, arg);
      if (!project) return { lines: unknownProjectLines(arg) };
      return { lines: [line(`Öffne ${project.title} …`, "ok")], action: { type: "open", id: project.id } };
    }

    case "cat": {
      if (arg === "lebenslauf.txt" || arg === "lebenslauf") return { lines: catResumeLines(resume) };
      if (!arg) return { lines: [line("Nutzung: cat lebenslauf.txt", "muted")] };
      return { lines: [line(`cat: ${arg}: Datei nicht gefunden`, "error")] };
    }

    case "demo": {
      if (!arg) return { lines: [line("Nutzung: demo <id> — z.B. demo sql-agent", "muted")] };
      const project = findProject(projects, arg);
      if (!project) return { lines: unknownProjectLines(arg) };
      if (!project.demoUrl) {
        return { lines: [line(`${project.title} hat (noch) keine Live-Demo — Status: ${project.status}.`, "muted")] };
      }
      return {
        lines: [line(`Starte Live-Demo von ${project.title} im neuen Tab …`, "ok")],
        // track: Event-Name fürs Analytics-Modul — der Parser bleibt pure,
        // window-manager.js führt das Tracking beim Ausführen der Action aus.
        action: { type: "open-url", url: project.demoUrl, track: `demo-${project.id}` }
      };
    }

    case "repo": {
      if (!arg) return { lines: [line("Nutzung: repo <id> — z.B. repo sql-agent", "muted")] };
      const project = findProject(projects, arg);
      if (!project) return { lines: unknownProjectLines(arg) };
      if (!project.repoUrl) return { lines: [line(`${project.title} hat kein öffentliches Repo.`, "muted")] };
      return {
        lines: [line(`Öffne Repo von ${project.title} …`, "ok")],
        action: { type: "open-url", url: project.repoUrl }
      };
    }

    case "tour":
      return { lines: [line("Starte die Tour — lehn dich kurz zurück.", "ok")], action: { type: "tour" } };

    case "whoami":
      return {
        lines: [
          line("gast@marco-os"),
          line("Berechtigungen: alle Live-Demos ausführbar, Lebenslauf lesbar.", "muted")
        ]
      };

    case "sudo":
      return { lines: [line("sudo: Zugriff verweigert — root gehört Marco.", "error")] };

    case "clear":
      return { lines: [], action: { type: "clear" } };

    case "exit":
      return { lines: [line("Bis gleich.", "muted")], action: { type: "exit" } };

    default:
      return {
        lines: [
          line(`marco-sh: ${cmd}: Befehl nicht gefunden`, "error"),
          line("'help' zeigt alle Befehle.", "muted")
        ]
      };
  }
}

// Tab-Vervollständigung: erstes Token gegen die Befehlsliste, zweites Token
// von open/demo/repo gegen die Projekt-IDs (+ "lebenslauf" bei open).
export function completeInput(rawInput, { projects }) {
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
  const candidates = projects.map((p) => p.id);
  if (cmd === "open") candidates.push("lebenslauf");
  const matches = candidates.filter((id) => id.startsWith(prefix));
  return {
    matches,
    replaceWith: matches.length === 1 ? `${cmd} ${matches[0]}` : null
  };
}
