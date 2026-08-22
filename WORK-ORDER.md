# 작업 지시 — 8건

WIDGET-SPEC.md, NOTION.md 를 먼저 읽어줘. 시안 11장이 유일한 기준이야.
애매하면 시안을 다시 봐.

항목마다 커밋하고 push해. 전부 끝나면 브라우저로 확인해서 결과를 표로 알려줘.

---

## 1. Bingo 3×3 · 9칸 고정

Notion 데이터를 9개로 정리했어. Monthly, Quarterly 둘 다 9칸이야.
현재 Monthly는 Done 7 / 9.

- `grid-template-columns: repeat(3, 1fr)`, 모바일 2열
- 9개를 초과하면 앞의 9개만 렌더하고, 아래에 회색 안내 한 줄
- 상단 카운트는 실제 값

## 2. Review — 저장된 숫자를 읽도록

지금 Daily Log를 기간 합산해서 계산하는데, 기록이 얇으면 값이 작게 나와서
시안과 전혀 달라져. Review DB에 이미 숫자 속성이 있으니 그걸 읽어줘.
Quarterly와 방식을 통일하는 거야.

```
Monthly    "Tasks done"  "Tasks total"  "Tracked (min)"  "Expense"
           "Life 건수"   "Bingo done"   "Bingo total"
Quarterly  기존 Q 접두 rollup 유지
```

실시간 합산 로직은 지우고, 속성이 비어 있으면 `—` 로 표시.

## 3. meta 위젯 신규 — `?w=meta`

페이지 상단의 작은 회색 메타 줄이 전부 수기 텍스트야. 데이터로 바꿔줘.
`?w=meta&kind=` 로 종류를 받아 한 줄만 그리는 위젯.
11px 회색, 항목 사이 공백 3칸.

| kind | 출력 |
|---|---|
| `today` | `2026.08.21 Friday` — KST 오늘 날짜 |
| `finance` | `Month 2026.08   Budget ₩1,600,000` |
| `life` | `Month 2026.08   기록 9건` |
| `books` | `Reading 2 · To Read 2 · Done 2` |
| `bingo` | `Board 2026.08 Monthly   Done 7 / 9` |

## 4. morning 위젯 신규 — `?w=morning`

시안 02-daily 상단 MORNING PAGE / DAILY LOG.
지금 Notion 본문에 글자로 박혀 있어서 데이터와 연결이 안 돼.
읽기만 하지 말고 위젯에서 직접 쓸 수 있어야 해.

Daily Log DB:

```
"Morning Page 본문"  rich_text   왼쪽 칸
"Log"               rich_text   오른쪽 칸
"Morning Page"      select      작성 / 미작성 — 본문 비면 미작성, 있으면 작성
```

- 2단. 왼쪽 연한 라벤더 배경, 오른쪽 연한 회색 배경
- textarea. 입력 멈추고 1.5초 뒤 자동 저장(debounce). 저장 버튼 없이
- 저장 중 / 저장됨 을 작은 회색 글씨로
- 라벨 MORNING PAGE / DAILY LOG 는 11px 대문자 회색
- `?date=` 없으면 오늘

API:

```
GET  /api/morning?date=YYYY-MM-DD
POST /api/morning { date, field: "morning" | "log", value }
```

`field` 는 이 둘만 허용. 다른 속성 쓰기는 막을 것.

## 5. timeline 가로형으로 — `?w=timeline`

지금 세로 시간축인데 안 예뻐. 가로 막대 하나로 바꿔줘.

- 07:00~23:00 을 가로축 하나로 놓고, 기록을 그 위 블록으로
- 높이 60px 정도로 얇게. 아래에 3시간 간격 눈금 라벨
- 블록에 마우스 올리면 제목과 소요시간 툴팁
- 우측에 합계

공간을 훨씬 덜 먹고 Notion 페이지에 얹기 좋아야 해.

## 6. calendar 위젯 신규 — `?w=calendar`

Daily 페이지 Tasks 아래에 넣을 월간 캘린더. 다이어리처럼 보이게.

- 각 날짜 칸에 그날의 Life 기록 사진을 **1장만** 배경으로
  (Life DB `Photo` 속성. 그날 기록이 여럿이면 첫 번째)
