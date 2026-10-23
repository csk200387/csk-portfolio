# 차성겸 포트폴리오

AI·빅데이터공학 전공자로서 데이터 품질, 프라이버시 우선 처리, 인터랙티브 시각화 작업을 소개하는 터미널 콘셉트 포트폴리오입니다.

## 구성

- 순수 HTML, CSS, JavaScript ES modules — 빌드 단계 없이 GitHub Pages에서 바로 서비스
- 종이·잉크 톤의 ASCII 터미널 레이아웃, 시스템 다크 모드 지원
- **ASCII 아트**: three.js(jsDelivr CDN)로 렌더링한 입체 CSK 글자를 매 프레임 문자로 변환. 포인터에 따라 그림자 방향이 바뀌고, 클릭하면 다시 디코딩. `[avatar]` 버튼으로 문자 대신 같은 장면의 WebGL 그래픽으로 전환. 그래픽 모드에서는 다크 모드와 관계없이 왼쪽 패널 전체가 프로필 사진 색(흰 배경, 검은 글자, `#f0f0f0` 그림자)을 따름. WebGL을 쓸 수 없으면 정적 배너 표시
- 스크롤하면 각 블록의 명령어가 타이핑된 뒤 결과 출력. `whoami`의 이름은 Noto Sans KR 윤곽을 문자로 옮긴 정적 ASCII 배너
- 프로젝트 `ls`: 유형 필터(슬라이딩 세그먼트)와 `grep` 검색, 상세 창(모바일에서는 바텀 시트) 안에서 GitHub 지표와 이전·다음 탐색
- `gh repo list`: GitHub API에서 최근 저장소를 불러오고, 오류가 나면 프로젝트 목록으로 대체
- `⌘ K` / `Ctrl K` 빠른 탐색, GitHub 프로필 링크 복사(스낵바)
- [SEED Design](https://github.com/daangn/seed-design)에서 가져온 인터랙션: 모션 토큰(duration·easing), 누름 스케일 피드백, 단어 단위 리빌, 커스텀 커서(캐럿 → 선택 박스 → 라벨 태그), 세그먼트 인디케이터, 스낵바, 바텀 시트
- 모션 토글과 `prefers-reduced-motion` 지원. 모션이 꺼져 있거나 아트가 화면 밖에 있으면 렌더 루프 중단

## 로컬 실행

프로젝트 루트에서 정적 서버를 실행한 뒤 브라우저로 엽니다.

```bash
python3 -m http.server 8000
```

`http://localhost:8000`으로 접속합니다.

ES modules를 사용하므로 HTML 파일을 직접 열기보다 위의 로컬 서버로 확인하세요.

## 확인

Node.js에서 실제 프로젝트 검색 동작을 검증할 수 있습니다. 외부 패키지를 설치할 필요가 없습니다.

```bash
node --test tests/*.test.mjs
```

## 파일

- `js/portfolio-data.js`: 프로젝트·기술 스택 콘텐츠
- `js/signal-model.js`: 프로젝트 검색 로직
- `js/ascii-art.js`: three.js 렌더링을 문자로 변환하는 ASCII 아트
- `js/main.js`: 터미널 블록, 프로젝트, 대화상자, 빠른 탐색, GitHub 연동, 커서
- `css/styles.css`: 전체 스타일과 SEED 모션 토큰

## 배포

GitHub Pages의 **Deploy from a branch** 방식으로 `main` 브랜치의 `/(root)`를 선택하면 됩니다. 별도 빌드 명령은 필요하지 않습니다.

Sites에 게시할 때만 `node scripts/build-site.mjs --origin <Sites에서 제공한 HTTPS 주소>`를 사용합니다. 이 명령은 필요한 공개 파일만 포함하는 독립 Worker를 `dist/server/index.js`에 생성하고, 해당 게시본의 공유 이미지 주소를 변경합니다. GitHub Pages용 원본은 그대로 사용할 수 있습니다.
