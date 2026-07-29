# Higgsfield Planet Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pure-CSS gradient "planet" look in the MARCO.OS graph with real photoreal artwork generated via the Higgsfield CLI, per `docs/superpowers/specs/2026-07-30-higgsfield-planet-artwork-design.md`.

**Architecture:** Generate 5 static PNG images (one per cluster color + center "sun" + moon) with `higgsfield generate create z_image`, downscale them locally with Python/Pillow (already installed on this machine — not a new project dependency), commit them to `assets/img/planets/`, then point the existing per-cluster/center/moon CSS selectors at those images instead of their current `radial-gradient` backgrounds. No new JS asset-selection logic is needed — the existing class-based selectors (`.node--color-amber`, `.node--color-teal`, `.node--color-violet`, `.node--center`, `.node--moon`) already map 1:1 onto the 5 images.

**Tech Stack:** Higgsfield CLI (`z_image` model), Python 3.10 + Pillow (local one-off resize, not committed as a dependency), plain CSS, vanilla JS (`scene.js`).

## Global Constraints

- No build tool, bundler, or framework — plain HTML/CSS/vanilla JS (ES modules). Do not add npm dependencies.
- No automated test exists (or should be added) for `scene.js` or `style.css` — it is DOM/visual and verified manually in-browser at 375px and 1280px+, per this repo's existing convention.
- `npm test` (`node --test tests/*.test.js`) must still pass unmodified after these changes — none of the touched files (`scene.js`, `style.css`) are covered by it, but a regression check is cheap insurance.
- Images: 256×256 PNG, near-black background (matches `--bg-deep: #06040d`), no baked-in ring (the CSS `.node--planet-ringed` overlay already draws one on top when applicable) — one image per cluster/center/moon, not per project.
- Higgsfield workspace is on the **free plan**: only `z_image` is usable (`gpt_image_2`, `recraft_v4_1`, `nano_banana_2_lite` all returned `job_minimum_basic_plan_required` during brainstorming). Do not swap to a different model without checking cost/plan first.

---

### Task 1: Generate and commit the 5 planet images

**Files:**
- Create: `assets/img/planets/planet-amber.png`
- Create: `assets/img/planets/planet-teal.png`
- Create: `assets/img/planets/planet-violet.png`
- Create: `assets/img/planets/sun-center.png`
- Create: `assets/img/planets/moon.png`

**Interfaces:**
- Consumes: nothing from earlier tasks (first task).
- Produces: 5 committed 256×256 PNG files at the paths above. Task 2 consumes these exact paths as CSS `background-image: url(...)` values (relative to `assets/css/style.css`, i.e. `url("../img/planets/planet-amber.png")`).

- [ ] **Step 1: Confirm the Higgsfield CLI is authenticated and on the free workspace**

Run:
```bash
higgsfield account status --json
```
Expected: JSON with `"subscription_plan_type": "free"` and a non-empty `email`. If this errors with "Session expired" or similar, run `higgsfield auth login` first and wait for the browser sign-in to complete before continuing.

- [ ] **Step 2: Generate all 5 source images (2048×2048 each, ~0.15 credits/image)**

Run each of these five commands. Each prints a JSON array on success; note the `result_url` field from each (needed in Step 3):

```bash
higgsfield generate create z_image --prompt "A small photorealistic alien planet floating in deep space, cratered rocky surface with a warm amber/orange atmospheric glow, sunlit from one side, NASA photograph style, isolated on a pure black background, centered, no text, no label, no rings" --aspect_ratio 1:1 --wait --json
```
```bash
higgsfield generate create z_image --prompt "A small photorealistic ice and ocean alien planet floating in deep space, textured surface with a cool teal and cyan atmospheric glow, sunlit from one side, NASA photograph style, isolated on a pure black background, centered, no text, no label, no rings" --aspect_ratio 1:1 --wait --json
```
```bash
higgsfield generate create z_image --prompt "A small photorealistic alien planet floating in deep space, textured rocky gas-giant surface with a violet and purple atmospheric glow, sunlit from one side, NASA photograph style, isolated on a pure black background, centered, no text, no label, no rings" --aspect_ratio 1:1 --wait --json
```
```bash
higgsfield generate create z_image --prompt "A small photorealistic glowing star, bright white-hot core with a soft violet-white corona glow, solar flare texture, NASA photograph style, isolated on a pure black background, centered, no text, no label" --aspect_ratio 1:1 --wait --json
```
```bash
higgsfield generate create z_image --prompt "A small photorealistic moon, pale grey-white cratered surface, subtle soft white glow, NASA photograph style, isolated on a pure black background, centered, no text, no label" --aspect_ratio 1:1 --wait --json
```

