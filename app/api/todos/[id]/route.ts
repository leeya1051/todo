import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import mongoose from "mongoose"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Todo from "@/lib/models/Todo"
import WeeklyPlan from "@/lib/models/WeeklyPlan"
import { updateTodoSchema } from "@/lib/validation/todo"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const parsed = updateTodoSchema.safeParse(body)

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

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json(
      { error: "할 일을 찾을 수 없습니다" },
      { status: 404 }
    )
  }

  await connectDB()

  const todo = await Todo.findOne({ _id: params.id, userId: session.user.id })

  if (!todo) {
    return NextResponse.json(
      { error: "할 일을 찾을 수 없습니다" },
      { status: 404 }
    )
  }

  if (
    parsed.data.weeklyPlanId !== undefined &&
    parsed.data.weeklyPlanId !== null
  ) {
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

  if (parsed.data.title !== undefined) {
    todo.title = parsed.data.title
  }

  if (parsed.data.description !== undefined) {
    todo.description = parsed.data.description
  }

  if (parsed.data.date !== undefined) {
    todo.date = parsed.data.date
  }

  if (parsed.data.status !== undefined) {
    todo.status = parsed.data.status
  }

  if (parsed.data.priority !== undefined) {
    todo.priority = parsed.data.priority
  }

  if (parsed.data.weeklyPlanId !== undefined) {
    todo.weeklyPlanId = parsed.data.weeklyPlanId
      ? new mongoose.Types.ObjectId(parsed.data.weeklyPlanId)
      : null
  }

  await todo.save()

  return NextResponse.json({ todo }, { status: 200 })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
  }

  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json(
      { error: "할 일을 찾을 수 없습니다" },
      { status: 404 }
    )
  }

  await connectDB()

  const deleted = await Todo.findOneAndDelete({
    _id: params.id,
    userId: session.user.id,
  })

  if (!deleted) {
    return NextResponse.json(
      { error: "할 일을 찾을 수 없습니다" },
      { status: 404 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
