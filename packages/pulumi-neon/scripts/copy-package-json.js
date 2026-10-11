const fs = require("node:fs")
const path = require("node:path")

const root = path.join(__dirname, "..")
fs.mkdirSync(path.join(root, "bin"), { recursive: true })
fs.copyFileSync(path.join(root, "package.json"), path.join(root, "bin", "package.json"))
