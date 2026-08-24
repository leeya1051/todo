import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import Todo from "@/lib/models/Todo"
import TodoBoard from "@/components/board/TodoBoard"
import type { BoardTodo, TodoStatus } from "@/components/board/types"

export const dynamic = "force-dynamic"

export default async function BoardPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  await connectDB()

  const todos = await Todo.find({ userId }).sort({ createdAt: -1 }).lean()

  const initialTodos: BoardTodo[] = todos.map(
    (todo: {
      _id: unknown
      title: string
      description?: string
      status: TodoStatus
      date: string
      priority?: "low" | "medium" | "high"
      weeklyPlanId?: unknown
    }) => ({
      _id: String(todo._id),
      title: todo.title,
      description: todo.description,
      status: todo.status,
      date: todo.date,
      priority: todo.priority ?? "medium",
      weeklyPlanId: todo.weeklyPlanId ? String(todo.weeklyPlanId) : null,
    })
  )

  return (
    <main className="mx-auto max-w-5xl p-6">
      <TodoBoard initialTodos={initialTodos} />
    </main>
  )
}
