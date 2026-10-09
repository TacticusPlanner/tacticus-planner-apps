import { useEffect, useState } from "react"
import { describe, expect, it, vi } from "vitest"

import type {
  ImportPartResult,
  ImportV1ProfileResult,
  V1LegendaryEventOutcome,
} from "@/entities/account"
import { fireEvent, render, screen, within } from "@/test/render"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string"
        ? options.defaultValue
        : options
          ? `${key} ${Object.entries(options)
              .map(([k, v]) => `${k}=${v}`)
              .join(" ")}`
          : key,
  }),
}))

vi.mock("@/entities/goal", () => ({
  GoalTypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}))

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) => {
    const [value, setValue] = useState<unknown>()
    useEffect(() => {
      void Promise.resolve(querier()).then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return value
  },
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () =>
    new Map([["astarLysander", { id: "astarLysander", name: "Lysander" }]]),
  getMowsMap: () => new Map(),
}))

import { ImportResult } from "./import-v1-result"

const notSelected: ImportPartResult = {
  status: "Skipped",
  code: "not_selected",
  message: null,
}
const imported: ImportPartResult = {
  status: "Imported",
  code: null,
  message: null,
}

function event(
  overrides: Partial<V1LegendaryEventOutcome>
): V1LegendaryEventOutcome {
  return {
    eventId: "astarLysander",
    v1EventId: 15,
    status: "Imported",
    code: "imported",
    message: "Imported.",
    teamsImported: 2,
    issues: [],
    ...overrides,
  }
}

function result(
  legendaryEventOutcomes: V1LegendaryEventOutcome[],
  part: ImportPartResult = imported
): ImportV1ProfileResult {
  return {
    tacticusUserId: notSelected,
    personalTacticusApiKey: notSelected,
    guildApiToken: notSelected,
    onslaughtProgress: notSelected,
    campaignEventProgress: notSelected,
    goals: notSelected,
    outcomes: [],
    legendaryEventPlans: part,
    legendaryEventOutcomes,
  }
}

