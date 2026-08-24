import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface IWeeklyPlan extends Document {
  userId: Types.ObjectId
  title: string
  weekStartDate: string
  weekEndDate: string
  yearGoalId: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const WeeklyPlanSchema = new Schema<IWeeklyPlan>(
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
    weekStartDate: {
      type: String,
      required: true,
    },
    weekEndDate: {
      type: String,
      required: true,
    },
    yearGoalId: {
      type: Schema.Types.ObjectId,
      ref: "YearGoal",
      default: null,
    },
  },
  { timestamps: true }
)

WeeklyPlanSchema.index({ userId: 1, yearGoalId: 1 })

export default (mongoose.models.WeeklyPlan as Model<IWeeklyPlan>) ||
  mongoose.model<IWeeklyPlan>("WeeklyPlan", WeeklyPlanSchema)
