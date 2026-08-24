export type TodoStatus = "todo" | "doing" | "done"

export type TodoPriority = "low" | "medium" | "high"

export interface BoardTodo {
  _id: string
  title: string
  description?: string
  status: TodoStatus
  date: string
  priority: TodoPriority
  weeklyPlanId: string | null
}

export interface BoardWeeklyPlan {
  _id: string
  title: string
}

export const STATUS_COLUMNS: { status: TodoStatus; label: string }[] = [
  { status: "todo", label: "할 일" },
  { status: "doing", label: "진행 중" },
  { status: "done", label: "완료" },
]

export function isTodoStatus(value: unknown): value is TodoStatus {
  return value === "todo" || value === "doing" || value === "done"
}
