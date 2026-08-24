import { z } from "zod"

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "올바른 ID 형식이 아닙니다")

const baseTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해 주세요")
    .max(200, "제목은 200자 이하로 입력해 주세요"),
  description: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  weeklyPlanId: objectIdSchema.nullable().optional(),
})

export const createTodoSchema = baseTodoSchema

export const updateTodoSchema = baseTodoSchema.partial().extend({
  status: z.enum(["todo", "doing", "done"]).optional(),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
