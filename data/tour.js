// Einzige Quelle der geführten Tour für BEIDE Frontends:
//  - index.html (v3, live) über assets/js/portfolio-data-v3.js
//  - index-legacy.html über assets/js/tour.js
//
// Drei kuratierte Projekte — eines pro Cluster, alle mit Live-Demo bzw.
// echter Metrik — danach der Lebenslauf mit Kontakt-CTA. Die Captions nennen
// ausschließlich reale, nachprüfbare Fakten.
//
// Der letzte Schritt trägt bewusst KEINE id, sondern `resume: true`. Die
// beiden Frontends benutzen unterschiedliche Sentinel-Werte für ihre Fenster
// (assets/js/state.js gegen portfolio-data-v3.js); jedes setzt seinen eigenen
// RESUME_ID beim Einlesen ein. Stünde die Zeichenkette hier fest drin, müsste
// sie an drei Stellen gleich bleiben.
export const tourSteps = [
  {
    id: "sql-agent",
    kicker: "Station 1/4 · Agentic AI",
    caption:
      "Los geht es mit dem SQL Copilot: ein Text-to-SQL-Agent mit harten " +
      "Guardrails und Selbstkorrektur-Loop, ehrlich evaluiert mit 8 von 15 " +
      "Referenzfragen und jederzeit selbst ausprobierbar."
  },
  {
    id: "cloud-native-pipeline",
    kicker: "Station 2/4 · Cloud",
    caption:
      "Weiter zur Cloud: Ein Upload genügt, dann laufen Klassifikation und " +
      "Feldextraktion vollautomatisch durch S3, Lambda, Claude und DynamoDB. " +
      "Serverlos auf AWS, per Terraform ausgerollt."
  },
  {
    id: "hr-interview-cockpit",
    kicker: "Station 3/4 · Full-Stack",
    caption:
      "Jetzt Full-Stack: Das Interview Cockpit führt komplette " +
      "Bewerbungsgespräche mit Live-Bewertung und Radar-Auswertung, und das " +
      "ganz ohne Backend, direkt im Browser."
  },
  {
    resume: true,
    kicker: "Station 4/4 · Der Mensch dahinter",
    caption:
      "Und dahinter steckt ein Mensch: Dr.-Ing. Marco Stang, über 10 Jahre ML " +
      "und Data Science, promoviert am KIT zur Validierung von KI-Systemen. " +
      "Neugierig geworden? Der Kontakt-Button wartet gleich hier im Fenster.",
    last: true
  }
];

// Setzt den frontend-eigenen Sentinel in den Lebenslauf-Schritt ein.
export function tourWithResumeId(resumeId) {
  return tourSteps.map((step) => (step.resume ? { ...step, id: resumeId } : step));
}
