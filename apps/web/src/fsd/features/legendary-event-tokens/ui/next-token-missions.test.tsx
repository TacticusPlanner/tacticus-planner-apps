import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  eventMissions,
  type LegendaryEventMissionRef,
} from "@/entities/legendary-event"
import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen } from "@/test/render"

import {
  buildTokenPlanView,
  type TokenPlanReady,
  type TokenPlanView,
} from "../lib/token-plan-view"
import type { MissionProgress } from "../lib/token-missions"
import { workedPlan, workedViewInput } from "../lib/token-plan-view.fixtures"
import { NextTokenCard } from "./next-token-card"

vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: vi.fn() }),
}))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string | null, id: string | null) => id ?? "",
}))

let i18n: I18n
const onMarkToken = vi.fn()

const ref = (
  track: "regular" | "premium",
  index: number
): LegendaryEventMissionRef => ({
  track,
  mission: eventMissions(utharEvent, track).find(
    (mission) => mission.index === index
  )!,
})
const gain = (
  mission: LegendaryEventMissionRef,
  amount: number,
  estimate = false
): MissionProgress => ({ ref: mission, amount, estimate })
const ADMECH = ref("regular", 2)

const worked = () => buildTokenPlanView(workedViewInput()) as TokenPlanReady

function renderCard(view: TokenPlanView) {
  return render(
    <NextTokenCard
      event={utharEvent}
      eventId="votanUthar"
      isMobile={false}
      onMarkToken={onMarkToken}
      onOpenTeams={vi.fn()}
      view={view}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

describe("NextTokenCard missions", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => onMarkToken.mockReset())

  it("hides what the Next token progresses behind a button, each mission with its +X", () => {
    renderCard({
      ...worked(),
      missions: {
        progressed: [gain(ADMECH, 4, true)],
      },
    })

    const button = screen.getByTestId("next-token-progresses")
    expect(button).toHaveAccessibleName("Progresses 1 mission")
    expect(screen.queryByText("Defeat 75 Adeptus Mechanicus")).toBeNull()
    fireEvent.click(button)
    expect(screen.getByTestId("next-token-progresses-gain")).toHaveTextContent(
      "~+4"
    )
  })

  it("shows no missions button without open missions", () => {
    renderCard({
      ...worked(),
      missions: { progressed: [] },
    })

    expect(screen.queryByTestId("next-token-progresses")).toBeNull()
  })

  it("matches the plan's tokens with the current run's open missions", () => {
    const melee = ["ultraCalgar", "ultraTitus", "ultraApothecary"]
    // Mission 0 (any battle) is done, so Defeat 30 Necrons is run 2's current mission.
    const plan = workedPlan(undefined, {
      runs: [
        {
          run: 2,
          regularMissions: 10,
          premiumMissions: 0,
          bundlePurchased: false,
          closeShards: 0,
          completedRegularMissions: [0],
          completedPremiumMissions: [],
          updatedAt: "2026-10-15T00:00:00Z",
        },
      ],
    })
    const view = buildTokenPlanView(
      workedViewInput({
        plan: { enabled: true, status: "success", data: plan },
        missions: {
          event: utharEvent,
          unitsById: new Map(
            melee.map((id) => [id, fixtureCharacter(id)] as const)
          ),
          enemiesOf: () => ({
            factions: new Set(["Necrons"]),
            traits: new Set(),
          }),
        },
      })
    ) as TokenPlanReady

    expect(
      view.missions?.progressed.map(
        (entry) => `${entry.ref.track} ${entry.ref.mission.index}`
      )
    ).toContain("regular 1")
    expect(worked().missions).toBeNull()
  })
})
