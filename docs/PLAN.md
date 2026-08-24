# 할 일 관리 앱 — 프로젝트 계획

> 기반 문서: [docs/PRD.md](./PRD.md)
> 상태: **pending approval** (실행 승인 전)

## 0. 기술 스택 결정 (인터뷰 결과)

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14 (App Router) + TypeScript | 프론트/백엔드 단일 저장소, API Routes로 REST 구현 |
| DB | MongoDB Atlas (클라우드) + Mongoose | 로컬 설치 불필요, 환경변수로 연결 |
| 인증 | NextAuth.js Credentials Provider + bcrypt | 이메일/비밀번호, 멀티유저, 데이터는 사용자별 격리 |
| 드래그 앤 드롭 | @dnd-kit/core | 컬럼 간 이동만 지원 (카드 내 재정렬은 P0 범위 아님) |
| 스타일링 | Tailwind CSS + shadcn/ui | |
| 검증 | Zod | API 요청/폼 공통 스키마 |
| 날짜 저장 | `YYYY-MM-DD` 문자열 (Date 타입 아님) | 타임존 드리프트 방지 |

### 확정된 비즈니스 규칙 (인터뷰 + Analyst 검토 결과)

1. **삭제 정책**: WeeklyPlan/YearGoal 삭제 시 하위 항목은 연결 해제(null 처리)만 하고 하위 데이터는 보존한다. Hard delete/cascade 없음.
2. **YearGoal 진행률**: 연결된 모든 WeeklyPlan의 `done todo 합계 / 전체 todo 합계`로 계산한다 (주간별 비율 평균이 아님).
3. **할 일 정렬 순서**: P0에서는 미지원. 컬럼(상태) 이동만 지원하며 `order` 필드는 도입하지 않는다.
4. **Todo.date**: 생성 시 필수 입력이며, 연결된 WeeklyPlan의 주간 범위와 일치하는지 서버에서 검증하지 않는다(자유 입력 허용).
5. **주 시작 요일**: ISO 8601 기준 월요일 시작으로 가정한다(P1 뷰 전환 시 변경 가능하도록 상수로 분리).
6. **진행률 계산 시점**: 값을 컬럼에 캐싱하지 않고 조회 시점에 Todo 상태를 집계해서 계산한다 (드리프트 버그 방지). 빈 계획(0/0)은 0%로 표시한다.
7. **인증 격리**: 모든 쿼리는 로그인 사용자의 `userId`로 필터링한다. 다른 사용자 소유의 `weeklyPlanId`/`yearGoalId`를 연결하려는 요청은 404로 거부한다.

## 1. Requirements Summary

PRD의 P0 범위(할 일 CRUD, 상태 관리, 드래그 앤 드롭, 3단계 기간 구조 연결, 진행률 자동 계산)를 MongoDB 기반 멀티유저 웹 앱으로 구현한다. P1(뷰 전환, 필터, 통계, 정렬/우선순위, 계획/목표 수정·삭제)은 P0 완료 후 별도 단계로 진행한다. 인증은 PRD에 없던 요구사항이나, 멀티유저 데이터 격리를 위해 이번 계획에 P0 범위로 포함한다.

## 2. 데이터 모델 (Mongoose)

```ts
// User
{ _id, email: string (unique, lowercase index), passwordHash: string, createdAt }

// YearGoal
{ _id, userId: ObjectId (ref User, indexed), title: string, startDate: string /* YYYY-MM-DD */, endDate: string, createdAt, updatedAt }

// WeeklyPlan
{ _id, userId: ObjectId (indexed), title: string, weekStartDate: string, weekEndDate: string, yearGoalId: ObjectId | null, createdAt, updatedAt }

// Todo
{ _id, userId: ObjectId (indexed), title: string, description?: string, status: "todo" | "doing" | "done", date: string /* YYYY-MM-DD, required */, weeklyPlanId: ObjectId | null, createdAt, updatedAt }
```

인덱스: `{ userId: 1, status: 1 }`, `{ userId: 1, weeklyPlanId: 1 }` (Todo), `{ userId: 1, yearGoalId: 1 }` (WeeklyPlan), `{ email: 1 }` unique (User).

## 3. API 설계 (`app/api/`)

