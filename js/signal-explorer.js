import { createSignalPoints, signalTarget } from "./signal-model.js";
import { animate, stagger } from "./vendor/anime.esm.min.js";

export function initSignalExplorer(isMotionOff) {
  const panel = document.getElementById("signal-lab");
  const viewport = document.getElementById("lab-viewport");
  const canvas = document.getElementById("hero-field");
  const ctx = canvas.getContext("2d");
  const density = document.getElementById("lab-density");
  const output = document.getElementById("lab-density-value");
  const modeName = document.getElementById("lab-mode-name");
  const live = document.getElementById("lab-live");
  const coordinates = document.getElementById("lab-coordinates");
  const modeButtons = [...panel.querySelectorAll("[data-lab-mode]")];
  const labels = { scatter: "01 / 자유로운 신호", grid: "02 / 정돈된 구조", orbit: "03 / 연결된 가능성" };
  let mode = "orbit";
  let seed = 37;
  let points = createSignalPoints(seed);
  const positions = points.map(point => {
    const [x, y, z] = signalTarget(point, mode, density.value);
    return { x, y, z };
  });
  let width = 0;
  let height = 0;
  let frame = null;
  let visible = true;
  let previousTime = 0;
  let rotation = .45;
  let morph = null;
  let autoElapsed = 0;
  let autoCycle = true;
  let pulse = 0;
  let pointer = { x: 0, y: 0 };
  let view = { x: 0, y: 0 };
  if (!ctx) {
    modeName.textContent = "이 브라우저에서는 시각화를 표시할 수 없습니다.";
    panel.querySelectorAll("button, input").forEach(control => { control.disabled = true; });
    return { onMotionChange() {} };
  }

  const paint = (elapsed = 16, snap = false) => {
    if (!width || !height) return;
    const reduced = isMotionOff();
    const easing = snap || reduced ? 1 : 1 - Math.exp(-elapsed / 170);
    view.x += (pointer.x - view.x) * easing;
    view.y += (pointer.y - view.y) * easing;
    if (!reduced && !snap) rotation += elapsed * .000085;
    const turn = rotation + (reduced ? 0 : view.x * .36);
    const tilt = -.62 + (reduced ? 0 : view.y * .32);
    const scale = Math.min(width * .35, height * .38);
    if (!reduced && !snap) pulse += elapsed * .0007;
    const projected = points.map((point, index) => {
      const { x, y, z } = positions[index];
      const drift = reduced ? 0 : Math.sin(pulse + point.phase) * .025;
      const rx = x * Math.cos(turn) - z * Math.sin(turn);
      const rz = x * Math.sin(turn) + z * Math.cos(turn);
      const ry = (y + drift) * Math.cos(tilt) - rz * Math.sin(tilt);
      const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
      const perspective = 3.4 / (3.4 - depth);
      return { x: width / 2 + rx * scale * perspective, y: height / 2 + ry * scale * perspective, depth, perspective, index };
    });
    ctx.clearRect(0, 0, width, height);
    // Coordinate rings keep this an abstract data field, with a visible depth cue.
    ctx.strokeStyle = "rgba(211,229,197,.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, scale * 1.28, scale * 1.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([2, 7]);
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, scale * 1.4, scale * 1.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = .7;
    projected.forEach((point, i) => {
      // Short connections expose structure without overwhelming individual points.
      const neighbors = mode === "grid" ? [i + 1, i + 6] : mode === "orbit" ? [Math.floor(i / 24) * 24 + (i + 1) % 24, (i + 24) % 216] : [i + 1, i + 13];
      neighbors.forEach(j => {
        const other = projected[j];
        if (!other || (mode === "grid" && j === i + 1 && i % 6 === 5)) return;
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        const maxDistance = scale * (mode === "scatter" ? .3 : .6);
        if (distance > maxDistance) return;
        const alpha = (1 - distance / maxDistance) * (mode === "scatter" ? .2 : .26);
        ctx.strokeStyle = `rgba(215,255,63,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      });
    });
    projected.sort((a, b) => a.depth - b.depth).forEach(point => {
      const alpha = Math.max(.2, Math.min(1, .65 + point.depth * .45));
      const radius = Math.max(1.3, (scale / 34) * point.perspective);
      const lime = point.index % 9 !== 0;
      ctx.fillStyle = lime ? `rgba(215,255,63,${alpha})` : `rgba(238,247,221,${alpha})`;
      if (point.depth > .65) {
        ctx.shadowColor = "#d7ff3f";
        ctx.shadowBlur = 10;
      }
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(Math.PI / 4 + (reduced ? 0 : turn * .22));
      ctx.beginPath();
      ctx.roundRect(-radius, -radius, radius * 2, radius * 2, radius * .25);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
    });
  };

  const setTargets = (immediate = false) => {
    if (morph) morph.cancel();
    const targets = points.map(point => signalTarget(point, mode, density.value));
    if (immediate || isMotionOff()) {
      positions.forEach((point, index) => {
        [point.x, point.y, point.z] = targets[index];
      });
      morph = null;
    } else {
      morph = animate(positions, {
        x: (_, index) => targets[index][0],
        y: (_, index) => targets[index][1],
        z: (_, index) => targets[index][2],
        duration: 1450,
        delay: stagger(4, { from: "center" }),
        ease: "inOutExpo",
      });
    }
  };
  const setMode = (next, announce = true) => {
    mode = next;
    modeButtons.forEach(item => {
      const selected = item.dataset.labMode === mode;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    modeName.textContent = labels[mode];
    canvas.setAttribute("aria-label", `216개의 가상 데이터 포인트: ${labels[mode].split(" / ")[1]}. 퍼짐 ${density.value}%.`);
    if (announce) live.textContent = `${labels[mode].split(" / ")[1]} 형태로 변경했습니다.`;
    setTargets();
    refresh();
  };

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previousTime = 0;
    if (morph) morph.pause();
  };
  const tick = time => {
    frame = null;
    if (document.hidden || !visible || isMotionOff()) return;
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
    if (autoCycle) {
      autoElapsed += elapsed;
      if (autoElapsed > 5800) {
        autoElapsed = 0;
        const modes = ["orbit", "grid", "scatter"];
        setMode(modes[(modes.indexOf(mode) + 1) % modes.length], false);
      }
    }
    paint(elapsed);
    previousTime = time;
    if (frame === null) frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (frame === null && visible && !document.hidden && !isMotionOff()) {
      if (morph && !morph.completed) morph.resume();
      frame = requestAnimationFrame(tick);
    }
  };
  const refresh = () => {
    if (isMotionOff()) paint(16, true);
    else start();
  };
  const resize = () => {
    width = viewport.clientWidth;
    height = viewport.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(16, true);
  };
  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      autoCycle = false;
      setMode(button.dataset.labMode);
    });
  });
  density.addEventListener("input", () => {
    autoCycle = false;
    setTargets(true);
    output.value = `${density.value}%`;
    canvas.setAttribute("aria-label", `216개의 가상 데이터 포인트: ${labels[mode].split(" / ")[1]}. 퍼짐 ${density.value}%.`);
    refresh();
  });
  document.getElementById("lab-reset").addEventListener("click", () => {
    autoCycle = false;
    points = createSignalPoints(++seed);
    live.textContent = `새로운 데이터 패턴 ${seed - 37}을 만들었습니다.`;
    setMode("scatter", false);
  });
  viewport.addEventListener("pointermove", event => {
    const rect = viewport.getBoundingClientRect();
    pointer = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 };
    coordinates.textContent = `X ${pointer.x.toFixed(2)} / Y ${pointer.y.toFixed(2)}`;
  }, { passive: true });
  viewport.addEventListener("pointerleave", () => {
    pointer = { x: 0, y: 0 };
    coordinates.textContent = "X 0.00 / Y 0.00";
  });
  panel.addEventListener("focusin", () => { autoCycle = false; });
  panel.addEventListener("pointerdown", () => { autoCycle = false; });
  new ResizeObserver(resize).observe(viewport);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) refresh();
    else stop();
  }).observe(panel);
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : refresh());
  resize();
  start();
  return { onMotionChange() { stop(); setTargets(true); refresh(); } };
}
