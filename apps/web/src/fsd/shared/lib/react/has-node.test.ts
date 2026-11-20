import { createElement } from "react"
import { describe, expect, it } from "vitest"

import { hasNode } from "./has-node"

describe("hasNode", () => {
  it("counts falsy nodes as empty", () => {
    for (const node of [undefined, null, false, "", 0]) {
      expect(hasNode(node)).toBe(false)
    }
  })

  it("counts text and elements as filled", () => {
    expect(hasNode("note")).toBe(true)
    expect(hasNode(createElement("span"))).toBe(true)
  })
})
