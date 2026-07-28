import { projects } from "../../data/projects.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
  initTaskbar(document.querySelector("#taskbar"), projects);
});