Expected: each command exits 0 and prints `"status": "completed"` with a `result_url` pointing to a `.png`. If any command instead prints `Error: {"error_type":"job_minimum_basic_plan_required"}`, stop — the workspace plan changed; do not substitute a different model without re-checking cost via `higgsfield generate cost <model> ...` first.

- [ ] **Step 3: Download the 5 source images to a scratch directory**

Substitute each `<RESULT_URL_...>` below with the `result_url` captured from Step 2 (in the same order: amber, teal, violet, sun, moon):

```bash
mkdir -p /tmp/planet-src
curl -sL "<RESULT_URL_AMBER>" -o /tmp/planet-src/planet-amber.png
curl -sL "<RESULT_URL_TEAL>" -o /tmp/planet-src/planet-teal.png
curl -sL "<RESULT_URL_VIOLET>" -o /tmp/planet-src/planet-violet.png
curl -sL "<RESULT_URL_SUN>" -o /tmp/planet-src/sun-center.png
curl -sL "<RESULT_URL_MOON>" -o /tmp/planet-src/moon.png
```

Expected: 5 files in `/tmp/planet-src/`, each a few MB. Verify with:
```bash
ls -la /tmp/planet-src/
```

- [ ] **Step 4: Downscale to 256×256 and write into the repo**

```bash
mkdir -p assets/img/planets
python -c "
from PIL import Image
import os

names = ['planet-amber', 'planet-teal', 'planet-violet', 'sun-center', 'moon']
for name in names:
    src = f'/tmp/planet-src/{name}.png'
    dst = f'assets/img/planets/{name}.png'
    im = Image.open(src).convert('RGB')
    im = im.resize((256, 256), Image.LANCZOS)
    im.save(dst, optimize=True)
    print(dst, os.path.getsize(dst), 'bytes')
"
```

Expected: prints 5 lines, one per file, each under ~200KB. If Pillow is not installed (`ModuleNotFoundError: No module named 'PIL'`), run `python -m pip install --user Pillow` first — this is a local one-off tool for asset prep, not a project dependency, so it is not added to any repo manifest.

- [ ] **Step 5: Verify dimensions and commit**

```bash
python -c "
from PIL import Image
for name in ['planet-amber', 'planet-teal', 'planet-violet', 'sun-center', 'moon']:
    im = Image.open(f'assets/img/planets/{name}.png')
    assert im.size == (256, 256), f'{name}: unexpected size {im.size}'
    print(name, 'OK', im.size)
"
```
Expected: 5 lines ending in `OK (256, 256)`.

```bash
git add assets/img/planets/
git commit -m "$(cat <<'EOF'
feat: add Higgsfield-generated planet artwork

5 photoreal images (z_image model): one per cluster color, plus the
center-node sun and the Ask-Marco moon. See
docs/superpowers/specs/2026-07-30-higgsfield-planet-artwork-design.md.
EOF
)"
```

---

### Task 2: Swap CSS gradients for the generated images

**Files:**
- Modify: `assets/css/style.css:291-306` (remove `.node--planet-shaded`/`.node--planet-blotchy` blocks)
- Modify: `assets/css/style.css:333-341` (`.node--center .node-dot`)
- Modify: `assets/css/style.css:350-370` (`.node--color-amber`/`.node--color-teal`/`.node--color-violet`)
- Modify: `assets/css/style.css:382-389` (`.node--project.node--moon .node-dot`)

**Interfaces:**
- Consumes: `assets/img/planets/*.png` from Task 1 (exact filenames: `planet-amber.png`, `planet-teal.png`, `planet-violet.png`, `sun-center.png`, `moon.png`).
- Produces: nothing new consumed by later tasks — CSS class names (`node--color-amber`, `node--color-teal`, `node--color-violet`, `node--center`, `node--project.node--moon`, `node--planet-ringed`) are unchanged, so Task 3 doesn't need to know about this task's internals beyond "the ringed overlay CSS still exists."

- [ ] **Step 1: Remove the now-redundant shaded/blotchy texture overlays**

In `assets/css/style.css`, delete these two blocks (currently lines 291-306, right after the "Planet-texture variants" comment on line 289-290 — keep that comment, it still applies to the ring variant that remains):

```css
.node--planet-shaded .node-dot::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 72% 68%, rgba(0, 0, 0, .65), transparent 60%);
}
.node--planet-blotchy .node-dot::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 22% 62%, rgba(0, 0, 0, .38), transparent 42%),
    radial-gradient(circle at 68% 22%, rgba(255, 255, 255, .28), transparent 38%),
    radial-gradient(circle at 78% 72%, rgba(0, 0, 0, .32), transparent 45%);
  mix-blend-mode: multiply;
}
```

Leave `.node--planet-ringed .node-dot { overflow: visible; }` and its `::before` block immediately below untouched.

- [ ] **Step 2: Point the center node at the sun image**

