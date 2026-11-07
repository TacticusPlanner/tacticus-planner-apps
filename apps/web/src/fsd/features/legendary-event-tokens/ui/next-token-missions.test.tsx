import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  eventMissions,
  type LegendaryEventMissionRef,
} from "@/entities/legendary-event"
import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import {
  buildTokenPlanView,
  type TokenPlanReady,
  type TokenPlanView,
} from "../lib/token-plan-view"
import type { MissionProgress } from "../lib/token-missions"
import { workedPlan, workedViewInput } from "../lib/token-plan-view.fixtures"
import { NextTokenCard } from "./next-token-card"
import { MissionAlternativeView } from "./next-token-missions"

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
const NO_BIG_TARGET = ref("premium", 4)

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

  it("keeps the For missions alternative out of the Points order", () => {
    const view = worked()
    renderCard({
      ...view,
      missions: {
        progressed: [],
        alternative: {
          token: { ...view.next!.token, laneId: "beta", battleIndex: 3 },
          index: 4,
          missions: [gain(ADMECH, 3)],
          pointsDifference: -30,
        },
      },
    })

    expect(screen.queryByTestId("next-token-missions-alternative")).toBeNull()
  })

  it("shows a For missions alternative with the points it gives up and its missions", () => {
    const view = worked()
    const token = {
      ...view.next!.token,
      laneId: "beta" as const,
      battleIndex: 3,
      points: 210,
      clearedIds: [0],
    }
    render(
      <MissionAlternativeView
        alternative={{
          token,
          index: 4,
          missions: [gain(ADMECH, 3), gain(NO_BIG_TARGET, 1)],
          pointsDifference: -30,
        }}
        event={utharEvent}
        isMobile={false}
        onMarkToken={onMarkToken}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getByTestId("next-token-missions-battle")).toHaveTextContent(
      "Beta · Battle 4"
    )
    expect(screen.getByTestId("next-token-missions-points")).toHaveTextContent(
      "+210 points (-30)"
    )
    const button = screen.getByTestId("next-token-missions-progresses")
    expect(button).toHaveTextContent("2")
    expect(button).toHaveAccessibleName("Progresses 2 missions")
    fireEvent.click(button)
    const popover = screen.getByTestId("next-token-missions-progresses-popover")
    expect(
      within(popover)
        .getAllByTestId("next-token-missions-progresses-mission")
        .map((row) => row.textContent)
    ).toStrictEqual([
      "Defeat 75 Adeptus Mechanicus+3",
      "Win 5 battles without deploying any Big Target characters (premium)+1",
    ])
    fireEvent.click(screen.getByTestId("next-token-missions-could-not"))
    expect(onMarkToken).toHaveBeenCalledWith(
      "beta",
      3,
      expect.any(Array),
      "stopHere"
    )
  })

  it("hides what the Next token progresses behind a button, each mission with its +X", () => {
    renderCard({
      ...worked(),
      missions: {
        progressed: [gain(ADMECH, 4, true)],
        alternative: null,
      },
    })

    const button = screen.getByTestId("next-token-progresses")
    expect(button).toHaveAccessibleName("Progresses 1 mission")
    expect(screen.queryByText("Defeat 75 Adeptus Mechanicus")).toBeNull()
    fireEvent.click(button)
    expect(screen.getByTestId("next-token-progresses-gain")).toHaveTextContent(
      "~+4"
    )
    expect(screen.queryByTestId("next-token-missions-alternative")).toBeNull()
  })

  it("shows no missions button without open missions", () => {
    renderCard({
      ...worked(),
      missions: { progressed: [], alternative: null },
    })

    expect(screen.queryByTestId("next-token-progresses")).toBeNull()
    expect(screen.queryByTestId("next-token-missions-alternative")).toBeNull()
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
