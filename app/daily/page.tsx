"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/DatePicker"
import { STATUS_COLUMNS, type TodoStatus } from "@/components/board/types"

interface DailyTodo {
  _id: string
  title: string
  description?: string
  status: TodoStatus
  date: string
  weeklyPlanId: string | null
  priority?: "high" | "medium" | "low"
}

const STATUS_LABELS: Record<TodoStatus, string> = Object.fromEntries(
  STATUS_COLUMNS.map((column) => [column.status, column.label])
) as Record<TodoStatus, string>

const PRIORITY_VARIANTS: Record<
  "high" | "medium" | "low",
  "default" | "outline" | "secondary"
> = {
  high: "default",
  medium: "outline",
  low: "secondary",
}

const PRIORITY_LABELS: Record<"high" | "medium" | "low", string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
}

function todayString() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function shiftDate(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(todayString())
  const [todos, setTodos] = useState<DailyTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [datesWithTodos, setDatesWithTodos] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    async function fetchDatesWithTodos() {
      try {
        const response = await fetch("/api/todos")

        if (!response.ok) {
          return
        }

        const data = await response.json()
        const dates: string[] = (data.todos ?? []).map(
          (todo: DailyTodo) => todo.date
        )

        if (!cancelled) {
          setDatesWithTodos(new Set(dates))
        }
      } catch {
        // 캘린더 표시용 부가 정보이므로 실패해도 조용히 무시한다
      }
    }

    fetchDatesWithTodos()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchTodos() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetch(`/api/todos?date=${selectedDate}`)

        if (!response.ok) {
          throw new Error("할 일을 불러오지 못했습니다")
        }

        const data = await response.json()

        if (!cancelled) {
          setTodos(data.todos ?? [])
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("할 일을 불러오지 못했습니다")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchTodos()

    return () => {
      cancelled = true
    }
  }, [selectedDate])

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{selectedDate} 할 일</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate((prev) => shiftDate(prev, -1))}
          >
            이전 날
          </Button>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            markedDates={datesWithTodos}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate((prev) => shiftDate(prev, 1))}
          >
            다음 날
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        {!loading && !errorMessage && todos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            이 날짜에 등록된 할 일이 없습니다.
          </p>
        ) : null}

        {todos.map((todo) => (
          <Card key={todo._id} size="sm" className="hover:shadow-airbnb">
            <CardContent className="grid gap-2">
              <p className="text-base font-semibold leading-snug">{todo.title}</p>

              {todo.description ? (
                <p className="text-sm text-muted-foreground">
                  {todo.description}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{STATUS_LABELS[todo.status]}</Badge>
                {todo.priority ? (
                  <Badge variant={PRIORITY_VARIANTS[todo.priority]}>
                    {PRIORITY_LABELS[todo.priority]}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
