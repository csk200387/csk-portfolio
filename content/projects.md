<!--
  포트폴리오 `ls -l ./projects` 목록입니다. 이 파일을 고쳐 main에 커밋하면 사이트에 반영됩니다.
  프로젝트마다 "## 이름" 줄로 시작하고, 그 아래에 필드와 설명 문단을 적습니다.
    - repo (필수): GitHub 저장소 이름. 링크는 https://github.com/csk200387/<repo> 로 만들어집니다.
    - tagline (필수): 목록에 보이는 한 줄 소개
    - type: data, tool 처럼 쉼표로 구분 (필터 버튼과 연결)
    - tags: 쉼표로 구분
    - live: 라이브 데모 주소 (없으면 줄을 생략)
    - github: 저장소 주소가 위 규칙과 다를 때만
  필드 아래 문단은 상세 창 설명이 되고, 목록 순서는 이 파일의 순서를 따릅니다.
-->
# projects

## Tabular Lens
- repo: tabular-lens
- tagline: 로컬 우선 CSV/JSON 데이터 품질 프로파일러
- type: data, tool
- tags: Data Quality, Local-first, CSV/JSON
- live: https://csk200387.github.io/tabular-lens/

CSV·JSON 파일을 업로드하면 브라우저 안에서 스키마, 결측치, 이상치, 컬럼 분포를 분석합니다. 파일이 서버로 전송되지 않아 민감한 데이터도 안전하게 점검할 수 있습니다.

## Netflix Stats Viewer
- repo: netflix-stats-viewer
- tagline: 프라이버시 우선 시청 기록 통계 대시보드
- type: data
- tags: Privacy-first, Dashboard, Data Viz

넷플릭스에서 내려받은 시청 기록 파일을 업로드해 개인 시청 패턴을 시각화합니다. 데이터는 외부로 전송되지 않고 클라이언트에서만 처리됩니다.

## Speedrun IGT Dashboard
- repo: speedrun-igt-dashboard
- tagline: 마인크래프트 스피드런 기록 분석 대시보드
- type: data
- tags: Speedrun, Analytics, Interactive
- live: https://csk200387.github.io/speedrun-igt-dashboard/

마인크래프트 스피드런의 IGT(In-Game Time) 기록을 카테고리별로 모아 추이와 분포를 인터랙티브하게 탐색할 수 있는 대시보드입니다.

## Placepicker
- repo: placepicker
- tagline: 약속 장소 중간지점 추천 서비스
- type: tool
- tags: Location, Web App
- live: https://placepicker-alpha.vercel.app

여러 명의 출발 위치를 입력하면 서로 만나기 편리한 중간 지점을 추천해주는 웹 앱입니다.

## AnniCal
- repo: AnniCal
- tagline: 모든 기념일을 한눈에
- type: tool
- tags: Calendar, Web App
- live: https://annical.vercel.app/

연인, 가족, 친구와의 다양한 기념일을 등록하고 D-day를 추적·관리할 수 있는 캘린더 앱입니다.
