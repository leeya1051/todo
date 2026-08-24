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
  createYearGoalSchema,
  type CreateYearGoalInput,
} from "@/lib/validation/yearGoal"
import type { YearGoalListItem } from "@/components/YearGoalList"

const emptyValues: CreateYearGoalInput = {
  title: "",
  startDate: "",
  endDate: "",
}

interface YearGoalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 값이 있으면 수정 모드, 없으면 생성 모드 */
  goal?: YearGoalListItem | null
  onSuccess: () => void
}

export default function YearGoalForm({
  open,
  onOpenChange,
  goal,
  onSuccess,
}: YearGoalFormProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<CreateYearGoalInput>({
    resolver: zodResolver(createYearGoalSchema),
    defaultValues: emptyValues,
  })

  const { reset } = form

  useEffect(() => {
    if (!open) {
      return
    }

    setFormError(null)

    if (goal) {
      reset({
        title: goal.title,
        startDate: goal.startDate,
        endDate: goal.endDate,
      })
      return
    }

    reset(emptyValues)
  }, [open, goal, reset])

  async function onSubmit(values: CreateYearGoalInput) {
    setFormError(null)

    const res = await fetch(
      goal ? `/api/year-goals/${goal._id}` : "/api/year-goals",
      {
        method: goal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    )

    if (!res.ok) {
      setFormError(
        goal ? "1년 목표 수정에 실패했습니다" : "1년 목표 생성에 실패했습니다"
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
          <DialogTitle>{goal ? "1년 목표 수정" : "새 1년 목표"}</DialogTitle>
          <DialogDescription>
            {goal ? "1년 목표 내용을 수정하세요." : "새로운 1년 목표를 추가하세요."}
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
                    <Input placeholder="목표 제목" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시작일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종료일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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
                  : goal
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
