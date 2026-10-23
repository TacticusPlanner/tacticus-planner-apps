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
        : options && Object.keys(options).length > 0
          ? `${key} ${Object.entries(options)
              .map(([k, v]) => `${k}=${v}`)
              .join(" ")}`
          : key,
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))

vi.mock("@/entities/goal", async () => {
  const { createContext } = await import("react")
  return {
    GoalTypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
    CreateGoalLauncherContext: createContext<unknown>(null),
  }
})

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
  getUpgrades: async () => [{ id: "upgHpC001", label: "Ceramite Plate" }],
  // Only the bounds the issue lines read: 10 regular and 10 premium missions, 18 battles a lane.
  getLegendaryEvents: async () => [
    {
      id: "astarLysander",
      regularMissions: Array.from({ length: 10 }),
      premiumMissions: Array.from({ length: 10 }),
      alpha: { battleIds: Array.from({ length: 18 }) },
      beta: { battleIds: Array.from({ length: 18 }) },
      gamma: { battleIds: Array.from({ length: 18 }) },
    },
  ],
}))

import { CreateGoalLauncherContext } from "@/entities/goal"

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
    runInputsImported: 0,
    annotationsImported: 0,
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
    profileId: "profile-1",
    playerName: null,
    powerLevel: 0,
    tacticusApiKeyMasked: null,
    tacticusUserIdMasked: null,
    suggestedDisplayName: null,
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

  it("explains a team skipped as too small with the units that remained (Melee, 2 remained)", async () => {
    render(
      <ImportResult
        result={result([
          event({
            teamsImported: 1,
            issues: [{ code: "team_too_small", teamName: "Melee", value: "2" }],
          }),
        ])}
      />
    )

    const bucket = screen.getByTestId("v1-import-le-bucket-imported")
    expect(await within(bucket).findByText("Lysander")).toBeInTheDocument()
    const issue = within(bucket).getByTestId("v1-import-le-issue")
    expect(issue).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.team_too_small count=2 min=3"
    )
    expect(issue).toHaveTextContent("Melee")
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

  it("lists an inputs-only event as imported with its runs and marks, not as imported without teams", () => {
    render(
      <ImportResult
        result={result([
          event({
            code: "inputs_imported",
            teamsImported: 0,
            runInputsImported: 2,
            annotationsImported: 5,
          }),
        ])}
      />
    )

    const bucket = screen.getByTestId("v1-import-le-bucket-imported")
    expect(bucket).toHaveTextContent(
      "goals.v1Import.legendaryEvents.reasons.inputs_imported"
    )
    expect(bucket).not.toHaveTextContent("imported_without_teams")
    const counts = within(bucket).getByTestId("v1-import-le-counts")
    expect(counts).toHaveTextContent(
      "goals.v1Import.legendaryEvents.runs count=2"
    )
    expect(counts).toHaveTextContent(
      "goals.v1Import.legendaryEvents.marks count=5"
    )
    expect(counts).not.toHaveTextContent("teams count")
  })

  it("names a clamped run input with the event's own bound, and a skipped mark's battle", async () => {
    render(
      <ImportResult
        result={result([
          event({
            annotationsImported: 3,
            issues: [
              {
                code: "run_input_clamped",
                teamName: null,
                value: "2:regularMissions:14",
              },
              { code: "unknown_battle", teamName: null, value: "beta:19" },
              {
                code: "existing_annotations_kept",
                teamName: null,
                value: "4",
              },
              { code: "existing_run_inputs_kept", teamName: null, value: "1" },
            ],
          }),
        ])}
      />
    )

    const issues = screen.getAllByTestId("v1-import-le-issue")
    await vi.waitFor(() =>
      expect(issues[0]).toHaveTextContent(
        "goals.v1Import.legendaryEvents.issues.run_input_clamped run=2 field=goals.v1Import.legendaryEvents.fields.regularMissions original=14 bound=10"
      )
    )
    expect(issues[1]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.unknown_battle lane=goals.v1Import.legendaryEvents.lanes.beta battle=20 count=18"
    )
    expect(issues[2]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.existing_annotations_kept count=4"
    )
    expect(issues[3]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.existing_run_inputs_kept run=1"
    )
    // The raw `run:field:original` value is not shown beside a described line.
    expect(issues[0]).not.toHaveTextContent("2:regularMissions:14")
    expect(
      within(screen.getByTestId("v1-import-le-counts")).getByText(
        /marks count=3/
      )
    ).toBeInTheDocument()
  })

  it("reads clamp and battle lines without a bound when the catalog lacks the event", () => {
    render(
      <ImportResult
        result={result([
          event({
            eventId: "unknownEvent",
            issues: [
              {
                code: "run_input_clamped",
                teamName: null,
                value: "1:premiumMissions:30",
              },
              { code: "unknown_battle", teamName: null, value: "alpha:40" },
              {
                code: "unknown_objective",
                teamName: null,
                value: "gamma:Old objective",
              },
            ],
          }),
        ])}
      />
    )

    const issues = screen.getAllByTestId("v1-import-le-issue")
    expect(issues[0]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.run_input_clamped_unbounded"
    )
    expect(issues[1]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.unknown_battle_unbounded"
    )
    expect(issues[2]).toHaveTextContent(
      "goals.v1Import.legendaryEvents.issues.unknown_objective_mark lane=goals.v1Import.legendaryEvents.lanes.gamma objective=Old objective"
    )
  })
})

describe("ImportResult — pre-farm goals", () => {
  const preFarmResult = (): ImportV1ProfileResult => ({
    ...result([]),
    goals: imported,
    outcomes: [
      {
        status: "Created",
        code: "goal_created",
        message: "Imported from V1.",
        entityType: "Character",
        entityId: "astarLysander",
        goalType: "Rank",
        goalId: "goal-1",
        sourceGoalId: "rank-1",
      },
      {
        status: "Skipped",
        code: "manual_step_required",
        message: "V2 has no pre-farm goal type.",
        entityType: null,
        entityId: null,
        goalType: null,
        goalId: null,
        sourceGoalId: "pf-1",
        upgradeId: "upgHpC001",
        linkedSourceGoalIds: ["rank-1"],
      },
    ],
  })

  it("asks for the manual step, naming the material and the unit it pre-farmed for", async () => {
    render(<ImportResult result={preFarmResult()} />)

    const step = await screen.findByTestId("v1-import-pre-farm-step")
    expect(await within(step).findByText("Ceramite Plate")).toBeInTheDocument()
    expect(
      await within(step).findByText(
        "goals.v1Import.preFarm.forUnits units=Lysander"
      )
    ).toBeInTheDocument()
    // Outside the app shell there is no creation sheet to open.
    expect(screen.queryByTestId("v1-import-pre-farm-create")).toBeNull()
  })

  it("opens goal creation with the unit, Upgrade type and material preselected", async () => {
    const launch = vi.fn()
    render(
      <CreateGoalLauncherContext.Provider value={launch}>
        <ImportResult result={preFarmResult()} />
      </CreateGoalLauncherContext.Provider>
    )

    fireEvent.click(await screen.findByTestId("v1-import-pre-farm-create"))

    expect(launch).toHaveBeenCalledWith({
      entityType: "Character",
      entityId: "astarLysander",
      goalType: "Upgrade",
      upgradeId: "upgHpC001",
    })
  })
})
