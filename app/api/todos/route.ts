import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import mongoose from "mongoose"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Todo from "@/lib/models/Todo"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import { createTodoSchema } from "@/lib/validation/todo"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
  }

  await connectDB()

  const status = request.nextUrl.searchParams.get("status")
  const date = request.nextUrl.searchParams.get("date")
  const weeklyPlanId = request.nextUrl.searchParams.get("weeklyPlanId")
  const yearGoalId = request.nextUrl.searchParams.get("yearGoalId")

  // 형식이 잘못된 id는 CastError(500) 대신 "일치 항목 없음"으로 처리한다
  if (weeklyPlanId && !mongoose.isValidObjectId(weeklyPlanId)) {
    return NextResponse.json({ todos: [] }, { status: 200 })
  }

  if (yearGoalId && !mongoose.isValidObjectId(yearGoalId)) {
    return NextResponse.json({ todos: [] }, { status: 200 })
  }

  const filter: Record<string, unknown> = { userId: session.user.id }

  if (status) {
    filter.status = status
  }

  if (date) {
    filter.date = date
  }

  if (weeklyPlanId) {
    filter.weeklyPlanId = weeklyPlanId
  }

  if (yearGoalId) {
    const planIds = await WeeklyPlan.distinct("_id", {
      userId: session.user.id,
      yearGoalId,
    })

    filter.weeklyPlanId = { $in: planIds }
  }

  const todos = await Todo.find(filter).sort({ createdAt: -1 })

  return NextResponse.json({ todos }, { status: 200 })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
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

  const parsed = createTodoSchema.safeParse(body)

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

  if (parsed.data.weeklyPlanId) {
    const weeklyPlan = await WeeklyPlan.findOne({
      _id: parsed.data.weeklyPlanId,
      userId: session.user.id,
    })

    if (!weeklyPlan) {
      return NextResponse.json(
        { error: "주간 계획을 찾을 수 없습니다" },
        { status: 404 }
      )
    }
  }

  const todo = await Todo.create({
    userId: session.user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    date: parsed.data.date,
    priority: parsed.data.priority ?? "medium",
    weeklyPlanId: parsed.data.weeklyPlanId ?? null,
    status: "todo",
  })

  return NextResponse.json({ todo }, { status: 201 })
}
