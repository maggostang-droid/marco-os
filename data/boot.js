// Einzige Quelle der Boot-Zeilen für BEIDE Frontends:
//  - index.html (v3, live) über assets/js/portfolio-data-v3.js
//  - index-legacy.html über assets/js/boot.js
//
// ASCII-Logo + neofetch-artiger Systeminfo-Block. Beides sind reale Fakten in
// Systeminfo-Verkleidung, keine erfundenen Zahlen. Wie die Zeilen gerendert
// werden (Farben, Typewriter, CSS-Klassen), entscheidet jedes Frontend selbst
// — hier steht nur der Text.
//
// Bewusst normale Zeichenketten mit verdoppelten Backslashes statt
// String.raw: Zeile 3 endet auf einen Backslash und würde in einem
// Template-Literal den schließenden Backtick escapen. Genau daran hing der
// alte Fehler in boot.js, wo Zeile 4 einen Backslash zu viel trug und das
// Logo ab dort um ein Zeichen verschoben war.
export const bootLogo = [
  " __  __   _   ___  ___ ___     ___  ___ ",
  "|  \\/  | /_\\ | _ \\/ __/ _ \\   / _ \\/ __|",
  "| |\\/| |/ _ \\|   / (_| (_) | | (_) \\__ \\",
  "|_|  |_/_/ \\_\\_|_\\___\\___/ (_)___/|___/"
];

// Live-Demos zählen über demoUrl, nicht über status: ein Projekt kann
// "live" sein und trotzdem keine anklickbare Demo haben (siehe amalea).
export function countDemos(projects) {
  return projects.filter((p) => p.demoUrl).length;
}

export function bootInfoLines(projects) {
  return [
    "",
    "marco@portfolio",
    "———————————————",
    "OS:      MARCO.OS v3.0",
    "Kernel:  Dr.-Ing. (KIT / ITIV)",
    "Uptime:  10+ Jahre ML & Data Science",
    "Shell:   marco-sh (KI-gestützt)",
    `Pakete:  ${projects.length} Projekte · ${countDemos(projects)} Live-Demos`,
    ""
  ];
}

export const bootStatusLines = [
  "[ OK ] neural-link.service gestartet",
  "[ OK ] netzwerk-graph geladen"
];

export const bootPromptLine = "[ .. ] bereit, leg los_";
