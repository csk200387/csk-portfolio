# 차성겸 포트폴리오

AI·빅데이터공학 전공자로서 데이터 품질, 프라이버시 우선 처리, 인터랙티브 시각화 작업을 소개하는 모션 중심 포트폴리오입니다.

## 구성

- 순수 HTML, CSS, JavaScript ES modules — 빌드 단계 없이 GitHub Pages에서 바로 서비스
- Anime.js 4.5.0 기반 글자별 등장, 섹션별 순차 모션, 데이터 형태 전환 (MIT 라이선스, 로컬 번들 포함)
- 대형 DATA / SIGNAL / IMPACT 타이포그래피와 라임 컬러 밴드, 입체 도넛 형태의 데이터 필드
- **Signal Explorer**: 216개 데이터 포인트의 자유·구조·연결 형태 전환, 퍼짐 슬라이더, 패턴 재생성, 포인터 반응
- 첫 방문 시 세 가지 형태 자동 순환. 사용자가 조작하면 순환 중지, 모션 끄기와 화면 밖 상태에서도 애니메이션 중지
- 스크롤 진행도와 단계 버튼으로 탐색하는 데이터 변환 스토리
- 저장소를 클릭하거나 키보드로 열 수 있는 GitHub 활동 관계망 (API 오류 시 프로젝트 목록으로 대체)
- 프로젝트 검색과 유형 필터, 그리드/몰입형 보기 전환, 상세 창 안에서 이전·다음 프로젝트 탐색
- `⌘ K` / `Ctrl K` 빠른 탐색, 현재 섹션 표시, GitHub 프로필 링크 복사
- 모바일 반응형, 모션 토글, 스킵 링크, `prefers-reduced-motion` 지원
- 화면 밖이거나 탭이 비활성 상태일 때 Canvas 애니메이션 중단
- SIGNAL LAB 공유 미리보기 이미지

## 로컬 실행

프로젝트 루트에서 정적 서버를 실행한 뒤 브라우저로 엽니다.

```bash
python3 -m http.server 8000
```

`http://localhost:8000`으로 접속합니다.

ES modules를 사용하므로 HTML 파일을 직접 열기보다 위의 로컬 서버로 확인하세요.

## 확인

Node.js에서 데이터 형태 계산과 실제 프로젝트 검색 동작을 검증할 수 있습니다. 외부 패키지를 설치할 필요가 없습니다.

```bash
node --test tests/*.test.mjs
```

## 파일

- `js/portfolio-data.js`: 프로젝트·기술 스택 콘텐츠
- `js/signal-model.js`: 데이터 좌표와 프로젝트 검색 로직
- `js/signal-explorer.js`: Canvas 시각화와 모션 생명주기
- `js/main.js`: 탐색, 프로젝트, 대화상자, 스토리, GitHub 연동
- `css/styles.css`: 기존 공통 스타일
- `css/experience.css`: 인터랙티브 에디션 레이아웃과 반응형 스타일
- `css/motion-edition.css`: Anime.js 레퍼런스 기반 타이포그래피, 컬러, 프로젝트 및 모바일 스타일
- `js/motion-edition.js`: 인트로 타임라인과 스크롤 순차 모션
- `js/vendor/`: Anime.js 4.5.0 배포 번들과 MIT 라이선스

## 배포

GitHub Pages의 **Deploy from a branch** 방식으로 `main` 브랜치의 `/(root)`를 선택하면 됩니다. 별도 빌드 명령은 필요하지 않습니다.

Sites에 게시할 때만 `node scripts/build-site.mjs --origin <Sites에서 제공한 HTTPS 주소>`를 사용합니다. 이 명령은 필요한 공개 파일만 포함하는 독립 Worker를 `dist/server/index.js`에 생성하고, 해당 게시본의 공유 이미지 주소를 변경합니다. GitHub Pages용 원본은 그대로 사용할 수 있습니다.
