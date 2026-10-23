import { PROJECTS, STACK } from "./portfolio-data.js";
import { filterProjects } from "./signal-model.js";

const GITHUB_USER = "csk200387";
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const hasHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

// -------------------------------------------------------
// Motion preference: OS setting first, manual toggle overrides
// -------------------------------------------------------
const reducedMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let savedMotion = null;
try { savedMotion = localStorage.getItem("motion"); } catch { /* Storage can be unavailable in private contexts. */ }
let motionOff = savedMotion ? savedMotion === "off" : reducedMotionQuery.matches;
const isMotionOff = () => motionOff;
let art = null;

const applyMotionState = () => {
  document.body.classList.toggle("motion-off", motionOff);
  $("motion-toggle").setAttribute("aria-pressed", String(motionOff));
  $("motion-label").textContent = motionOff ? "off" : "on";
  if (motionOff) blocks.forEach(finish);
  art?.onMotionChange();
};

// -------------------------------------------------------
// Terminal blocks type their command when scrolled into view
// -------------------------------------------------------
// Each word gets its own mask so it can lift into view (SEED landing RevealText).
const splitWords = el => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let i = 0;
  nodes.forEach(node => {
    const words = node.textContent.split(/(\s+)/).filter(Boolean).map(part => {
      if (/^\s+$/.test(part)) return part;
      const mask = document.createElement("span"), word = document.createElement("span");
      mask.className = "w";
      word.textContent = part;
      word.style.setProperty("--i", i++);
      mask.append(word);
      return mask;
    });
    node.replaceWith(...words);
  });
};

const blocks = [...document.querySelectorAll(".blk")];
const finish = blk => {
  if (!blk.classList.contains("pending")) return;
  blk.querySelector(".typed").textContent = blk.dataset.cmd;
  blk.classList.replace("pending", "done");
};
const type = blk => {
  if (motionOff) return finish(blk);
  const cmd = blk.dataset.cmd, typed = blk.querySelector(".typed");
  let i = 0;
  const id = setInterval(() => {
    if (!blk.classList.contains("pending")) return clearInterval(id);
    typed.textContent = cmd.slice(0, ++i);
    if (i >= cmd.length) { clearInterval(id); setTimeout(() => finish(blk), 250); }
  }, 45);
};
const blockObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  blockObserver.unobserve(entry.target);
  type(entry.target);
}), { rootMargin: "0px 0px -15% 0px" });
blocks.forEach(blk => {
  blk.insertAdjacentHTML("afterbegin", '<p class="cmd" aria-hidden="true"><span class="ps">csk@portfolio:~$</span> <span class="typed"></span><span class="caret"></span></p>');
  blk.classList.add("pending");
  blk.querySelectorAll("[data-reveal]").forEach(splitWords);
  // Keyboard users never wait on the typing animation.
  blk.addEventListener("focusin", () => finish(blk));
  blockObserver.observe(blk);
});
applyMotionState();

$("year").textContent = new Date().getFullYear();
$("stat-projects").textContent = PROJECTS.length;
$("stat-live").textContent = PROJECTS.filter(p => p.live).length;

const tickClock = () => { $("clock").textContent = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Seoul" }); };
tickClock();
setInterval(tickClock, 1000);

$("stack-json").innerHTML = `{\n${STACK.map(g => `  <span class="k">"${g.group}"</span>: [${g.items.map(item => `<span class="s">"${item}"</span>`).join(", ")}]`).join(",\n")}\n}`;

// -------------------------------------------------------
// GitHub data (shared by the repo log + dialog metrics)
// -------------------------------------------------------
let repoDataPromise = null;
const loadRepoData = () => {
  repoDataPromise ??= fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, {
    headers: { Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(8000),
  })
    .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
    .then(repos => ({ repos, byName: new Map(repos.map(r => [r.name, r])) }))
    .catch(() => null);
  return repoDataPromise;
};

const relative = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
const since = date => {
  const days = Math.round((new Date(date) - Date.now()) / 864e5);
  if (Math.abs(days) < 30) return relative.format(days, "day");
  return Math.abs(days) < 365 ? relative.format(Math.round(days / 30), "month") : relative.format(Math.round(days / 365), "year");
};

loadRepoData().then(data => {
  const repos = data?.repos
    .filter(r => !r.fork)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 8);
  const rows = repos?.length
    ? repos.map(r => ({ name: r.name, stars: r.stargazers_count, lang: r.language || "—", when: since(r.pushed_at), fresh: Date.now() - new Date(r.pushed_at) < 90 * 864e5 }))
    : PROJECTS.map(p => ({ name: p.repo, stars: "–", lang: "—", when: "", fresh: false }));
  $("repo-list").innerHTML = rows.map(r => `
    <li><a class="row repo" href="https://github.com/${GITHUB_USER}/${encodeURIComponent(r.name)}" target="_blank" rel="noreferrer" data-cursor-text="GitHub ↗">
      <span class="dot${r.fresh ? " is-fresh" : ""}" aria-hidden="true">●</span><span class="nm">${escapeHTML(r.name)}</span><span class="lang">${escapeHTML(r.lang)}</span><span>★ ${r.stars}</span><span class="when">${r.when}</span>
    </a></li>`).join("");
  $("repo-caption").textContent = repos?.length
    ? `GitHub API에서 불러온 ${rows.length}개 저장소 · ● 최근 90일 내 활동`
    : "GitHub API에 연결할 수 없어 프로젝트 목록으로 대신합니다.";
});

