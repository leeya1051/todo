import { Types } from "mongoose"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import connectDB from "@/lib/db"
import Todo, { TodoStatus } from "@/lib/models/Todo"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import YearGoal from "@/lib/models/YearGoal"
import { calcWeeklyPlanProgress, calcYearGoalProgress } from "@/lib/progress"

const userId = new Types.ObjectId()

async function createWeeklyPlan(yearGoalId: Types.ObjectId | null = null) {
  return WeeklyPlan.create({
    userId,
    title: "주간 계획",
    weekStartDate: "2026-08-17",
    weekEndDate: "2026-08-23",
    yearGoalId,
  })
}

async function createTodos(
  weeklyPlanId: Types.ObjectId,
  doneCount: number,
  total: number
) {
  const docs = Array.from({ length: total }, (_, index) => ({
    userId,
    title: `할 일 ${index + 1}`,
    status: (index < doneCount ? "done" : "todo") satisfies TodoStatus,
    date: "2026-08-20",
    weeklyPlanId,
  }))

  await Todo.insertMany(docs)
}

beforeAll(async () => {
  await connectDB()
})

afterEach(async () => {
  await Promise.all([
    Todo.deleteMany({}),
    WeeklyPlan.deleteMany({}),
    YearGoal.deleteMany({}),
  ])
})

describe("calcWeeklyPlanProgress", () => {
  it("returns 0 (not NaN) for a weekly plan with no todos", async () => {
    const plan = await createWeeklyPlan()

    const progress = await calcWeeklyPlanProgress(
      plan._id.toString(),
      userId.toString()
    )

    expect(progress).toBe(0)
    expect(Number.isNaN(progress)).toBe(false)
    expect(Number.isFinite(progress)).toBe(true)
  })

  it("floors the percentage instead of rounding (1 of 3 -> 33)", async () => {
    const plan = await createWeeklyPlan()
    await createTodos(plan._id, 1, 3)

    const progress = await calcWeeklyPlanProgress(
      plan._id.toString(),
      userId.toString()
    )

    expect(progress).toBe(33)
  })

  it("returns 100 when every todo is done", async () => {
    const plan = await createWeeklyPlan()
    await createTodos(plan._id, 4, 4)

    const progress = await calcWeeklyPlanProgress(
      plan._id.toString(),
      userId.toString()
    )

    expect(progress).toBe(100)
  })

  it("ignores todos owned by another user", async () => {
    const plan = await createWeeklyPlan()
    await createTodos(plan._id, 1, 2)
    await Todo.create({
      userId: new Types.ObjectId(),
      title: "다른 사용자 할 일",
      status: "done",
      date: "2026-08-20",
      weeklyPlanId: plan._id,
    })

    const progress = await calcWeeklyPlanProgress(
      plan._id.toString(),
      userId.toString()
    )

    expect(progress).toBe(50)
  })
})

describe("calcYearGoalProgress", () => {
  it("sums todos across weekly plans rather than averaging their percentages", async () => {
    const goal = await YearGoal.create({
      userId,
      title: "1년 목표",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })

    // plan A: 1/2 -> 50%, plan B: 1/6 -> 16%
    const planA = await createWeeklyPlan(goal._id)
    const planB = await createWeeklyPlan(goal._id)
    await createTodos(planA._id, 1, 2)
    await createTodos(planB._id, 1, 6)

    const progress = await calcYearGoalProgress(
      goal._id.toString(),
      userId.toString()
    )

    const planAProgress = await calcWeeklyPlanProgress(
      planA._id.toString(),
      userId.toString()
    )
    const planBProgress = await calcWeeklyPlanProgress(
      planB._id.toString(),
      userId.toString()
    )
    const naiveAverage = Math.floor((planAProgress + planBProgress) / 2)

    expect(planAProgress).toBe(50)
    expect(planBProgress).toBe(16)

    // sum-based: floor(2 / 8 * 100) = 25
    expect(progress).toBe(25)
    expect(naiveAverage).toBe(33)
    expect(progress).not.toBe(naiveAverage)
  })

  it("returns 0 for a year goal with no linked weekly plans", async () => {
    const goal = await YearGoal.create({
      userId,
      title: "빈 1년 목표",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })

    const progress = await calcYearGoalProgress(
      goal._id.toString(),
      userId.toString()
    )

    expect(progress).toBe(0)
  })

  it("returns 0 when linked weekly plans have no todos", async () => {
    const goal = await YearGoal.create({
      userId,
      title: "할 일 없는 목표",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    })
    await createWeeklyPlan(goal._id)
    await createWeeklyPlan(goal._id)

    const progress = await calcYearGoalProgress(
      goal._id.toString(),
      userId.toString()
    )

    expect(progress).toBe(0)
    expect(Number.isNaN(progress)).toBe(false)
  })
})
