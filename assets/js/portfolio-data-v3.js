// Inhalte + Terminal-Parser für MARCO.OS v3, 1:1 aus data/projects.js,
// data/resume.js, assets/js/tour.js, assets/js/boot.js und
// assets/js/terminal-commands.js des Repos maggostang-droid/marco-os.
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

export const PROJECTS = [
  { id: "sql-agent", title: "SQL Copilot", cluster: "agentic-ai", status: "live",
    summary: "Frag die Firmendatenbank einfach in normaler Sprache und du bekommst die Antwort. Kein SQL nötig, und der Agent darf ausschließlich lesen, niemals verändern.",
    description: "Ein LangGraph-Agent arbeitet hier gegen eine echte PostgreSQL-Datenbank mit rund 100.000 Olist-Bestellungen: Er erkundet das Schema selbst, hält sich an harte Guardrails (Whitelist statt Blacklist, nur lesende SELECT-Queries, read-only DB-User) und korrigiert fehlerhafte Queries in einem eigenen Loop. Das Spannendste daran: Die Streamlit-Oberfläche zeigt Guardrails und Selbstkorrektur offen, statt sie im Code zu verstecken, und ein Live-Button provoziert den Korrektur-Loop auf Knopfdruck. Die Evaluation bleibt ehrlich: 8 von 15 Referenzfragen korrekt, mit klarem Muster nach Schwierigkeit (Grundlagen 5/5, Joins und Aggregation 3/5, Window Functions 0/5).",
    tags: ["LangGraph", "LangChain", "Python", "PostgreSQL", "Streamlit"],
    stats: [{ value: "8/15", label: "Eval korrekt" }, { value: "5/5", label: "Grundlagen" }, { value: "0/5", label: "Window Fns" }],
    demoUrl: "https://sql-copilot-portfolio.streamlit.app/", repoUrl: "https://github.com/maggostang-droid/sql-copilot" },
  { id: "ai-act-validation-toolkit", title: "AI Act Evidence Toolkit", cluster: "agentic-ai", status: "live",
    summary: "Stuft eine KI-Anwendung nach dem EU AI Act ein und geht dann genau einen Schritt weiter als jedes andere Compliance-Tool: Womit belegst du die Pflichten technisch?",
    description: "Ein deterministischer Regelbaum ordnet den Use-Case einer Risikoklasse nach Annex III zu. Das LLM formuliert dabei nur die Begründung und hat auf die Einstufung selbst keinen Einfluss, denn nachvollziehbar geht vor elegant. Für die technisch belegbaren Pflichten laufen metamorphe Tests gegen drei simulierte Systeme, und eine Namensinvarianz-Relation deckt dabei auf, dass ein Bewerber-Scoring den Score senkt, sobald man nur den Vornamen tauscht (Art. 10, Bias-Prüfung). Wer will, injiziert absichtlich Fehler und sieht in einer Kill-Matrix, wie viele davon die Relationsmenge wirklich fängt. Kurz gesagt: Marcos Promotionsthema am KIT/ITIV, in eine Anwendung übersetzt, die man anklicken kann.",
    tags: ["Python", "LangChain", "Streamlit", "pytest"],
    stats: [{ value: "2/7", label: "Pflichten technisch belegt" }, { value: "11/14", label: "Mutanten getötet" }],
    demoUrl: "https://ai-act-validation-toolkit.streamlit.app/", repoUrl: "https://github.com/maggostang-droid/ai-risk-classifier" },
  { id: "goz-finetune-vs-rag", title: "Medical Coding Extractor", cluster: "agentic-ai", status: "live",
    summary: "Zieht Abrechnungsziffern aus zahnärztlichen Behandlungsnotizen und klärt nebenbei die Frage, die viele Teams nur behaupten: Finetuning oder RAG, was gewinnt hier wirklich?",
    description: "Ein per LoRA feingetuntes Llama-3.2-3B-Instruct extrahiert GOZ-Ziffern im Multi-Label-Setup über 10 Kern-Codes und tritt gegen eine RAG-Baseline aus BM25 und Embeddings an, aufgesetzt auf genau demselben unveränderten Basismodell. Der Weg dahin war ehrliche Arbeit: Zwei frühe Trainingsläufe kollabierten in fast konstante Vorhersagen, systematisches Debugging verdächtigte zuerst Exposure Bias und fand am Ende die banale Ursache, nämlich zu wenige Gradientenschritte. Nach der Korrektur gewinnt das Finetune bei F1 (0,59 gegen 0,48) und ganz deutlich bei Exact Match (0,38 gegen 0,07), während die RAG-Baseline den höheren Recall behält. Ein dritter Ansatz verdrahtet beide Pfade als Graph: Die erste Fassung mit Aggregator scheiterte messbar, die zweite mit Checker-Knoten schöpft 86 % des Spielraums aus. Alle Trainingsdaten sind synthetisch generiert.",
    tags: ["PyTorch", "LoRA", "RAG", "Llama 3.2", "Python"],
    stats: [{ value: "0,59", label: "F1 (RAG: 0,48)" }, { value: "0,38", label: "Exact Match (RAG: 0,07)" }],
    demoUrl: "https://medical-coding-extractor.streamlit.app/", repoUrl: "https://github.com/maggostang-droid/medical-coding-extractor" },
  { id: "second-brain", title: "Ask-Marco Assistant", cluster: "agentic-ai", status: "live", moon: true,
    summary: "Ein Chat, der jedes Projekt in diesem Portfolio kennt. Frag ihn einfach direkt, zum Beispiel: „Welche Projekte zeigen Cloud-Erfahrung?“",
    description: "Ein „second brain“, das README, CLAUDE.md und HANDOVER aller Portfolio-Repos zu einem Snapshot verdichtet und Fragen dazu direkt im Chat beantwortet. Bewusst Context-Stuffing statt Vektor-RAG, denn bei dieser Projektzahl passt alles locker ins Prompt und jede Vektor-Datenbank wäre reine Show. Dasselbe Wissen liegt zusätzlich hinter einem MCP-Server, sodass Claude Code oder Desktop direkt danach fragen können.",
    tags: ["Python", "LangChain", "MCP", "Streamlit"],
    demoUrl: "https://second-brain-projects.streamlit.app/", repoUrl: "https://github.com/maggostang-droid/ask-marco-assistant" },
  { id: "cloud-native-pipeline", title: "Document Auto-Classifier", cluster: "cloud", status: "live",
    summary: "Dokument hochladen, fertig: Typ und relevante Felder erkennt die Pipeline von allein, komplett serverlos auf AWS und ohne einen einzigen selbst betriebenen Server.",
    description: "Eine Rechnung, eine Visitenkarte oder ein Vertragsschnipsel landet in S3 und löst sofort eine Lambda aus, die den Dokumenttyp erkennt und die relevanten Felder herauszieht, vollständig event-getrieben über S3, Lambda, Claude, DynamoDB und API Gateway. Ein einziger Claude-API-Call klassifiziert und extrahiert in einem Schritt, die Antwort wird gegen typspezifische Pydantic-Schemas validiert, und Fehlerfälle macht die Pipeline sichtbar statt sie zu verschlucken. Die gesamte Infrastruktur steht als Terraform-Code im Repo und ist gegen ein echtes AWS-Konto verifiziert.",
    tags: ["AWS Lambda", "Terraform", "DynamoDB", "Streamlit", "Claude API"],
    demoUrl: "https://cloud-native-pipeline.streamlit.app/", repoUrl: "https://github.com/maggostang-droid/document-auto-classifier" },
  { id: "ai-analytics-portal", title: "Review Risk Predictor", cluster: "full-stack", status: "live",
    summary: "Sagt für jede Bestellung das Risiko einer schlechten Kundenbewertung vorher und erklärt in einem Satz, woran es liegt. Keine nackte Zahl, sondern eine Begründung.",
    description: "Für jede Bestellung im Olist-Marktplatz schätzt ein GradientBoostingClassifier aus scikit-learn das Risiko einer schlechten Bewertung. SHAP legt die wichtigsten Treiber frei, ein LLM übersetzt sie in Klartext, den auch das Fachteam ohne Data-Science-Hintergrund sofort versteht. Umgesetzt als vollständige Full-Stack-Anwendung mit React und TypeScript im Frontend und FastAPI im Backend, ganz bewusst als Gegenstück zu SQL Copilot (Agentic AI) und Medical Coding Extractor (LLM-Finetuning). Die Zahlen bei zeitlichem Train/Test-Split: ROC-AUC 0,706, konservativ kalibriert mit hoher Precision und niedrigerem Recall.",
    tags: ["React", "TypeScript", "FastAPI", "scikit-learn", "SHAP"],
    stats: [{ value: "0,706", label: "ROC-AUC (zeitl. Split)" }],
    demoUrl: "https://ai-analytics-portal-gray.vercel.app/", repoUrl: "https://github.com/maggostang-droid/review-risk-predictor" },
  { id: "hr-interview-cockpit", title: "Interview Cockpit", cluster: "full-stack", status: "live",
    summary: "Führt dich strukturiert durch Bewerbungsgespräche: Fragenpool vorbereiten, live im Gespräch bewerten, am Ende steht die Auswertung als Radar-Chart bereit.",
    description: "Ein einziges HTML-File deckt den ganzen Interviewprozess ab: Intake von Stellenanzeige und CV, ein importierbarer Fragenpool aus xlsx mit Cluster- und Verhaltensankern, Terminplanung im Kalender, ein Live-Cockpit mit Timer, Phasen-Tracking und vierstufiger Skala, dazu je Kandidat:in eine KPI- und Radar-Chart-Auswertung. Kein Backend, kein Build-Schritt, und selbst der optionale KI-Copilot ruft die API direkt aus dem Browser mit einem selbst eingegebenen Key. Entstanden ist das Tool aus echtem Bedarf während eines Bewerbungsprozesses, diese Version ist bereinigt und enthält ausschließlich synthetische Beispieldaten.",
    tags: ["JavaScript", "HTML/CSS", "Chart.js", "Claude API"],
    demoUrl: "https://maggostang-droid.github.io/interview-cockpit/", repoUrl: "https://github.com/maggostang-droid/interview-cockpit" },
  { id: "amalea", title: "Applied ML Course (KIT)", cluster: "full-stack", status: "no-demo",
    summary: "Sechs Wochen praktisches Machine Learning für den KI-Campus. Marco hat die Inhalte am KIT mitentwickelt und den Kurs als Co-Dozent begleitet.",
    description: "Praktische Jupyter-Notebook-Übungen für den KI-Campus-Kurs AMALEA, also Angewandte Machine Learning Algorithmen: von Pandas-Grundlagen über Klassifikation, Clustering und Regression bis zu CNNs und generativen Modellen. Marco hat die Kursinhalte als Mitarbeiter des ITIV am KIT mitgeschrieben und den Kurs als Co-Dozent begleitet. Dieser Fork ist die persönliche Portfolio-Kopie, das Original hostet und versioniert der KI-Campus.",
    tags: ["Python", "Jupyter", "Machine Learning", "Deep Learning"],
    demoUrl: null, repoUrl: "https://github.com/maggostang-droid/applied-ml-course" }
];

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
      return { lines: [{ text: `Öffne ${cmd === "demo" ? "Live-Demo" : "Repo"} von ${p.title} …`, kind: "ok" }], action: { type: "url", url } };
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
