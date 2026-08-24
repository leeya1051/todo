할 일 관리 앱 PRD

1\. Why - 목적

일일 할 일을 주간 계획과 1년 목표에 연결

할 일 상태와 주간 목표 진행률을 한 화면에서 관리

드래그 앤 드롭 기반의 직관적인 업무 상태 관리

상위 목표 대비 실제 실행 현황을 자동으로 확인

2\. Who - 타깃 사용자

개인의 업무와 목표를 체계적으로 관리하려는 사용자

일일/주간/연간 목표를 연계해 관리하려는 사용자

진행 상황을 시각적으로 관리하려는 사용자

3\. User Flow

1년 목표 생성

1년 목표 입력

목표 기간 설정

주간 계획 생성

주간 계획 입력

1년 목표 연결

할 일 생성

할 일 입력

주간 계획 연결

상태 설정: todo

할 일 실행

todo → doing → done 상태 변경

드래그 앤 드롭으로 상태 변경

진행률 확인

완료된 할 일 기준 주간 진행률 자동 계산

주간 계획 진행률 확인

연결된 1년 목표의 진행 현황 확인

4\. 기능 요구 사항

P0 - 핵심 기능

할 일 CRUD

생성

제목 필수

설명 선택

상태 기본값: todo

주간 계획 연결 선택

조회

일일 할 일 목록

상태별 목록

수정

제목/설명 수정

연결된 주간 계획 수정

삭제

삭제 확인 후 삭제

상태 관리

상태값: todo, doing, done

상태별 컬럼 제공

상태 변경 시 즉시 저장

드래그 앤 드롭

할 일을 상태 컬럼 간 이동

이동 완료 시 상태값 자동 변경

todo → doing → done 외 역방향 이동 지원

기간 구조

일일 단위: 할 일 관리

주간 단위: 주간 계획 관리

연간 단위: 1년 목표 관리

구조 연결

할 일 → 주간 계획 → 1년 목표

할 일은 하나의 주간 계획에 연결 가능

주간 계획은 하나의 1년 목표에 연결 가능

주간 진행률 자동 반영

주간 계획의 완료 할 일 수 / 전체 할 일 수로 진행률 계산

할 일이 done으로 변경되면 진행률 자동 갱신

done에서 다른 상태로 변경되면 진행률 자동 감소

할 일 생성/삭제 시 진행률 자동 갱신

데이터 모델

YearGoal

id

title

startDate

endDate

WeeklyPlan

id

title

weekStartDate

weekEndDate

yearGoalId

Todo

id

title

description

status

date

weeklyPlanId

createdAt

updatedAt

핵심 API

POST /todos

GET /todos

PATCH /todos/:id

DELETE /todos/:id

POST /weekly-plans

GET /weekly-plans

PATCH /weekly-plans/:id

POST /year-goals

GET /year-goals

진행률은 Todo 상태 데이터를 기준으로 서버 또는 클라이언트에서 자동 계산

P1 - 추가 기능

일일/주간/연간 뷰 전환

주간 계획별 할 일 필터링

1년 목표별 주간 계획 필터링

주간 진행률 시각화

완료율 및 미완료 할 일 통계

할 일 정렬 및 우선순위 설정

주간 계획 및 1년 목표 수정/삭제

날짜별 할 일 조회

