import { runWebPreflight } from "../src/lib/preflight"

void runWebPreflight()
  .then(() => {
    process.exitCode = 0
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
