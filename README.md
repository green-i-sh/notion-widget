# My Life Planner Widget Station

Notion의 **My Life Planner** 페이지에 `/embed`로 붙여 쓰는 위젯 대시보드입니다.
React + TypeScript + Vite로 만들었고, Vercel에 배포합니다.

로컬 위젯(Todo, Habit 등)의 데이터는 브라우저 `localStorage`에만 저장됩니다.
Notion 연동 위젯(Routine, Today, Timeline)은 `/api` 서버리스 함수를 거쳐
Notion을 직접 읽고 씁니다 — 자세한 내용은 [NOTION.md](./NOTION.md) 참고.

## 위젯

Clock · Calendar · Schedule · D-Day · Countdown · Todo · Memo · Habit ·
Progress · Quote · Timer · Stopwatch · Link · Image · Weather ·
Routine · Today · Timeline

Weather는 API 키가 필요 없는 [Open-Meteo](https://open-meteo.com)를 씁니다.
Routine/Today/Timeline은 Notion 토큰이 필요하며, 토큰은 서버리스 함수
환경 변수에만 있습니다 — 클라이언트 번들에는 절대 들어가지 않습니다.

## `?w=` 단독 렌더 (Notion embed용)

`?w=<위젯이름>`을 붙이면 그 위젯 하나만 대시보드 없이 단독으로 렌더됩니다.
Notion의 `/embed` 블록에는 이 형태로 붙입니다.

```
https://<배포 주소>/?w=today
https://<배포 주소>/?w=routine
https://<배포 주소>/?w=timeline
```

## 로컬 실행

```bash
npm install
npm run dev
```

`npm run dev`는 순수 Vite라서 `/api`가 없습니다. Routine/Today/Timeline을
로컬에서 실제 데이터로 확인하려면 [Vercel CLI](https://vercel.com/docs/cli)를 설치하고:

```bash
npm i -g vercel
cp .env.example .env   # NOTION_TOKEN 채우기
vercel dev
```

## 검사

```bash
npm run lint    # ESLint (api/ 포함)
npm run build   # tsc -b && vite build (api/ 포함)
```

## Vercel 배포

1. [vercel.com](https://vercel.com)에서 이 저장소를 **Import**합니다.
   Framework Preset은 Vite로 자동 감지되고, `/api/*.ts`는 별도 설정 없이
   서버리스 함수로 배포됩니다.
2. 프로젝트 **Settings → Environment Variables**에 `NOTION_TOKEN`을 추가합니다.
   (토큰 발급 방법은 [NOTION.md](./NOTION.md) 참고)
3. Deploy. 이후 `main`에 push할 때마다 자동 재배포됩니다.

## Notion에 붙이기

Notion 페이지에서 `/embed` → 배포 주소 입력 → 블록 모서리를 끌어 높이 조절.
세로 900px 안팎이면 위젯이 잘리지 않습니다.

## 구조

```
api/
├── _lib/            notion (Notion API 호출·속성 파싱), date (KST), types
├── today.ts         GET  Daily Log 오늘 요약
├── routine.ts        GET  이번 주 루틴 그리드 · POST 체크박스 토글
└── timeline.ts       GET  Time Log 하루치

src/
├── components/
│   ├── layout/      WidgetContainer, WidgetGrid, Header
│   ├── settings/    SettingsPanel, WidgetToggles, DataPanel
│   └── widgets/     위젯 18개 + registry.tsx
├── hooks/           useNow, useTicker, useAddForm
├── services/        storage (localStorage + 검증), notion (api/* 클라이언트)
├── store/           appStore (상태·액션), themes (팔레트)
├── types/           공용 타입
├── utils/           date, id
└── styles/          global.css
```

위젯을 추가하려면 `components/widgets/`에 컴포넌트를 만들고
`registry.tsx`에 한 줄, `types/index.ts`의 `WidgetType`에 한 줄을 더하면 됩니다.
그리드·드래그·크기·숨김은 공통 컨테이너가 처리합니다.

## 데이터

모든 기록은 `localStorage`의 `mlp-widget-station` 키 하나에 들어갑니다.
Settings → Data에서 JSON으로 Export / Import / Reset 할 수 있습니다.

저장된 값이 깨져 있거나 잘못된 JSON을 가져와도 앱이 죽지 않고
기본값으로 되돌아갑니다.

## Notion embed에서 확인한 것

- 스크롤 컨테이너가 하나뿐이라 iframe 안에서 이중 스크롤이 생기지 않습니다.
- 설정은 오른쪽 패널로 열리고, iframe 높이 안에서 자체 스크롤됩니다.
- 폭 720px 아래에서는 자동으로 1열이 됩니다.
