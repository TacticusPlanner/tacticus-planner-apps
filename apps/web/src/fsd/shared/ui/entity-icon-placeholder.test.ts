import { describe, expect, it } from "vitest"
import {
  abilityIcon,
  characterIcon,
  datamineAssetUrl,
  mowIcon,
  traitIcon,
} from "@workspace/game-catalog"
import { unitIdSchema } from "@workspace/game-domain"

import { placeholderKindForIcon } from "./entity-icon-placeholder"

describe("placeholderKindForIcon", () => {
  it("treats character and MoW portraits as units", () => {
    expect(
      placeholderKindForIcon(
        characterIcon(unitIdSchema.parse("lostaFearmonger"))!
      )
    ).toBe("unit")
    expect(
      placeholderKindForIcon(mowIcon(unitIdSchema.parse("custoDreadnought"))!)
    ).toBe("unit")
  })

  it("recognises ability and trait icons", () => {
    expect(placeholderKindForIcon(abilityIcon("WrathfulAdvance"))).toBe(
      "ability"
    )
    expect(placeholderKindForIcon(traitIcon("MachineOfWar"))).toBe("trait")
  })

  it("falls back to generic for any other sprite", () => {
    expect(placeholderKindForIcon(datamineAssetUrl("fonts/Rank_5.webp"))).toBe(
      "generic"
    )
  })
})