describe("ImportResult — Legendary Event teams", () => {
  it("lists an imported event with its team count and an issue line naming the team and V1 value", async () => {
    render(
      <ImportResult
        result={result([
          event({
            issues: [
              { code: "unknown_unit", teamName: "Melee", value: "unknownX" },
            ],
          }),
        ])}
      />
    )

    const bucket = screen.getByTestId("v1-import-le-bucket-imported")
    expect(await within(bucket).findByText("Lysander")).toBeInTheDocument()
    expect(bucket).toHaveTextContent(
      "goals.v1Import.legendaryEvents.teams count=2"
    )
    const issue = within(bucket).getByTestId("v1-import-le-issue")
    expect(issue).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.unknown_unit"
    )
    expect(issue).toHaveTextContent("Melee")
    expect(issue).toHaveTextContent("unknownX")
    expect(screen.getByTestId("v1-import-result")).toHaveTextContent(
      "goals.v1Import.parts.legendaryEventPlans"
    )
  })

  it("reads an event imported without any team as such, with no team count", () => {
    render(
      <ImportResult
        result={result([
          event({
            teamsImported: 0,
            issues: [{ code: "empty_team", teamName: "Melee", value: null }],
          }),
        ])}
      />
    )

    const bucket = screen.getByTestId("v1-import-le-bucket-imported")
    expect(bucket).toHaveTextContent(
      "goals.v1Import.legendaryEvents.reasons.imported_without_teams"
    )
    expect(bucket).not.toHaveTextContent(
      /goals\.v1Import\.legendaryEvents\.reasons\.imported($|\s)/
    )
    expect(bucket).not.toHaveTextContent("teams count")
  })

  it("lists an event the catalog does not carry by its V1 number in the not-imported bucket", () => {
    render(
      <ImportResult
        result={result([
          event({
            eventId: null,
            v1EventId: 10,
            status: "Skipped",
            code: "event_not_in_catalog",
            teamsImported: 0,
          }),
        ])}
      />
    )

    const bucket = screen.getByTestId("v1-import-le-bucket-notImported")
    expect(bucket).toHaveTextContent(
      "goals.v1Import.legendaryEvents.v1Event id=10"
    )
    expect(bucket).toHaveTextContent(
      "goals.v1Import.legendaryEvents.reasons.event_not_in_catalog"
    )
    expect(bucket).not.toHaveTextContent("teams count")
  })

  it("omits empty buckets and renders no raw code", () => {
    render(
      <ImportResult
        result={result([
          event({ status: "Skipped", code: "plan_already_exists" }),
          event({
            v1EventId: 16,
            status: "Failed",
            code: "legendary_event_import_failed",
          }),
        ])}
      />
    )

    expect(
      screen.getByTestId("v1-import-le-bucket-needsNoImport")
    ).toBeInTheDocument()
    expect(screen.getByTestId("v1-import-le-bucket-failed")).toBeInTheDocument()
    expect(screen.queryByTestId("v1-import-le-bucket-imported")).toBeNull()
    expect(screen.queryByTestId("v1-import-le-bucket-notImported")).toBeNull()
    const report = screen.getByTestId("v1-import-legendary-events")
    expect(report).not.toHaveTextContent(/(^|\s)plan_already_exists/)
  })

  it("translates the part's own skip reason instead of the server message", () => {
    render(
      <ImportResult
        result={result([], {
          status: "Skipped",
          code: "missing_legendary_event_plans",
          message: "The V1 profile has no Legendary Event teams.",
        })}
      />
    )

    const report = screen.getByTestId("v1-import-result")
    expect(report).toHaveTextContent(
      "goals.v1Import.legendaryEvents.reasons.missing_legendary_event_plans"
    )
    expect(report).not.toHaveTextContent("The V1 profile has no")
    expect(screen.queryByTestId("v1-import-legendary-events")).toBeNull()
  })

  it("translates the legendary_events_skipped part code", () => {
    render(
      <ImportResult
        result={result(
          [
            event({
              status: "Skipped",
              code: "plan_already_exists",
              teamsImported: 0,
            }),
          ],
          {
            status: "Skipped",
            code: "legendary_events_skipped",
            message: "No Legendary Event plan was imported.",
          }
        )}
      />
    )

    const report = screen.getByTestId("v1-import-result")
    expect(report).toHaveTextContent(
      "goals.v1Import.legendaryEvents.reasons.legendary_events_skipped"
    )
    expect(report).not.toHaveTextContent("No Legendary Event plan was")
  })

  it("translates the plan-level notes issues, which name no team", () => {
    render(
      <ImportResult
        result={result([
          event({
            issues: [
              { code: "existing_notes_kept", teamName: null, value: null },
              { code: "notes_truncated", teamName: null, value: "2400" },
            ],
          }),
        ])}
      />
    )

    const issues = screen.getAllByTestId("v1-import-le-issue")
    expect(issues[0]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.existing_notes_kept"
    )
    expect(issues[1]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.notes_truncated"
    )
    expect(issues[1]).toHaveTextContent("2400")
    expect(
      screen.getByTestId("v1-import-legendary-events")
    ).not.toHaveTextContent("goals.v1Import.reasons.generic")
  })

  it("copies event problems and issues with the goal diagnostics", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } })
    render(
      <ImportResult
        result={result([
          event({
            eventId: null,
            v1EventId: 10,
            status: "Skipped",
            code: "event_not_in_catalog",
          }),
          event({
            issues: [{ code: "empty_team", teamName: "Old", value: null }],
          }),
        ])}
      />
    )

    fireEvent.click(await screen.findByTestId("v1-import-copy"))
    const text = writeText.mock.calls[0][0] as string
    expect(text).toContain("goals.v1Import.legendaryEvents.title")
    expect(text).toContain(
      "goals.v1Import.legendaryEvents.v1Event id=10: goals.v1Import.legendaryEvents.reasons.event_not_in_catalog"
    )
    expect(text).toContain(
      "goals.v1Import.legendaryEvents.issues.empty_team (Old)"
    )
    vi.unstubAllGlobals()
  })
})
