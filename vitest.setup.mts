import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import { afterAll } from "vitest"

// Must run at module top level: lib/db.ts reads process.env.MONGODB_URI when it
// is first imported, which happens after setup files are evaluated.
const mongod = await MongoMemoryServer.create()
process.env.MONGODB_URI = mongod.getUri()

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})
