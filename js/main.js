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
  const stackGroupsEl = document.getElementById("stack-groups");
  stackGroupsEl.innerHTML = STACK.map(
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

  // -------------------------------------------------------
  // Project cards
  // -------------------------------------------------------
  const grid = document.getElementById("project-grid");
  const renderProjectCards = (filter = "all") => {
    const visibleProjects = PROJECTS.filter((p) => filter === "all" || p.type.includes(filter));
    grid.innerHTML = visibleProjects.map(
    (p, i) => `
    <button class="project-card" type="button" data-index="${PROJECTS.indexOf(p)}" aria-haspopup="dialog">
      <div class="project-card-head">
        <h3>${p.name}</h3>
        <span class="project-status ${p.live ? "is-live" : ""}">${p.live ? "LIVE" : "GITHUB ONLY"}</span>
      </div>
      <p>${p.tagline}</p>
      <div class="project-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
    </button>`
    ).join("");
  };
  renderProjectCards();

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      document.querySelectorAll(".filter-button").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      renderProjectCards(filter);
    });
  });

  document.getElementById("stat-repos").textContent = PROJECTS.length;
  document.getElementById("stat-deployed").textContent = PROJECTS.filter((p) => p.live).length;

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

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".project-card");
    if (!card) return;
    openProject(Number(card.dataset.index), card);
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
  // Reading progress
  // -------------------------------------------------------
  const progressBar = document.getElementById("scroll-progress-bar");
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });

  // -------------------------------------------------------
  // Constellation graph
  // -------------------------------------------------------
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

  const drawGraph = (nodes, isLive) => {
    svg.innerHTML = "";
    const radiusOrbit = Math.min(W, H) / 2 - 70;

    svg.appendChild(
      el("circle", { cx: CX, cy: CY, r: 26, class: "node-dot", fill: "#ffb454", "fill-opacity": 0.9 })
    );
    svg.appendChild(
      el("text", { x: CX, y: CY + 4, "text-anchor": "middle", class: "node-label", fill: "#04141a" })
    ).textContent = GITHUB_USER;

    const now = Date.now();
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const x = CX + radiusOrbit * Math.cos(angle);
      const y = CY + radiusOrbit * Math.sin(angle);
      const active = n.pushed_at ? now - new Date(n.pushed_at).getTime() < NINETY_DAYS : false;
      const r = 8 + Math.min(14, (n.stars || 0) * 2);

      svg.appendChild(el("line", { x1: CX, y1: CY, x2: x, y2: y, class: "edge-line" }));

      const dot = el("circle", {
        cx: x,
        cy: y,
        r,
        fill: "#6ee7ff",
        "fill-opacity": active ? 0.9 : 0.45,
        class: "node-dot" + (active ? " is-active" : ""),
      });
      svg.appendChild(dot);

      const label = el("text", {
        x,
        y: y + r + 16,
        "text-anchor": "middle",
        class: "node-label",
      });
      label.textContent = n.name;
      svg.appendChild(label);
    });
  };

  loadRepoData().then((data) => {
    if (data && data.repos.length) {
      const nodes = data.repos
        .filter((r) => !r.fork)
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 10)
        .map((r) => ({ name: r.name, stars: r.stargazers_count, pushed_at: r.pushed_at }));
      drawGraph(nodes, true);
      caption.textContent = `GitHub API에서 실시간으로 불러온 ${nodes.length}개 저장소 · 밝은 노드 = 최근 90일 내 활동`;
    } else {
      const nodes = PROJECTS.map((p) => ({ name: p.repo, stars: 0, pushed_at: null }));
      drawGraph(nodes, false);
      caption.textContent = "실시간 데이터를 불러올 수 없어 정적 프로젝트 목록으로 표시합니다.";
    }
  });
})();
