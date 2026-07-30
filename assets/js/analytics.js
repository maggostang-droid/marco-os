// GoatCounter-Integration: cookielose Besucherzählung + Demo-Start-Events.
// Bewusst GoatCounter statt einer eigenen Backend-Lösung: kostenlos für
// persönliche Nutzung, Open Source, keine Cookies und keine personenbezogenen
// Daten — nach eigener Aussage ohne DSGVO-Notice einsetzbar
// (goatcounter.com). Die Seite bleibt damit backend-frei.
//
// Setup (einmalig, erledigt 2026-07-30):
//  1. Account auf goatcounter.com, Site-Code "maggringer" (= Konstante
//     unten — bei einem Code-Wechsel nur diese eine Stelle anpassen).
//  2. In den GoatCounter-Einstellungen muss "Allow adding visitor counts
//     on your website" aktiv sein — sonst liefert der Counter-Endpoint
//     403 und die Taskbar zeigt schlicht keine Besucherzahl (stiller
//     Fallback).
// Hinweise: count.js zählt localhost standardmäßig nicht (gut für die
// lokale Entwicklung); der Counter-Endpoint cached bis zu 4 h.

const GOATCOUNTER_CODE = "maggringer";
const GOATCOUNTER_BASE = `https://${GOATCOUNTER_CODE}.goatcounter.com`;
const COUNT_JS_URL = "https://gc.zgo.at/count.js";
const FETCH_TIMEOUT_MS = 6000;

export function initAnalytics() {
  const script = document.createElement("script");
  script.async = true;
  script.dataset.goatcounter = `${GOATCOUNTER_BASE}/count`;
  script.src = COUNT_JS_URL;
  document.head.appendChild(script);
}

// Demo-Starts u.ä. als GoatCounter-Event (sichtbar nur in Marcos Dashboard,
// bewusst nicht auf der Seite — "Demo 3× gestartet" wäre Anti-Wow).
// count.js lädt async und kann beim ersten Klick noch fehlen — Events sind
// nice-to-have, darum optional gechaint statt gequeued.
export function trackEvent(name) {
  window.goatcounter?.count?.({ path: name, title: name, event: true });
}

// Gesamt-Besucherzahl vom öffentlichen Counter-Endpoint. Fehlerpfad ist
// still (null) — z.B. solange das Setting aus Schritt 2 oben fehlt.
export async function fetchVisitorCount() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${GOATCOUNTER_BASE}/counter/TOTAL.json`, {
      signal: controller.signal
    });
    if (!response.ok) return null;
    const json = await response.json();
    // count kommt als vorformatierter String ("1 234") — Ziffern extrahieren
    // und deutsch formatieren.
    const digits = String(json?.count ?? "").replace(/\D/g, "");
    if (!digits) return null;
    return Number(digits).toLocaleString("de-DE");
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