Replace the `.node--center .node-dot` block:

```css
.node--center .node-dot {
  width: 52px;
  height: 52px;
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 255, 255, .95), transparent 10%),
    radial-gradient(circle at 78% 80%, rgba(0, 0, 0, .35), transparent 55%),
    radial-gradient(circle at 35% 30%, #fff, var(--violet) 60%, #4c3a8f);
  box-shadow: 0 0 14px rgba(167, 139, 250, .7), 0 0 46px rgba(167, 139, 250, .25);
}
```

with:

```css
.node--center .node-dot {
  width: 52px;
  height: 52px;
  background-color: var(--violet);
  background-image: url("../img/planets/sun-center.png");
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 14px rgba(167, 139, 250, .7), 0 0 46px rgba(167, 139, 250, .25);
}
```

`background-color` is the fallback if the image fails to load (e.g. offline, path typo) — without it a failed load would show the near-black scene background through a transparent dot instead of a plain colored glow.

- [ ] **Step 3: Point the 3 cluster color variants at their planet images**

Replace the three color-variant blocks:

```css
.node--project.node--color-amber .node-dot {
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 255, 255, .95), transparent 10%),
    radial-gradient(circle at 78% 80%, rgba(0, 0, 0, .35), transparent 55%),
    radial-gradient(circle at 35% 30%, #fff6db, var(--amber) 55%, #8a5f10);
  box-shadow: 0 0 10px rgba(251, 191, 36, .65), 0 0 32px rgba(251, 191, 36, .22);
}
.node--project.node--color-teal .node-dot {
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 255, 255, .95), transparent 10%),
    radial-gradient(circle at 78% 80%, rgba(0, 0, 0, .35), transparent 55%),
    radial-gradient(circle at 35% 30%, #d9fffa, var(--teal) 55%, #0f766e);
  box-shadow: 0 0 10px rgba(94, 234, 212, .65), 0 0 32px rgba(94, 234, 212, .22);
}
.node--project.node--color-violet .node-dot {
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 255, 255, .95), transparent 10%),
    radial-gradient(circle at 78% 80%, rgba(0, 0, 0, .35), transparent 55%),
    radial-gradient(circle at 35% 30%, #ece7ff, var(--violet) 55%, #4c3a8f);
  box-shadow: 0 0 10px rgba(167, 139, 250, .65), 0 0 32px rgba(167, 139, 250, .22);
}
```

with:

```css
.node--project.node--color-amber .node-dot {
  background-color: var(--amber);
  background-image: url("../img/planets/planet-amber.png");
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 10px rgba(251, 191, 36, .65), 0 0 32px rgba(251, 191, 36, .22);
}
.node--project.node--color-teal .node-dot {
  background-color: var(--teal);
  background-image: url("../img/planets/planet-teal.png");
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 10px rgba(94, 234, 212, .65), 0 0 32px rgba(94, 234, 212, .22);
}
.node--project.node--color-violet .node-dot {
  background-color: var(--violet);
  background-image: url("../img/planets/planet-violet.png");
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 10px rgba(167, 139, 250, .65), 0 0 32px rgba(167, 139, 250, .22);
}
```

- [ ] **Step 4: Point the moon node at the moon image**

Replace:

```css
.node--project.node--moon .node-dot {
  width: 18px;
  height: 18px;
  background:
    radial-gradient(circle at 30% 26%, rgba(255, 255, 255, .95), transparent 12%),
    radial-gradient(circle at 35% 30%, #ffffff, #d8d5ea 55%, #8a86a8);
  box-shadow: 0 0 6px rgba(255, 255, 255, .5), 0 0 16px rgba(255, 255, 255, .25);
}
```

with:

```css
.node--project.node--moon .node-dot {
  width: 18px;
  height: 18px;
  background-color: #d8d5ea;
  background-image: url("../img/planets/moon.png");
  background-size: cover;
  background-position: center;
  box-shadow: 0 0 6px rgba(255, 255, 255, .5), 0 0 16px rgba(255, 255, 255, .25);
}
```

- [ ] **Step 5: Confirm no syntax errors and commit**

