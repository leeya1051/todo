import { MongoMemoryServer } from "mongodb-memory-server"
import { randomBytes } from "node:crypto"
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envPath = path.join(projectRoot, ".env.local")

const mongod = await MongoMemoryServer.create()
const uri = mongod.getUri("todo")

const envContent = [
  `MONGODB_URI=${uri}`,
  `NEXTAUTH_SECRET=${randomBytes(32).toString("hex")}`,
  `NEXTAUTH_URL=http://localhost:3000`,
  "",
].join("\n")

writeFileSync(envPath, envContent)

console.log(`[dev-local-mongo] ready, uri=${uri}`)
console.log(`[dev-local-mongo] .env.local written at ${envPath}`)
console.log("[dev-local-mongo] keeping in-memory MongoDB alive — do not stop this process while testing")

const shutdown = async () => {
  await mongod.stop()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

await new Promise(() => {})
