"use client"

import { useDroppable } from "@dnd-kit/core"

import { cn } from "@/lib/utils"
import { TodoCard } from "@/components/board/TodoCard"
import type { BoardTodo, TodoStatus } from "@/components/board/types"

interface StatusColumnProps {
  status: TodoStatus
  label: string
  todos: BoardTodo[]
  weeklyPlanTitles: Record<string, string>
  onEdit: (todo: BoardTodo) => void
  onDelete: (todo: BoardTodo) => void
}

export function StatusColumn({
  status,
  label,
  todos,
  weeklyPlanTitles,
  onEdit,
  onDelete,
}: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section className="flex flex-col gap-2" aria-label={label}>
      <header className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-xs text-muted-foreground">{todos.length}</span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-2 transition-colors",
          isOver && "border-primary bg-muted"
        )}
      >
        {todos.length === 0 ? (
          <p className="flex min-h-[176px] items-center justify-center text-xs text-muted-foreground">
            여기로 카드를 끌어다 놓으세요
          </p>
        ) : (
          todos.map((todo) => (
            <TodoCard
              key={todo._id}
              todo={todo}
              weeklyPlanTitle={
                todo.weeklyPlanId
                  ? weeklyPlanTitles[todo.weeklyPlanId]
                  : undefined
              }
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default StatusColumn
