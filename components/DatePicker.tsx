"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"]

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  markedDates?: Set<string>
}

function parseDateString(value: string) {
  return new Date(`${value}T00:00:00`)
}

function formatDateString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** JS getDay()는 일요일(0) 시작이라 월요일(0) 시작 인덱스로 변환한다 */
function isoWeekday(date: Date) {
  return (date.getDay() + 6) % 7
}

export function DatePicker({ value, onChange, markedDates }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDateString(value)
  const [viewYear, setViewYear] = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth())

  function handleOpenChange(next: boolean) {
    if (next) {
      const current = parseDateString(value)
      setViewYear(current.getFullYear())
      setViewMonth(current.getMonth())
    }
    setOpen(next)
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const leadingBlanks = isoWeekday(firstOfMonth)

  const cells: (Date | null)[] = []
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewYear, viewMonth, day))
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const todayStr = formatDateString(new Date())

  function goToPrevMonth() {
    const prev = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(prev.getFullYear())
    setViewMonth(prev.getMonth())
  }

  function goToNextMonth() {
    const next = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <CalendarIcon className="size-4" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex items-center justify-between pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goToPrevMonth}
          >
            <ChevronLeftIcon />
          </Button>
          <p className="text-sm font-medium">
            {viewYear}년 {viewMonth + 1}월
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goToNextMonth}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="py-1">
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((date, index) => {
            if (!date) {
              return <span key={`blank-${index}`} />
            }

            const dateStr = formatDateString(date)
            const isSelected = dateStr === value
            const isToday = dateStr === todayStr
            const hasTodos = markedDates?.has(dateStr)

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => {
                  onChange(dateStr)
                  setOpen(false)
                }}
                className={cn(
                  "relative mx-auto flex size-10 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted",
                  isSelected &&
                    "bg-foreground text-background hover:bg-foreground/90",
                  !isSelected &&
                    isToday &&
                    "font-semibold text-foreground ring-1 ring-ring"
                )}
              >
                {date.getDate()}
                {hasTodos ? (
                  <span
                    className={cn(
                      "absolute bottom-1.5 size-1 rounded-full bg-primary",
                      isSelected && "bg-background"
                    )}
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
