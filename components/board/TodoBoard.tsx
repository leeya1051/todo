"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import TodoForm from "@/components/forms/TodoForm"
import { StatusColumn } from "@/components/board/StatusColumn"
import {
  STATUS_COLUMNS,
  isTodoStatus,
  type BoardTodo,
  type BoardWeeklyPlan,
  type TodoPriority,
} from "@/components/board/types"

const PRIORITY_RANK: Record<TodoPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

interface TodoBoardProps {
  initialTodos: BoardTodo[]
}

export default function TodoBoard({ initialTodos }: TodoBoardProps) {
  const [todos, setTodos] = useState<BoardTodo[]>(initialTodos)
  const [weeklyPlans, setWeeklyPlans] = useState<BoardWeeklyPlan[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<BoardTodo | null>(null)

  const boardSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )
  // 다이얼로그가 열려 있는 동안에는 센서를 비활성화해 포커스/포인터 충돌을 막는다
  const disabledSensors = useSensors()

  useEffect(() => {
    let cancelled = false

    fetch("/api/weekly-plans")
      .then((res) => (res.ok ? res.json() : { weeklyPlans: [] }))
      .then((data: { weeklyPlans?: BoardWeeklyPlan[] }) => {
        if (!cancelled) {
          setWeeklyPlans(data.weeklyPlans ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeeklyPlans([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const weeklyPlanTitles = useMemo(
    () =>
      Object.fromEntries(weeklyPlans.map((plan) => [plan._id, plan.title])),
    [weeklyPlans]
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) {
      return
    }

    const nextStatus = over.id

    if (!isTodoStatus(nextStatus)) {
      return
    }

    const todoId = String(active.id)
    const dragged = todos.find((todo) => todo._id === todoId)

    if (!dragged) {
      return
    }

    // 동일 컬럼 드롭은 no-op — 네트워크 요청을 보내지 않는다
    if (dragged.status === nextStatus) {
      return
    }

    const previousStatus = dragged.status

    setErrorMessage(null)
    setTodos((prev) =>
      prev.map((todo) =>
        todo._id === todoId ? { ...todo, status: nextStatus } : todo
      )
    )

    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!res.ok) {
        throw new Error("status update failed")
      }
    } catch {
      // 실패 시 이전 상태로 롤백
      setTodos((prev) =>
        prev.map((todo) =>
          todo._id === todoId ? { ...todo, status: previousStatus } : todo
        )
      )
      setErrorMessage("상태 변경에 실패했습니다. 다시 시도해 주세요.")
    }
  }

  function handleCreate() {
    setEditingTodo(null)
    setFormOpen(true)
  }

  const handleEdit = useCallback((todo: BoardTodo) => {
    setEditingTodo(todo)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (todo: BoardTodo) => {
    if (!window.confirm(`"${todo.title}" 할 일을 삭제할까요?`)) {
      return
    }

    setErrorMessage(null)

    try {
      const res = await fetch(`/api/todos/${todo._id}`, { method: "DELETE" })

      if (!res.ok) {
        throw new Error("delete failed")
      }

      setTodos((prev) => prev.filter((item) => item._id !== todo._id))
    } catch {
      setErrorMessage("할 일 삭제에 실패했습니다. 다시 시도해 주세요.")
    }
  }, [])

  function handleFormSuccess(saved: BoardTodo) {
    setTodos((prev) => {
      const exists = prev.some((todo) => todo._id === saved._id)

      return exists
        ? prev.map((todo) => (todo._id === saved._id ? saved : todo))
        : [saved, ...prev]
    })
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">보드</h1>
        <Button type="button" onClick={handleCreate}>
          <PlusIcon />새 할 일
        </Button>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
        >
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setErrorMessage(null)}
          >
            닫기
          </Button>
        </div>
      ) : null}

      <DndContext
        sensors={formOpen ? disabledSensors : boardSensors}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {STATUS_COLUMNS.map((column) => (
            <StatusColumn
              key={column.status}
              status={column.status}
              label={column.label}
              todos={todos
                .filter((todo) => todo.status === column.status)
                .sort(
                  (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
                )}
              weeklyPlanTitles={weeklyPlanTitles}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>

      <TodoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        todo={editingTodo}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
