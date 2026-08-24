import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import mongoose from "mongoose"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import YearGoal from "@/lib/models/YearGoal"
import { calcWeeklyPlanProgress } from "@/lib/progress"
import { createWeeklyPlanSchema } from "@/lib/validation/weeklyPlan"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const userId = session.user.id
  const yearGoalId = new URL(request.url).searchParams.get("yearGoalId")

  // 형식이 잘못된 id는 CastError(500) 대신 "일치 항목 없음"으로 처리한다
  if (yearGoalId && !mongoose.isValidObjectId(yearGoalId)) {
    return NextResponse.json({ weeklyPlans: [] })
  }

  await connectDB()

  const filter: Record<string, unknown> = { userId }

  if (yearGoalId) {
    filter.yearGoalId = yearGoalId
  }

  const plans = await WeeklyPlan.find(filter).sort({ weekStartDate: -1 }).lean()

  const weeklyPlans = await Promise.all(
    plans.map(async (plan: { _id: unknown }) => ({
      ...plan,
      progress: await calcWeeklyPlanProgress(String(plan._id), userId),
    }))
  )

  return NextResponse.json({ weeklyPlans })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const userId = session.user.id

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON이 아닙니다" },
      { status: 400 }
    )
  }

  const parsed = createWeeklyPlanSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "입력값이 올바르지 않습니다",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  await connectDB()

  const yearGoalId = parsed.data.yearGoalId ?? null

  if (yearGoalId) {
    const yearGoal = await YearGoal.findOne({ _id: yearGoalId, userId })

    if (!yearGoal) {
      return NextResponse.json(
        { error: "1년 목표를 찾을 수 없습니다" },
        { status: 404 }
      )
    }
  }

  const plan = await WeeklyPlan.create({
    ...parsed.data,
    yearGoalId,
    userId,
  })

  return NextResponse.json(
    { ...plan.toObject(), progress: 0 },
    { status: 201 }
  )
}
