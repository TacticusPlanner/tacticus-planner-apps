import { describe, expect, it, vi } from "vitest"

import type { LegendaryEventPlan } from "@/entities/legendary-event"

import { buildTeamsSectionState } from "./teams.view-model"

const plan: LegendaryEventPlan = {
  eventId: "astarLysander",
  revision: 1,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: false,
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