| Method | Path | 설명 | P |
|---|---|---|---|
| POST | `/api/auth/register` | 회원가입 (이메일 중복/형식, 비밀번호 8자+ 검증) | P0 |
| * | `/api/auth/[...nextauth]` | NextAuth 로그인/세션/로그아웃 | P0 |
| GET | `/api/todos` | 목록 (query: `status`, `date`, `weeklyPlanId`) | P0 |
| POST | `/api/todos` | 생성 (title 필수, status 기본 "todo") | P0 |
| PATCH | `/api/todos/:id` | 수정 (title/description/status/weeklyPlanId, 소유권 검증) | P0 |
| DELETE | `/api/todos/:id` | 삭제 (확인은 클라이언트에서, API는 즉시 삭제) | P0 |
| GET | `/api/weekly-plans` | 목록 (query: `yearGoalId`), 각 항목에 계산된 progress 포함 | P0 |
| POST | `/api/weekly-plans` | 생성 | P0 |
| PATCH | `/api/weekly-plans/:id` | 수정 | P0 |
| DELETE | `/api/weekly-plans/:id` | 삭제 + 하위 Todo `weeklyPlanId` null 처리 | P1 |
| GET | `/api/year-goals` | 목록, 각 항목에 계산된 progress 포함 | P0 |
| POST | `/api/year-goals` | 생성 | P0 |
| PATCH | `/api/year-goals/:id` | 수정 | P1 |
| DELETE | `/api/year-goals/:id` | 삭제 + 하위 WeeklyPlan `yearGoalId` null 처리 | P1 |

모든 라우트는 세션 확인 → 404(권한 없음/존재하지 않음 구분 안 함, 정보 노출 방지) → Zod 검증 → Mongoose 쿼리(`userId` 필터 필수) 순서로 처리한다.

## 4. 프로젝트 구조 (신규 생성)

```
app/
  layout.tsx
  page.tsx                         # 로그인 여부에 따라 /board 또는 /login 리다이렉트
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  board/page.tsx                   # P0 메인 화면: 상태별 칼럼 + DnD
  weekly-plans/page.tsx            # 주간 계획 목록/생성
  year-goals/page.tsx              # 1년 목표 목록/생성
  api/
    auth/[...nextauth]/route.ts
    auth/register/route.ts
    todos/route.ts
    todos/[id]/route.ts
    weekly-plans/route.ts
    weekly-plans/[id]/route.ts
    year-goals/route.ts
    year-goals/[id]/route.ts
lib/
  db.ts                            # Mongoose 연결 캐싱 (서버리스 대응)
  auth.ts                          # NextAuth 설정
  models/{User,YearGoal,WeeklyPlan,Todo}.ts
  validation/{todo,weeklyPlan,yearGoal,auth}.ts   # Zod 스키마
  progress.ts                      # WeeklyPlan/YearGoal 진행률 집계 함수
components/
  board/{TodoBoard,StatusColumn,TodoCard}.tsx     # @dnd-kit DndContext
  forms/{TodoForm,WeeklyPlanForm,YearGoalForm}.tsx
  ui/...                           # shadcn 컴포넌트
middleware.ts                      # 미인증 접근 시 /login 리다이렉트
.env.local                         # MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL
```

## 5. Implementation Steps

### Phase 0 — 프로젝트 부트스트랩
1. `create-next-app` (TypeScript, App Router, Tailwind, ESLint) 실행
2. `shadcn/ui` init, 기본 컴포넌트(button, input, dialog, card, select) 추가
3. `mongoose`, `next-auth`, `bcryptjs`, `zod`, `@dnd-kit/core` 설치
4. `lib/db.ts` — Mongoose 연결 캐싱 유틸 작성 (`global` 캐시로 서버리스 재연결 방지)
5. `.env.local.example` 작성: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
6. MongoDB Atlas 클러스터 생성, IP 액세스(0.0.0.0/0 개발용 또는 Vercel용), DB 사용자 생성 → 연결 문자열 확보

