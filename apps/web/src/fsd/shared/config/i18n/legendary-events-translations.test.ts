import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/legendaryEvents.json"
import en from "../../../../../public/locales/en/legendaryEvents.json"
import es from "../../../../../public/locales/es/legendaryEvents.json"
import fr from "../../../../../public/locales/fr/legendaryEvents.json"

function leaves(value: unknown, prefix = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null) return [[prefix, value]]
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key)
  )
}

const translated = [
  ["de", de],
  ["es", es],
  ["fr", fr],
] as const

describe("Legendary Events translations", () => {
  it.each(translated)(
    "keeps the %s namespace aligned with English",
    (_locale, resource) => {
      const keys = (source: unknown) =>
        leaves(source)
          .map(([key]) => key)
          .sort()
      expect(keys(resource)).toEqual(keys(en))
    }
  )

  it.each([
    ["en", en],
    ["de", de],
    ["es", es],
    ["fr", fr],
  ] as const)("has no empty values in %s", (_locale, resource) => {
    for (const [key, value] of leaves(resource)) {
      expect(typeof value, key).toBe("string")
      expect((value as string).trim(), key).not.toBe("")
    }
  })

  it.each(translated)(
    "keeps every interpolation placeholder in %s",
    (_locale, resource) => {
      const english = new Map(leaves(en))
      for (const [key, value] of leaves(resource)) {
        const placeholders = (text: unknown) =>
          (String(text).match(/{{\w+}}/g) ?? []).sort()
        expect(placeholders(value), key).toEqual(placeholders(english.get(key)))
      }
    }
  )

  it.each(translated)("translates the page copy in %s", (_locale, resource) => {
    expect(resource.hub.noActive).not.toBe(en.hub.noActive)
    expect(resource.runStatus.noEntry).not.toBe(en.runStatus.noEntry)
    expect(resource.laneOverview.howPoints.body).not.toBe(
      en.laneOverview.howPoints.body
    )
    expect(resource.objective.not).not.toBe(en.objective.not)
    expect(resource.tour.event.steps.runStatus.content).not.toBe(
      en.tour.event.steps.runStatus.content
    )
    expect(resource.tour.hub.steps.upcoming.content).not.toBe(
      en.tour.hub.steps.upcoming.content
    )
    expect(resource.leaderboard.rosterNotSynced).not.toBe(
      en.leaderboard.rosterNotSynced
    )
    expect(resource.leaderboard.onlyUnlocked).not.toBe(
      en.leaderboard.onlyUnlocked
    )
    expect(resource.progress.noLane).not.toBe(en.progress.noLane)
    expect(resource.progress.howPoints.body).not.toBe(
      en.progress.howPoints.body
    )
    expect(resource.tour.event.steps.leaderboard.content).not.toBe(
      en.tour.event.steps.leaderboard.content
    )
    expect(resource.tour.event.steps.progressGrid.content).not.toBe(
      en.tour.event.steps.progressGrid.content
    )
  })
})
