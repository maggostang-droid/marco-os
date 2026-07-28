import { projects } from "../../data/projects.js";
import { initScene } from "./scene.js";

document.addEventListener("DOMContentLoaded", () => {
  initScene(document.querySelector("#scene"), projects);
});
