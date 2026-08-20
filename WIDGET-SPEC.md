# Widget Spec — My Life Planner

첨부한 시안 11장(`01-home` ~ `11-review-quarterly`)을 Notion embed 위젯으로
재현하기 위한 사양입니다. **시안이 유일한 기준**입니다. 애매하면 시안을 다시 보세요.

Notion 기본 블록으로 이미 시안과 같게 나오는 것(Tasks 테이블, 캘린더,
Books·Trips 갤러리, Money Letter 보드)은 **건드리지 않습니다.** 아래 목록만
위젯으로 만듭니다.

---

## 0. 공통 규칙 — 모든 위젯에 적용

지금 구현이 시안과 어긋나는 가장 큰 원인이 여기입니다. 먼저 공통 토큰과
공통 컴포넌트를 만들고, 각 위젯이 그것만 쓰게 하세요.

### 색

```
--text        #1f2024   본문
--subtext     #8b8e97   라벨, 보조 텍스트
--rule        #e8e8ec   구분선 1px
--lav-bg      #e8eaf6   라벤더 칩 배경 / 체크된 칸 배경
--lav-ink     #5b62a8   라벤더 칩 글자 / ✓
--green-bg    #e6f2ea   Done 칩 배경
--green-ink   #3d7a56
--gray-bg     #f1f1f4   미완료 칩 배경
--gray-ink    #9b9ea6
--pink-bg     #fbe9ee   Highest
--pink-ink    #a8506b
--yellow-bg   #fdf3dd   Medium
--yellow-ink  #8a6d2f
```

배경은 **투명**입니다. 위젯 바깥에 카드 테두리를 두르지 마세요.
Notion 페이지 배경이 그대로 비쳐야 합니다.

### 타이포

- 큰 숫자·제목: `Nanum Myeongjo` (serif)
- 본문·라벨: `Pretendard`
- 섹션 라벨: 11px, `letter-spacing: .09em`, 대문자, `--subtext`
- 값: 15px, `font-weight: 600`
- 라벨: 13.5px, `--subtext`

### 반복되는 두 가지 패턴

**패턴 A — 라벨/값 행** (Home 하단, Daily 하단에서 반복)

```
라벨            값
────────────────────   ← 1px --rule
라벨            값
────────────────────
```

라벨 왼쪽 회색, 값 오른쪽 진하게, 각 행 아래 1px 선. 마지막 행도 선 있음.

**패턴 B — 큰 숫자 블록** (Finance 상단, Review 상단)

```
Tracked          ← 11px 회색 라벨
42h 10m          ← 28px serif
기록된 시간       ← 12px 회색
─────────────    ← 1px --rule
```

4개가 가로로 나란히. 모바일에서는 2×2.

이 둘을 공통 컴포넌트로 빼고 각 위젯이 재사용하게 하세요.

---

## 1. `?w=routine` — 수정

**시안: 01-home 좌측 상단**

지금 구현의 문제:
- `3 / 7` 카운트가 없음
- 체크 칸 색이 너무 진함 (채도 높은 파랑 → 연한 라벤더로)
- 칸이 오른쪽 끝에 몰림 (7칸 균등 분할로)
- 바깥 카드 테두리가 있음

시안대로:

```
Exercise   3 / 7
[✓][화][✓][목][금][✓][일]

Reading    4 / 7
[✓][✓][✓][✓][금][토][일]
```

- 루틴 이름은 `--lav-bg` 배경 칩, 글자 `--lav-ink`, 12px
- 카운트는 칩 오른쪽에 회색 12px
- 칸: `grid-template-columns: repeat(7, 1fr)`, 정사각형에 가깝게
- 체크됨: 배경 `--lav-bg`, 테두리 연한 라벤더, `✓` 는 `--lav-ink`
- 안 체크됨: 흰 배경, 1px `--rule` 테두리, 요일 글자 `--subtext`
- 루틴 행마다 아래 1px `--rule`
- 칸 클릭 → Notion Daily Log 체크박스 즉시 토글 (이미 동작함, 유지)

## 2. `?w=today` — 수정

**시안: 01-home 하단 좌측 "Today · Monitoring"**

패턴 A로 4행.

```
Tasks 완료          1 / 5
Tracked            1h 50m
Expense            ₩12,000
Morning Page       작성 완료
```

- Tracked는 Notion에서 **분 단위**로 온다. `1h 50m`으로 포맷
- Expense는 **음수**로 온다. 절댓값에 `₩` + 천단위 콤마
- Morning Page: `작성`이면 초록 칩, `미작성`이면 회색 칩

## 3. `?w=timeline` — 수정

**시안: 02-daily 좌측 "Time Log"**

세로 시간축입니다. Notion 타임라인으로는 절대 안 나오는 부분이라 위젯 효과가
가장 큽니다.

- 좌측에 `07:00` ~ `23:00` 1시간 간격 눈금, 회색 12px
- 각 시간 행 사이 1px `--rule`
- 블록은 시작 시각 위치에 배치, 길이는 duration에 비례
- 블록 안: 제목 + 소요시간 (`회사 보고서 수정  35m`)
- 블록 색은 연한 라벤더 / 연한 초록 계열, 좌측에 2px 짙은 세로선
- 우측 상단에 `합계 2h 16m`

## 4. `?w=bingo` — 신규

**시안: 09-bingo, 01-home 좌측 중단**

- 4열 격자 (`repeat(4, 1fr)`), 모바일 2열
- 카드 상단에 번호 `01` ~ `16`, 회색 작은 글씨, 연한 라벤더 배경 띠
- 카드 본문: 제목 → `Done` 초록 칩 또는 `미완료` 회색 칩 → 체크박스
- 체크박스 클릭 → Notion Bingo DB의 `Done` 토글
- `?board=monthly` / `?board=quarterly` 로 보드 전환
- 상단에 `Done 8 / 16` 표시

