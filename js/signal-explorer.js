import { createSignalPoints, signalTarget } from "./signal-model.js";

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
  let mode = "scatter";
  let seed = 37;
  let points = createSignalPoints(seed);
  let positions = points.map(point => signalTarget(point, mode, density.value));
  let width = 0;
  let height = 0;
  let frame = null;
  let visible = true;
  let previousTime = 0;
  let rotation = .45;
  let pointer = { x: 0, y: 0 };
  let view = { x: 0, y: 0 };
  if (!ctx) {
    modeName.textContent = "이 브라우저에서는 시각화를 표시할 수 없습니다.";
    panel.querySelectorAll("button, input").forEach(control => { control.disabled = true; });
    return { onMotionChange() {} };
  }

  const paint = (elapsed = 16, snap = false) => {
    const reduced = isMotionOff();
    const easing = snap || reduced ? 1 : 1 - Math.exp(-elapsed / 170);
    view.x += (pointer.x - view.x) * easing;
    view.y += (pointer.y - view.y) * easing;
    if (!reduced && !snap) rotation += elapsed * .000085;
    const turn = rotation + (reduced ? 0 : view.x * .36);
    const tilt = -.2 + (reduced ? 0 : view.y * .28);
    const scale = Math.min(width * .4, height * .4);
    const projected = points.map((point, index) => {
      const target = signalTarget(point, mode, density.value);
      positions[index] = positions[index].map((value, axis) => value + (target[axis] - value) * easing);
      const [x, y, z] = positions[index];
      const rx = x * Math.cos(turn) - z * Math.sin(turn);
      const rz = x * Math.sin(turn) + z * Math.cos(turn);
      const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
      const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
      const perspective = 3.4 / (3.4 - depth);
      return { x: width / 2 + rx * scale * perspective, y: height / 2 + ry * scale * perspective, depth, index };
    });
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = .65;
    projected.forEach((point, i) => {
      // Short connections expose structure without overwhelming individual points.
      const neighbors = mode === "grid" ? [i + 1, i + 6] : [i + 1, i + 13];
      neighbors.forEach(j => {
        const other = projected[j];
        if (!other || (mode === "grid" && j === i + 1 && i % 6 === 5)) return;
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        const maxDistance = mode === "scatter" ? 45 : 85;
        if (distance > maxDistance) return;
        const alpha = (1 - distance / maxDistance) * (mode === "scatter" ? .25 : .4);
        ctx.strokeStyle = `rgba(91,232,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      });
    });
    projected.sort((a, b) => a.depth - b.depth).forEach(point => {
      const alpha = Math.max(.2, Math.min(1, .6 + point.depth * .35));
      const radius = Math.max(.7, 1.8 + point.depth * .75);
      const lime = point.index % 5 !== 0;
      ctx.fillStyle = lime ? `rgba(215,255,63,${alpha})` : `rgba(91,232,255,${alpha})`;
      if (point.depth > .55) {
        ctx.shadowColor = lime ? "#d7ff3f" : "#5be8ff";
        ctx.shadowBlur = 7;
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previousTime = 0;
  };
  const tick = time => {
    frame = null;
    if (document.hidden || !visible || isMotionOff()) return;
    paint(previousTime ? Math.min(time - previousTime, 50) : 16);
    previousTime = time;
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (frame === null && visible && !document.hidden && !isMotionOff()) frame = requestAnimationFrame(tick);
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
      mode = button.dataset.labMode;
      modeButtons.forEach(item => {
        const selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      modeName.textContent = labels[mode];
      canvas.setAttribute("aria-label", `216개의 가상 데이터 포인트: ${labels[mode].split(" / ")[1]}. 퍼짐 ${density.value}%.`);
      live.textContent = `${labels[mode].split(" / ")[1]} 형태로 변경했습니다.`;
      refresh();
    });
  });
  density.addEventListener("input", () => {
    output.value = `${density.value}%`;
    canvas.setAttribute("aria-label", `216개의 가상 데이터 포인트: ${labels[mode].split(" / ")[1]}. 퍼짐 ${density.value}%.`);
    refresh();
  });
  document.getElementById("lab-reset").addEventListener("click", () => {
    points = createSignalPoints(++seed);
    live.textContent = `새로운 데이터 패턴 ${seed - 37}을 만들었습니다.`;
    refresh();
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
  new ResizeObserver(resize).observe(viewport);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) refresh();
    else stop();
  }).observe(panel);
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : refresh());
  resize();
  start();
  return { onMotionChange() { stop(); refresh(); } };
}