// -------------------------------------------------------
// Projects: segmented filter + grep search
// -------------------------------------------------------
const projectList = $("project-list");
const projectSearch = $("project-search");
const seg = $("project-filters");
const segButtons = [...seg.querySelectorAll("[data-filter]")];
let activeFilter = "all";

segButtons.forEach(button => { button.querySelector(".count").textContent = pad(filterProjects(PROJECTS, button.dataset.filter).length); });
// The indicator slides between options (SEED SegmentedControl).
const moveIndicator = () => {
  const selected = seg.querySelector('[aria-pressed="true"]');
  seg.style.setProperty("--x", `${selected.offsetLeft}px`);
  seg.style.setProperty("--w", `${selected.offsetWidth}px`);
};
moveIndicator();
document.fonts.ready.then(moveIndicator);
addEventListener("resize", moveIndicator, { passive: true });

const renderProjects = () => {
  const visible = filterProjects(PROJECTS, activeFilter, projectSearch.value);
  const query = projectSearch.value.trim();
  projectList.innerHTML = visible.length
    ? visible.map(p => `
      <li><button class="row" type="button" data-index="${PROJECTS.indexOf(p)}" aria-haspopup="dialog" data-cursor-text="open →">
        <span class="perm" aria-hidden="true">drwxr-xr-x</span><span class="st${p.live ? " is-live" : ""}">${p.live ? "live" : "repo"}</span><span class="nm">${p.repo}/</span><span class="ds">${p.tagline}</span>
      </button></li>`).join("")
    : '<li class="empty">grep: 일치하는 프로젝트가 없습니다. <button class="text-btn" type="button" id="project-reset">[reset]</button></li>';
  $("project-results").textContent = `total ${visible.length}${query ? ` · “${query}”` : ""}`;
};

const setFilter = filter => {
  activeFilter = filter;
  segButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
  moveIndicator();
  renderProjects();
};
segButtons.forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
projectSearch.addEventListener("input", renderProjects);
projectList.addEventListener("click", event => {
  if (event.target.closest("#project-reset")) {
    projectSearch.value = "";
    setFilter("all");
    projectSearch.focus();
    return;
  }
  const row = event.target.closest("[data-index]");
  if (row) openProject(Number(row.dataset.index), row);
});
renderProjects();

// -------------------------------------------------------
// Project dialog (bottom sheet on phones)
// -------------------------------------------------------
const dialog = $("project-dialog");
const dialogBody = $("dialog-body");
let lastTrigger = null;
let currentProject = null;
let dialogSequence = 0;

const renderMetrics = repoInfo => repoInfo
  ? `<dl class="metrics">
      <div><dt>stars</dt><dd>${repoInfo.stargazers_count}</dd></div>
      <div><dt>language</dt><dd>${escapeHTML(repoInfo.language || "—")}</dd></div>
      <div><dt>updated</dt><dd>${new Date(repoInfo.pushed_at).toLocaleDateString("ko-KR")}</dd></div>
    </dl>`
  : '<p class="dim total">지금은 GitHub 지표를 불러올 수 없습니다. 저장소에서 직접 확인할 수 있습니다.</p>';

