import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import YearGoal from "@/lib/models/YearGoal"
import { calcYearGoalProgress } from "@/lib/progress"
import YearGoalList, { type YearGoalListItem } from "@/components/YearGoalList"

export const dynamic = "force-dynamic"

export default async function YearGoalsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  await connectDB()

  const goals = await YearGoal.find({ userId }).sort({ startDate: -1 }).lean()

  const initialGoals: YearGoalListItem[] = await Promise.all(
    goals.map(async (goal) => ({
      _id: String(goal._id),
      title: goal.title,
      startDate: goal.startDate,
      endDate: goal.endDate,
      progress: await calcYearGoalProgress(String(goal._id), userId),
    }))
  )

  return (
    <main className="mx-auto max-w-3xl p-6">
      <YearGoalList initialGoals={initialGoals} />
    </main>
  )
}
