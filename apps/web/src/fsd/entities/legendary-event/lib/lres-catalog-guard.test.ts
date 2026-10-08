import { describe, expect, it } from "vitest"

import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import {
  farsightEvent,
  lysanderEvent,
  utharEvent,
} from "@/test/fixtures/legendary-events"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEvent,
  type LegendaryEventUnitFilter,
} from "../model/types"
import { unitDealtDamageTypes } from "./damage-profile-exclusions"
import { describeUnitFilter } from "./objective-label"
import {
  isSupportedUnitFilterKind,
  isUnitAllowedOnLane,
} from "./objective-match"

// Guards the served `lres` data against the client's matcher, so a new objective kind or a renamed
// trait / damage-type / faction id fails CI instead of silently emptying an objective.
const servedEvents = [lysanderEvent, utharEvent, farsightEvent]

function lanesOf(event: LegendaryEvent) {
  return LEGENDARY_EVENT_LANE_IDS.map((laneId) => ({
    where: `${event.id}.${laneId}`,
    lane: event[laneId],
  }))
}

function filtersOf(event: LegendaryEvent) {
  return lanesOf(event).flatMap(({ where, lane }) => [
    ...lane.allowedUnitsFilter.map((filter) => ({
      where: `${where}.allowedUnitsFilter`,
      filter,
    })),
    ...lane.unitsRestrictions.map((objective) => ({
      where: `${where}.objective[${objective.index}]`,
      filter: objective.filter,
    })),
  ])
}

/** Every filter whose kind the matcher does not support, as "where: kind". */
function unsupportedKinds(events: LegendaryEvent[]): string[] {
  return events
    .flatMap(filtersOf)
    .filter(({ filter }) => !isSupportedUnitFilterKind(filter.kind))
    .map(({ where, filter }) => `${where}: ${filter.kind}`)
}

const targetResolves = (filter: LegendaryEventUnitFilter): boolean => {
  switch (filter.kind) {
    case "Trait": {
      return legendaryEventCharacters.some((unit) =>
        unit.traits.includes(filter.target)
      )
    }
    case "DamageType": {
      return legendaryEventCharacters.some((unit) =>
        unitDealtDamageTypes(unit).includes(filter.target)
      )
    }
    case "Faction": {
      return legendaryEventCharacters.some(
        (unit) => unit.faction === filter.target
      )
    }
    default: {
      return true
    }
  }
}

describe("served lres against the objective matcher", () => {
  it("supports every allowed-units and objective kind", () => {
    expect(unsupportedKinds(servedEvents)).toEqual([])
  })

  it("reports an unsupported kind by name", () => {
    const broken: LegendaryEvent = {
      ...lysanderEvent,
      beta: {
        ...lysanderEvent.beta,
        unitsRestrictions: lysanderEvent.beta.unitsRestrictions.map(
          (objective) =>
            objective.index === 1
              ? {
                  ...objective,
                  filter: { kind: "NoSummons", target: "", exclude: false },
                }
              : objective
        ),
      },
    }
    expect(unsupportedKinds([broken])).toEqual([
      "astarLysander.beta.objective[1]: NoSummons",
    ])
  })

  it("resolves every Trait, DamageType and Faction target to a catalog character", () => {
    const unresolved = servedEvents
      .flatMap(filtersOf)
      .filter(({ filter }) => !targetResolves(filter))
      .map(({ where, filter }) => `${where}: ${filter.kind} ${filter.target}`)
    expect(unresolved).toEqual([])
  })

  it("resolves every served objective to an icon asset", () => {
    const missing = servedEvents
      .flatMap(lanesOf)
      .flatMap(({ where, lane }) =>
        lane.unitsRestrictions
          .filter((objective) => !describeUnitFilter(objective.filter).icon)
          .map((objective) => `${where}.objective[${objective.index}]`)
      )
    expect(missing).toEqual([])
  })

  it("agrees with the served availableUnitIds on every lane", () => {
    for (const event of servedEvents) {
      for (const { where, lane } of lanesOf(event)) {
        const allowed = legendaryEventCharacters
          .filter((unit) => isUnitAllowedOnLane(unit, lane))
          .map((unit) => unit.id)
          .sort()
        expect(allowed, where).toEqual([...lane.availableUnitIds].sort())
        expect(allowed.length, where).toBeGreaterThan(0)
      }
    }
  })
})
