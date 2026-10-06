import { describe, expect, it } from "vitest"

import { laneAllowedRule } from "./lane-label"

const filter = (kind: string, target: string, exclude = false) => ({
  kind,
  target,
  exclude,
})

describe("laneAllowedRule", () => {
  const labelOf = ({ target }: { target: string }) => target
  const negate = (label: string) => `No ${label}`

  it("reads a single excluded alliance (Lysander Alpha)", () => {
    expect(
      laneAllowedRule(
        [filter("Alliance", "Xenos", true)],
        labelOf,
        negate,
        "en"
      )
    ).toBe("No Xenos")
  })

  it("joins several exclusions with 'or' (Farsight Gamma)", () => {
    expect(
      laneAllowedRule(
        [filter("Alliance", "Chaos", true), filter("Faction", "Orks", true)],
        labelOf,
        negate,
        "en"
      )
    ).toBe("No Chaos or Orks")
  })

  it("is undefined when nothing is excluded", () => {
    expect(
      laneAllowedRule([filter("Alliance", "Imperial")], labelOf, negate, "en")
    ).toBeUndefined()
  })
})