- 사진 없는 날은 빈 칸
- 날짜 숫자는 사진 위에 작게. 가독성 위해 옅은 흰 그라데이션
- 오늘 날짜는 테두리 강조
- 칸을 누르면 그 Life 기록의 Notion 페이지로 이동

## 7. trip 전면 재설계 — `?w=trip`

지금 3단 텍스트라 밋밋해. 시안 06-trips 를 다시 보고 다시 만들어줘.

- 상단에 여행 대표 사진을 넓게 (Trips DB `Cover`)
- 그 위에 여행 이름, Phase 칩, 기간, 인원을 얹기
- 아래에 Best Moment / Favorite Place / What to Change 를 카드 3장으로
- 맨 아래에 그 여행의 지출 합계와 카테고리별 막대

사진첩 느낌이어야 해. 지금처럼 표 같으면 안 돼.

## 8. 책 자동 채우기 — `?w=book-add`

Books DB에 책을 추가할 때 제목만 입력하면 저자와 표지를 자동으로 채우고 싶어.
네이버 책 검색 API를 쓸 거야. 키는 Vercel 환경변수에 있어.

```
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
```

**1) `GET /api/book-search?q=제목`**

- `https://openapi.naver.com/v1/search/book.json` 호출
- 헤더 `X-Naver-Client-Id`, `X-Naver-Client-Secret`
- 키를 클라이언트 번들에 절대 넣지 말 것. `VITE_` 접두사 금지
- 응답에서 title, author, image, publisher, pubdate 만 추려서 반환
- title 과 author 의 `<b>` 같은 HTML 태그 제거
- author 에 여러 명이면 `|` 구분자를 ` · ` 로
- 상위 5건

**2) `POST /api/book-add`**

```
{ title, author, cover, publisher }
```

Books DB에 새 행 생성. `Name` = title, `Author` = author,
`Status` = "To Read", `Cover` = external 파일로 cover URL.
Books DB 이외에는 쓰지 못하게 막을 것.

**3) 위젯 `?w=book-add`**

- 입력창 하나. 제목 치고 엔터
- 결과 5건을 표지 썸네일 + 제목 + 저자 + 출판사로
- 하나 고르면 Notion에 추가, 완료 메시지 후 입력창 초기화
- 같은 제목이 이미 Books에 있으면 경고 표시. 추가 자체는 가능하게
- 키 미설정이면 "네이버 API 키가 설정되지 않았습니다" 라고 명확히

---

## 전 항목 공통 규칙

- 위젯 CSS에 hex 코드 직접 쓰기 금지. 전부 `var(--토큰)`
- 라벨/값 행은 `EmbedRows`, 큰 숫자 4분할은 `EmbedStats` 를 반드시 사용.
  위젯이 자기만의 row/stat 클래스를 새로 만들지 말 것
- 위젯 안에 제목 넣지 말 것. 라벨은 Notion 쪽에서 붙임
- 배경 투명, 바깥 카드 테두리 없음
- 조회 실패 시 원인이 보이는 메시지. "요청 실패" 같은 뭉뚱그린 문구 금지
- `npm run lint`, `npm run build`, `npm run test:api` 전부 통과
- 커밋 메시지는 `feat:` `fix:` `refactor:`

## 마지막에 검증

grep 으로 확인하고 **실제 출력을 붙여줘.** "통과했습니다" 라고만 쓰지 말 것.

- `src/components/widgets` 안에 hex 가 남았는지
- `EmbedRows` / `EmbedStats` 를 import 하는 파일 목록
- `.embed-title` 이 남았는지

그리고 브라우저로 아래를 열어 결과를 표로:

```
?w=bingo                    3×3 · 9칸 · Done 7/9
?w=review&type=monthly      시안 숫자(18/27, 42h 10m, ₩1,323,100)
?w=review&type=quarterly    기존대로
?w=meta&kind=today          ~ kind=bingo 5종
?w=morning                  입력하면 Notion에 실제 저장되는지
?w=timeline                 가로형
?w=calendar                 사진 깔린 달력
?w=trip                     사진첩 느낌
?w=book-add                 검색과 추가가 되는지
```
