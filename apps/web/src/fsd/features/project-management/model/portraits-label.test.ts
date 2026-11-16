import { describe, expect, it } from "vitest"

import { portraitsLabel } from "./portraits-label"

const moreText = (count: number, names: string) => `${names} and ${count} more`

describe("portraitsLabel", () => {
  it("names the shown units and the count of the others", () => {
    expect(
      portraitsLabel(
        ["Kharn", "Abaddon", "Typhus", "Lucius"],
        2,
        "en",
        moreText
      )
    ).toBe("Kharn, Abaddon, Typhus, Lucius and 2 more")
  })

  it("lists every unit when all are shown", () => {
    expect(
      portraitsLabel(["Kharn", "Abaddon", "Typhus"], 0, "en", moreText)
    ).toBe("Kharn, Abaddon, and Typhus")
  })
})
