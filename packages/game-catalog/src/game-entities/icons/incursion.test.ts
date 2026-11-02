import { describe, expect, it } from "vitest"

import {
  incursionBoardImage,
  incursionEnhancementIcon,
  incursionTokenIcon,
} from "./incursion"

describe("incursion icons", () => {
  it("maps an enhancement type to its run-map icon", () => {
    expect(incursionEnhancementIcon("Summons")).toMatch(
      /atlases\/ui_icon_enhancement_summon_01\.webp$/
    )
    expect(incursionEnhancementIcon("Unknown")).toBeUndefined()
  })

  it("points the run token at the MoW event sprite", () => {
    expect(incursionTokenIcon()).toMatch(
      /liveevents\/ui_icon_battle_token_mow\.webp$/
    )
  })

  it("uses the plain board art when no annotated board ships", () => {
    expect(incursionBoardImage("C4_07")).toMatch(
      /incursion_boards\/C4_07\.webp$/
    )
  })
})
