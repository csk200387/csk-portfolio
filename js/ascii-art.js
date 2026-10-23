// A 3D "CSK" rendered small with three.js, read back, and turned into characters every frame.
import * as THREE from "three";

const COLS = 84, S = COLS * 4, INK = ":-=+*#%@", SHADE = "#*+=-:·.", GLYPH = "01<>/\\{}[]#*+=?$%";
const rnd = () => GLYPH[Math.random() * GLYPH.length | 0];

// "CSK" in NanumBarunGothic Regular — glyph outlines extracted once with opentype.js (1em = 100 units, y-up)
const CSK_PATH = "M60.1 12.5C60.9 13.1 61.4 12.9 61.4 12.1L61.4 3.3C55.2 -2 47.2 -4.5 37.8 -4.5C16.2 -4.5 3.5 11.1 3.5 34.2C3.5 58.3 18.5 73 39 73C47.7 73 54.7 71.3 60.8 66.5L60.8 57.3C60.8 56.4 60.2 56.2 59.5 56.9C54.3 62.6 47.7 65.5 39.6 65.5C24.6 65.5 12.8 54.6 12.8 34.7C12.8 14 22.3 3.2 39.3 3.2C47.3 3.2 54.3 6.4 60.1 12.5ZM69.7 2.1L69.7 11.8C69.7 12.6 70.2 12.8 70.8 12.2C76.9 5.8 83 3.4 91.1 3.4C102 3.4 107.5 7.4 107.5 16.5C107.5 23.1 102.1 27.2 94.2 30.9L87.1 34C77 38.4 70.3 43.6 70.3 54.6C70.3 67.1 81.1 73.2 94.3 73.2C100.6 73.2 108 71.7 113.4 67.8L113.4 60.4C113.4 59.4 112.8 59.1 112.2 59.8C106.8 63.7 101.7 65.5 94.7 65.5C85.3 65.5 79.6 62.2 79.6 54.9C79.6 48.2 84.8 44.5 91.5 42L98.7 38.8C110.9 33.4 117.2 27 117.2 17.1C117.2 2.2 106.6 -4.5 90.9 -4.5C82.1 -4.5 75.1 -2.7 69.7 2.1ZM155.2 41.3L155.2 41.2L185.6 -3.6L174.8 -3.6L149.3 35.7L149.2 35.7L140.4 26.4L140.4 -3.6L131.6 -3.6L131.6 72.1L140.4 72.1L140.4 36.8L140.5 36.8L172.8 72.1L183.4 72.1Z";

function cskGeometry(depth) {
  const shapes = []; let s;
  for (const [, cmd, args] of CSK_PATH.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const n = (args.match(/-?[\d.]+/g) || []).map(Number);
    if (cmd === "M") shapes.push(s = new THREE.Shape().moveTo(n[0], n[1]));
    else if (cmd === "L") s.lineTo(n[0], n[1]);
    else if (cmd === "C") s.bezierCurveTo(...n);
  }
  // ponytail: one Shape per contour — fine for C/S/K (no counters); letters with holes need ShapePath.toShapes
  const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 16 });
  g.computeBoundingBox(); const b = g.boundingBox;
  g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -depth);  // centered, front face at z=0
  return g;
}