### Phase 1 — 인증
7. `lib/models/User.ts` — email unique index, passwordHash
8. `lib/auth.ts` — NextAuth Credentials Provider (bcrypt.compare), JWT 세션 전략
9. `app/api/auth/register/route.ts` — 이메일 중복 검사, bcrypt.hash(cost 10+)
10. `app/(auth)/login`, `app/(auth)/register` 페이지 (react-hook-form + zod)
11. `middleware.ts` — `/board`, `/weekly-plans`, `/year-goals`, `/api/*`(auth 제외) 보호

### Phase 2 — 데이터 모델 & 진행률 로직
12. `lib/models/{YearGoal,WeeklyPlan,Todo}.ts` 스키마 정의 (인덱스 포함)
13. `lib/progress.ts`
    - `calcWeeklyPlanProgress(weeklyPlanId, userId)`: Todo aggregation `$match{userId, weeklyPlanId} → $group` done/total, 0/0 → 0
    - `calcYearGoalProgress(yearGoalId, userId)`: 연결된 WeeklyPlan들의 Todo를 한 번에 집계(합산 기준), 반올림 없이 내림 처리
14. 단위 테스트: 진행률 계산 함수 (빈 계획, 부분 완료, 전체 완료, 여러 계획 합산 케이스)

### Phase 3 — 할 일 CRUD API
15. `app/api/todos/route.ts` — GET(필터), POST(title 필수, status 기본값, userId/weeklyPlanId 소유권 검증)
16. `app/api/todos/[id]/route.ts` — PATCH(status/weeklyPlanId 변경 시 연결 대상 소유권 재검증), DELETE
17. `lib/validation/todo.ts` — Zod 스키마 (title 1자 이상 200자 이하, date 필수 `YYYY-MM-DD` 정규식)

### Phase 4 — 주간 계획 / 1년 목표 API
18. `app/api/weekly-plans/route.ts`, `app/api/year-goals/route.ts` — GET(목록 + progress 포함), POST
19. `app/api/weekly-plans/[id]/route.ts` PATCH (P0), DELETE (P1, cascade null-out 트랜잭션)
20. `app/api/year-goals/[id]/route.ts` PATCH/DELETE (P1, cascade null-out)

### Phase 5 — 보드 UI (P0 핵심 화면)
21. `components/board/TodoBoard.tsx` — `DndContext` + 3개 `StatusColumn`(todo/doing/done)
22. `components/board/StatusColumn.tsx` — `useDroppable`, 빈 컬럼 min-height 처리
23. `components/board/TodoCard.tsx` — `useDraggable`, 키보드 센서(a11y) 포함
24. 드롭 핸들러: optimistic update → `PATCH /api/todos/:id {status}` → 실패 시 롤백 + toast, 동일 컬럼 드롭은 no-op
25. `components/forms/TodoForm.tsx` — 생성/수정 다이얼로그 (제목 필수, 설명 선택, 주간계획 선택 드롭다운)
26. `app/board/page.tsx` — 서버 컴포넌트에서 초기 데이터 fetch(`cache: "no-store"`), 클라이언트 컴포넌트에 hydrate

### Phase 6 — 주간 계획 / 1년 목표 UI
27. `app/weekly-plans/page.tsx` — 목록(진행률 바 포함) + 생성 폼 + 1년 목표 연결 선택
28. `app/year-goals/page.tsx` — 목록(진행률 바 포함) + 생성 폼

### Phase 7 — P1 (P0 완료 후 별도 승인 필요)
29. 일일/주간/연간 뷰 전환, 계획별/목표별 필터링
30. 완료율 통계, 미완료 할 일 통계 시각화
31. 할 일 정렬/우선순위 필드 추가 (스키마 변경 필요)
32. 주간 계획/1년 목표 수정·삭제 UI 연결 (API는 Phase 4에서 이미 구현)
33. 날짜별 할 일 조회 화면

## 6. Acceptance Criteria (testable)

