import { describe, expect, it } from "vitest"
import type { V1GoalOutcome } from "@/entities/account"

import {
  bucketForCode,
  buildDiagnosticText,
  effectiveGoalsStatus,
  groupOutcomes,
  importedCounts,
  isAutomaticallyAdded,
  materialSteps,
  reasonKeyForCode,
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
    upgradeId: null,
    linkedSourceGoalIds: null,
    upgradeQuantity: null,
    ...overrides,
  }
}

describe("bucketForCode", () => {
  it("maps every documented code to its bucket (4.1)", () => {
    expect(bucketForCode("goal_created")).toBe("imported")
    expect(bucketForCode("prerequisite_added")).toBe("imported")
    expect(bucketForCode("upgrade_goal_assigned")).toBe("imported")
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
    expect(bucketForCode("unknown_upgrade")).toBe("notImported")
    expect(bucketForCode("no_upgrade_owner")).toBe("notImported")
    expect(bucketForCode("manual_step_required")).toBe("needsAction")
    expect(bucketForCode("player_data_required")).toBe("failed")
    expect(bucketForCode("target_rejected")).toBe("failed")
    expect(bucketForCode("project_slot_conflict")).toBe("failed")
    expect(bucketForCode("prerequisite_rejected")).toBe("failed")
  })

  it("falls back an unrecognised code to notImported rather than hiding it as benign", () => {
    expect(bucketForCode("some_future_code")).toBe("notImported")
  })
})