Run:
```bash
node --check assets/js/scene.js
python -c "print('css has no JS to check, just eyeball the diff')"
git diff assets/css/style.css
```
Expected: the diff shows exactly the 4 block replacements and the 1 deletion above, nothing else changed. (The `node --check` call is a no-op sanity check here since this task doesn't touch JS — it's included so the step isn't silently a pure eyeball-only step.)

```bash
git add assets/css/style.css
git commit -m "$(cat <<'EOF'
style: use generated planet artwork instead of CSS gradients

Points .node--center/.node--color-*/.node--moon at the images added in
the previous commit; drops the now-redundant shaded/blotchy texture
overlays (the real photos supply their own texture). The ringed overlay
stays for per-node variety.
EOF
)"
```

---

### Task 3: Simplify the ring-variant assignment in scene.js

**Files:**
- Modify: `assets/js/scene.js:257` (`PLANET_TEXTURE_VARIANTS` constant)
- Modify: `assets/js/scene.js:267-346` (`buildNodeLayer`, specifically the `nextPlanetVariant` helper at line ~272-276 and its two call sites at lines 310 and 328)

**Interfaces:**
- Consumes: nothing new — same `nodes`/`projects` inputs `buildNodeLayer` already takes.
- Produces: nothing new consumed elsewhere — `node--planet-ringed` is still the only class name added by this logic, same as `.node--planet-ringed` CSS from Task 2 expects. No other file calls `nextPlanetVariant` or reads `PLANET_TEXTURE_VARIANTS`.

- [ ] **Step 1: Replace the 3-way variant cycle with a 2-way ring toggle**

Replace line 257:
```js
const PLANET_TEXTURE_VARIANTS = ["node--planet-shaded", "node--planet-ringed", "node--planet-blotchy"];
```
with:
```js
// Only one CSS texture overlay remains (the ring) now that real planet
// photos supply their own shading — see docs/superpowers/specs/
// 2026-07-30-higgsfield-planet-artwork-design.md. Alternate it by render
// order (not per-id randomness) so, same as before, it doesn't
// coincidentally land on the same nodes every reload.
const RING_CLASS = "node--planet-ringed";
```

- [ ] **Step 2: Replace the `nextPlanetVariant` helper**

Find (around line 272-276):
```js
  // Cycle through the texture variants in render order (not a content hash)
  // so with only 3 variants and few planet nodes, every variant actually
  // gets used instead of coincidentally landing on the same one repeatedly.
  let planetIndex = 0;
  const nextPlanetVariant = () => PLANET_TEXTURE_VARIANTS[planetIndex++ % PLANET_TEXTURE_VARIANTS.length];
```
Replace with:
```js
  let planetIndex = 0;
  const shouldRing = () => planetIndex++ % 2 === 0;
```

- [ ] **Step 3: Update the two call sites**

Find (around line 309-310, inside the `node.type === "center"` branch):
```js
    if (node.type === "center") {
      el.classList.add(nextPlanetVariant());
```
Replace with:
```js
    if (node.type === "center") {
      if (shouldRing()) el.classList.add(RING_CLASS);
```

Find (around line 328):
```js
      if (node.tier !== "moon") el.classList.add(nextPlanetVariant());
```
Replace with:
```js
      if (node.tier !== "moon" && shouldRing()) el.classList.add(RING_CLASS);
```

- [ ] **Step 4: Syntax-check and run the existing test suite**

```bash
node --check assets/js/scene.js
npm test
```
Expected: `node --check` prints nothing (success), and `npm test` still reports all existing tests passing (this change doesn't touch any tested module, so this is a regression check, not new coverage).

- [ ] **Step 5: Commit**

```bash
git add assets/js/scene.js
git commit -m "$(cat <<'EOF'
refactor: drop shaded/blotchy planet variants, keep ring toggle only

The two removed variants are redundant now that .node-dot uses real
planet photos (previous two commits). The Saturn-ring overlay stays as
a free, image-independent way to add per-node variety within a cluster.
EOF
)"
```

---

### Task 4: Visual verification

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: the full graph scene as rendered after Tasks 1-3.
- Produces: nothing further downstream — this is the last task in the plan.

- [ ] **Step 1: Serve the site locally**

```bash
python -m http.server 8000
```
(Run in the background/a separate terminal — it blocks.)

- [ ] **Step 2: Hard-refresh and inspect at desktop width**

Open `http://localhost:8000/` in a browser at ≥1280px width. Hard refresh (Ctrl+Shift+R — this dev server sends no cache-busting headers, see CLAUDE.md) after the boot sequence completes. Confirm:
- The center "Marco" node shows the sun image, not a flat violet gradient.
- Each cluster's planets show their cluster's photo (amber/teal/violet), not a flat gradient.
- The Ask-Marco moon node shows the moon image.
- Roughly half the planet-like nodes (center + non-moon projects, alternating by render order) show the Saturn-ring overlay on top of the photo; the rest don't.
- No broken-image icons, no layout shift versus before, hover/focus glow still works.

- [ ] **Step 3: Inspect at mobile width**

Resize (or use device toolbar) to 375px width. Confirm the same checks as Step 2 still hold — images stay circular and centered, no overflow or distortion.

- [ ] **Step 4: Stop the dev server**

Stop the `python -m http.server 8000` process (Ctrl+C, or kill the background job) once verification is done. No commit for this task — it's verification-only; if it surfaces a problem, fix it via a follow-up commit on the relevant Task 1-3 file and re-run this task.
