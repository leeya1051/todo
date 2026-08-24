"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"

import WeeklyPlanForm from "@/components/forms/WeeklyPlanForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface WeeklyPlanListItem {
  _id: string
  title: string
  weekStartDate: string
  weekEndDate: string
  yearGoalId: string | null
  progress: number
}

interface WeeklyPlanListProps {
  initialPlans: WeeklyPlanListItem[]
  yearGoalTitles: Record<string, string>
}

export default function WeeklyPlanList({
  initialPlans,
  yearGoalTitles,
}: WeeklyPlanListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<WeeklyPlanListItem | null>(
    null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleCreate() {
    setEditingPlan(null)
    setFormOpen(true)
  }

  const handleEdit = useCallback((plan: WeeklyPlanListItem) => {
    setEditingPlan(plan)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (plan: WeeklyPlanListItem) => {
      if (!window.confirm(`"${plan.title}" 주간 계획을 삭제할까요?`)) {
        return
      }

      setErrorMessage(null)

      try {
        const res = await fetch(`/api/weekly-plans/${plan._id}`, {
          method: "DELETE",
        })

        if (!res.ok) {
          throw new Error("delete failed")
        }

        router.refresh()
      } catch {
        setErrorMessage("주간 계획 삭제에 실패했습니다. 다시 시도해 주세요.")
      }
    },
    [router]
  )

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">주간 계획</h1>
        <Button type="button" onClick={handleCreate}>
          <PlusIcon />새 주간 계획
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

      {initialPlans.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          아직 등록된 주간 계획이 없습니다.
        </p>
      ) : (
        <div className="grid gap-3">
          {initialPlans.map((plan) => (
            <Card key={plan._id} className="hover:shadow-airbnb">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{plan.title}</CardTitle>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handleEdit(plan)}
                    >
                      수정
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => handleDelete(plan)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2">
                <p className="text-muted-foreground text-sm">
                  {plan.weekStartDate} ~ {plan.weekEndDate}
                </p>
                {plan.yearGoalId ? (
                  <p className="text-muted-foreground text-sm">
                    연결된 1년 목표: {yearGoalTitles[plan.yearGoalId] ?? "-"}
                  </p>
                ) : null}
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-right text-xs">
                  {plan.progress}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WeeklyPlanForm
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editingPlan}
        onSuccess={() => {
          setFormOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
