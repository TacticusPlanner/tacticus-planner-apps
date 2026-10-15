import { describe, expect, it } from "vitest"

import { tokenMarkIds } from "./token-marks"

describe("tokenMarkIds", () => {
  it("marks every cleared cell Stop here", () => {
    expect(tokenMarkIds([0, 1, 4], "stopHere")).toEqual([0, 1, 4])
  })

  it("marks only the objective cells Maybe clear", () => {
    expect(tokenMarkIds([0, 1, 4], "maybeClear")).toEqual([1, 4])
  })

  it("marks defeat-all Maybe clear when the token clears no objective", () => {
    expect(tokenMarkIds([0], "maybeClear")).toEqual([0])
  })
})
