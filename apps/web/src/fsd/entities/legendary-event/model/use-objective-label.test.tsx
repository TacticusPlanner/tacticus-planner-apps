import type { ReactNode } from "react"
import { renderHook } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { describe, expect, it } from "vitest"

import deCommon from "../../../../../public/locales/de/common.json"
import deLegendaryEvents from "../../../../../public/locales/de/legendaryEvents.json"
import enCommon from "../../../../../public/locales/en/common.json"
import enDamageTypes from "../../../../../public/locales/en/damageTypes.json"
import enFactions from "../../../../../public/locales/en/factions.json"
import enLegendaryEvents from "../../../../../public/locales/en/legendaryEvents.json"
import enTraits from "../../../../../public/locales/en/traits.json"

import { useLaneAllowedRule, useObjectiveLabel } from "./use-objective-label"

async function createI18n(lng: "en" | "de") {
  const instance = i18next.createInstance()
  await instance.use(initReactI18next).init({
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: {
      en: {
        common: enCommon,
        legendaryEvents: enLegendaryEvents,
        traits: enTraits,
        damageTypes: enDamageTypes,
        factions: enFactions,
      },
      // The game-data namespaces ship English-only; a German trait entry is seeded here to show
      // the label follows the active language.
      de: {
        common: deCommon,
        legendaryEvents: deLegendaryEvents,
        traits: { Resilient: "Widerstandsfähig" },
      },
    },
  })
  return instance
}

async function renderLabels(lng: "en" | "de") {
  const instance = await createI18n(lng)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={instance}>{children}</I18nextProvider>
  )
  const { result } = renderHook(
    () => ({ label: useObjectiveLabel(), rule: useLaneAllowedRule() }),
    { wrapper }
  )
  return result.current
}

const objective = (
  name: string,
  kind: string,
  target: string,
  exclude = false
) => ({ name, filter: { kind, target, exclude } })

describe("useObjectiveLabel", () => {
  it("labels Lysander Alpha's objectives in English with icons", async () => {
    const { label } = await renderLabels("en")
    const alpha = [
      objective("Eviscerate", "DamageType", "Eviscerate"),
      objective("Suppressive Fire", "Trait", "SuppressiveFire"),
      objective("Flying", "Trait", "Flying"),
      objective("Min 5 Hits", "MinHits", "5"),
      objective("No Resilient", "Trait", "Resilient", true),
    ].map(label)

    expect(alpha.map((entry) => entry.label)).toEqual([
      "Eviscerate",
      "Suppressive Fire",
      "Flying",
      "Min 5 hits",
      "No Resilient",
    ])
    expect(alpha.every((entry) => entry.icon !== undefined)).toBe(true)
  })

  it("labels factions, alliances, attack type and max hits", async () => {
    const { label } = await renderLabels("en")
    expect(label(objective("Orks", "Faction", "Orks")).label).toBe("Orks")
    expect(
      label(objective("Astra Militarum", "Faction", "AstraMilitarum")).label
    ).toBe("Astra Militarum")
    expect(label(objective("No Xenos", "Alliance", "Xenos", true)).label).toBe(
      "No Xenos"
    )
    expect(label(objective("Ranged", "AttackType", "Ranged")).label).toBe(
      "Ranged"
    )
    expect(label(objective("Melee", "AttackType", "Ranged", true))).toEqual({
      label: "Melee",
      icon: { type: "glyph", glyph: "melee" },
    })
    expect(label(objective("Max 1 Hit", "MaxHits", "1")).label).toBe(
      "Max 1 hit"
    )
  })

  it("falls back to the catalog name when the namespace lacks the target", async () => {
    const { label } = await renderLabels("en")
    expect(label(objective("Warp Fire", "DamageType", "WarpFire")).label).toBe(
      "Warp Fire"
    )
    expect(label(objective("Odd", "Unknown", "X")).label).toBe("Odd")
  })

  it("applies the German templates", async () => {
    const { label } = await renderLabels("de")
    const noResilient = label(
      objective("No Resilient", "Trait", "Resilient", true)
    )
    expect(noResilient.label).toBe("Ohne Widerstandsfähig")
    expect(noResilient.icon).toEqual({
      type: "image",
      src: expect.stringContaining("ui_icon_trait_resilient_01.png"),
    })
    expect(label(objective("Min 5 Hits", "MinHits", "5")).label).toBe(
      "Mind. 5 Treffer"
    )
    expect(label(objective("Melee", "AttackType", "Ranged", true)).label).toBe(
      "Nahkampf"
    )
    // English-only game-data entries fall back to English, not to the catalog name.
    expect(label(objective("Flying", "Trait", "Flying")).label).toBe("Flying")
  })
})

describe("useLaneAllowedRule", () => {
  it("reads the lane rules from allowedUnitsFilter", async () => {
    const { rule } = await renderLabels("en")
    expect(
      rule({
        allowedUnitsFilter: [
          { kind: "Alliance", target: "Xenos", exclude: true },
        ],
      })
    ).toBe("No Xenos")
    expect(
      rule({
        allowedUnitsFilter: [
          { kind: "Alliance", target: "Chaos", exclude: true },
          { kind: "Faction", target: "Orks", exclude: true },
        ],
      })
    ).toBe("No Chaos or Orks")
  })

  it("localizes the rule in German", async () => {
    const { rule } = await renderLabels("de")
    expect(
      rule({
        allowedUnitsFilter: [
          { kind: "Alliance", target: "Chaos", exclude: true },
          { kind: "Faction", target: "Orks", exclude: true },
        ],
      })
    ).toBe("Ohne Chaos oder Orks")
  })
})
