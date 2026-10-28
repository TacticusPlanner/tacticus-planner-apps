import { describe, expect, it } from "vitest"

import { HRE_OBJECTIVE_KINDS } from "./hre-missions"
import { hreObjectiveIcon } from "./hre-objective-icon"

describe("hreObjectiveIcon", () => {
  it("gives every objective kind an icon", () => {
    for (const kind of HRE_OBJECTIVE_KINDS) {
      expect(hreObjectiveIcon({ kind, target: 1 }, "Xenos")).toBeTruthy()
    }
  })

  it("uses the featured hero's alliance and the named faction", () => {
    expect(
      hreObjectiveIcon({ kind: "killWithAlliance", target: 10 }, "Xenos")
    ).toContain("xenos")
    expect(
      hreObjectiveIcon({ kind: "killWithAlliance", target: 10 }, "Neutral")
    ).toContain("ui_icon_dmg_prediction_skull")
    expect(
      hreObjectiveIcon(
        { kind: "damageType", target: 7500, qualifier: "Psychic" },
        null
      )
    ).toContain("ui_icon_damage_profile2_Psychic")
  })
})
