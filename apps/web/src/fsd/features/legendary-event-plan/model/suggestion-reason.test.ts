import type { TFunction } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n } from "@/test/i18n"
import enLegendaryEvents from "../../../../../public/locales/en/legendaryEvents.json"

import { suggestionReason } from "./suggestion-reason"

let t: TFunction<"legendaryEvents">

beforeAll(async () => {
  const i18n = await createTestI18n("en", {
    en: { legendaryEvents: enLegendaryEvents },
  })
  t = i18n.getFixedT("en", "legendaryEvents")
})
const reason = (
  gainPoints: number,
  tokensSaved: number,
  hasObjectives = true
) =>
  suggestionReason(
    { depth: 8, gainPoints, tokensSaved },
    {
      t,
      objectives: "Piercing, Max 3 hits and No Power",
      hasObjectives,
      points: String(gainPoints),
    }
  )

describe("suggestionReason", () => {
  it("names the points gain", () => {
    expect(reason(60, 0)).toBe(
      "Covers Piercing, Max 3 hits and No Power · clears ~8 · +60 points over your teams"
    )
  })

  it("adds the tokens saved after the points gain", () => {
    expect(reason(60, 2)).toBe(
      "Covers Piercing, Max 3 hits and No Power · clears ~8 · +60 points over your teams · saves 2 tokens"
    )
  })

  it("names only the tokens saved without a points gain", () => {
    expect(reason(0, 1)).toBe(
      "Covers Piercing, Max 3 hits and No Power · clears ~8 · saves 1 token over your teams"
    )
    expect(reason(0, 3, false)).toBe(
      "Clears ~8 · saves 3 tokens over your teams"
    )
  })

  it("says no gain yet with neither", () => {
    expect(reason(0, 0)).toBe(
      "Covers Piercing, Max 3 hits and No Power · clears ~8 · no gain over your teams yet"
    )
  })
})