describe("reasonKeyForCode", () => {
  it("maps every documented code to a translation key", () => {
    expect(reasonKeyForCode("goal_created")).toBe(
      "goals.v1Import.reasons.goalCreated"
    )
    expect(reasonKeyForCode("prerequisite_added")).toBe(
      "goals.v1Import.reasons.prerequisiteAdded"
    )
    expect(reasonKeyForCode("upgrade_goal_assigned")).toBe(
      "goals.v1Import.reasons.upgradeGoalAssigned"
    )
    expect(reasonKeyForCode("target_already_reached")).toBe(
      "goals.v1Import.reasons.targetAlreadyReached"
    )
    expect(reasonKeyForCode("goal_already_exists")).toBe(
      "goals.v1Import.reasons.goalAlreadyExists"
    )
    expect(reasonKeyForCode("duplicate_goal_merged")).toBe(
      "goals.v1Import.reasons.duplicateGoalMerged"
    )
    expect(reasonKeyForCode("prerequisite_target_insufficient")).toBe(
      "goals.v1Import.reasons.prerequisiteTargetInsufficient"
    )
    expect(reasonKeyForCode("unknown_unit")).toBe(
      "goals.v1Import.reasons.unknownUnit"
    )
    expect(reasonKeyForCode("unsupported_goal_type")).toBe(
      "goals.v1Import.reasons.unsupportedGoalType"
    )
    expect(reasonKeyForCode("invalid_progression")).toBe(
      "goals.v1Import.reasons.invalidProgression"
    )
    expect(reasonKeyForCode("missing_target")).toBe(
      "goals.v1Import.reasons.missingTarget"
    )
    expect(reasonKeyForCode("player_data_required")).toBe(
      "goals.v1Import.reasons.playerDataRequired"
    )
    expect(reasonKeyForCode("target_rejected")).toBe(
      "goals.v1Import.reasons.targetRejected"
    )
    expect(reasonKeyForCode("project_slot_conflict")).toBe(
      "goals.v1Import.reasons.projectSlotConflict"
    )
    expect(reasonKeyForCode("prerequisite_rejected")).toBe(
      "goals.v1Import.reasons.prerequisiteRejected"
    )
  })

  it("falls back an unrecognised code to a generic translated reason", () => {
    expect(reasonKeyForCode("some_future_code")).toBe(
      "goals.v1Import.reasons.generic"
    )
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
      "prerequisite_rejected",
    ]
    const grouped = groupOutcomes(codes.map((code) => outcome({ code })))

    expect(grouped.imported).toHaveLength(2)
    expect(grouped.needsNoImport).toHaveLength(3)
    expect(grouped.notImported).toHaveLength(5)
    expect(grouped.failed).toHaveLength(4)
  })

  it("is empty for an empty outcome list", () => {
    const grouped = groupOutcomes([])
    expect(grouped).toEqual({
      imported: [],
      needsNoImport: [],
      needsAction: [],
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
  const heading = (bucket: "notImported" | "needsAction" | "failed") =>
    ({
      notImported: "Not imported",
      needsAction: "Needs a manual step",
      failed: "Failed",
    })[bucket]
  const upgradeName = (upgradeId: string) => `upgrade:${upgradeId}`
  const unitName = (_entityType: string | null, entityId: string | null) =>
    entityId ?? ""
  const goalTypeLabel = (goalType: string | null) => goalType
  const reasonFor = (code: string) => `reason:${code}`

  it("lists each not-imported/failed outcome's unit, goal type and reason (6.1)", () => {
    const text = buildDiagnosticText({
      notImported: [
        outcome({ code: "unknown_unit", entityId: "SomeV1Id", goalType: null }),
      ],
      needsAction: [],
      failed: [
        outcome({
          code: "target_rejected",
          entityId: "hero1",
          goalType: "Rank",
        }),
      ],
      heading,
      unitName,
      upgradeName,
      goalTypeLabel,
      noUnitLabel: "Unspecified unit",
      reasonFor,
    })

    expect(text).toContain("Not imported:")
    expect(text).toContain("- SomeV1Id: reason:unknown_unit")
    expect(text).toContain("Failed:")
    expect(text).toContain("- hero1 (Rank): reason:target_rejected")
  })

  it("names the material of a unit-less material or pre-farm goal", () => {
    const text = buildDiagnosticText({
      notImported: [
        outcome({
          code: "no_upgrade_owner",
          entityType: null,
          entityId: null,
          goalType: null,
          upgradeId: "upgHpC001",
        }),
      ],
      failed: [],
      needsAction: [
        outcome({
          status: "Skipped",
          code: "manual_step_required",
          entityId: "hero1",
          goalType: null,
          upgradeId: "upgDmgC001",
        }),
      ],
      heading,
      unitName,
      upgradeName,
      goalTypeLabel,
      noUnitLabel: "Unspecified unit",
      reasonFor,
    })

    expect(text).toContain("- upgrade:upgHpC001: reason:no_upgrade_owner")
    expect(text).toContain("Needs a manual step:")
    expect(text).toContain(
      "- hero1 · upgrade:upgDmgC001: reason:manual_step_required"
    )
  })

  it("omits an empty bucket's section entirely", () => {
    const text = buildDiagnosticText({
      notImported: [],
      needsAction: [],
      failed: [outcome({ code: "target_rejected" })],
      heading,
      unitName,
      upgradeName,
      goalTypeLabel,
      noUnitLabel: "Unspecified unit",
      reasonFor,
    })
    expect(text).not.toContain("Not imported:")
    expect(text).toContain("Failed:")
  })

  it("is empty when both buckets are empty (6.3)", () => {
    expect(
      buildDiagnosticText({
        notImported: [],
        needsAction: [],
        failed: [],
        heading,
        unitName,
        upgradeName,
        goalTypeLabel,
        noUnitLabel: "Unspecified unit",
        reasonFor,
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
        }),
      ],
      needsAction: [],
      failed: [],
      heading,
      unitName,
      upgradeName,
      goalTypeLabel,
      noUnitLabel: "Unspecified unit",
      reasonFor,
    })
    expect(text).toContain("- Unspecified unit: reason:unsupported_goal_type")
  })
})

describe("materialSteps", () => {
  it("resolves each pre-farm goal's linked V1 goals to their distinct units", () => {
    const steps = materialSteps([
      outcome({ sourceGoalId: "rank-a", entityId: "heroA" }),
      outcome({
        sourceGoalId: "ability-a",
        entityId: "heroA",
        goalType: "Ability",
      }),
      outcome({
        sourceGoalId: "mow-b",
        entityType: "Mow",
        entityId: "mowB",
        goalType: "Ability",
      }),
      outcome({
        status: "Failed",
        code: "unknown_unit",
        sourceGoalId: "gone",
        entityType: "Character",
        entityId: null,
        goalType: null,
      }),
      outcome({
        status: "Skipped",
        code: "manual_step_required",
        sourceGoalId: "pf-1",
        entityId: "heroSuggested",
        goalType: "Upgrade",
        goalId: null,
        upgradeId: "upgHpC001",
        linkedSourceGoalIds: ["rank-a", "ability-a", "mow-b", "gone"],
      }),
    ])

    const linked = [
      { entityType: "Character", entityId: "heroA" },
      { entityType: "Mow", entityId: "mowB" },
    ]
    expect(steps).toEqual([
      {
        sourceGoalId: "pf-1",
        upgradeId: "upgHpC001",
        quantity: null,
        linkedUnits: linked,
        units: linked,
      },
    ])
  })

  it("offers the suggested unit, with its quantity, for an upgrade-material goal", () => {
    const steps = materialSteps([
      outcome({
        status: "Skipped",
        code: "manual_step_required",
        sourceGoalId: "m-1",
        entityId: "heroSuggested",
        goalType: "Upgrade",
        goalId: null,
        upgradeId: "upgHpC001",
        upgradeQuantity: 10,
      }),
    ])

    expect(steps).toEqual([
      {
        sourceGoalId: "m-1",
        upgradeId: "upgHpC001",
        quantity: 10,
        linkedUnits: [],
        units: [{ entityType: "Character", entityId: "heroSuggested" }],
      },
    ])
  })

  it("groups the manual step in its own bucket", () => {
    const buckets = groupOutcomes([
      outcome({ code: "manual_step_required", status: "Skipped" }),
    ])

    expect(buckets.needsAction).toHaveLength(1)
    expect(buckets.notImported).toHaveLength(0)
  })
})
