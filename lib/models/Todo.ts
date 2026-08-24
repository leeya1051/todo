import mongoose, { Schema, Document, Model, Types } from "mongoose"

export type TodoStatus = "todo" | "doing" | "done"

export interface ITodo extends Document {
  userId: Types.ObjectId
  title: string
  description?: string
  status: TodoStatus
  date: string
  priority: "low" | "medium" | "high"
  weeklyPlanId: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const TodoSchema = new Schema<ITodo>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
    },
    date: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    weeklyPlanId: {
      type: Schema.Types.ObjectId,
      ref: "WeeklyPlan",
      default: null,
    },
  },
  { timestamps: true }
)

TodoSchema.index({ userId: 1, status: 1 })
TodoSchema.index({ userId: 1, weeklyPlanId: 1 })

export default (mongoose.models.Todo as Model<ITodo>) ||
  mongoose.model<ITodo>("Todo", TodoSchema)
