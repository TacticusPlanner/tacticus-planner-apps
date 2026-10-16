import { renderHook } from "@testing-library/react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import type {
  LegendaryEvent,
  LegendaryEventPlan,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"

import { useImpactTeamName } from "./use-upgrade-impact"

let i18n: I18n

const team = (
  overrides: Partial<LegendaryEventTeam> & Pick<LegendaryEventTeam, "id">
): LegendaryEventTeam => ({
  laneId: "alpha",
  name: "alpha",
  sortOrder: 0,
  memberUnitIds: [],
  reserveUnitId: null,
  objectiveIndexes: [],
  runDepths: [],
  ...overrides,
})

const plan = {
  teams: [
    team({ id: "imported", objectiveIndexes: [2, 3] }),
    team({ id: "rush", name: "Melee rush", sortOrder: 1 }),
  ],
} as unknown as LegendaryEventPlan

describe("useImpactTeamName", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("names an Upgrade impact row's team by its display name, or its id when unknown", () => {
    const { result } = renderHook(
      () => useImpactTeamName(utharEvent as unknown as LegendaryEvent, plan),
      { wrapper: i18nWrapper(i18n) }
    )
    expect(result.current("imported")).toBe("Max 2 hits · Melee")
    expect(result.current("rush")).toBe("Melee rush")
    expect(result.current("gone")).toBe("gone")
  })
})
