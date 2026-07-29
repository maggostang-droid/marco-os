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
      "(Grundlagen 5/5, Joins & Aggregation 3/5, Window Functions 0/5).",
    tags: ["LangGraph", "LangChain", "Python", "PostgreSQL", "Streamlit"],
    demoUrl: "https://sql-copilot-portfolio.streamlit.app/",
    repoUrl: "https://github.com/maggostang-droid/sql-copilot",
    status: "live",
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
      "Der Weg dahin war kein Selbstläufer: zwei frühe Trainingsläufe kollabierten in " +
      "nahezu konstante Vorhersagen — systematisches Debugging führte das zunächst auf " +
      "klassisches Exposure Bias zurück (gesunde Trainings-Loss-Kurve, aber kollabierende " +
      "freie Generierung), danach auf schlicht zu wenige Gradientenschritte. Nach der " +
      "Korrektur schlägt das Finetune die RAG-Baseline auf F1 (0,59 vs. 0,48) und deutlich " +
      "auf Exact Match (0,38 vs. 0,07); die RAG-Baseline behält den höheren Recall. " +
      "Trainingsdaten sind komplett synthetisch generiert, kein Abgleich mit realen " +
      "Praxisfällen im großen Stil.",
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
    cluster: "agentic-ai",
    orbitsCenter: true
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
