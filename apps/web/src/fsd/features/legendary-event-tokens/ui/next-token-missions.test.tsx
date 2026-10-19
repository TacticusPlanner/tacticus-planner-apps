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
import { workedViewInput } from "../lib/token-plan-view.fixtures"
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

  it("shows a For missions alternative with the points it gives up", () => {
    const view = worked()
    const token = {
      ...view.next!.token,
      laneId: "beta" as const,
      battleIndex: 3,
      points: 210,
      clearedIds: [0],
    }
    renderCard({
      ...view,
      missions: {
        progressed: [],
        alternative: {
          token,
          index: 4,
          missions: [ADMECH, NO_BIG_TARGET],
          pointsDifference: -30,
        },
      },
    })

    expect(screen.queryByTestId("next-token-progresses")).toBeNull()
    expect(screen.getByTestId("next-token-missions-battle")).toHaveTextContent(
      "Beta · Battle 4"
    )
    expect(screen.getByTestId("next-token-missions-points")).toHaveTextContent(
      "+210 points (-30)"
    )
    expect(
      screen.getByTestId("next-token-missions-progresses")
    ).toHaveTextContent(
      "Progresses: Defeat 75 Adeptus Mechanicus · Win 5 battles without deploying any Big Target characters (premium)"
    )
    fireEvent.click(screen.getByTestId("next-token-missions-could-not"))
    expect(onMarkToken).toHaveBeenCalledWith(
      "beta",
      3,
      expect.any(Array),
      "stopHere"
    )
  })

  it("shows what the Next token progresses and no alternative when it is best", () => {
    renderCard({
      ...worked(),
      missions: { progressed: [ADMECH, NO_BIG_TARGET], alternative: null },
    })

    expect(screen.getByTestId("next-token-progresses")).toHaveTextContent(
      "Progresses: Defeat 75 Adeptus Mechanicus"
    )
    expect(screen.queryByTestId("next-token-missions-alternative")).toBeNull()
  })

  it("shows no mission lines without open missions", () => {
    renderCard({
      ...worked(),
      missions: { progressed: [], alternative: null },
    })

    expect(screen.queryByTestId("next-token-progresses")).toBeNull()
    expect(screen.queryByTestId("next-token-missions-alternative")).toBeNull()
  })

  it("matches the plan's tokens with the current run's open missions", () => {
    const melee = ["ultraCalgar", "ultraTitus", "ultraApothecary"]
    const view = buildTokenPlanView(
      workedViewInput({
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
        (entry) => `${entry.track} ${entry.mission.index}`
      )
    ).toContain("regular 1")
    expect(worked().missions).toBeNull()
  })
})
