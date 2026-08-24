"use client"

import { useDraggable } from "@dnd-kit/core"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { BoardTodo, TodoPriority } from "@/components/board/types"

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
}

const PRIORITY_VARIANTS: Record<
  TodoPriority,
  "destructive" | "default" | "secondary"
> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

interface TodoCardProps {
  todo: BoardTodo
  weeklyPlanTitle?: string
  onEdit: (todo: BoardTodo) => void
  onDelete: (todo: BoardTodo) => void
}

export function TodoCard({
  todo,
  weeklyPlanTitle,
  onEdit,
  onDelete,
}: TodoCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: todo._id })

  // @dnd-kit/utilities 의존 없이 변환값을 직접 적용한다
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "z-10 cursor-grabbing opacity-60"
      )}
      onClick={() => onEdit(todo)}
      {...listeners}
      {...attributes}
    >
      <Card
        size="sm"
        className={cn(
          "transition-shadow hover:shadow-md",
          isDragging && "shadow-lg"
        )}
      >
        <CardContent className="grid gap-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{todo.title}</p>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(todo)
                }}
              >
                수정
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(todo)
                }}
              >
                삭제
              </Button>
            </div>
          </div>

          {todo.description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {todo.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{todo.date}</span>
            <Badge
              variant={PRIORITY_VARIANTS[todo.priority]}
              className="max-w-full truncate"
            >
              {PRIORITY_LABELS[todo.priority]}
            </Badge>
            {weeklyPlanTitle ? (
              <Badge variant="secondary" className="max-w-full truncate">
                {weeklyPlanTitle}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TodoCard
