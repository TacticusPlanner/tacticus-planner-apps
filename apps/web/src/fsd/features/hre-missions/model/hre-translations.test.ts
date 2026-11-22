import i18next from "i18next"
import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/hre.json"
import en from "../../../../../public/locales/en/hre.json"
import es from "../../../../../public/locales/es/hre.json"
import fr from "../../../../../public/locales/fr/hre.json"
import { hreMissions } from "@/test/fixtures/hre-rules"

import {
  HRE_OBJECTIVE_KINDS,
  hreMission,
  isTokenObjective,
} from "@/entities/hre-mission"
import { objectiveTextKey } from "./hre-objective-text"
import { objectiveTipKeys } from "./hre-objective-tips"
import { compareCodeUnits } from "@/shared/lib"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

const english = i18next.createInstance()
await english.init({ lng: "en", resources: { en: { hre: en } } })

/** An objective worded the way the tab words it, in English. */
function word(
  mission: number,
  index: 0 | 1,
  context: { alliance: string | null; hero: string; qualifier?: string }
) {
  const objective = hreMission(hreMissions, mission).objectives[index]
  const { key, values } = objectiveTextKey(objective, {
    ...context,
    formatNumber: (value) => value.toLocaleString("en"),
  })
  return english.t(key as never, {
    ns: "hre",
    ...values,
    qualifier: context.qualifier ?? values.qualifier,
  })
}

describe("HRE translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("keeps the %s namespace aligned with English", (_locale, resource) => {
    expect(leafKeys(resource).toSorted(compareCodeUnits)).toEqual(
      leafKeys(en).toSorted(compareCodeUnits)
    )
  })

  it("words every objective kind and has every tip it shows", () => {
    const tips = en.tips as Record<string, string>
    for (const kind of HRE_OBJECTIVE_KINDS) {
      const objectives = en.objectives as Record<string, unknown>
      expect(objectives[kind] ?? objectives[`${kind}_other`], kind).toBeTruthy()
      const keys = objectiveTipKeys(kind)
      if (isTokenObjective(kind)) expect(keys, kind).toEqual([])
      for (const key of keys) expect(tips[key], key).toBeTruthy()
    }
  })

  it("words Zapspitta's mission 10 for the Xenos alliance", () => {
    const zapspitta = { alliance: "Xenos", hero: "Zapspitta" }
    expect(word(10, 0, zapspitta)).toBe("Win 15 battles with an all-Xenos team")
    expect(word(10, 1, zapspitta)).toBe("Play 4 Arena battles")
    expect(word(20, 0, zapspitta)).toBe("Use abilities 10 times with Zapspitta")
    expect(word(20, 1, zapspitta)).toBe("Win 250 campaign battles")
    expect(word(12, 1, zapspitta)).toBe("Play 1 Onslaught battle")
    expect(word(5, 0, zapspitta)).toBe("Deal 10,000 damage with abilities")
  })

  it("uses the same list for an Imperial hero", () => {
    const imperial = { alliance: "Imperial", hero: "Someone" }
    expect(word(2, 0, imperial)).toBe("Raid 5 campaign battles")
    expect(word(2, 1, imperial)).toBe("Defeat 10 enemies with Imperial units")
    expect(word(11, 1, { ...imperial, qualifier: "Necrons" })).toBe(
      "Defeat 100 units of the Necrons faction"
    )
  })

  it("falls back to the generic alliance wording for an unresolved hero", () => {
    expect(word(2, 1, { alliance: null, hero: "unknown-hero" })).toBe(
      "Defeat 10 enemies with your alliance's units"
    )
  })
})
