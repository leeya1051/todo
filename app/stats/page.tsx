import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Todo from "@/lib/models/Todo"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import YearGoal from "@/lib/models/YearGoal"
import { calcWeeklyPlanProgress, calcYearGoalProgress } from "@/lib/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function StatsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  await connectDB()

  const [todos, plans, yearGoals] = await Promise.all([
    Todo.find({ userId }).lean(),
    WeeklyPlan.find({ userId }).lean(),
    YearGoal.find({ userId }).lean(),
  ])

  const total = todos.length
  const doneCount = todos.filter((todo) => todo.status === "done").length
  const doingCount = todos.filter((todo) => todo.status === "doing").length
  const todoCount = todos.filter((todo) => todo.status === "todo").length
  const completionRate =
    total === 0 ? 0 : Math.floor((doneCount / total) * 100)

  const outstandingByPriority = todos
    .filter((todo) => todo.status !== "done")
    .reduce(
      (acc, todo) => {
        const priority = todo.priority ?? "medium"
        acc[priority] += 1
        return acc
      },
      { high: 0, medium: 0, low: 0 }
    )

  const planProgress = await Promise.all(
    plans.map(async (plan) => ({
      _id: String(plan._id),
      title: plan.title,
      progress: await calcWeeklyPlanProgress(String(plan._id), userId),
    }))
  )

  const yearGoalProgress = await Promise.all(
    yearGoals.map(async (goal) => ({
      _id: String(goal._id),
      title: goal.title,
      progress: await calcYearGoalProgress(String(goal._id), userId),
    }))
  )

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">통계</h1>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>완료율</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{completionRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>상태별 개수</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p>할 일: {todoCount}건</p>
              <p>진행 중: {doingCount}건</p>
              <p>완료: {doneCount}건</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>우선순위별 미완료 개수</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p>높음: {outstandingByPriority.high}건</p>
              <p>보통: {outstandingByPriority.medium}건</p>
              <p>낮음: {outstandingByPriority.low}건</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">주간 계획별 진행률</h2>
          {planProgress.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              아직 등록된 주간 계획이 없습니다.
            </p>
          ) : (
            <div className="grid gap-3">
              {planProgress.map((plan) => (
                <Card key={plan._id}>
                  <CardHeader>
                    <CardTitle>{plan.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground text-right text-xs">
                      {plan.progress}%
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">1년 목표별 진행률</h2>
          {yearGoalProgress.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              아직 등록된 1년 목표가 없습니다.
            </p>
          ) : (
            <div className="grid gap-3">
              {yearGoalProgress.map((goal) => (
                <Card key={goal._id}>
                  <CardHeader>
                    <CardTitle>{goal.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground text-right text-xs">
                      {goal.progress}%
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
