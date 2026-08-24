import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import YearGoal from "@/lib/models/YearGoal"
import { calcYearGoalProgress } from "@/lib/progress"
import { createYearGoalSchema } from "@/lib/validation/yearGoal"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const userId = session.user.id

  await connectDB()

  const goals = await YearGoal.find({ userId }).sort({ startDate: -1 }).lean()

  const yearGoals = await Promise.all(
    goals.map(async (goal: { _id: unknown }) => ({
      ...goal,
      progress: await calcYearGoalProgress(String(goal._id), userId),
    }))
  )

  return NextResponse.json({ yearGoals })
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

  const parsed = createYearGoalSchema.safeParse(body)

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

  const goal = await YearGoal.create({ ...parsed.data, userId })

  return NextResponse.json(
    { ...goal.toObject(), progress: 0 },
    { status: 201 }
  )
}
