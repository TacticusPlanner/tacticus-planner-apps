import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildLanePointsModel,
  buildSyncedLaneProgress,
  type LegendaryEventRosterUnit,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

import type { TeamSuggestionsSource } from "../model/team-suggestions-state"
import { TeamSuggestionsDialog } from "./team-suggestions-dialog"

const capture = vi.hoisted(() => vi.fn())
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: capture }),
}))

beforeEach(async () => {
  await seedGameCatalog({ characters: legendaryEventCharacters })
})

let i18n: I18n

const OWNED = [
  "ultraCalgar",
  "ultraTigurius",
  "ultraTitus",
  "ultraApothecary",
  "ultraEliminatorSgt",
]
// Gold1 / Epic:RedOneStar / slots 0–2 / 20 / 15: power Incisus 24,753, Titus 21,883, Calgar 21,675,
// Tigurius 16,672 (× 1.2), Certus 13,912.
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
      powerRatio: 1.2,
      calibrated: true,
      hordeMultipliers: new Map([["ultraTigurius", 1.2]]),
      unitPower: unitPowerContextFixture(),
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

  it("shows the three worked proposals with their reasons", async () => {
    renderDialog()
    await screen.findAllByText("Incisus")
    expect(cards()).toHaveLength(3)
    expect(members(cards()[0]!)).toEqual([
      "ultraApothecary",
      "ultraTitus",
      "ultraCalgar",
    ])
    expect(
      within(cards()[0]!).getByTestId("team-suggestion-reason")
    ).toHaveTextContent(
      "Covers Ultramarines and Melee · clears ~5 · +945 points over your teams"
    )
    expect(members(cards()[1]!)).toEqual([
      "ultraApothecary",
      "ultraCalgar",
      "ultraTigurius",
      "ultraEliminatorSgt",
    ])
    expect(members(cards()[2]!)).toHaveLength(5)
    expect(
      screen.queryByTestId("team-suggestions-show-more")
    ).not.toBeInTheDocument()
    expect(capture).toHaveBeenCalledWith({
      type: "legendary_event_team_suggestions_opened",
      eventId: "votanUthar",
      laneId: "alpha",
      suggestionCount: 3,
    })
  })

  it("ignores an incomplete existing team (Uthar's two-member team) in the gains", async () => {
    renderDialog({
      teams: [
        {
          id: "short",
          laneId: "alpha",
          name: "Max 2 Hits · Melee",
          sortOrder: 0,
          memberUnitIds: ["ultraApothecary", "bloodIntercessor"],
          reserveUnitId: null,
          objectiveIndexes: [2, 3],
          runDepths: [
            {
              run: 1,
              expectedBattleClears: 5,
              expectedBattleClearsSource: "manual",
              recordedAt: "2026-10-01T00:00:00Z",
            },
          ],
        },
      ],
    })
    await screen.findAllByText("Incisus")
    expect(
      within(cards()[0]!).getByTestId("team-suggestion-reason")
    ).toHaveTextContent("+945 points over your teams")
  })

  it("marks a covered objective already cleared through the proposal depth and leaves it out of the reason", async () => {
    // Ultramarines (objective id 1) cleared in battles 1–5.
    renderDialog({
      progress: buildSyncedLaneProgress(model, {
        encounters: Array.from({ length: 5 }, () => ({
          objectivesCleared: [1],
          highScore: 0,
          encounterPoints: 0,
        })),
      } as Parameters<typeof buildSyncedLaneProgress>[1]),
    })
    await screen.findAllByText("Incisus")
    const melee = cards().find(
      (card) =>
        members(card).join() === "ultraApothecary,ultraTitus,ultraCalgar"
    )!
    const [ultramarines, meleeChip] = within(melee).getAllByTestId(
      "team-suggestion-objective"
    )
    expect(ultramarines).toHaveAttribute("data-cleared", "true")
    expect(
      within(ultramarines!).getByText("Already cleared through battle 5")
    ).toHaveClass("sr-only")
    expect(meleeChip).not.toHaveAttribute("data-cleared")
    expect(
      within(melee).getByTestId("team-suggestion-reason")
    ).toHaveTextContent(
      /^Covers Melee · clears ~5 · \+[\d,]+ points over your teams$/
    )
  })

  it("hands a proposal and its rank to Use this team", async () => {
    const { onUseSuggestion } = renderDialog()
    await screen.findAllByText("Incisus")
    const use = within(cards()[0]!).getByTestId("team-suggestion-use")
    expect(use).toHaveAccessibleDescription(
      within(cards()[0]!).getByTestId("team-suggestion-reason").textContent!
    )
    fireEvent.click(use)
    expect(onUseSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        memberUnitIds: ["ultraApothecary", "ultraTitus", "ultraCalgar"],
        coveredObjectiveIndexes: [0, 3],
        gainPoints: 945,
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
