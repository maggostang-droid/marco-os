const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

export function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (char) => ESCAPES[char]);
}
