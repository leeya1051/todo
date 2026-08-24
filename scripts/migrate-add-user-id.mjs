// Backfills `userId` on legacy `todos` documents that predate per-user scoping.
//
// Run with (Node 20+ reads the env files directly, no dotenv dependency):
//   node --env-file=.env.local --env-file=.env scripts/migrate-add-user-id.mjs [owner-email]
//
// Without an email argument the script only reports how many orphaned todos exist.

import mongoose from "mongoose"

const ORPHAN_FILTER = { $or: [{ userId: { $exists: false } }, { userId: null }] }

async function main() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Run with: node --env-file=.env.local --env-file=.env scripts/migrate-add-user-id.mjs [owner-email]"
    )
    process.exitCode = 1
    return
  }

  await mongoose.connect(uri)

  const db = mongoose.connection.db
  const orphanCount = await db.collection("todos").countDocuments(ORPHAN_FILTER)

  if (orphanCount === 0) {
    console.log("No todos are missing userId - nothing to do.")
    return
  }

  const ownerEmail = process.argv[2]

  if (!ownerEmail) {
    console.log(`Found ${orphanCount} todo(s) without a userId.`)
    console.log(
      "Re-run with the owner's email to assign them: node --env-file=.env.local --env-file=.env scripts/migrate-add-user-id.mjs owner@example.com"
    )
    return
  }

  const email = ownerEmail.toLowerCase().trim()
  const owner = await db.collection("users").findOne({ email })

  if (!owner) {
    console.error(`No user found with email "${email}".`)
    process.exitCode = 1
    return
  }

  const result = await db
    .collection("todos")
    .updateMany(ORPHAN_FILTER, { $set: { userId: owner._id } })

  console.log(`Assigned userId ${owner._id} to ${result.modifiedCount} todo(s).`)
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
