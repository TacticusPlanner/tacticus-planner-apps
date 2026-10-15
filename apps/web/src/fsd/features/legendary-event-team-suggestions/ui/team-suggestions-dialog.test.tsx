import { useEffect, useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildLanePointsModel,
  buildSyncedLaneProgress,
  type LegendaryEventRosterUnit,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import type { TeamSuggestionsSource } from "../model/team-suggestions-state"
import { TeamSuggestionsDialog } from "./team-suggestions-dialog"

const capture = vi.hoisted(() => vi.fn())
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: capture }),
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return value
  },
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: async () =>
    new Map(legendaryEventCharacters.map((unit) => [unit.id, unit])),
  getMowsMap: async () => new Map(),
}))

let i18n: I18n

const OWNED = [
  "ultraCalgar",
  "ultraTigurius",
  "ultraTitus",
  "ultraApothecary",
  "ultraEliminatorSgt",
]
// Gold1 / Epic:RedOneStar / 3 upgrades / 20 / 15: combat power 8,792.
const rosterUnit = (unitId: string): LegendaryEventRosterUnit =>
  ({
    unitId,
    rank: "Gold1",
    progressionIndex: "Epic:RedOneStar",
    appliedUpgradeSlots: [0, 1, 2],
    abilities: [
      { abilityId: "active", level: 20 },
      { abilityId: "passive", level: 15 },
    ],
  }) as LegendaryEventRosterUnit
const model = buildLanePointsModel(utharEvent.alpha)
const source: TeamSuggestionsSource = {
  eventId: "votanUthar",
  laneId: "alpha",
  lane: utharEvent.alpha,
  units: legendaryEventCharacters,
  teams: [],
  run: 1,
  model,
  progress: buildSyncedLaneProgress(model, {
    encounters: [
      { objectivesCleared: [0, 1], highScore: 29, encounterPoints: 29 },
      { objectivesCleared: [0], highScore: 31, encounterPoints: 31 },
    ],
  } as Parameters<typeof buildSyncedLaneProgress>[1]),
  estimates: {
    battlePowers: [1018, 3055, 8199, 20703, 40586, 75787, 134603],
    roster: new Map(OWNED.map((unitId) => [unitId, rosterUnit(unitId)])),
    config: {
      powerRatio: 0.5,
      calibrated: true,
      hordeMultipliers: new Map([["ultraTigurius", 1.2]]),
    },
  },
  goalUnitIds: new Set(),
}

function renderDialog(
  overrides: Partial<TeamSuggestionsSource> = {},
  onUseSuggestion = vi.fn()
) {
  const onClose = vi.fn()
  render(
    <TeamSuggestionsDialog
      onClose={onClose}
      onUseSuggestion={onUseSuggestion}
      open
      source={{ ...source, ...overrides }}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return { onUseSuggestion, onClose }
}

const cards = () => screen.getAllByTestId("team-suggestion")
const members = (card: HTMLElement) =>
  within(card)
    .getAllByTestId("team-suggestion-member")
    .map((element) => element.dataset.unit)

describe("TeamSuggestionsDialog", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    capture.mockReset()
    setViewportWidth(1280)
  })

  it("shows the first three worked proposals with their reasons, then up to ten", async () => {
    renderDialog()
    await screen.findAllByText("Incisus")
    expect(cards()).toHaveLength(3)
    expect(members(cards()[0]!)).toEqual([
      "ultraApothecary",
      "ultraCalgar",
      "ultraTitus",
    ])
    expect(
      within(cards()[0]!).getByTestId("team-suggestion-reason")
    ).toHaveTextContent(
      "Covers Ultramarines and Melee · clears ~5 · +830 points over your teams"
    )
    expect(members(cards()[1]!)).toEqual(["ultraApothecary"])

    fireEvent.click(screen.getByTestId("team-suggestions-show-more"))
    expect(cards()).toHaveLength(5)
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_team_suggestions_opened",
      eventId: "votanUthar",
      laneId: "alpha",
      suggestionCount: 5,
    })
  })

  it("hands a proposal and its rank to Use this team", async () => {
    const { onUseSuggestion } = renderDialog()
    await screen.findAllByText("Incisus")
    fireEvent.click(within(cards()[0]!).getByTestId("team-suggestion-use"))
    expect(onUseSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        memberUnitIds: ["ultraApothecary", "ultraCalgar", "ultraTitus"],
        coveredObjectiveIndexes: [0, 3],
        gainPoints: 830,
      }),
      1
    )
  })

  it("starts with Only unlocked on and can propose a locked unit with it off", async () => {
    renderDialog()
    await screen.findAllByText("Incisus")
    expect(screen.getByTestId("team-suggestions-only-unlocked")).toBeChecked()
    expect(
      screen.getByTestId("team-suggestions-prefer-goals")
    ).not.toBeChecked()
    fireEvent.click(screen.getByTestId("team-suggestions-only-unlocked"))
    fireEvent.click(screen.getByTestId("team-suggestions-show-more"))
    const locked = screen
      .getAllByTestId("team-suggestion-member")
      .filter((element) => element.dataset.locked === "true")
    expect(locked.map((element) => element.dataset.unit)).toContain(
      "ultraInceptorSgt"
    )
  })

  it("says when no team adds points and when estimates are unavailable", () => {
    const { onClose } = renderDialog({ model: { ...model, battles: [] } })
    expect(screen.getByTestId("team-suggestions-empty")).toHaveTextContent(
      "No team adds points over your current teams"
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it("shows a skeleton while estimates load", () => {
    renderDialog({ estimates: "pending" })
    expect(screen.getByTestId("team-suggestions-loading")).toBeInTheDocument()
  })

  it("is a bottom sheet with full-width actions on mobile", async () => {
    setViewportWidth(390)
    renderDialog()
    await screen.findAllByText("Incisus")
    expect(within(cards()[0]!).getByTestId("team-suggestion-use")).toHaveClass(
      "w-full",
      "min-h-11"
    )
  })
})
