import { Types } from "mongoose"
import connectDB from "@/lib/db"
import Todo from "@/lib/models/Todo"
import WeeklyPlan from "@/lib/models/WeeklyPlan"

interface ProgressCounts {
  done: number
  total: number
}

function toPercent({ done, total }: ProgressCounts): number {
  if (total <= 0) {
    return 0
  }

  return Math.floor((done / total) * 100)
}

const doneCountStage = {
  $group: {
    _id: null,
    total: { $sum: 1 },
    done: {
      $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] },
    },
  },
}

export async function calcWeeklyPlanProgress(
  weeklyPlanId: string,
  userId: string
): Promise<number> {
  if (
    !Types.ObjectId.isValid(weeklyPlanId) ||
    !Types.ObjectId.isValid(userId)
  ) {
    return 0
  }

  await connectDB()

  const [counts] = await Todo.aggregate<ProgressCounts>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        weeklyPlanId: new Types.ObjectId(weeklyPlanId),
      },
    },
    doneCountStage,
  ])

  return toPercent(counts ?? { done: 0, total: 0 })
}

export async function calcYearGoalProgress(
  yearGoalId: string,
  userId: string
): Promise<number> {
  if (!Types.ObjectId.isValid(yearGoalId) || !Types.ObjectId.isValid(userId)) {
    return 0
  }

  await connectDB()

  const ownerId = new Types.ObjectId(userId)

  const weeklyPlanIds: Types.ObjectId[] = await WeeklyPlan.distinct("_id", {
    userId: ownerId,
    yearGoalId: new Types.ObjectId(yearGoalId),
  })

  if (weeklyPlanIds.length === 0) {
    return 0
  }

  const [counts] = await Todo.aggregate<ProgressCounts>([
    {
      $match: {
        userId: ownerId,
        weeklyPlanId: { $in: weeklyPlanIds },
      },
    },
    doneCountStage,
  ])

  return toPercent(counts ?? { done: 0, total: 0 })
}
