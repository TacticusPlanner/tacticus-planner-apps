import { beforeAll, describe, expect, it } from "vitest"
import type { TFunction } from "i18next"

import { createTestI18n } from "@/test/i18n"
import enDailies from "../../../../../public/locales/en/dailies.json"

import { dailyGoalTargetLabel } from "./goal-target-label"

let t: TFunction<["dailies", "progression"]>

beforeAll(async () => {
  const i18n = await createTestI18n("en", { en: { dailies: enDailies } })
  t = i18n.getFixedT("en", ["dailies", "progression"])
})

describe("dailyGoalTargetLabel", () => {
  it.each([
    ["Legendary:RedFiveStars", "Ascension Legendary Red Five Stars"],
    ["Mythic:OneBlueStar", "Ascension Mythic One Blue Star"],
    ["Epic:None", "Ascension Epic"],
  ])("localizes the ascension target %s", (end, expected) => {
    expect(
      dailyGoalTargetLabel(t, {
        goalType: "Ascension",
        config: { progression: { start: "Common:None", end } },
      } as never)
    ).toBe(expected)
  })

  it("keeps the other goal kinds' labels", () => {
    expect(
      dailyGoalTargetLabel(t, { goalType: "Unlock", config: {} } as never)
    ).toBe("Unlock")
    expect(
      dailyGoalTargetLabel(t, {
        goalType: "Ability",
        config: { ability: { activeEnd: 40, passiveEnd: 50 } },
      } as never)
    ).toBe("Ability 50")
  })
})
