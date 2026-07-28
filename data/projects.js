export const projects = [
  {
    id: "sql-agent",
    title: "sql-agent",
    summary: "Text-to-SQL-Agent für Fachabteilungen ohne SQL-Kenntnisse.",
    description:
      "Fachabteilungen brauchen schnelle Antworten aus Firmendaten, aber die wenigsten " +
      "können SQL schreiben. sql-agent ist ein LangGraph-basierter Text-to-SQL-Agent, der " +
      "natürlichsprachige Fragen gegen eine echte PostgreSQL-Datenbank beantwortet — inklusive " +
      "Schema-Exploration, Guardrails (nur lesende SELECT-Queries, read-only DB-User) und einem " +
      "Selbstkorrektur-Loop bei fehlerhaften Queries.",
    tags: ["LangGraph", "LangChain", "Python", "PostgreSQL", "Streamlit"],
    demoUrl: null,
    repoUrl: "https://github.com/maggostang-droid/sql-agent",
    status: "coming-soon"
  },
  {
    id: "bi-dashboard-assistent",
    title: "BI-Dashboard-Assistent",
    summary: "Natürlichsprachige Abfragen gegen BI-Dashboards/KPIs statt manuellem Filtern.",
    description:
      "Idee: Fachabteilungen filtern und interpretieren Dashboards oft manuell, was Zeit kostet " +
      "und Rückfragen an BI-Teams erzeugt. Ziel ist ein Assistent, der Fragen in natürlicher Sprache " +
      "entgegennimmt und passende KPI-Ansichten oder Kennzahlen direkt liefert.",
    tags: ["Python", "Streamlit"],
    demoUrl: null,
    repoUrl: null,
    status: "planned"
  },
  {
    id: "rag-wissens-assistent",
    title: "RAG-Wissens-Assistent",
    summary: "Chatbot über interne Dokumente per Retrieval-Augmented Generation.",
    description:
      "Idee: Interne Dokumentation (Wikis, PDFs, Handbücher) ist oft schwer durchsuchbar. " +
      "Ziel ist ein Chatbot, der Fragen gegen eine Vektor-Datenbank aus internen Dokumenten " +
      "beantwortet und dabei Quellen mit angibt.",
    tags: ["LangChain", "Pinecone"],
    demoUrl: null,
    repoUrl: null,
    status: "planned"
  }
];
