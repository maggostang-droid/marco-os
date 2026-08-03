import { test } from "node:test";
import assert from "node:assert/strict";
import {
  executeCommand,
  completeInput,
  COMMANDS,
  PROJECTS,
  TOUR,
  BOOT,
  RESUME,
  CHAT_ID,
  RESUME_ID
} from "../assets/js/portfolio-data-v3.js";
import { projects } from "../data/projects.js";

// Der v3-Terminal-Parser ist eine reine Funktion und damit testbar, obwohl der
// Rest von v3 in index.html steckt und nur im Browser verifiziert wird.

const text = (result) => result.lines.map((l) => l.text).join("\n");

test("help nennt jeden dokumentierten Befehl", () => {
  const out = text(executeCommand("help"));
  for (const cmd of ["ls", "open", "demo", "repo", "cat", "tour", "clear", "exit"]) {
    assert.ok(out.includes(cmd), `help muss "${cmd}" nennen`);
  }
});

test("ls listet alle Projekte", () => {
  const out = text(executeCommand("ls"));
  assert.ok(out.includes(`${PROJECTS.length} Projekte:`));
  for (const p of PROJECTS) assert.ok(out.includes(p.id), `ls muss "${p.id}" listen`);
});

test("leere Eingabe erzeugt keine Ausgabe", () => {
  assert.deepEqual(executeCommand("   "), { lines: [] });
});

test("unbekannter Befehl meldet Fehler und verweist auf help", () => {
  const r = executeCommand("bloedsinn");
  assert.ok(text(r).includes("Befehl nicht gefunden"));
  assert.ok(text(r).includes("help"));
  assert.equal(r.action, undefined);
});

test("open ohne Argument erklaert die Nutzung, statt etwas zu oeffnen", () => {
  const r = executeCommand("open");
  assert.ok(text(r).includes("Nutzung: open"));
  assert.equal(r.action, undefined);
});

test("open mit unbekannter id oeffnet nichts", () => {
  const r = executeCommand("open gibtsnicht");
  assert.ok(text(r).includes("nicht gefunden"));
  assert.equal(r.action, undefined);
});

test("open <id> oeffnet das Projektfenster", () => {
  const r = executeCommand("open sql-agent");
  assert.deepEqual(r.action, { type: "open", id: "sql-agent" });
});

test("open lebenslauf oeffnet das Lebenslauf-Fenster", () => {
  for (const eingabe of ["open lebenslauf", "open lebenslauf.txt"]) {
    assert.deepEqual(executeCommand(eingabe).action, { type: "open", id: RESUME_ID });
  }
});

test("der Mond fuehrt ins Chat-Fenster, nicht in ein Projektfenster", () => {
  // Klick auf den Mond tut dasselbe -- beide Wege muessen uebereinstimmen,
  // sonst gibt es einen Zustand, den man nur ueber das Terminal erreicht.
  const mond = PROJECTS.find((p) => p.moon);
  assert.ok(mond, "es muss genau einen Mond geben");
  assert.deepEqual(executeCommand(`open ${mond.id}`).action, { type: "open", id: CHAT_ID });
});

test("demo auf ein Projekt ohne Demo oeffnet keinen Tab", () => {
  const ohneDemo = PROJECTS.find((p) => !p.demoUrl);
  assert.ok(ohneDemo, "ein Projekt ohne demoUrl wird fuer diesen Test gebraucht");
  const r = executeCommand(`demo ${ohneDemo.id}`);
  assert.ok(text(r).includes("keine Live-Demo"));
  assert.equal(r.action, undefined);
});

test("demo und repo liefern id und kind mit, damit der Start zaehlbar ist", () => {
  const mitDemo = PROJECTS.find((p) => p.demoUrl && p.repoUrl);
  const demo = executeCommand(`demo ${mitDemo.id}`).action;
  assert.deepEqual(demo, { type: "url", url: mitDemo.demoUrl, id: mitDemo.id, kind: "demo" });
  const repo = executeCommand(`repo ${mitDemo.id}`).action;
  assert.deepEqual(repo, { type: "url", url: mitDemo.repoUrl, id: mitDemo.id, kind: "repo" });
});

