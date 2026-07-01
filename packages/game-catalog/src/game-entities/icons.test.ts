import { describe, expect, it } from "vitest"

import { campaignLabel } from "./icons"

describe("campaignLabel", () => {
  it("labels standard campaigns with an explicit difficulty word", () => {
    expect(campaignLabel("indomitus", "standard")).toBe("Indomitus Standard")
    expect(campaignLabel("indomitus", "elite")).toBe("Indomitus Elite")
    expect(campaignLabel("fall-of-cadia", "standard")).toBe(
      "Fall of Cadia Standard"
    )
    expect(campaignLabel("fall-of-cadia", "elite")).toBe("Fall of Cadia Elite")
  })

  it("omits the redundant 'Standard' word for a mirror group's base tier", () => {
    expect(campaignLabel("indomitus-mirror", "standard")).toBe(
      "Indomitus Mirror"
    )
    expect(campaignLabel("fall-of-cadia-mirror", "standard")).toBe(
      "Fall of Cadia Mirror"
    )
  })

  it("still appends 'Elite' for a mirror group's elite tier", () => {
    expect(campaignLabel("indomitus-mirror", "elite")).toBe(
      "Indomitus Mirror Elite"
    )
    expect(campaignLabel("fall-of-cadia-mirror", "elite")).toBe(
      "Fall of Cadia Mirror Elite"
    )
  })

  it("labels event campaigns by defending faction + difficulty, using in-game faction names", () => {
    expect(campaignLabel("death-guard-vs-admech", "eventStandard")).toBe(
      "Adeptus Mechanicus Standard"
    )
    expect(campaignLabel("death-guard-vs-admech", "eventExtremis")).toBe(
      "Adeptus Mechanicus Extremis"
    )
    // Differs from the shipped asset filenames ("T'au Empire", "Adeptus Sororitas").
    expect(campaignLabel("genestealers-vs-tau-empire", "eventStandard")).toBe(
      "T'au Standard"
    )
    expect(
      campaignLabel("world-eaters-vs-adepta-sororitas", "eventExtremis")
    ).toBe("Adepta Sororitas Extremis")
  })

  it("returns undefined for an unrecognized group or difficulty", () => {
    expect(campaignLabel("unknown-group", "standard")).toBeUndefined()
    expect(campaignLabel("death-guard-vs-admech", "unknown")).toBeUndefined()
  })
})
