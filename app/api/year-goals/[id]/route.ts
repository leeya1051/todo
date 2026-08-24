import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import mongoose from "mongoose"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import YearGoal from "@/lib/models/YearGoal"
import { calcYearGoalProgress } from "@/lib/progress"
import { updateYearGoalSchema } from "@/lib/validation/yearGoal"

const notFound = () =>
  NextResponse.json({ error: "1년 목표를 찾을 수 없습니다" }, { status: 404 })

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const userId = session.user.id

  if (!mongoose.isValidObjectId(params.id)) {
    return notFound()
  }

  await connectDB()

  const goal = await YearGoal.findOne({ _id: params.id, userId })

  if (!goal) {
    return notFound()
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON이 아닙니다" },
      { status: 400 }
    )
  }

  const parsed = updateYearGoalSchema.safeParse(body)

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

  goal.set(parsed.data)
  await goal.save()

  const progress = await calcYearGoalProgress(String(goal._id), userId)

  return NextResponse.json({ ...goal.toObject(), progress })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const userId = session.user.id

  if (!mongoose.isValidObjectId(params.id)) {
    return notFound()
  }

  await connectDB()

  const goal = await YearGoal.findOne({ _id: params.id, userId })

  if (!goal) {
    return notFound()
  }

  // WeeklyPlan → YearGoal 링크만 해제한다. WeeklyPlan과 그 하위 Todo는 보존한다
  // (PLAN.md §0-1 null-out 정책).
  await WeeklyPlan.updateMany(
    { yearGoalId: params.id, userId },
    { $set: { yearGoalId: null } }
  )

  await goal.deleteOne()

  return new NextResponse(null, { status: 204 })
}
