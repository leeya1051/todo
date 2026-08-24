import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import mongoose from "mongoose"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Todo from "@/lib/models/Todo"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import YearGoal from "@/lib/models/YearGoal"
import { calcWeeklyPlanProgress } from "@/lib/progress"
import { updateWeeklyPlanSchema } from "@/lib/validation/weeklyPlan"

const notFound = () =>
  NextResponse.json({ error: "주간 계획을 찾을 수 없습니다" }, { status: 404 })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const userId = session.user.id
  const { id } = await params

  if (!mongoose.isValidObjectId(id)) {
    return notFound()
  }

  await connectDB()

  const plan = await WeeklyPlan.findOne({ _id: id, userId })

  if (!plan) {
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

  const parsed = updateWeeklyPlanSchema.safeParse(body)

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

  if (parsed.data.yearGoalId) {
    const yearGoal = await YearGoal.findOne({
      _id: parsed.data.yearGoalId,
      userId,
    })

    if (!yearGoal) {
      return NextResponse.json(
        { error: "1년 목표를 찾을 수 없습니다" },
        { status: 404 }
      )
    }
  }

  plan.set(parsed.data)
  await plan.save()

  const progress = await calcWeeklyPlanProgress(String(plan._id), userId)

  return NextResponse.json({ ...plan.toObject(), progress })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const userId = session.user.id
  const { id } = await params

  if (!mongoose.isValidObjectId(id)) {
    return notFound()
  }

  await connectDB()

  const plan = await WeeklyPlan.findOne({ _id: id, userId })

  if (!plan) {
    return notFound()
  }

  // 연결 해제(null 처리)를 삭제보다 먼저 수행한다. 이 순서 덕분에 두 작업
  // 사이에 실패가 발생해도 Todo는 이미 연결 해제된 상태이고 계획은 아직
  // 존재하는, 안전하게 복구 가능한 상태로 남는다 (삭제된 계획을 가리키는
  // 고아 Todo가 생기지 않는다) (PLAN.md §0-1).
  await Todo.updateMany(
    { weeklyPlanId: id, userId },
    { $set: { weeklyPlanId: null } }
  )

  await plan.deleteOne()

  return new NextResponse(null, { status: 204 })
}