const renderDialog = project => {
  const index = PROJECTS.indexOf(project);
  $("dialog-path").textContent = `cat ./${project.repo}/README.md`;
  dialogBody.innerHTML = `
    <h2 class="sheet-title" id="dialog-title">${project.name}</h2>
    <p class="sheet-tagline">${project.tagline}</p>
    <p class="sheet-desc">${project.description}</p>
    <p class="tags">${project.tags.map(t => `<span>#${t}</span>`).join("")}</p>
    <div id="dialog-metrics" aria-live="polite"><p class="dim total">fetching metrics…</p></div>
    <div class="sheet-links">
      <a href="${project.github}" target="_blank" rel="noreferrer" data-cursor-text="GitHub ↗">[github ↗]</a>
      ${project.live ? `<a href="${project.live}" target="_blank" rel="noreferrer">[live demo ↗]</a>` : ""}
    </div>
    <div class="sheet-nav">
      <button class="text-btn" type="button" data-dialog-step="-1" ${index === 0 ? "disabled" : ""}>← prev</button>
      <span class="dim">${pad(index + 1)} / ${pad(PROJECTS.length)}</span>
      <button class="text-btn" type="button" data-dialog-step="1" ${index === PROJECTS.length - 1 ? "disabled" : ""}>next →</button>
    </div>`;
};

const openProject = (index, trigger) => {
  const project = PROJECTS[index];
  if (!project) return;
  currentProject = project;
  const sequence = ++dialogSequence;
  if (trigger) lastTrigger = trigger;
  renderDialog(project);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  loadRepoData().then(data => {
    if (dialog.open && sequence === dialogSequence) $("dialog-metrics").innerHTML = renderMetrics(data?.byName.get(project.repo));
  });
};

dialogBody.addEventListener("click", event => {
  const button = event.target.closest("[data-dialog-step]");
  if (!button || !currentProject) return;
  const step = Number(button.dataset.dialogStep);
  openProject(PROJECTS.indexOf(currentProject) + step);
  const nextButton = dialogBody.querySelector(`[data-dialog-step="${step}"]`);
  (nextButton.disabled ? dialog.querySelector("[type=submit]") : nextButton).focus();
});
dialog.addEventListener("close", () => {
  dialogSequence++;
  currentProject = null;
  if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true });
});

// Native dialogs close on Escape; also close on a backdrop click.
const closeOnBackdrop = target => target.addEventListener("click", event => {
  const rect = target.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) target.close();
});
closeOnBackdrop(dialog);

// -------------------------------------------------------
// Quick navigation (⌘K / Ctrl K)
// -------------------------------------------------------
const quickDialog = $("quick-dialog");
const quickSearch = $("quick-search");
const quickResults = $("quick-results");
const quickOpen = $("quick-open");
let quickTrigger = quickOpen;
let quickMatches = [];
const quickItems = [
  { name: "~ whoami", section: "top", group: "cd" },
  { name: "./projects · 프로젝트", section: "projects", group: "cd" },
  { name: "gh repo list · GitHub 활동", section: "log", group: "cd" },
  { name: "about.md · 소개", section: "about", group: "cd" },
  { name: "stack.json · 기술 스택", section: "stack", group: "cd" },
  { name: "contact.sh · 연락", section: "contact", group: "cd" },
  ...PROJECTS.map((project, index) => ({ name: project.name, keywords: `${project.repo} ${project.tagline} ${project.tags.join(" ")}`, index, group: "open" })),
];
const renderQuickResults = () => {
  const query = quickSearch.value.trim().toLocaleLowerCase();
  quickMatches = quickItems.filter(item => `${item.name} ${item.keywords || ""}`.toLocaleLowerCase().includes(query));
  quickResults.innerHTML = quickMatches.map((item, i) => `<button type="button" data-quick-index="${i}"><span>${escapeHTML(item.name)}</span><small>${item.group}</small></button>`).join("");
  $("quick-empty").hidden = quickMatches.length !== 0;
};
const openQuick = () => {
  if (dialog.open || quickDialog.open) return;
  quickTrigger = document.activeElement;
  quickSearch.value = "";
  renderQuickResults();
  quickDialog.showModal();
  quickSearch.focus();
};
quickOpen.addEventListener("click", openQuick);
quickSearch.addEventListener("input", renderQuickResults);
quickDialog.addEventListener("close", () => {
  if (!dialog.open && quickTrigger?.isConnected) quickTrigger.focus({ preventScroll: true });
});
quickResults.addEventListener("click", event => {
  const button = event.target.closest("[data-quick-index]");
  if (!button) return;
  const item = quickMatches[Number(button.dataset.quickIndex)];
  quickDialog.close();
  if (item.section) {
    const section = $(item.section);
    section.scrollIntoView({ behavior: motionOff ? "instant" : "smooth" });
    // Restore focus to the destination after the native dialog restores its trigger.
    requestAnimationFrame(() => {
      section.tabIndex = -1;
      section.focus({ preventScroll: true });
    });
  } else openProject(item.index, quickOpen);
});
quickDialog.addEventListener("keydown", event => {
  const buttons = [...quickResults.querySelectorAll("button")];
  if (!buttons.length) return;
  const current = buttons.indexOf(document.activeElement);
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const down = event.key === "ArrowDown";
    buttons[current === -1 ? (down ? 0 : buttons.length - 1) : (current + (down ? 1 : -1) + buttons.length) % buttons.length].focus();
  } else if (event.key === "Enter" && document.activeElement === quickSearch) {
    event.preventDefault();
    buttons[0].click();
  }
});
closeOnBackdrop(quickDialog);
quickOpen.textContent = !hasHover ? "[⌕]" : /Mac|iPhone|iPad/.test(navigator.platform) ? "[⌘K]" : "[ctrl K]";
document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (quickDialog.open) quickDialog.close();
    else openQuick();
  }
});

// -------------------------------------------------------
// Copy link → snackbar (SEED Snackbar)
// -------------------------------------------------------
const snackbar = $("snackbar");
let snackTimer = 0;
const toast = message => {
  snackbar.textContent = message;
  snackbar.classList.add("is-open");
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => snackbar.classList.remove("is-open"), 3000);
};
$("copy-profile").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(`https://github.com/${GITHUB_USER}`);
    toast("✓ 프로필 링크를 복사했습니다.");
  } catch {
    toast(`복사할 수 없습니다: https://github.com/${GITHUB_USER}`);
  }
});

