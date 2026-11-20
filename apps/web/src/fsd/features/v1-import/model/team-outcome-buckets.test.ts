import { describe, expect, it } from "vitest"

import type { V1TeamOutcome } from "@/entities/account"

import {
  classifyTeamIssue,
  groupTeamOutcomes,
  reasonKeyForTeamOutcome,
  reasonKeyForTeamPart,
} from "./team-outcome-buckets"

const outcome = (
  status: V1TeamOutcome["status"],
  code: string | null,
  name = code ?? "imported"
): V1TeamOutcome => ({ name, status, code, teamId: null, issues: [] })

describe("team outcome buckets", () => {
  it("puts each outcome code in its bucket", () => {
    const buckets = groupTeamOutcomes([
      outcome("Imported", null),
      outcome("Skipped", "already_imported"),
      outcome("Skipped", "duplicate_name"),
      outcome("Skipped", "team_limit_reached"),
      outcome("Skipped", "no_units"),
      outcome("Failed", "invalid_team"),
      outcome("Skipped", "something_new"),
    ])
    const names = (key: keyof typeof buckets) =>
      buckets[key].map((entry) => entry.name)
    expect(names("imported")).toEqual(["imported"])
    expect(names("needsNoImport")).toEqual([
      "already_imported",
      "duplicate_name",
    ])
    expect(names("notImported")).toEqual([
      "team_limit_reached",
      "no_units",
      "something_new",
    ])
    expect(names("failed")).toEqual(["invalid_team"])
  })

  it("translates every outcome code, and an unknown one generically", () => {
    expect(reasonKeyForTeamOutcome(outcome("Imported", null))).toBe(
      "goals.v1Import.teams.reasons.imported"
    )
    for (const code of [
      "already_imported",
      "duplicate_name",
      "team_limit_reached",
      "no_units",
      "invalid_team",
    ]) {
      expect(reasonKeyForTeamOutcome(outcome("Skipped", code))).toBe(
        `goals.v1Import.teams.reasons.${code}`
      )
    }
    expect(reasonKeyForTeamOutcome(outcome("Skipped", "x"))).toBe(
      "goals.v1Import.reasons.generic"
    )
  })

  it("tells team rules from import issues", () => {
    expect(classifyTeamIssue({ code: "tooManyCoreMows", value: null })).toEqual(
      {
        kind: "rule",
        code: "tooManyCoreMows",
      }
    )
    expect(
      classifyTeamIssue({ code: "unit_not_recognised", value: "notAUnit" })
    ).toEqual({
      kind: "import",
      key: "goals.v1Import.teams.issues.unit_not_recognised",
      value: "notAUnit",
    })
    expect(classifyTeamIssue({ code: "brand_new", value: null })).toMatchObject(
      {
        key: "goals.v1Import.teams.issues.unknown",
      }
    )
  })

  it("translates the part's own codes", () => {
    for (const code of [
      "missing_teams",
      "invalid_teams",
      "teams_skipped",
      "team_import_failed",
    ]) {
      expect(reasonKeyForTeamPart(code)).toBe(
        `goals.v1Import.teams.partReasons.${code}`
      )
    }
    expect(reasonKeyForTeamPart("other")).toBeUndefined()
  })
})