## 5. `?w=finance` — 신규

**시안: 04-finance 상단 4분할**

패턴 B로 4개.

```
Expense           Income            Budget left       Card / Loan
₩1,323,100        ₩2,512,000        ₩276,900          ₩540,000
고정 ₩668,900     급여 · 중고 판매   예산 ₩1,600,000    카드 08.25  ₩412,000
변동 ₩654,200                                          학자금 09.01 ₩128,000
```

계산 방법:
- Expense = `Type = Expense` 인 행의 `Amount` 합 (해당 월)
- 고정 = Category가 주거·통신·보험·구독
- 변동 = 그 외 Expense
- Income = `Type = Income` 합
- Budget left = Budget DB의 `Left` 값
- Card / Loan = `Type = 카드/대출` 합, 아래에 개별 항목과 날짜

## 6. `?w=finance-month` — 신규

**시안: 01-home 하단 중앙 "Finance · 이번 달"**

큰 숫자 하나 + 패턴 A 3행.

```
₩1,323,100
고정지출          ₩668,900
변동지출          ₩654,200
남은 예산         ₩276,900
```

## 7. `?w=category` — 신규

**시안: 04-finance 하단 우측 "By category"**

Notion 롤업으로는 **전월 대비가 안 나와서** 위젯이 필요합니다.

```
Category      Amount        전월
식비         −₩286,000     −12,000
카페         −₩64,300      +21,500   ← 증가는 빨강
교통         −₩92,000      +4,000
책           −₩51,900      −8,200
                          합계 −₩654,200
```

- 카테고리 칩은 각 색상 토큰 사용
- 전월 대비: 증가(+)는 빨강, 감소(−)는 회색
- 이번 달과 지난 달을 각각 조회해서 차이 계산

## 8. `?w=life` — 신규

**시안: 05-life 하단 4분할**

```
장소              전시 / 취미        사람             새로운 경험
3                2                 2                2
용산 · 안양천 · 연희동   사진전 · 도자기    친구 · 가족       새 카페 · 새 음식
```

- Life DB의 `Group` 멀티셀렉트로 집계 (장소 / 전시 / 취미 / 사람 / 새로운 경험)
- 숫자는 28px serif
- 아래 줄은 해당 그룹에 속한 항목 이름을 `·`로 연결

## 9. `?w=review` — 신규

**시안: 10-review-monthly, 11-review-quarterly**

패턴 B로 4개. `?type=monthly` / `?type=quarterly` 로 전환.

Monthly:
```
Tasks      Tracked      Expense       Life
18 / 27    42h 10m      ₩1,323,100    9건
완료/전체   기록된 시간   예산 ₩1,600,000   Bingo 8 / 16
```

Quarterly는 Review DB의 `Q Tasks done` 등 rollup 값을 사용.

## 10. `?w=shelf` — 신규

**시안: 01-home 하단 우측 "Reading / Travel"**

패턴 A.

```
단순한 열정        Reading
아무튼, 계속       Reading
부산              09.12 —
```

Books에서 `Status = Reading`, Trips에서 `Phase = Planning` 을 합쳐서 표시.

## 11. `?w=trip` — 신규

**시안: 06-trips 중단 "강릉 · After Trip"**

Notion 페이지에서는 **다른 행의 속성을 본문에 못 띄웁니다.** 그래서 위젯이 필요.

```
Best Moment              Favorite Place        What I'd Change
해변에서 아무 계획 없이     경포호 산책로   아침    일정 하나 줄이기   다시 갈 것
앉아 있던 오후
```

3단, 각 칸 아래 1px `--rule`. `?trip=강릉` 처럼 이름으로 지정.

## 12. `?w=streak` — 신규

**시안: 08-money-letter 메타 줄 "기록 19일 연속"**

Streak DB의 `연속 기록` count rollup을 읽어서 표시.

```
Month 2026.08      기록 3일 연속
```

## 13. `?w=tasks` — 신규 (선택)

**시안: 02-daily 우측 "Tasks" + 타이머 칩**

이건 난이도가 높으니 **마지막에** 하세요.

- 각 행에 `▷ 시작` `■ 정지` 버튼
- `시작` → Time Log에 새 행 생성 (Task 관계 + Start = 지금)
- `정지` → 그 행의 End = 지금
- 우측 상단에 `00:00:00 대기 중` 칩, 실행 중이면 경과 시간 표시

---

## 작업 순서

한 번에 다 하지 말고 단계로 나누세요. 각 단계마다 커밋합니다.

1. **공통** — 색 토큰, 패턴 A/B 컴포넌트, 서버 조회 함수 정리
2. **수정** — routine, today, timeline (이미 있는 것)
3. **신규 1차** — bingo, finance, finance-month
4. **신규 2차** — life, review, shelf
5. **신규 3차** — category, trip, streak
6. **선택** — tasks

## 지켜야 할 것

- `npm run lint` 와 `npm run build` 둘 다 통과
- Notion 토큰은 서버에서만. 클라이언트 번들에 절대 넣지 말 것
- 위젯마다 조회 실패 시 **원인이 보이는 메시지**를 띄울 것. "요청 실패" 같은
  뭉뚱그린 문구 금지
- 응답을 30초 정도 캐시할 것. Notion API는 초당 3회 제한이고 위젯이 여러 개
  뜨면 각자 요청함
- DB ID와 속성 이름은 `NOTION.md` 참고
- 커밋 메시지는 `feat:` `fix:` `refactor:`
- 단계마다 push