// -------------------------------------------------------
// Cursor (SEED landing CustomCursor): caret → selection box over controls → labelled tag over rows
// -------------------------------------------------------
if (hasHover) {
  const cursor = $("cursor");
  const label = cursor.firstElementChild;
  const PILLS = ["var(--acc)", "var(--warm)"];
  const pos = { x: -100, y: -100 }, aim = { x: -100, y: -100 };
  let frame = 0, hovered = null;
  const follow = () => {
    pos.x += (aim.x - pos.x) * 0.35;
    pos.y += (aim.y - pos.y) * 0.35;
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    frame = Math.abs(aim.x - pos.x) + Math.abs(aim.y - pos.y) > 0.2 ? requestAnimationFrame(follow) : 0;
  };
  addEventListener("pointermove", event => {
    aim.x = event.clientX;
    aim.y = event.clientY;
    frame ||= requestAnimationFrame(follow);
  }, { passive: true });
  document.addEventListener("pointerover", event => {
    const hit = event.target.closest("input, a, button, [data-cursor], [data-cursor-text]");
    if (hit === hovered) return;
    hovered = hit;
    const text = hit?.dataset.cursorText;
    cursor.dataset.mode = !hit ? "dot" : hit.matches("input") ? "off" : text ? "text" : "ring";
    // The tag color is picked once per target, so moving inside a row doesn't reshuffle it.
    if (text) {
      label.textContent = text;
      cursor.style.setProperty("--pill", PILLS[Math.random() * PILLS.length | 0]);
    }
  });
  document.documentElement.addEventListener("pointerleave", () => { hovered = null; cursor.dataset.mode = "off"; });
  document.documentElement.classList.add("has-cursor");
}

// -------------------------------------------------------
// Motion toggle + the ASCII art (three.js from CDN; the static banner stays if it fails)
// -------------------------------------------------------
const setMotion = off => {
  motionOff = off;
  applyMotionState();
};
$("motion-toggle").addEventListener("click", () => {
  savedMotion = motionOff ? "on" : "off";
  try { localStorage.setItem("motion", savedMotion); } catch { /* Keep the current preference in memory. */ }
  setMotion(savedMotion === "off");
});
reducedMotionQuery.addEventListener("change", event => { if (savedMotion === null) setMotion(event.matches); });

import("./ascii-art.js")
  .then(module => module.initAsciiArt(isMotionOff))
  .then(controller => { art = controller; })
  .catch(error => console.warn("ASCII art unavailable:", error));
