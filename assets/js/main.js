import { projects } from "../../data/projects.js";
import { resume } from "../../data/resume.js";
import { initBoot } from "./boot.js";
import { initStarfield } from "./starfield.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";

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
});
