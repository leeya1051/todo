"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTodoSchema, type CreateTodoInput } from "@/lib/validation/todo"
import type { BoardTodo, BoardWeeklyPlan } from "@/components/board/types"

const NONE_VALUE = "none"

const emptyValues: CreateTodoInput = {
  title: "",
  description: "",
  date: "",
  priority: "medium",
  weeklyPlanId: null,
}

function todayString() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${now.getFullYear()}-${month}-${day}`
}

interface TodoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 값이 있으면 수정 모드, 없으면 생성 모드 */
  todo?: BoardTodo | null
  onSuccess: (todo: BoardTodo) => void
}

export default function TodoForm({
  open,
  onOpenChange,
  todo,
  onSuccess,
}: TodoFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [weeklyPlans, setWeeklyPlans] = useState<BoardWeeklyPlan[]>([])

  const form = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: emptyValues,
  })

  const { reset } = form

  useEffect(() => {
    if (!open) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing pattern predating this rule, tracked as follow-up (out of scope for this Next 16 vuln-fix upgrade)
    setFormError(null)

    if (todo) {
      reset({
        title: todo.title,
        description: todo.description ?? "",
        date: todo.date,
        priority: todo.priority ?? "medium",
        weeklyPlanId: todo.weeklyPlanId,
      })
      return
    }

    reset({ ...emptyValues, date: todayString() })
  }, [open, todo, reset])

  useEffect(() => {
    if (!open) {
      return
    }

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
  }, [open])

  async function onSubmit(values: CreateTodoInput) {
    setFormError(null)

    const payload = {
      title: values.title,
      description: values.description?.trim() ? values.description : "",
      date: values.date,
      priority: values.priority,
      weeklyPlanId: values.weeklyPlanId || null,
    }

    const res = await fetch(todo ? `/api/todos/${todo._id}` : "/api/todos", {
      method: todo ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setFormError(
        todo ? "할 일 수정에 실패했습니다" : "할 일 생성에 실패했습니다"
      )
      return
    }

    const data: { todo?: BoardTodo } = await res.json()

    if (!data.todo) {
      setFormError("서버 응답을 처리하지 못했습니다")
      return
    }

    onSuccess({
      _id: String(data.todo._id),
      title: data.todo.title,
      description: data.todo.description,
      status: data.todo.status,
      date: data.todo.date,
      priority: data.todo.priority ?? "medium",
      weeklyPlanId: data.todo.weeklyPlanId
        ? String(data.todo.weeklyPlanId)
        : null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{todo ? "할 일 수정" : "새 할 일"}</DialogTitle>
          <DialogDescription>
            {todo
              ? "할 일 내용을 수정하세요."
              : "새로운 할 일을 추가하세요."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="할 일 제목" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="설명"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>날짜</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>우선순위</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="우선순위 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeklyPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주간 계획 연결</FormLabel>
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="연결 안 함" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>연결 안 함</SelectItem>
                      {weeklyPlans.map((plan) => (
                        <SelectItem key={plan._id} value={plan._id}>
                          {plan.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError ? (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "저장 중..."
                  : todo
                    ? "수정"
                    : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
