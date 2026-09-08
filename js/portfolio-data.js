export const PROJECTS = [
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

export const STACK = [
  { group: "언어", items: ["Python", "JavaScript", "SQL", "TypeScript"] },
  { group: "데이터 · ML", items: ["Pandas", "NumPy", "scikit-learn"] },
  { group: "웹", items: ["HTML/CSS", "Node.js"] },
  { group: "도구", items: ["Git", "GitHub Actions", "Vercel"] },
];
