(() => {
  "use strict";

  const GITHUB_USER = "csk200387";

  const PROJECTS = [
    {
      repo: "tabular-lens",
      name: "Tabular Lens",
      tagline: "로컬 우선 CSV/JSON 데이터 품질 프로파일러",
      description:
        "CSV·JSON 파일을 업로드하면 브라우저 안에서 스키마, 결측치, 이상치, 컬럼 분포를 분석합니다. 파일이 서버로 전송되지 않아 민감한 데이터도 안전하게 점검할 수 있습니다.",
      tags: ["Data Quality", "Local-first", "CSV/JSON"],
      type: ["data", "tool"],
      github: "https://github.com/csk200387/tabular-lens",
      live: "https://csk200387.github.io/tabular-lens/",
    },
    {
      repo: "netflix-stats-viewer",
      name: "Netflix Stats Viewer",
      tagline: "프라이버시 우선 시청 기록 통계 대시보드",
      description:
        "넷플릭스에서 내려받은 시청 기록 파일을 업로드해 개인 시청 패턴을 시각화합니다. 데이터는 외부로 전송되지 않고 클라이언트에서만 처리됩니다.",
      tags: ["Privacy-first", "Dashboard", "Data Viz"],
      type: ["data"],
      github: "https://github.com/csk200387/netflix-stats-viewer",
      live: null,
    },
    {
      repo: "speedrun-igt-dashboard",
      name: "Speedrun IGT Dashboard",
      tagline: "마인크래프트 스피드런 기록 분석 대시보드",
      description:
        "마인크래프트 스피드런의 IGT(In-Game Time) 기록을 카테고리별로 모아 추이와 분포를 인터랙티브하게 탐색할 수 있는 대시보드입니다.",
      tags: ["Speedrun", "Analytics", "Interactive"],
      type: ["data"],
      github: "https://github.com/csk200387/speedrun-igt-dashboard",
      live: "https://csk200387.github.io/speedrun-igt-dashboard/",
    },
    {
      repo: "placepicker",
      name: "Placepicker",
      tagline: "약속 장소 중간지점 추천 서비스",
      description:
        "여러 명의 출발 위치를 입력하면 서로 만나기 편리한 중간 지점을 추천해주는 웹 앱입니다.",
      tags: ["Location", "Web App"],
      type: ["tool"],
      github: "https://github.com/csk200387/placepicker",
      live: "https://placepicker-alpha.vercel.app",
    },
    {
      repo: "AnniCal",
      name: "AnniCal",
      tagline: "모든 기념일을 한눈에",
      description:
        "연인, 가족, 친구와의 다양한 기념일을 등록하고 D-day를 추적·관리할 수 있는 캘린더 앱입니다.",
      tags: ["Calendar", "Web App"],
      type: ["tool"],
      github: "https://github.com/csk200387/AnniCal",
      live: "https://annical.vercel.app/",
    },
  ];

  const STACK = [
    { group: "언어", items: ["Python", "JavaScript", "SQL", "TypeScript"] },
    { group: "데이터 · ML", items: ["Pandas", "NumPy", "scikit-learn"] },
    { group: "웹", items: ["HTML/CSS", "Node.js"] },
    { group: "도구", items: ["Git", "GitHub Actions", "Vercel"] },
  ];

  // -------------------------------------------------------
  // Motion preference: OS setting first, manual toggle overrides
  // -------------------------------------------------------
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const savedMotion = localStorage.getItem("motion");
  let motionOff = savedMotion ? savedMotion === "off" : prefersReduced;
  const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const body = document.body;
  const motionToggle = document.getElementById("motion-toggle");
  const motionLabel = document.getElementById("motion-toggle-label");

  const applyMotionState = () => {
    body.classList.toggle("motion-off", motionOff);
    motionToggle.setAttribute("aria-pressed", String(motionOff));
    motionLabel.textContent = motionOff ? "모션 꺼짐" : "모션 켜짐";
  };
  applyMotionState();

  document.getElementById("year").textContent = new Date().getFullYear();

  // -------------------------------------------------------
  // Clock
  // -------------------------------------------------------
  const clockEl = document.getElementById("clock");
  const tickClock = () => {
    clockEl.textContent = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  };
  tickClock();
  setInterval(tickClock, 1000);

  // -------------------------------------------------------
  // Stack chips
  // -------------------------------------------------------
  document.getElementById("stack-groups").innerHTML = STACK.map(
    (g) => `
    <div class="stack-group">
      <h3>${g.group}</h3>
      <ul>${g.items.map((i) => `<li>${i}</li>`).join("")}</ul>
    </div>`
  ).join("");

  // -------------------------------------------------------
  // GitHub data (shared by graph + modal metrics)
  // -------------------------------------------------------
  let repoDataPromise = null;
  const loadRepoData = () => {
    if (!repoDataPromise) {
      repoDataPromise = fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
        { headers: { Accept: "application/vnd.github+json" } }
      )
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
        .then((repos) => {
          const byName = new Map(repos.map((r) => [r.name, r]));
          return { repos, byName };
        })
        .catch(() => null);
    }
    return repoDataPromise;
  };

  document.getElementById("stat-repos").textContent = PROJECTS.length;
  document.getElementById("stat-deployed").textContent = PROJECTS.filter((p) => p.live).length;

  // -------------------------------------------------------
  // Scroll-triggered reveal
  // -------------------------------------------------------
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  // -------------------------------------------------------
  // Project cards — cinematic scroll-stacked scenes
  // -------------------------------------------------------
  const deck = document.getElementById("project-deck");

  const SCENE_TONE = {
    "tabular-lens": "lime",
    "netflix-stats-viewer": "cyan",
    "speedrun-igt-dashboard": "warm",
    placepicker: "cyan",
    AnniCal: "lime",
  };

  const calendarCells = () => {
    const events = new Set([2, 9, 16, 22]);
    let cells = "";
    for (let i = 0; i < 28; i++) {
      const col = i % 7;
      const row = Math.floor(i / 7);
      const x = 20 + col * 50;
      const y = 15 + row * 50;
      const isEvent = events.has(i);
      cells += `<rect x="${x}" y="${y}" width="40" height="40" rx="6" fill="${isEvent ? "var(--tone)" : "#161c24"}" fill-opacity="${isEvent ? 0.85 : 1}" stroke="#232a32"/>`;
      if (isEvent) cells += `<circle class="scene-dot" cx="${x + 20}" cy="${y + 20}" r="4" fill="#fff" style="transition-delay:${col * 0.06}s"/>`;
    }
    const pts = [...events].map((i) => {
      const col = i % 7;
      const row = Math.floor(i / 7);
      return `${20 + col * 50 + 20},${15 + row * 50 + 20}`;
    });
    const path = `M${pts.join(" L")}`;
    return `<g>${cells}<path class="scene-draw" d="${path}" fill="none" stroke="var(--tone)" stroke-width="1.5" stroke-dasharray="4 4" pathLength="100" opacity="0.8"/></g>`;
  };

  const SCENE_SVG = {
    "tabular-lens": `
      <svg viewBox="0 0 400 240" aria-hidden="true">
        <g stroke="#2a323b" stroke-width="1.5" fill="none">
          <rect x="20" y="20" width="360" height="180" rx="8"/>
          <line x1="20" y1="65" x2="380" y2="65"/><line x1="20" y1="110" x2="380" y2="110"/><line x1="20" y1="155" x2="380" y2="155"/>
          <line x1="130" y1="20" x2="130" y2="200"/>
        </g>
        <rect class="scene-bar" x="150" y="35" width="200" height="14" rx="7" fill="var(--tone)" fill-opacity=".85"/>
        <rect class="scene-bar" x="150" y="80" width="120" height="14" rx="7" fill="var(--tone)" fill-opacity=".55" style="transition-delay:.08s"/>
        <rect class="scene-bar" x="150" y="125" width="170" height="14" rx="7" fill="var(--tone)" fill-opacity=".7" style="transition-delay:.16s"/>
        <rect class="scene-bar" x="150" y="170" width="60" height="14" rx="7" fill="#ff8a5c" fill-opacity=".8" style="transition-delay:.24s"/>
      </svg>`,
    "netflix-stats-viewer": `
      <svg viewBox="0 0 400 240" aria-hidden="true">
        <line x1="20" y1="205" x2="380" y2="205" stroke="#2a323b" stroke-width="1.5"/>
        <path class="scene-draw" d="M20,165 C80,125 120,185 160,115 C200,65 240,145 280,95 C320,55 350,105 380,75" fill="none" stroke="var(--tone)" stroke-width="3" pathLength="100"/>
        <circle class="scene-dot" cx="160" cy="115" r="5" fill="var(--tone)"/>
        <circle class="scene-dot" cx="280" cy="95" r="5" fill="var(--tone)" style="transition-delay:.15s"/>
        <circle class="scene-dot" cx="380" cy="75" r="6" fill="#fff" style="transition-delay:.3s"/>
      </svg>`,
    "speedrun-igt-dashboard": `
      <svg viewBox="0 0 400 240" aria-hidden="true">
        <g stroke="#2a323b" stroke-width="1"><line x1="20" y1="30" x2="20" y2="205"/><line x1="20" y1="205" x2="380" y2="205"/></g>
        <polyline class="scene-draw" points="20,185 80,150 140,165 200,100 260,120 320,55 380,80" fill="none" stroke="var(--tone)" stroke-width="3" pathLength="100"/>
        <g fill="var(--tone)">
          <circle class="scene-dot" cx="80" cy="150" r="4"/>
          <circle class="scene-dot" cx="200" cy="100" r="4" style="transition-delay:.1s"/>
          <circle class="scene-dot" cx="320" cy="55" r="5" style="transition-delay:.2s"/>
        </g>
      </svg>`,
    placepicker: `
      <svg viewBox="0 0 400 240" aria-hidden="true">
        <g stroke="#232a32" stroke-width="1">
          <line x1="0" y1="60" x2="400" y2="60"/><line x1="0" y1="120" x2="400" y2="120"/><line x1="0" y1="180" x2="400" y2="180"/>
          <line x1="100" y1="0" x2="100" y2="240"/><line x1="200" y1="0" x2="200" y2="240"/><line x1="300" y1="0" x2="300" y2="240"/>
        </g>
        <path class="scene-draw" d="M60,50 L200,130 L340,70" fill="none" stroke="var(--tone)" stroke-width="2" stroke-dasharray="6 6" pathLength="100"/>
        <path class="scene-draw" d="M60,50 L200,130 L100,200" fill="none" stroke="var(--tone)" stroke-width="2" stroke-dasharray="6 6" pathLength="100" style="transition-delay:.1s"/>
        <circle class="scene-dot" cx="60" cy="50" r="7" fill="#fff"/>
        <circle class="scene-dot" cx="340" cy="70" r="7" fill="#fff" style="transition-delay:.1s"/>
        <circle class="scene-dot" cx="100" cy="200" r="7" fill="#fff" style="transition-delay:.2s"/>
        <circle class="scene-dot" cx="200" cy="130" r="10" fill="var(--tone)" style="transition-delay:.3s"/>
      </svg>`,
    AnniCal: `<svg viewBox="0 0 400 240" aria-hidden="true">${calendarCells()}</svg>`,
  };

  const sceneObserver = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting)),
    { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
  );

  const renderProjectScenes = (filter = "all") => {
    const visible = PROJECTS.filter((p) => filter === "all" || p.type.includes(filter));
    sceneObserver.disconnect();
    deck.innerHTML = visible.map((p) => {
      const idx = PROJECTS.indexOf(p);
      const tone = SCENE_TONE[p.repo] || "lime";
      const reversed = idx % 2 === 1 ? " is-reversed" : "";
      return `
      <div class="scene-slot">
        <button class="project-scene${reversed}" type="button" data-index="${idx}"
          style="--tone:var(--${tone});--tone-soft:var(--${tone}-soft)" aria-haspopup="dialog">
          <div class="scene-visual">${SCENE_SVG[p.repo] || ""}</div>
          <div class="scene-copy">
            <span class="scene-number">${String(idx + 1).padStart(2, "0")}</span>
            <span class="project-status ${p.live ? "is-live" : ""}">${p.live ? "LIVE" : "GITHUB ONLY"}</span>
            <h3>${p.name}</h3>
            <p>${p.tagline}</p>
            <div class="project-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
            <span class="scene-cue">상세 보기
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </div>
        </button>
      </div>`;
    }).join("");

    deck.querySelectorAll(".project-scene").forEach((scene) => sceneObserver.observe(scene));
  };
  renderProjectScenes();

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      document.querySelectorAll(".filter-button").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      renderProjectScenes(filter);
    });
  });

  // Pointer parallax on the scene artwork + subtle tilt (pointer devices only)
  if (hasHover) {
    deck.addEventListener("pointermove", (e) => {
      if (motionOff) return;
      const scene = e.target.closest(".project-scene");
      if (!scene) return;
      const rect = scene.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      scene.style.setProperty("--pv-x", `${px * -16}px`);
      scene.style.setProperty("--pv-y", `${py * -12}px`);
      scene.style.transform = `translateY(-3px) rotateX(${py * -1.2}deg) rotateY(${px * 1.2}deg)`;
    });
    deck.addEventListener("pointerout", (e) => {
      const scene = e.target.closest(".project-scene");
      if (!scene || (e.relatedTarget && scene.contains(e.relatedTarget))) return;
      scene.style.transform = "";
      scene.style.removeProperty("--pv-x");
      scene.style.removeProperty("--pv-y");
    });
  }

  // -------------------------------------------------------
  // Modal
  // -------------------------------------------------------
  const dialog = document.getElementById("project-dialog");
  const dialogBody = document.getElementById("dialog-body");
  let lastTrigger = null;

  const renderDialog = (project, repoInfo) => {
    const metrics = repoInfo
      ? `<h4>실시간 GitHub 지표</h4>
        <dl class="metrics-grid">
          <div class="metric"><dt>Stars</dt><dd>${repoInfo.stargazers_count}</dd></div>
          <div class="metric"><dt>Language</dt><dd>${repoInfo.language || "—"}</dd></div>
          <div class="metric"><dt>Updated</dt><dd>${new Date(repoInfo.pushed_at).toLocaleDateString("ko-KR")}</dd></div>
        </dl>`
      : `<h4>실시간 GitHub 지표</h4><p class="dialog-desc">불러올 수 없습니다 (private repo 또는 API 제한).</p>`;

    dialogBody.innerHTML = `
      <h3 id="dialog-title">${project.name}</h3>
      <p class="dialog-tagline">${project.tagline}</p>
      <p class="dialog-desc">${project.description}</p>
      <h4>기술 태그</h4>
      <div class="dialog-tags">${project.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      ${metrics}
      <div class="dialog-links">
        <a class="btn btn-primary btn-sm" href="${project.github}" target="_blank" rel="noreferrer">GitHub 저장소</a>
        ${project.live ? `<a class="btn btn-ghost btn-sm" href="${project.live}" target="_blank" rel="noreferrer">라이브 데모</a>` : ""}
      </div>
    `;
  };

  const openProject = (index, trigger) => {
    const project = PROJECTS[index];
    lastTrigger = trigger;
    renderDialog(project, null);
    dialog.showModal();
    loadRepoData().then((data) => {
      const repoInfo = data && data.byName.get(project.repo);
      if (dialog.open) renderDialog(project, repoInfo);
    });
  };

  deck.addEventListener("click", (e) => {
    const scene = e.target.closest(".project-scene");
    if (!scene) return;
    openProject(Number(scene.dataset.index), scene);
  });

  dialog.addEventListener("close", () => {
    if (lastTrigger) lastTrigger.focus();
  });

  dialog.addEventListener("click", (e) => {
    const rect = dialog.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });

  // -------------------------------------------------------
  // Magnetic buttons
  // -------------------------------------------------------
  if (hasHover) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        if (motionOff) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  // -------------------------------------------------------
  // Kinetic data collage — pointer parallax + scroll fallback
  // -------------------------------------------------------
  const collageGrid = document.getElementById("collage-grid");
  const sceneCards = [...collageGrid.querySelectorAll(".scene-card")];
  sceneCards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 70}ms`;
    revealObserver.observe(card);
  });

  if (hasHover) {
    collageGrid.addEventListener("pointermove", (e) => {
      if (motionOff) return;
      const rect = collageGrid.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
      sceneCards.forEach((card) => {
        const depth = parseFloat(card.dataset.depth) || 0.5;
        card.style.setProperty("--tx", `${dx * 26 * depth}px`);
        card.style.setProperty("--ty", `${dy * 26 * depth}px`);
      });
    });
    collageGrid.addEventListener("pointerleave", () => {
      sceneCards.forEach((card) => {
        card.style.setProperty("--tx", "0px");
        card.style.setProperty("--ty", "0px");
      });
    });
  }

  const updateCollageScroll = () => {
    if (hasHover || motionOff) return;
    const vh = window.innerHeight;
    sceneCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const depth = parseFloat(card.dataset.depth) || 0.5;
      const ratio = (rect.top + rect.height / 2 - vh / 2) / vh;
      card.style.setProperty("--ty", `${ratio * 18 * depth}px`);
    });
  };

  // -------------------------------------------------------
  // Story — sticky scroll-driven SVG
  // -------------------------------------------------------
  const initStory = () => {
    const svg = document.getElementById("story-svg");
    const caption = document.getElementById("story-caption");
    const live = document.getElementById("story-live");
    const dotEls = [...document.querySelectorAll(".story-dots span")];
    const track = document.getElementById("story-track");
    const NS = "http://www.w3.org/2000/svg";

    const COLS = 6;
    const ROWS = 4;
    const W = 800;
    const H = 480;
    const barHeights = [0.85, 0.45, 0.7, 0.3, 0.6, 0.4];
    const bottom = H - 60;

    const points = Array.from({ length: COLS * ROWS }, (_, i) => {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;
      const top = bottom - barHeights[col] * (H - 160);
      const frac = (ROWS - 1 - row) / (ROWS - 1);
      return {
        a: { x: 60 + Math.random() * 680, y: 40 + Math.random() * 400 },
        b: { x: 110 + col * 116, y: 80 + row * 90 },
        c: { x: 110 + col * 116, y: bottom - frac * (bottom - top) },
      };
    });

    const gridGroup = document.createElementNS(NS, "g");
    gridGroup.setAttribute("opacity", "0");
    for (let r = 0; r < ROWS; r++) {
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", "80");
      line.setAttribute("x2", "720");
      line.setAttribute("y1", String(80 + r * 90));
      line.setAttribute("y2", String(80 + r * 90));
      line.setAttribute("stroke", "#232a32");
      gridGroup.appendChild(line);
    }
    svg.appendChild(gridGroup);

    const circles = points.map(() => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", "7");
      c.setAttribute("class", "story-dot");
      svg.appendChild(c);
      return c;
    });

    const stages = [
      "흩어진 데이터에는 아직 <strong>형태가 없습니다</strong>.",
      "정제와 검증을 거치며 데이터가 <strong>구조</strong>를 갖춥니다.",
      "구조는 마침내 누구나 쓸 수 있는 <strong>도구</strong>가 됩니다.",
    ];
    const lerp = (a, b, t) => a + (b - a) * t;
    let lastStage = -1;

    const render = (progress) => {
      const p = Math.min(Math.max(progress, 0), 1);
      const seg = p < 0.5 ? 0 : 1;
      const localT = seg === 0 ? p / 0.5 : (p - 0.5) / 0.5;
      points.forEach((pt, i) => {
        const from = seg === 0 ? pt.a : pt.b;
        const to = seg === 0 ? pt.b : pt.c;
        circles[i].setAttribute("cx", String(lerp(from.x, to.x, localT)));
        circles[i].setAttribute("cy", String(lerp(from.y, to.y, localT)));
        circles[i].classList.toggle("is-resolved", p > 0.66);
      });
      gridGroup.setAttribute("opacity", String(Math.min(1, p / 0.55)));

      const stageIndex = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
      if (stageIndex !== lastStage) {
        lastStage = stageIndex;
        caption.innerHTML = stages[stageIndex];
        live.textContent = stages[stageIndex].replace(/<[^>]+>/g, "");
        dotEls.forEach((d, i) => d.classList.toggle("is-active", i === stageIndex));
      }
    };

    render(motionOff ? 1 : 0);

    const update = () => {
      if (motionOff) return;
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      render(total > 0 ? -rect.top / total : 1);
    };

    return { render, update };
  };
  const story = initStory();

  // -------------------------------------------------------
  // GitHub constellation graph
  // -------------------------------------------------------
  const graphPanel = document.getElementById("graph-panel");
  const svg = document.getElementById("constellation");
  const caption = document.getElementById("graph-desc");
  const NS = "http://www.w3.org/2000/svg";
  const W = 800;
  const H = 440;
  const CX = W / 2;
  const CY = H / 2;

  const el = (tag, attrs) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  };

  const drawGraph = (nodes) => {
    svg.innerHTML = "";
    const group = el("g", { class: "graph-group" });
    svg.appendChild(group);
    const radiusOrbit = Math.min(W, H) / 2 - 70;

    group.appendChild(el("circle", { cx: CX, cy: CY, r: 26, class: "node-dot", fill: "#d7ff3f", "fill-opacity": 0.9 }));
    const centerLabel = el("text", { x: CX, y: CY + 4, "text-anchor": "middle", class: "node-label", fill: "#06110a" });
    centerLabel.textContent = GITHUB_USER;
    group.appendChild(centerLabel);

    const now = Date.now();
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const x = CX + radiusOrbit * Math.cos(angle);
      const y = CY + radiusOrbit * Math.sin(angle);
      const active = n.pushed_at ? now - new Date(n.pushed_at).getTime() < NINETY_DAYS : false;
      const r = 8 + Math.min(14, (n.stars || 0) * 2);

      group.appendChild(el("line", { x1: CX, y1: CY, x2: x, y2: y, class: "edge-line" }));

      group.appendChild(
        el("circle", {
          cx: x,
          cy: y,
          r,
          fill: "#5be8ff",
          "fill-opacity": active ? 0.9 : 0.45,
          class: "node-dot" + (active ? " is-active" : ""),
        })
      );

      const label = el("text", { x, y: y + r + 16, "text-anchor": "middle", class: "node-label" });
      label.textContent = n.name;
      group.appendChild(label);
    });
  };

  loadRepoData().then((data) => {
    if (data && data.repos.length) {
      const nodes = data.repos
        .filter((r) => !r.fork)
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 10)
        .map((r) => ({ name: r.name, stars: r.stargazers_count, pushed_at: r.pushed_at }));
      drawGraph(nodes);
      caption.textContent = `GitHub API에서 실시간으로 불러온 ${nodes.length}개 저장소 · 밝은 노드 = 최근 90일 내 활동`;
    } else {
      const nodes = PROJECTS.map((p) => ({ name: p.repo, stars: 0, pushed_at: null }));
      drawGraph(nodes);
      caption.textContent = "실시간 데이터를 불러올 수 없어 정적 프로젝트 목록으로 표시합니다.";
    }
  });

  new IntersectionObserver(([entry]) => graphPanel.classList.toggle("in-view", entry.isIntersecting), {
    threshold: 0,
  }).observe(graphPanel);

  if (hasHover) {
    graphPanel.addEventListener("pointermove", (e) => {
      if (motionOff) return;
      const rect = graphPanel.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      svg.style.transform = `rotateX(${py * -4}deg) rotateY(${px * 4}deg)`;
    });
    graphPanel.addEventListener("pointerleave", () => {
      svg.style.transform = "";
    });
  }

  // -------------------------------------------------------
  // Hero generative data field (canvas)
  // -------------------------------------------------------
  const initHeroField = () => {
    const canvas = document.getElementById("hero-field");
    const ctx = canvas.getContext("2d");
    const hero = document.getElementById("top");
    let w = 0;
    let h = 0;
    let points = [];
    let pointer = null;
    let rafId = null;
    let visible = true;

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(215,255,63,0.6)";
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 18000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
      if (motionOff) drawStatic();
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      points.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        if (pointer) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 120) {
            const force = ((120 - dist) / 120) * 0.06;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }
      });
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(91,232,255,${(1 - dist / 110) * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(215,255,63,0.75)";
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
      if (visible && !motionOff) rafId = requestAnimationFrame(tick);
      else rafId = null;
    };

    const start = () => {
      if (rafId || motionOff || !visible) return;
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };

    hero.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
    hero.addEventListener("pointerleave", () => {
      pointer = null;
    });

    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 }
    ).observe(hero);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    window.addEventListener("resize", resize, { passive: true });
    resize();
    start();

    return {
      onMotionChange: () => {
        if (motionOff) {
          stop();
          drawStatic();
        } else {
          start();
        }
      },
    };
  };
  const heroField = initHeroField();

  motionToggle.addEventListener("click", () => {
    motionOff = !motionOff;
    localStorage.setItem("motion", motionOff ? "off" : "on");
    applyMotionState();
    heroField.onMotionChange();
    if (motionOff) story.render(1);
    onScroll();
  });

  // -------------------------------------------------------
  // Header pill morph + scroll progress (single rAF-throttled loop)
  // -------------------------------------------------------
  const header = document.getElementById("site-header");
  const progressBar = document.getElementById("scroll-progress-bar");

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  const updateHeaderCondense = () => {
    header.classList.toggle("is-condensed", window.scrollY > 80);
  };

  let scrollScheduled = false;
  function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => {
      scrollScheduled = false;
      updateProgress();
      updateHeaderCondense();
      story.update();
      updateCollageScroll();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
