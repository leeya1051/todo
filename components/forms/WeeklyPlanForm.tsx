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
import {
  createWeeklyPlanSchema,
  type CreateWeeklyPlanInput,
} from "@/lib/validation/weeklyPlan"
import type { WeeklyPlanListItem } from "@/components/WeeklyPlanList"

interface YearGoalOption {
  _id: string
  title: string
}

const NONE_VALUE = "none"

const emptyValues: CreateWeeklyPlanInput = {
  title: "",
  weekStartDate: "",
  weekEndDate: "",
  yearGoalId: null,
}

interface WeeklyPlanFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 값이 있으면 수정 모드, 없으면 생성 모드 */
  plan?: WeeklyPlanListItem | null
  onSuccess: () => void
}

export default function WeeklyPlanForm({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: WeeklyPlanFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [yearGoals, setYearGoals] = useState<YearGoalOption[]>([])

  const form = useForm<CreateWeeklyPlanInput>({
    resolver: zodResolver(createWeeklyPlanSchema),
    defaultValues: emptyValues,
  })

  const { reset } = form

  useEffect(() => {
    if (!open) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing pattern predating this rule, tracked as follow-up (out of scope for this Next 16 vuln-fix upgrade)
    setFormError(null)

    if (plan) {
      reset({
        title: plan.title,
        weekStartDate: plan.weekStartDate,
        weekEndDate: plan.weekEndDate,
        yearGoalId: plan.yearGoalId,
      })
      return
    }

    reset(emptyValues)
  }, [open, plan, reset])

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    fetch("/api/year-goals")
      .then((res) => (res.ok ? res.json() : { yearGoals: [] }))
      .then((data: { yearGoals?: YearGoalOption[] }) => {
        if (!cancelled) {
          setYearGoals(data.yearGoals ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setYearGoals([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [open])

  async function onSubmit(values: CreateWeeklyPlanInput) {
    setFormError(null)

    const payload = {
      ...values,
      yearGoalId: values.yearGoalId || null,
    }

    const res = await fetch(
      plan ? `/api/weekly-plans/${plan._id}` : "/api/weekly-plans",
      {
        method: plan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      setFormError(
        plan ? "주간 계획 수정에 실패했습니다" : "주간 계획 생성에 실패했습니다"
      )
      return
    }

    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "주간 계획 수정" : "새 주간 계획"}</DialogTitle>
          <DialogDescription>
            {plan
              ? "주간 계획 내용을 수정하세요."
              : "새로운 주간 계획을 추가하세요."}
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
                    <Input placeholder="계획 제목" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주 시작일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주 종료일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearGoalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>1년 목표 연결</FormLabel>
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
                      {yearGoals.map((goal) => (
                        <SelectItem key={goal._id} value={goal._id}>
                          {goal.title}
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
                  : plan
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
