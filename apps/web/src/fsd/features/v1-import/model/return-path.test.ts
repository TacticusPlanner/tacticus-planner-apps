import { describe, expect, it } from "vitest"

import { v1ImportReturnPath, v1ImportReturnState } from "./return-path"

describe("v1ImportReturnPath", () => {
  it("returns to the page that linked to the import", () => {
    expect(
      v1ImportReturnPath(v1ImportReturnState("/my-game/teams?mode=horde"))
    ).toBe("/my-game/teams?mode=horde")
  })

  it("falls back to Home when the page was opened directly", () => {
    expect(v1ImportReturnPath(null)).toBe("/home")
    expect(v1ImportReturnPath(undefined)).toBe("/home")
    expect(v1ImportReturnPath({ other: true })).toBe("/home")
  })

  it("ignores anything that is not an in-app path", () => {
    expect(v1ImportReturnPath(v1ImportReturnState("https://x.test"))).toBe(
      "/home"
    )
    expect(v1ImportReturnPath(v1ImportReturnState("//x.test/a"))).toBe("/home")
  })
})
