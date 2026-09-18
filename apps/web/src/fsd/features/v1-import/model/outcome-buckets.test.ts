import { describe, expect, it } from "vitest"
import type { V1GoalOutcome } from "@/entities/account"

import {
  bucketForCode,
  buildDiagnosticText,
  effectiveGoalsStatus,
  groupOutcomes,
  importedCounts,
  isAutomaticallyAdded,
} from "./outcome-buckets"

function outcome(overrides: Partial<V1GoalOutcome>): V1GoalOutcome {
  return {
    status: "Created",
    code: "goal_created",
    message: "Imported from V1.",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    goalId: "goal-1",
    sourceGoalId: "v1-goal-1",
    ...overrides,
  }
}

describe("bucketForCode", () => {
  it("maps every documented code to its bucket (4.1)", () => {
    expect(bucketForCode("goal_created")).toBe("imported")
    expect(bucketForCode("prerequisite_added")).toBe("imported")
    expect(bucketForCode("target_already_reached")).toBe("needsNoImport")
    expect(bucketForCode("goal_already_exists")).toBe("needsNoImport")
    expect(bucketForCode("duplicate_goal_merged")).toBe("needsNoImport")
    expect(bucketForCode("prerequisite_target_insufficient")).toBe(
      "notImported"
    )
    expect(bucketForCode("unknown_unit")).toBe("notImported")
    expect(bucketForCode("unsupported_goal_type")).toBe("notImported")
    expect(bucketForCode("invalid_progression")).toBe("notImported")
    expect(bucketForCode("missing_target")).toBe("notImported")
    expect(bucketForCode("player_data_required")).toBe("failed")
    expect(bucketForCode("target_rejected")).toBe("failed")
    expect(bucketForCode("project_slot_conflict")).toBe("failed")
  })

  it("falls back an unrecognised code to notImported rather than hiding it as benign", () => {
    expect(bucketForCode("some_future_code")).toBe("notImported")
  })
})

describe("groupOutcomes", () => {
  it("groups a fixture containing one outcome per code into the right buckets", () => {
    const codes = [
      "goal_created",
      "prerequisite_added",
      "target_already_reached",
      "goal_already_exists",
      "duplicate_goal_merged",
      "prerequisite_target_insufficient",
      "unknown_unit",
      "unsupported_goal_type",
      "invalid_progression",
      "missing_target",
      "player_data_required",
      "target_rejected",
      "project_slot_conflict",
    ]
    const grouped = groupOutcomes(codes.map((code) => outcome({ code })))

    expect(grouped.imported).toHaveLength(2)
    expect(grouped.needsNoImport).toHaveLength(3)
    expect(grouped.notImported).toHaveLength(5)
    expect(grouped.failed).toHaveLength(3)
  })

  it("is empty for an empty outcome list", () => {
    const grouped = groupOutcomes([])
    expect(grouped).toEqual({
      imported: [],
      needsNoImport: [],
      notImported: [],
      failed: [],
    })
  })
})

describe("importedCounts", () => {
  it("reports five goals across four units as distinct numbers (4.2)", () => {
    const imported = [
      outcome({ entityId: "unit-1", goalType: "Unlock" }),
      outcome({ entityId: "unit-1", goalType: "Rank" }),
      outcome({ entityId: "unit-2", goalType: "Rank" }),
      outcome({ entityId: "unit-3", goalType: "Rank" }),
      outcome({ entityId: "unit-4", goalType: "Rank" }),
    ]
    expect(importedCounts(imported)).toEqual({ goals: 5, units: 4 })
  })
})

describe("isAutomaticallyAdded", () => {
  it("identifies a synthesized prerequisite by its code (4.7)", () => {
    expect(isAutomaticallyAdded(outcome({ code: "prerequisite_added" }))).toBe(
      true
    )
    expect(isAutomaticallyAdded(outcome({ code: "goal_created" }))).toBe(false)
  })
})

describe("effectiveGoalsStatus", () => {
  it("does not report success when every outcome was not-imported or failed (5.3)", () => {
    const outcomes = [
      outcome({ code: "unknown_unit", status: "Failed" }),
      outcome({ code: "target_rejected", status: "Failed" }),
    ]
    expect(effectiveGoalsStatus("Imported", outcomes)).toBe("Failed")
  })

  it("reports success when at least one goal was created", () => {
    const outcomes = [
      outcome({ code: "unknown_unit", status: "Failed" }),
      outcome({ code: "goal_created", status: "Created" }),
    ]
    expect(effectiveGoalsStatus("Imported", outcomes)).toBe("Imported")
  })

  it("leaves a trivially empty import (nothing to import) as reported", () => {
    expect(effectiveGoalsStatus("Imported", [])).toBe("Imported")
  })

  it("leaves a server-refused status alone", () => {
    const refusal = [
      outcome({ code: "player_data_required", status: "Failed" }),
    ]
    expect(effectiveGoalsStatus("Failed", refusal)).toBe("Failed")
  })
})

describe("buildDiagnosticText", () => {
  const heading = (bucket: "notImported" | "failed") =>
    bucket === "notImported" ? "Not imported" : "Failed"
  const unitName = (_entityType: string | null, entityId: string | null) =>
    entityId ?? ""
  const goalTypeLabel = (goalType: string | null) => goalType

  it("lists each not-imported/failed outcome's unit, goal type and reason (6.1)", () => {
    const text = buildDiagnosticText({
      notImported: [
        outcome({
          code: "unknown_unit",
          entityId: "SomeV1Id",
          goalType: null,
          message:
            "The goal's character or Machine of War is not in the V2 Game Catalog.",
        }),
      ],
      failed: [
        outcome({
          code: "target_rejected",
          entityId: "hero1",
          goalType: "Rank",
          message: "The target rank exceeds the unit's rarity cap.",
        }),
      ],
      heading,
      unitName,
      goalTypeLabel,
      noUnitLabel: "Unspecified unit",
    })

    expect(text).toContain("Not imported:")
    expect(text).toContain(
      "- SomeV1Id: The goal's character or Machine of War is not in the V2 Game Catalog."
    )
    expect(text).toContain("Failed:")
    expect(text).toContain(
      "- hero1 (Rank): The target rank exceeds the unit's rarity cap."
    )
  })

  it("omits an empty bucket's section entirely", () => {
    const text = buildDiagnosticText({
      notImported: [],
      failed: [outcome({ code: "target_rejected" })],
      heading,
      unitName,
      goalTypeLabel,
      noUnitLabel: "Unspecified unit",
    })
    expect(text).not.toContain("Not imported:")
    expect(text).toContain("Failed:")
  })

  it("is empty when both buckets are empty (6.3)", () => {
    expect(
      buildDiagnosticText({
        notImported: [],
        failed: [],
        heading,
        unitName,
        goalTypeLabel,
        noUnitLabel: "Unspecified unit",
      })
    ).toBe("")
  })

  it("falls back to a no-unit label when the outcome carries no unit id", () => {
    const text = buildDiagnosticText({
      notImported: [
        outcome({
          code: "unsupported_goal_type",
          entityType: null,
          entityId: null,
          goalType: null,
          message: "V1 goal type 6 is not supported.",
        }),
      ],
      failed: [],
      heading,
      unitName,
      goalTypeLabel,
      noUnitLabel: "Unspecified unit",
    })
    expect(text).toContain(
      "- Unspecified unit: V1 goal type 6 is not supported."
    )
  })
})
