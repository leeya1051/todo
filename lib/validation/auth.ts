import { z } from "zod"

export const registerSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
})

export const loginSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
