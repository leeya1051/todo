import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface IYearGoal extends Document {
  userId: Types.ObjectId
  title: string
  startDate: string
  endDate: string
  createdAt: Date
  updatedAt: Date
}

const YearGoalSchema = new Schema<IYearGoal>(
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
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

export default (mongoose.models.YearGoal as Model<IYearGoal>) ||
  mongoose.model<IYearGoal>("YearGoal", YearGoalSchema)