- [ ] `POST /api/todos` — title 누락 시 400, 정상 요청 시 201 + `status:"todo"` 기본값 확인
- [ ] `GET /api/todos?status=doing` — 로그인 사용자의 doing 항목만 반환, 다른 사용자 데이터 미포함(별도 계정 2개로 교차 검증)
- [ ] `PATCH /api/todos/:id {status:"done"}` — 200 응답 후 연결된 WeeklyPlan `GET` 응답의 progress가 즉시 증가
- [ ] `PATCH /api/todos/:id {status:"todo"}` (done→todo 역방향) — 연결 WeeklyPlan progress 감소 확인
- [ ] `DELETE /api/todos/:id` — 204, 목록에서 제거, 연결 WeeklyPlan progress 재계산 확인
- [ ] `PATCH /api/todos/:id {weeklyPlanId: <다른 유저 소유 ID>}` — 404 반환, 연결되지 않음
- [ ] WeeklyPlan에 Todo가 0개일 때 progress = 0 (NaN/Infinity 아님)
- [ ] YearGoal progress — 연결된 2개 이상 WeeklyPlan의 done/total 합산값과 일치 (평균 아님)
- [ ] 보드 화면: 카드를 todo→doing 드래그 시 즉시 UI 반영 + 새로고침 후에도 상태 유지
- [ ] 보드 화면: 네트워크 실패 시뮬레이션(PATCH 500) 시 카드가 원래 컬럼으로 롤백 + 에러 토스트 표시
- [ ] KST(UTC+9) 환경에서 `date` 필드 저장/조회 시 날짜가 하루 밀리지 않음(문자열 저장 검증)
- [ ] 미로그인 상태로 `/board` 접근 시 `/login`으로 리다이렉트
- [ ] 회원가입 시 중복 이메일 → 409, 8자 미만 비밀번호 → 400

## 7. Risks and Mitigations

| 리스크 | 완화 방안 |
|---|---|
| 진행률 캐시 필드와 실제 상태 드리프트 | 캐싱하지 않고 조회 시점에 aggregation으로 계산 (§0-6) |
| 타임존 드리프트로 날짜 하루 밀림 | 모든 날짜를 `YYYY-MM-DD` 문자열로 저장, `Date` 객체 변환 최소화 |
| 크로스 테넌트 데이터 연결(다른 유저의 weeklyPlanId 주입) | PATCH 시 연결 대상 소유권을 `userId` 필터로 재검증, 실패 시 404 |
| 드래그 중 연속 요청의 응답 순서 역전 | 마지막 드롭 상태만 신뢰하는 optimistic update + 실패 시 서버 재조회로 정합성 복구 |
| Mongoose 서버리스 연결 폭증 | `lib/db.ts`에서 `global` 객체에 연결 캐싱 |
| Atlas 네트워크 접근 제한으로 배포 후 연결 실패 | IP 액세스 리스트에 배포 환경(Vercel 등) 허용 설정 문서화 |
| 하위 항목 cascade 삭제로 인한 데이터 유실 | null-out 정책 채택(§0-1), hard delete 미사용 |
| shadcn Dialog와 dnd-kit 센서 충돌(포커스/포인터 이벤트) | Dialog 오픈 중 드래그 센서 비활성화 처리 |

## 8. Verification Steps

1. `npm run build` — 타입 에러/빌드 실패 없음
2. `lib/progress.ts` 단위 테스트 실행 (Vitest/Jest) — 빈/부분/완료/합산 케이스 통과
3. API 통합 테스트 — 인증 격리 시나리오(계정 A가 계정 B의 리소스 조작 시도 시 404) 통과
4. 브라우저 수동 QA — 보드 화면에서 카드 드래그(정방향/역방향), 새로고침 후 상태 유지 확인
5. 브라우저 수동 QA — 네트워크 탭에서 PATCH 요청 실패 강제 후 롤백 동작 확인
6. 회원가입→로그인→로그아웃→미인증 접근 리다이렉트 전체 플로우 수동 확인

## 9. 변경 이력 / 결정 근거

- 인터뷰를 통해 기술 스택(Next.js 14 + TypeScript + MongoDB Atlas + NextAuth + @dnd-kit + Tailwind/shadcn) 확정
- Analyst(Opus) 검토로 PRD에 명시되지 않은 5개 핵심 이슈(cascade 정책, YearGoal 진행률 공식, 정렬 순서 범위, 날짜 필수 여부, 인증 격리) 식별 → 각각 사용자 확인 후 §0에 반영
- P1 항목 중 "주간 계획/1년 목표 수정·삭제"는 API는 P0에서 함께 구현하되 UI 연결은 P1로 분리(백엔드 재작업 방지)
