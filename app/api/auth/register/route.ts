import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import { registerSchema } from "@/lib/validation/auth"

const BCRYPT_COST = 10

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON이 아닙니다" },
      { status: 400 }
    )
  }

  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "입력값이 올바르지 않습니다",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  const email = parsed.data.email.toLowerCase().trim()

  await connectDB()

  const existing = await User.findOne({ email })

  if (existing) {
    return NextResponse.json(
      { error: "이미 등록된 이메일입니다" },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST)

  try {
    const user = await User.create({ email, passwordHash })

    return NextResponse.json(
      { id: String(user._id), email: user.email },
      { status: 201 }
    )
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다" },
        { status: 409 }
      )
    }

    throw error
  }
}