test("cat lebenslauf.txt zeigt das Kurzprofil, cat auf Unbekanntes meldet Fehler", () => {
  assert.ok(text(executeCommand("cat lebenslauf.txt")).includes(RESUME.headline));
  assert.ok(text(executeCommand("cat unfug.txt")).includes("Datei nicht gefunden"));
});

test("tour, clear und exit melden ihre Aktion", () => {
  assert.deepEqual(executeCommand("tour").action, { type: "tour" });
  assert.deepEqual(executeCommand("clear").action, { type: "clear" });
  assert.deepEqual(executeCommand("exit").action, { type: "exit" });
});

test("Befehle sind gross-/kleinschreibungsunabhaengig", () => {
  assert.ok(text(executeCommand("LS")).includes("Projekte:"));
  assert.deepEqual(executeCommand("OpEn sql-agent").action, { type: "open", id: "sql-agent" });
});

test("Tab vervollstaendigt einen eindeutigen Befehlspraefix", () => {
  assert.deepEqual(completeInput("wh"), { matches: ["whoami"], replaceWith: "whoami " });
});

test("Tab vervollstaendigt Projekt-ids nach open/demo/repo", () => {
  const r = completeInput("open sql");
  assert.deepEqual(r, { matches: ["sql-agent"], replaceWith: "open sql-agent" });
});

test("Tab listet mehrere Treffer, ohne zu ersetzen", () => {
  const r = completeInput("");
  assert.deepEqual(r.matches, COMMANDS);
  assert.equal(r.replaceWith, null);
});

test("Tab vervollstaendigt nach Befehlen ohne Argument nicht", () => {
  assert.deepEqual(completeInput("whoami x"), { matches: [], replaceWith: null });
});

// --- abgeleitete Daten: v3 baut sie aus data/, das darf nicht auseinanderlaufen

test("PROJECTS spiegelt data/projects.js inklusive orbitsCenter -> moon", () => {
  assert.equal(PROJECTS.length, projects.length);
  assert.deepEqual(PROJECTS.map((p) => p.id), projects.map((p) => p.id));
  for (const p of PROJECTS) {
    const quelle = projects.find((q) => q.id === p.id);
    assert.equal(p.moon, Boolean(quelle.orbitsCenter), `${p.id}: moon muss orbitsCenter entsprechen`);
  }
});

test("jeder Tour-Schritt ausser dem letzten zeigt auf ein echtes Projekt", () => {
  const ids = new Set(PROJECTS.map((p) => p.id));
  for (const schritt of TOUR.slice(0, -1)) {
    assert.ok(ids.has(schritt.id), `Tour-Schritt "${schritt.id}" muss es in data/projects.js geben`);
  }
  assert.equal(TOUR.at(-1).id, RESUME_ID, "der letzte Schritt fuehrt in den Lebenslauf");
  assert.equal(TOUR.at(-1).last, true);
});

test("die Boot-Zeilen nennen die tatsaechliche Projekt- und Demo-Zahl", () => {
  const demos = PROJECTS.filter((p) => p.demoUrl).length;
  const zeile = BOOT.map((l) => l.text).find((t) => t.startsWith("Pakete:"));
  assert.ok(zeile, "es muss eine Pakete-Zeile geben");
  assert.ok(zeile.includes(`${PROJECTS.length} Projekte`), zeile);
  assert.ok(zeile.includes(`${demos} Live-Demos`), zeile);
});

test("das ASCII-Logo hat keine verrutschte Zeile", () => {
  // Die vierte Zeile trug frueher einen Backslash zu viel; das Logo war ab
  // dort um ein Zeichen verschoben.
  const logo = BOOT.slice(0, 4).map((l) => l.text);
  const breiten = new Set(logo.map((l) => l.length));
  assert.ok(breiten.size <= 2, `Logo-Zeilen unterschiedlich breit: ${[...breiten].join(", ")}`);
  assert.ok(logo.every((l) => !l.includes("\\\\")), "kein doppelter Backslash im Logo");
});

test("Kurztitel sind kuerzer als der volle Titel", () => {
  // shortTitle wird auf schmalen Viewports als Knoten-Label benutzt; ein
  // laengerer Kurztitel waere sinnlos.
  for (const p of PROJECTS.filter((x) => x.shortTitle)) {
    assert.ok(
      p.shortTitle.length < p.title.length,
      `${p.id}: shortTitle "${p.shortTitle}" ist nicht kuerzer als "${p.title}"`
    );
  }
});
