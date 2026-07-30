import { projects } from "../../data/projects.js";
import { resume } from "../../data/resume.js";
import { initBoot } from "./boot.js";
import { initStarfield } from "./starfield.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";
import { initMenubar } from "./menubar.js";
import { initHud } from "./hud.js";
import { initGithubActivity } from "./github-activity.js";
import { initRouter, registerSpecialHash } from "./router.js";
import { state, focusProject, TERMINAL_ID } from "./state.js";
import { startTour } from "./tour.js";

document.addEventListener("DOMContentLoaded", () => {
  initBoot(document.querySelector("#boot-overlay"), projects);
  // initScene must run before initWindowManager: window-manager's focus
  // restore on close queries scene-rendered [data-node-id] elements. It must
  // also run before initStarfield, which needs .graph-viewport (created by
  // initScene) to exist so the starfield zooms/pans together with the graph.
  initScene(document.querySelector("#scene"), projects);
  initStarfield(document.querySelector(".graph-viewport"));
  initWindowManager(document.querySelector("#window-layer"), projects, resume);
  initTaskbar(document.querySelector("#taskbar"), projects);
  initMenubar(document.querySelector("#menubar"), resume);
  initHud(document.querySelector("#hud"), projects, resume);
  initGithubActivity(projects);
  registerSpecialHash("terminal", TERMINAL_ID);
  initRouter(projects, {
    // #tour öffnet kein Fenster, sondern startet die geführte Tour.
    onHashAction: (hash) => {
      if (hash.replace(/^#/, "").trim() === "tour") {
        startTour();
        return true;
      }
      return false;
    }
  });

  // Terminal-Shortcut: T (oder ` auf Layouts, wo das keine Dead-Key-Taste
  // ist — auf deutschen Tastaturen liefert ` nur "Dead", darum primär T).
  // Nur ohne Modifier und nur, wenn gerade kein Eingabefeld fokussiert ist.
  document.addEventListener("keydown", (event) => {
    if (!state.bootComplete) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
    if (event.key === "t" || event.key === "T" || event.key === "`") {
      event.preventDefault();
      focusProject(TERMINAL_ID);
    }
  });
});
