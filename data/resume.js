// Einzige Quelle des Lebenslaufs für BEIDE Frontends:
//  - index.html (v3, live) über assets/js/portfolio-data-v3.js, das die
//    currentStations-Bullets zu einer detail-Zeile zusammenzieht
//  - index-legacy.html über assets/js/window-manager.js
// Der Text entspricht dem v3-Stand, weil der live ist.
export const resume = {
  name: "Dr.-Ing. Marco Stang",
  headline: "KI-Spezialist & Data Scientist",
  intro:
    "Seit über 10 Jahren baue ich KI- und Data-Science-Lösungen, die nicht nur " +
    "im Notebook funktionieren, sondern validiert in den Betrieb gehen. Zuhause " +
    "bin ich in Machine Learning, Deep Learning und generativer KI, promoviert " +
    "habe ich genau zu der Frage, wie man KI-Systeme belastbar prüft.",
  currentStations: [
    {
      role: "Solution Architect",
      org: "ILI.DIGITAL AG",
      period: "10.2025–05.2026",
      bullets: [
        "Leitung von Projektteams, Requirements-Workshops, Lösungsarchitekturen",
        "LLM-Datenextraktionspipelines auf AWS & Azure",
        "Entwicklung von maika.digital (KI-Abrechnungsassistent, RAG-System)"
      ]
    },
    {
      role: "Promotion Dr.-Ing., Note \u201eSehr gut\u201c",
      org: "KIT / ITIV",
      period: "10.2019–05.2025",
      bullets: [
        "Dissertationsthema: Validierung von KI-Systemen durch Szenarien-Verknüpfung und metamorphes Testen",
        "Industriekooperation mit Mercedes-Benz AG (Autonomous Comfort)"
      ]
    }
  ],
  skills: [
    "Python",
    "Machine Learning",
    "Deep Learning",
    "LLM/RAG",
    "Agentische Workflows",
    "TensorFlow",
    "React",
    "FastAPI",
    "AWS",
    "Azure",
    "Docker",
    "n8n",
    "Power Automate",
    "C++",
    "Projektleitung"
  ],
  extendedHistory: [
    "Data Scientist FZI, Future Bus mit Daimler Trucks (09.2015–12.2016)",
    "Lehre: AMALEA-Kursentwicklung, Übungsleiter Software Engineering",
    "Studium: M.Sc. Elektro-/Informationstechnik KIT (Note 1,7), Auslandspraktikum INIT AG (USA)",
    "Sprachen: Deutsch (Muttersprache), Englisch (verhandlungssicher)",
    "Referenz: auf Anfrage"
  ],
  pdfUrl: "assets/docs/lebenslauf-marco-stang.pdf",
  email: "stang.marco@t-online.de",
  linkedinUrl: "https://www.linkedin.com/in/marco-stang"
};
