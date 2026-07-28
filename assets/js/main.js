import { projects } from "../../data/projects.js";
import { initBoot } from "./boot.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";
import { initTaskbar } from "./taskbar.js";

document.addEventListener("DOMContentLoaded", () => {
  initBoot(document.querySelector("#boot-overlay"));
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
  initTaskbar(document.querySelector("#taskbar"), projects);
});
