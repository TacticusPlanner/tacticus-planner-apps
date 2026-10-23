import { describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventRosterUnit,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import {
  buildTeamCardViewModel,
  buildTeamsSectionState,
  rosterMap,
  type TeamPowerSource,
} from "./teams.view-model"

const plan: LegendaryEventPlan = {
  eventId: "astarLysander",
  revision: 1,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: false,
  runs: [],
  annotations: [],
  teams: [],
}

function state(
  overrides: Partial<Parameters<typeof buildTeamsSectionState>[0]> = {}
) {
  const refetch = vi.fn()
  const retryUnits = vi.fn()
  const result = buildTeamsSectionState({
    enabled: true,
    query: { status: "success", data: plan, refetch },
    units: [],
    retryUnits,
    roster: undefined,
    runPending: false,
    ...overrides,
  })
  return { result, refetch, retryUnits }
}

describe("buildTeamsSectionState", () => {
  it("is ready once the plan, the units, the roster and the run are known", () => {
    expect(state().result.kind).toBe("ready")
  })

  it("stays loading while the synced progress (the current run) loads", () => {
    expect(state({ runPending: true }).result.kind).toBe("loading")
  })

  it("retries only the catalog units when they failed", () => {
    const refetch = vi.fn()
    const { result, retryUnits } = state({
      units: "error",
      query: { status: "success", data: plan, refetch },
    })
    if (result.kind !== "error") throw new Error("expected an error state")
    result.retry()
    expect(retryUnits).toHaveBeenCalledTimes(1)
    expect(refetch).not.toHaveBeenCalled()
  })

  it("retries only the plan when it failed", () => {
    const refetch = vi.fn()
    const { result, retryUnits } = state({
      query: { status: "error", data: undefined, refetch },
    })
    if (result.kind !== "error") throw new Error("expected an error state")
    result.retry()
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(retryUnits).not.toHaveBeenCalled()
  })

  it("retries both when both failed", () => {
    const refetch = vi.fn()
    const { result, retryUnits } = state({
      units: "error",
      query: { status: "error", data: undefined, refetch },
    })
    if (result.kind !== "error") throw new Error("expected an error state")
    result.retry()
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(retryUnits).toHaveBeenCalledTimes(1)
  })
})

describe("buildTeamCardViewModel team power (spec worked examples)", () => {
  const unitPower = unitPowerContextFixture()
  const WORKED_TEAM = [
    "ultraCalgar",
    "ultraTigurius",
    "ultraTitus",
    "ultraApothecary",
    "ultraEliminatorSgt",
  ]
  // Gold1 / Epic:RedOneStar / slots 0–2 / 20 / 15 / no items: 21,675; 16,672; 21,883; 24,753;
  // 13,912 (Tigurius's 1.2 horde-mode multiplier is not applied here).
  const owned = (unitId: string): LegendaryEventRosterUnit =>
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
  const team = (
    overrides: Partial<LegendaryEventTeam> = {}
  ): LegendaryEventTeam => ({
    id: "t1",
    laneId: "alpha",
    name: "Ultramarines",
    sortOrder: 0,
    memberUnitIds: WORKED_TEAM,
    reserveUnitId: null,
    objectiveIndexes: [0],
    runDepths: [],
    ...overrides,
  })
  const card = (
    value: LegendaryEventTeam,
    roster: LegendaryEventRosterUnit[] | undefined,
    source: TeamPowerSource
  ) =>
    buildTeamCardViewModel(
      value,
      utharEvent.alpha,
      legendaryEventCharacters,
      roster,
      1,
      undefined,
      source
    )

  it("sums the members' power without the horde-mode multiplier: 98,895", () => {
    const result = card(team(), WORKED_TEAM.map(owned), unitPower)
    expect(result.teamPower).toBe(98895)
    expect(result.teamPowerStatus).toBe("ready")
  })

  it("counts neither a locked member nor the reserve: 77,012", () => {
    const roster = [...WORKED_TEAM, "ultraInceptorSgt"]
      .filter((unitId) => unitId !== "ultraTitus")
      .map(owned)
    const result = card(
      team({ reserveUnitId: "ultraInceptorSgt" }),
      roster,
      unitPower
    )
    expect(result.teamPower).toBe(77012)
    expect(result.lockedMemberCount).toBe(1)
  })

  it("counts equipped items", () => {
    const roster = WORKED_TEAM.map((unitId) =>
      unitId === "ultraTigurius"
        ? {
            ...owned(unitId),
            equippedItems: [
              { slotId: "slot1", equipmentId: "I_Crit_C001", level: 3 },
            ],
          }
        : owned(unitId)
    ) as LegendaryEventRosterUnit[]
    // Tigurius 16,672 → 16,809.
    expect(card(team(), roster, unitPower).teamPower).toBe(99032)
  })

  it("is pending while the power data loads", () => {
    const result = card(team(), WORKED_TEAM.map(owned), "loading")
    expect(result.teamPower).toBeNull()
    expect(result.teamPowerStatus).toBe("pending")
  })

  it("names the roster, not the power data, when the roster is not synced", () => {
    for (const source of [unitPower, "loading", null, "error"] as const) {
      const result = card(team(), undefined, source)
      expect(result.teamPower).toBeNull()
      expect(result.teamPowerStatus).toBe("noRoster")
    }
  })

  it("reads a roster map the section built once", () => {
    const roster = WORKED_TEAM.map(owned)
    const result = buildTeamCardViewModel(
      team(),
      utharEvent.alpha,
      legendaryEventCharacters,
      roster,
      1,
      undefined,
      unitPower,
      rosterMap(roster)
    )
    expect(result.teamPower).toBe(98895)
    expect(result.members.every((member) => member.owned)).toBe(true)
  })

  it("is unavailable, never a partial sum, without power data or a readable roster", () => {
    const roster = WORKED_TEAM.map(owned)
    for (const source of [null, "error"] as const) {
      const result = card(team(), roster, source)
      expect(result.teamPower).toBeNull()
      expect(result.teamPowerStatus).toBe("unavailable")
    }
    // One owned member wearing an item the power data does not know.
    const unknownItem = roster.map((unit) =>
      unit.unitId === "ultraCalgar"
        ? {
            ...unit,
            equippedItems: [
              { slotId: "slot1", equipmentId: "I_Unknown", level: 1 },
            ],
          }
        : unit
    ) as LegendaryEventRosterUnit[]
    expect(card(team(), unknownItem, unitPower)).toMatchObject({
      teamPower: null,
      teamPowerStatus: "unavailable",
    })
  })
})
