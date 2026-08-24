import { z } from "zod"

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "올바른 ID 형식이 아닙니다")

const baseWeeklyPlanSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요")
    .max(200, "제목은 200자 이하로 입력해 주세요"),
  weekStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다"),
  weekEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다"),
  yearGoalId: objectIdSchema.nullable().optional(),
})

export const createWeeklyPlanSchema = baseWeeklyPlanSchema

export const updateWeeklyPlanSchema = baseWeeklyPlanSchema.partial()

export type CreateWeeklyPlanInput = z.infer<typeof createWeeklyPlanSchema>
export type UpdateWeeklyPlanInput = z.infer<typeof updateWeeklyPlanSchema>
