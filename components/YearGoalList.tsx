"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"

import YearGoalForm from "@/components/forms/YearGoalForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface YearGoalListItem {
  _id: string
  title: string
  startDate: string
  endDate: string
  progress: number
}

interface YearGoalListProps {
  initialGoals: YearGoalListItem[]
}

export default function YearGoalList({ initialGoals }: YearGoalListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<YearGoalListItem | null>(
    null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleCreate() {
    setEditingGoal(null)
    setFormOpen(true)
  }

  const handleEdit = useCallback((goal: YearGoalListItem) => {
    setEditingGoal(goal)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (goal: YearGoalListItem) => {
      if (!window.confirm(`"${goal.title}" 1년 목표를 삭제할까요?`)) {
        return
      }

      setErrorMessage(null)

      try {
        const res = await fetch(`/api/year-goals/${goal._id}`, {
          method: "DELETE",
        })

        if (!res.ok) {
          throw new Error("delete failed")
        }

        router.refresh()
      } catch {
        setErrorMessage("1년 목표 삭제에 실패했습니다. 다시 시도해 주세요.")
      }
    },
    [router]
  )

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">1년 목표</h1>
        <Button type="button" onClick={handleCreate}>
          <PlusIcon />새 1년 목표
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

      {initialGoals.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          아직 등록된 1년 목표가 없습니다.
        </p>
      ) : (
        <div className="grid gap-3">
          {initialGoals.map((goal) => (
            <Card key={goal._id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{goal.title}</CardTitle>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handleEdit(goal)}
                    >
                      수정
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => handleDelete(goal)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2">
                <p className="text-muted-foreground text-sm">
                  {goal.startDate} ~ {goal.endDate}
                </p>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-right text-xs">
                  {goal.progress}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <YearGoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={editingGoal}
        onSuccess={() => {
          setFormOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
