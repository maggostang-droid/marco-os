export const projects = [
  {
    id: "sql-agent",
    title: "sql-agent",
    summary:
      "Text-to-SQL-Agent für Fachabteilungen ohne SQL-Kenntnisse — mit SQL-Guardrails statt offenem DB-Zugriff.",
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
    repoUrl: "https://github.com/maggostang-droid/sql-agent",
    status: "coming-soon",
    cluster: "agentic-ai"
  },
  {
    id: "ai-act-validation-toolkit",
    title: "AI Act Validation Toolkit",
    summary:
      "EU-AI-Act-Risikoklassifizierung mit echtem metamorphem Test statt nur Behauptung.",
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
    repoUrl: "https://github.com/maggostang-droid/ai-act-validation-toolkit",
    status: "live",
    cluster: "agentic-ai"
  },
  {
    id: "ai-analytics-portal",
    title: "AI Analytics Portal",
    summary:
      "Sagt das Risiko einer schlechten Kundenbewertung voraus und erklärt in einem Satz, warum.",
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
    title: "AMALEA",
    summary:
      "Sechs Kurswochen angewandtes Machine Learning — als Co-Dozent am KIT mitentwickelt.",
    description:
      "Praktische Jupyter-Notebook-Übungen für den KI-Campus-Kurs AMALEA (Angewandte " +
      "Machine Learning Algorithmen), von Pandas-Grundlagen über Klassifikation, " +
      "Clustering und Regression bis zu CNNs und generativen Modellen. Marco hat die " +
      "Kursinhalte als Mitarbeiter des ITIV am KIT mitgeschrieben und den Kurs als Co-" +
      "Dozent begleitet — dieser Fork ist die persönliche Kopie zu Portfolio-Zwecken, das " +
      "Original wird vom KI-Campus gehostet und versioniert.",
    tags: ["Python", "Jupyter", "Machine Learning", "Deep Learning"],
    demoUrl: null,
    repoUrl: "https://github.com/maggostang-droid/AMALEA",
    status: "coming-soon",
    cluster: "full-stack"
  },
  {
    id: "cloud-native-pipeline",
    title: "Cloud-Native Pipeline",
    summary:
      "Dokumenten-Upload → automatische Klassifikation & Extraktion, live auf AWS deployed.",
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
    repoUrl: "https://github.com/maggostang-droid/cloud-native-pipeline",
    status: "live",
    cluster: "cloud"
  },
  {
    id: "goz-finetune-vs-rag",
    title: "GOZ Finetune vs. RAG",
    summary:
      "LoRA-Finetuning vs. RAG im direkten Vergleich: extrahiert GOZ-Ziffern aus Behandlungsnotizen.",
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
    repoUrl: "https://github.com/maggostang-droid/goz-finetune-vs-rag",
    status: "coming-soon",
    cluster: "agentic-ai"
  },
  {
    id: "second-brain",
    title: "second-brain",
    summary: "Chat-Assistent, der alle Portfolio-Projekte kennt — noch im Aufbau.",
    description:
      "Ein 'second brain', das README/CLAUDE.md/HANDOVER aller anderen Portfolio-Repos zu " +
      "einem Snapshot verarbeitet und Fragen dazu direkt im Chat beantwortet (Context-" +
      "Stuffing statt Vektor-RAG, reicht bei der aktuellen Projektzahl locker ins Prompt) " +
      "— z.B. 'welche Projekte zeigen Cloud-Erfahrung?'. Dasselbe Wissen wird zusätzlich " +
      "über einen MCP-Server exponiert, sodass Claude Code/Desktop direkt danach fragen " +
      "kann. Noch in Arbeit: Design-Spec und Implementierungsplan stehen, die Umsetzung " +
      "läuft noch.",
    tags: ["Python", "LangChain", "MCP", "Streamlit"],
    demoUrl: null,
    repoUrl: null,
    status: "planned",
    cluster: "agentic-ai"
  }
];
