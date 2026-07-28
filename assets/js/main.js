import { projects } from "../../data/projects.js";
import { initScene } from "./scene.js";
import { initWindowManager } from "./window-manager.js";

document.addEventListener("DOMContentLoaded", () => {
  initScene(document.querySelector("#scene"), projects);
  initWindowManager(document.querySelector("#window-layer"), projects);
});
