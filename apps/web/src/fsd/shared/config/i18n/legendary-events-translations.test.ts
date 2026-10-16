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

  it.each(translated)(
    "translates the team editor workflow copy in %s",
    (_locale, resource) => {
      const pairs = [
        [resource.teams.picker.objectives, en.teams.picker.objectives],
        [resource.teams.picker.doesNotSatisfy, en.teams.picker.doesNotSatisfy],
        [
          resource.teams.editor.saveAndAddAnother,
          en.teams.editor.saveAndAddAnother,
        ],
        [
          resource.teams.editor.footer.depthEstimated,
          en.teams.editor.footer.depthEstimated,
        ],
        [
          resource.leaderboardActions.addToTeam,
          en.leaderboardActions.addToTeam,
        ],
        [
          resource.leaderboardActions.addToTeamOnLane,
          en.leaderboardActions.addToTeamOnLane,
        ],
      ]
      for (const [translatedText, english] of pairs) {
        expect(translatedText).not.toBe(english)
      }
      // The lane leaderboard tour step names both menu items.
      const content = resource.tour.event.steps.leaderboard.content
      expect(content).toContain(resource.leaderboardActions.createGoal)
      expect(content).toContain(resource.leaderboardActions.addToTeam)
    }
  )

  it("names both menu items in the English tour step", () => {
    const content = en.tour.event.steps.leaderboard.content
    expect(content).toContain(en.leaderboardActions.createGoal)
    expect(content).toContain(en.leaderboardActions.addToTeam)
  })

  it.each(translated)(
    "translates the token plan copy in %s",
    (_locale, resource) => {
      expect(resource.tokenPlan.nextToken.title).not.toBe(
        en.tokenPlan.nextToken.title
      )
      expect(resource.tokenPlan.nextToken.reasons.mostPoints).not.toBe(
        en.tokenPlan.nextToken.reasons.mostPoints
      )
      expect(resource.tokenPlan.nextToken.actions.couldNot).not.toBe(
        en.tokenPlan.nextToken.actions.couldNot
      )
      expect(resource.tokenPlan.plan.title).not.toBe(en.tokenPlan.plan.title)
      expect(resource.tokenPlan.forecast.header).not.toBe(
        en.tokenPlan.forecast.header
      )
      expect(resource.tour.event.steps.nextToken.content).not.toBe(
        en.tour.event.steps.nextToken.content
      )
      expect(resource.tour.event.steps.tokenPlan.content).not.toBe(
        en.tour.event.steps.tokenPlan.content
      )
    }
  )

  it.each(translated)(
    "translates the run inputs, outlook and marks copy in %s",
    (_locale, resource) => {
      expect(resource.runInputs.description).not.toBe(en.runInputs.description)
      expect(resource.runInputs.showPaidOptions).not.toBe(
        en.runInputs.showPaidOptions
      )
      expect(resource.runInputs.toasts.error).not.toBe(
        en.runInputs.toasts.error
      )
      expect(resource.outlook.title).not.toBe(en.outlook.title)
      expect(resource.outlook.steps.unlock).not.toBe(en.outlook.steps.unlock)
      expect(resource.outlook.explain.startedRuns).not.toBe(
        en.outlook.explain.startedRuns
      )
      expect(resource.annotations.maybeClear).not.toBe(
        en.annotations.maybeClear
      )
      expect(resource.annotations.stopHere).not.toBe(en.annotations.stopHere)
      expect(resource.annotations.legend.note).not.toBe(
        en.annotations.legend.note
      )
      expect(resource.tour.event.steps.runInputs.content).not.toBe(
        en.tour.event.steps.runInputs.content
      )
      expect(resource.tour.event.steps.progressGrid.content).not.toBe(
        en.tour.event.steps.progressGrid.content
      )
    }
  )

  it("mentions marks in the progress grid tour step", () => {
    expect(en.tour.event.steps.progressGrid.content).toMatch(/Maybe clear/)
    expect(en.tour.event.steps.progressGrid.content).toMatch(/Stop here/)
  })

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

  it.each(translated)(
    "translates the team minimum copy in %s",
    (_locale, resource) => {
      expect(resource.teams.editor.needsMembers).not.toBe(
        en.teams.editor.needsMembers
      )
      expect(resource.teams.incomplete).not.toBe(en.teams.incomplete)
      expect(resource.teams.picker.countBelowMinimum).not.toBe(
        en.teams.picker.countBelowMinimum
      )
    }
  )
})
