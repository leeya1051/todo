import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  email?: string
  passwordHash?: string
  githubId?: string
  username?: string
  avatarUrl?: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: false,
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  username: {
    type: String,
  },
  avatarUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema)
