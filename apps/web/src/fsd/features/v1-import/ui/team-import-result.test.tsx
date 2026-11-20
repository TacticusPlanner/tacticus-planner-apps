import { describe, expect, it } from "vitest"

import type { V1TeamOutcome } from "@/entities/account"
import { render, screen, within } from "@/test/render"

import { groupTeamOutcomes } from "../model/team-outcome-buckets"
import { TeamImportResult } from "./team-import-result"

const outcome = (overrides: Partial<V1TeamOutcome>): V1TeamOutcome => ({
  name: "Horde core",
  status: "Imported",
  code: null,
  teamId: "t1",
  issues: [],
  ...overrides,
})

function renderResult(outcomes: V1TeamOutcome[]) {
  render(<TeamImportResult buckets={groupTeamOutcomes(outcomes)} />, {
    route: "/account/v1-import",
  })
}

const IMPORT_ISSUES = [
  ["unit_not_recognised", "notAUnit", "Unit not recognised: notAUnit"],
  ["campaign_not_recognised", "eldar", "Campaign not recognised: eldar"],
  ["duplicate_unit", "ultraCalgar", "Listed twice, kept once: ultraCalgar"],
  [
    "flex_dropped",
    null,
    "V1 had no core character before its flex section, so every character is core",
  ],
  ["name_shortened", null, "Name shortened to 40 characters"],
  ["notes_shortened", null, "Notes shortened to 300 characters"],
] as const

describe("TeamImportResult", () => {
  it("lists an imported team's issues with the value concerned and links to the Teams page", () => {
    renderResult([
      outcome({
        issues: [
          { code: "unit_not_recognised", value: "notAUnit" },
          { code: "tooManyCoreMows", value: null },
        ],
      }),
    ])
    const bucket = screen.getByTestId("v1-import-team-bucket-imported")
    expect(bucket).toHaveTextContent("Horde core")
    const issues = within(bucket).getByTestId("v1-import-team-issues")
    expect(
      within(issues)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual([
      "Unit not recognised: notAUnit",
      "A war or Tournament Arena team can have at most one core Machine of War.",
    ])
    expect(
      within(bucket).getByRole("link", { name: "Open Teams" })
    ).toHaveAttribute("href", "/my-game/teams")
  })

  it.each(IMPORT_ISSUES)("translates the %s issue", (code, value, text) => {
    renderResult([outcome({ issues: [{ code, value }] })])
    expect(screen.getByTestId("v1-import-team-issues")).toHaveTextContent(text)
    expect(screen.getByTestId("v1-import-team-issues")).not.toHaveTextContent(
      code
    )
  })

  it("puts every outcome in its bucket with a translated reason", () => {
    renderResult([
      outcome({ name: "Done" }),
      outcome({ name: "Renamed", status: "Skipped", code: "already_imported" }),
      outcome({ name: "horde", status: "Skipped", code: "duplicate_name" }),
      outcome({
        name: "Late 1",
        status: "Skipped",
        code: "team_limit_reached",
      }),
      outcome({
        name: "Late 2",
        status: "Skipped",
        code: "team_limit_reached",
      }),
      outcome({ name: "Empty", status: "Skipped", code: "no_units" }),
      outcome({ name: null, status: "Failed", code: "invalid_team" }),
    ])
    expect(
      screen.getByTestId("v1-import-team-bucket-needsNoImport")
    ).toHaveTextContent("Imported before, even if renamed since")
    expect(
      screen.getByTestId("v1-import-team-bucket-needsNoImport")
    ).toHaveTextContent("A team in the planner already has this name")
    const notImported = screen.getByTestId("v1-import-team-bucket-notImported")
    expect(notImported).toHaveTextContent("Not imported (3)")
    expect(notImported).toHaveTextContent(
      "You already have 20 teams, the most you can keep"
    )
    expect(notImported).toHaveTextContent(
      "None of its units are in the planner's game data"
    )
    const failed = screen.getByTestId("v1-import-team-bucket-failed")
    expect(failed).toHaveTextContent("Unnamed team")
    expect(failed).toHaveTextContent("This team couldn't be read")
    expect(failed).toHaveAttribute("open")
    for (const code of [
      "already_imported",
      "duplicate_name",
      "team_limit_reached",
      "no_units",
      "invalid_team",
    ]) {
      expect(
        screen.getByTestId("v1-import-teams-result")
      ).not.toHaveTextContent(code)
    }
  })
})