// Eye at (ex, ey) but still looking straight down -z: the face stays undistorted and the depth
// recedes toward the vanishing point — a 3D long shadow. Lens shift puts the word at ndc (cx, cy).
function eyeAt(camera, ex, ey, cx = 0, cy = 0) {
  camera.position.x = ex; camera.position.y = ey; camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  const e = camera.projectionMatrix.elements, D = camera.position.z;
  e[8] = -e[0] * ex / D - cx; e[9] = -e[5] * ey / D - cy;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

export async function initAsciiArt(isMotionOff) {
  const art = document.getElementById("art"), inkEl = document.getElementById("ink"), shEl = document.getElementById("sh");

  // Throws without WebGL; the caller keeps the static fallback banner.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1); renderer.setSize(S, S, false); renderer.setClearColor("#ffffff");
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
  camera.position.z = 470;
  // face: pure black → "ink" layer · sides: lit grey → "shade" layer.
  // The graphic view shows the scene itself in the GitHub avatar's colors: black on white, a flat #f0f0f0 shadow.
  const face = new THREE.MeshBasicMaterial({ color: "#000000" }), litSides = new THREE.MeshLambertMaterial({ color: "#d4d4d4" }), flatSides = new THREE.MeshBasicMaterial({ color: "#f0f0f0" });
  const mesh = new THREE.Mesh(cskGeometry(900), [face, litSides]);
  scene.add(mesh);
  const sun = new THREE.DirectionalLight("#ffffff", 2.2); sun.position.set(-1, 1.4, 1);
  scene.add(sun, new THREE.AmbientLight("#ffffff", 0.9));
  const readCtx = Object.assign(document.createElement("canvas"), { width: S, height: S }).getContext("2d", { willReadFrequently: true });

  await document.fonts.load('16px "IBM Plex Mono"').catch(() => {});
  const probe = document.createElement("span");
  probe.style.cssText = 'position:absolute;visibility:hidden;font:100px "IBM Plex Mono",monospace;white-space:pre';
  probe.textContent = "M".repeat(50); document.body.appendChild(probe);
  const charEm = probe.getBoundingClientRect().width / 5000; probe.remove();
  const ROWS = Math.round(COLS * charEm / 1.15);              // square box: rows × line-height = cols × char width
  const heat = new Float32Array(COLS * ROWS);
  // decode sweeps from top-left to bottom-right, following the shadow
  const at = Float32Array.from({ length: COLS * ROWS }, (_, i) => 200 + ((i / COLS | 0) / ROWS + (i % COLS) / COLS) * 1100 + Math.random() * 350);
  const aim = { x: 0, y: 0 }, vp = { x: 150, y: -150 };
  let t0 = performance.now(), graphic = false;

  const draw = now => {
    const still = isMotionOff();
    const t = still ? Infinity : now - t0, wob = still ? 0 : now * 0.001, k = still ? 1 : 0.06;
    // the vanishing point drifts (and follows the pointer), so the shadow keeps turning
    vp.x += (150 + Math.sin(wob * 0.5) * 70 - aim.x * 300 - vp.x) * k;
    vp.y += (-150 + Math.sin(wob * 0.7) * 50 + aim.y * 300 - vp.y) * k;
    eyeAt(camera, vp.x, vp.y, 0, 0.05);  // centered like the GitHub avatar (50% across, 47.5% down)
    renderer.render(scene, camera);
    if (graphic) return;
    readCtx.drawImage(renderer.domElement, 0, 0);
    const d = readCtx.getImageData(0, 0, S, S).data, cw = S / COLS, ch = S / ROWS;
    let a = "", b = "";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let ink = 0, sh = 0, shL = 0, n = 0;
        for (let y = r * ch | 0; y < (r + 1) * ch; y += 2) for (let x = c * cw | 0; x < (c + 1) * cw; x++) {
          const l = d[(y * S + x) * 4 + 1]; n++;
          if (l < 40) ink++; else if (l < 252) { sh++; shL += l; }
        }
        const i = r * COLS + c;
        let ic = ink / n > 0.12 ? INK[Math.min(INK.length - 1, ink / n * INK.length * 1.6 | 0)] : " ";
        let sc = ic === " " && sh / n > 0.3 ? SHADE[Math.min(SHADE.length - 1, (shL / sh - 40) / 212 * SHADE.length | 0)] : " ";
        if (t < at[i]) { const near = t > at[i] - 450; ic = ic !== " " && near ? rnd() : " "; sc = sc !== " " && near ? rnd() : " "; }
        if (heat[i] > 0.2) { heat[i] *= 0.9; if (ic !== " ") ic = rnd(); else if (Math.random() < heat[i]) sc = rnd(); }
        a += ic; b += sc;
      }
      a += "\n"; b += "\n";
    }
    inkEl.textContent = a; shEl.textContent = b;
  };

  // One loop, running only while the art is on screen and motion is allowed.
  let running = false, visible = true;
  const loop = now => { if (!running) return; draw(now); requestAnimationFrame(loop); };
  const sync = () => {
    const live = visible && !isMotionOff();
    if (live && !running) { running = true; requestAnimationFrame(loop); }
    if (!live) running = false;
    if (isMotionOff()) { aim.x = aim.y = 0; heat.fill(0); draw(0); }
  };

  const cellAt = e => { const r = art.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * COLS, (e.clientY - r.top) / r.height * ROWS]; };
  art.addEventListener("pointermove", e => {
    if (isMotionOff()) return;
    const [mc, mr] = cellAt(e);
    aim.x = mc / COLS - 0.5; aim.y = mr / ROWS - 0.5;
    if (graphic) return;  // the scramble is an ASCII-only effect
    for (let r = Math.max(0, mr - 4 | 0); r < Math.min(ROWS, mr + 5); r++)
      for (let c = Math.max(0, mc - 7 | 0); c < Math.min(COLS, mc + 8); c++)
        if (Math.hypot(c - mc, (r - mr) * 1.8) < 6.5) heat[r * COLS + c] = 1;
  });
  art.addEventListener("pointerleave", () => { aim.x = aim.y = 0; });
  art.addEventListener("pointerdown", () => { if (!isMotionOff()) t0 = performance.now(); });

  // ASCII ⇄ graphic: the canvas itself is shown, sized for the screen.
  const paint = () => {
    mesh.material = [face, graphic ? flatSides : litSides];
    const size = graphic ? Math.round(art.clientWidth * Math.min(devicePixelRatio, 2)) : S;
    renderer.setSize(size, size, false);
    if (isMotionOff()) draw(0);
  };
  const viewButton = document.getElementById("art-view");
  viewButton.addEventListener("click", () => {
    graphic = !graphic;
    art.closest(".art-col").classList.toggle("is-graphic", graphic);
    viewButton.setAttribute("aria-pressed", String(graphic));
    document.getElementById("dims").textContent = graphic ? "WebGL" : `${COLS}×${ROWS} chars`;
    document.getElementById("art-hint").textContent = graphic ? "hover to steer the shadow" : "hover · click to re-decode";
    t0 = performance.now();  // back in ASCII, the decode sweep replays
    paint();
  });
  art.prepend(renderer.domElement);
  viewButton.hidden = false;

  const fit = () => { inkEl.style.fontSize = shEl.style.fontSize = art.clientWidth / (COLS * charEm) + "px"; };
  inkEl.classList.remove("fallback");
  document.getElementById("dims").textContent = `${COLS}×${ROWS} chars`;
  fit(); addEventListener("resize", () => { fit(); if (graphic) paint(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(art);
  sync();
  return { onMotionChange: sync };
}
