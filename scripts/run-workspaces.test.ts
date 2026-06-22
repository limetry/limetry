import { describe, expect, it } from "vitest"

import {
  formatDuration,
  matchesWorkspacePattern,
  parseCliArgs,
  parseWorkspacesList,
} from "./run-workspaces.js"

describe("run-workspaces", () => {
  it("parses yarn workspaces list JSON lines", () => {
    const workspaces = parseWorkspacesList([
      "{\"location\":\".\",\"name\":\"limetry\"}",
      "{\"location\":\"packages/web\",\"name\":\"@limetry/web\"}",
    ].join("\n"))
    expect(workspaces).toEqual([
      { location: ".", name: "limetry" },
      { location: "packages/web", name: "@limetry/web" },
    ])
  })

  it("parses script, exclude, and include flags", () => {
    expect(parseCliArgs([
      "test",
      "--exclude",
      "limetry",
      "--exclude=@limetry/skill",
      "--include",
      "@examples/*",
    ])).toEqual({
      script: "test",
      exclude: ["limetry", "@limetry/skill"],
      include: ["@examples/*"],
      help: false,
    })
  })

  it("matches simple workspace globs", () => {
    expect(matchesWorkspacePattern("@examples/mcp-sql-write-gate", "@examples/*")).toBe(true)
    expect(matchesWorkspacePattern("@limetry/web", "@examples/*")).toBe(false)
    expect(matchesWorkspacePattern("infra", "infra")).toBe(true)
  })

  it("formats durations", () => {
    expect(formatDuration(820)).toBe("820ms")
    expect(formatDuration(1637)).toBe("1.64s")
  })
})
