import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import YearGoal from "@/lib/models/YearGoal"
import { calcWeeklyPlanProgress } from "@/lib/progress"
import WeeklyPlanList, {
  type WeeklyPlanListItem,
} from "@/components/WeeklyPlanList"

export const dynamic = "force-dynamic"

export default async function WeeklyPlansPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  await connectDB()

  const [plans, yearGoals] = await Promise.all([
    WeeklyPlan.find({ userId }).sort({ weekStartDate: -1 }).lean(),
    YearGoal.find({ userId }).lean(),
  ])

  const initialPlans: WeeklyPlanListItem[] = await Promise.all(
    plans.map(async (plan) => ({
      _id: String(plan._id),
      title: plan.title,
      weekStartDate: plan.weekStartDate,
      weekEndDate: plan.weekEndDate,
      yearGoalId: plan.yearGoalId ? String(plan.yearGoalId) : null,
      progress: await calcWeeklyPlanProgress(String(plan._id), userId),
    }))
  )

  const yearGoalTitles = Object.fromEntries(
    yearGoals.map((goal) => [String(goal._id), goal.title])
  )

  return (
    <main className="mx-auto max-w-3xl p-6">
      <WeeklyPlanList
        initialPlans={initialPlans}
        yearGoalTitles={yearGoalTitles}
      />
    </main>
  )
}
