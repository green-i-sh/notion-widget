# Notion 연동 참고

이 문서는 위젯이 Notion 데이터를 읽고 쓸 때 필요한 정보입니다.
저장소 루트에 두고 Claude Code에게 "NOTION.md 읽어줘"라고 하면 됩니다.

## 인테그레이션

1. <https://www.notion.so/my-integrations> → **New integration**
2. Capabilities: **Read content** + **Update content** 체크
3. Internal Integration Token 복사 (`ntn_`으로 시작)
4. Notion에서 **My Life Planner** 페이지 → `···` → **Connections** → 방금 만든 인테그레이션 추가
   (부모 페이지에 연결하면 하위 DB에 전부 적용됩니다)

토큰은 **환경 변수 `NOTION_TOKEN`으로만** 씁니다. 클라이언트 번들에 절대 넣지 않습니다.
`VITE_` 접두사를 붙이면 번들에 박히므로 붙이지 않습니다.

## Database ID

Notion API v1의 `/v1/databases/{id}/query`에 쓰는 값입니다.

| DB | ID |
|---|---|
| Tasks | `06302b1af3a749508270d58e32df9f46` |
| Time Log | `6b79332a8eea457f94560296f866f214` |
| Daily Log | `3c91cb4b5255486c98c6128f44650848` |
| Finance | `e8768a8de1ee483f9d89764732df2c29` |
| Fixed Expense | `014a2496cd7443feb4adae5155349431` |
| Budget | `4cf3969375a04ee2953d0f00feb0b006` |
| Life | `38c6359d8cb741958f3d2846cfd5a524` |
| Books | `ad322dffe3cd4b098981a2cd895b5c7d` |
| Trips | `5f00b7a7a42e4bdaad7384171d3c896e` |
| Money Letter | `ae109bbc5bb44b92bbedf0bc319d04f3` |
| Bingo | `518a7ad69e0a49fbbba066995d76a20e` |
| Review | `3dc712a7442e4a2eaa54965050fbf987` |
| Streak | `555ee768575c4882b24ef03f637a2622` |
| Routine Check (미사용) | `09b68da4a1bb4991b907c6fa7921b951` |

## 서버리스 함수

토큰을 아는 코드는 `api/`뿐입니다. 브라우저는 `src/services/notion.ts`를 거쳐
같은 origin의 `/api/*`만 부르고, Notion API는 함수 안에서만 호출됩니다.

| 함수 | 메서드 | 하는 일 |
|---|---|---|
| `/api/today` | GET `?date=YYYY-MM-DD` (기본 오늘 KST) | Daily Log 한 행 요약 |
| `/api/routine` | GET `?start=YYYY-MM-DD` (기본 이번 주 월요일) | 월~일 7일치 루틴 체크 상태 |
| `/api/routine` | POST `{ pageId, routine, value }` | 체크박스 하나 토글 |
| `/api/timeline` | GET `?date=YYYY-MM-DD` (기본 오늘 KST) | 그날 Time Log 전체 |

응답에는 `Cache-Control: s-maxage=30, stale-while-revalidate=120`이 붙습니다 —
여러 위젯이 동시에 떠 있어도 초당 3회 제한에 잘 안 걸립니다.

## 위젯별로 필요한 속성

### Daily Log — `?w=today`, `?w=routine`

하루에 한 행. 위젯이 **쓰는 유일한 DB**입니다.

| 속성 | 타입 | 비고 |
|---|---|---|
| `Name` | title | `2026.08.19` |
| `Date` | date | 조회 기준 |
| `Tasks` | formula (string) | `3 / 5` |
| `Tasks done` | rollup (number) | |
| `Tasks total` | rollup (number) | |
| `Tracked` | rollup (number) | **분 단위.** 위젯에서 `1h 50m`으로 포맷 |
| `Expense` | rollup (number) | 음수 |
| `Morning Page` | select | `작성` / `미작성` |
| `Exercise` `Reading` `Organizing` `Other` | checkbox | **위젯이 토글하는 대상** |

체크박스 쓰기:

```
PATCH /v1/pages/{pageId}
{ "properties": { "Exercise": { "checkbox": true } } }
```

### Time Log — `?w=timeline`

| 속성 | 타입 |
|---|---|
| `Name` | title |
| `Task` | relation → Tasks |
| `Start` `End` | date (datetime) |
| `Duration (min)` | formula (number) |
| `What I did` | rich_text |

타임라인은 `Start`가 오늘인 행만 가져와 07:00~23:00 축에 배치합니다.

### Finance — `?w=finance`

| 속성 | 타입 | 값 |
|---|---|---|
| `Date` | date | |
| `Amount` | number | 지출은 음수 |
| `Type` | select | `Expense` `Income` `카드/대출` `저축` |
| `Category` | select | 식비·카페·교통·책·생활·숙소·주거·통신·보험·구독·급여·기타 수입 |
| `Month` | formula (string) | `2026.08` |
| `Expense only` | formula (number) | `Type == "Expense"`일 때만 금액 |

고정지출 = Category가 주거·통신·보험·구독
변동지출 = 그 외 Expense

### Budget — 예산 잔액

| 속성 | 타입 |
|---|---|
| `Month` | rich_text (`2026.08`) |
| `Budget` | number |
| `Spent` | rollup (Finance의 `Expense only` 합) |
| `Left` | formula = `Budget + Spent` |
| `Progress` | formula = `-Spent / Budget` |

### Bingo — `?w=bingo`

| 속성 | 타입 |
|---|---|
| `Name` | title |
| `Board` | select (`2026.08 Monthly` / `2026 Fall Quarterly`) |
| `No` | number (1~16) |
| `Done` | checkbox |

### Tasks — `?w=today`의 완료 수 계산에 사용

| 속성 | 타입 |
|---|---|
| `Status` | select (`Inbox` `Next Action` `Waiting For` `Project` `Someday` `Reference` `Done`) |
| `Priority` | select (`Highest` `Medium` `Lowest`) |
| `Context` | multi_select (Home·Work·Computer·Phone·Outside·Offline) |
| `Due` | date |
| `Tracked` | rollup (분) |
| `Done?` | formula (number) — Done이면 1 |

## 주의

- **Notion API는 브라우저에서 직접 못 부릅니다.** CORS로 막힙니다.
  반드시 서버리스 함수를 거칩니다.
- rollup 값은 `property.rollup.number`, formula는 `property.formula.string`
  또는 `.number`로 꺼냅니다. 타입을 확인하지 않고 `.number`만 보면 빈 값이 나옵니다.
- 날짜 필터는 `YYYY-MM-DD` 문자열입니다. `toISOString()`을 쓰면 KST에서
  하루 밀리므로 로컬 날짜를 직접 만듭니다.
- Rate limit은 평균 초당 3회입니다. 위젯이 여러 개 떠 있으면 각자
  요청하므로, 응답을 짧게 캐시하는 편이 안전합니다.
