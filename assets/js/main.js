import { projects } from "../../data/projects.js";
import { initBoot } from "./boot.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initBoot(document.querySelector("#boot-overlay"));
  // initScene must run before initWindowManager: window-manager's focus
  // restore on close queries scene-rendered [data-node-id] elements.
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
  initTaskbar(document.querySelector("#taskbar"), projects);
});
