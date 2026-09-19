import { useEffect, useState } from "react"
import { fireEvent, render, screen, waitFor } from "@/test/render"
import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ImportPartResult, V1GoalOutcome } from "@/entities/account"

import type { V1ImportSelection } from "./v1-import-panel"

const importV1Profile = vi.fn()
const refetch = vi.fn()
const account = { homeAccountId: "account-1" }
const instance = { getActiveAccount: () => account }

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options
        ? `${key} ${Object.entries(options)
            .map(([k, v]) => `${k}=${v}`)
            .join(" ")}`
        : key,
  }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance, accounts: [account] }),
}))

vi.mock("@/entities/account", () => ({
  importV1Profile: (...args: unknown[]) => importV1Profile(...args),
  useCurrentUser: () => ({ refetch }),
  accountQueries: { all: () => ["current-user"] },
}))

vi.mock("@/entities/goal", () => ({
  GoalTypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
  goalQueries: { all: () => ["goals"] },
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  projectQueries: { all: () => ["projects"] },
}))

vi.mock("@/entities/player-data-override", () => ({
  onslaughtProgressQueries: {
    all: () => ["player-data-overrides"],
  },
  campaignEventProgressQueries: {
    all: () => ["player-data-overrides", "campaign-events"],
  },
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
}))

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () =>
    new Map([["hero1", { id: "hero1", name: "Hero One" }]]),
  getMowsMap: () => new Map([["mow1", { id: "mow1", name: "Stormbird" }]]),
}))

import { V1ImportPanel } from "./v1-import-panel"

const ALL_SELECTED: V1ImportSelection = {
  personalTacticusApiKey: true,
  tacticusUserId: true,
  guildApiToken: true,
  goals: true,
  onslaughtProgress: true,
  campaignEventProgress: true,
}

const imported: ImportPartResult = {
  status: "Imported",
  code: null,
  message: null,
}
const notSelected: ImportPartResult = {
  status: "Skipped",
  code: "not_selected",
  message: null,
}

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

function response(overrides: Record<string, unknown> = {}) {
  return {
    tacticusUserId: imported,
    personalTacticusApiKey: imported,
    guildApiToken: imported,
    onslaughtProgress: notSelected,
    campaignEventProgress: notSelected,
    goals: imported,
    outcomes: [],
    ...overrides,
  }
}

async function fillCredentials() {
  fireEvent.change(screen.getByTestId("v1-import-username"), {
    target: { value: "legacy-user" },
  })
  fireEvent.change(screen.getByTestId("v1-import-password"), {
    target: { value: "secret" },
  })
}

function renderPanel(defaultSelection: V1ImportSelection = ALL_SELECTED) {
  return render(<V1ImportPanel defaultSelection={defaultSelection} />)
}

describe("V1ImportPanel", () => {
  beforeEach(() => {
    importV1Profile.mockReset().mockResolvedValue(response())
    refetch.mockReset()
  })

  it("submits credentials with the given default parts and the prerequisites flag", async () => {
    renderPanel()

    await fillCredentials()
    fireEvent.change(screen.getByTestId("v1-import-username"), {
      target: { value: "  legacy-user  " },
    })
    fireEvent.click(screen.getByTestId("v1-import-guildApiToken"))
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    await waitFor(() => {
      expect(importV1Profile).toHaveBeenCalledWith(
        {
          username: "legacy-user",
          password: "secret",
          import: {
            personalTacticusApiKey: true,
            tacticusUserId: true,
            guildApiToken: false,
            goals: true,
            onslaughtProgress: true,
            campaignEventProgress: true,
            automaticPrerequisites: true,
          },
        },
        expect.anything()
      )
    })
  })

  it("starts with only the given default parts selected", () => {
    renderPanel({
      personalTacticusApiKey: false,
      tacticusUserId: false,
      guildApiToken: false,
      goals: false,
      onslaughtProgress: false,
      campaignEventProgress: false,
    })

    for (const key of [
      "personalTacticusApiKey",
      "tacticusUserId",
      "guildApiToken",
      "goals",
      "onslaughtProgress",
      "campaignEventProgress",
    ] as const) {
      expect(screen.getByTestId(`v1-import-${key}`)).toHaveAttribute(
        "data-state",
        "unchecked"
      )
    }
  })

  it("disables a locked part's checkbox so it cannot be unchecked", () => {
    render(
      <V1ImportPanel
        defaultSelection={ALL_SELECTED}
        lockedParts={["personalTacticusApiKey"]}
      />
    )

    expect(
      screen.getByTestId("v1-import-personalTacticusApiKey")
    ).toBeDisabled()
    expect(screen.getByTestId("v1-import-tacticusUserId")).toBeEnabled()
  })

  it("renders host actions in the same row as the submit control", () => {
    render(
      <V1ImportPanel
        actions={<button data-testid="host-action">Host action</button>}
        defaultSelection={ALL_SELECTED}
      />
    )

    const submit = screen.getByTestId("v1-import-submit")
    const action = screen.getByTestId("host-action")
    expect(submit.parentElement).toBe(action.parentElement)
  })

  it("issues no goal-creation request of its own (3.1)", async () => {
    renderPanel()
    await fillCredentials()
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    await screen.findByTestId("v1-import-result")
    // No mocked goal-creation mutation exists at all in this test file — a stray call would throw
    // "not a function" rather than silently pass, so the absence of any such mock is itself the
    // assertion that the panel no longer submits goals.
    expect(importV1Profile).toHaveBeenCalledTimes(1)
  })

  it("always sends automaticPrerequisites=true — there is no option to clear it", async () => {
    renderPanel()
    await fillCredentials()
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    await waitFor(() => {
      expect(importV1Profile).toHaveBeenCalledWith(
        expect.objectContaining({
          import: expect.objectContaining({ automaticPrerequisites: true }),
        }),
        expect.anything()
      )
    })
    expect(
      screen.queryByTestId("v1-import-automaticPrerequisites")
    ).not.toBeInTheDocument()
  })

  it("refreshes goal and project queries unconditionally after an import (3.3)", async () => {
    const invalidateQueries = vi.spyOn(
      QueryClient.prototype,
      "invalidateQueries"
    )
    renderPanel()
    await fillCredentials()
    fireEvent.click(screen.getByTestId("v1-import-goals"))
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    await screen.findByTestId("v1-import-result")
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["goals"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["projects"] })
    invalidateQueries.mockRestore()
  })

  it("calls onSuccess with the result once a submission succeeds", async () => {
    const onSuccess = vi.fn()
    const result = response({ outcomes: [outcome({})] })
    importV1Profile.mockResolvedValue(result)
    render(
      <V1ImportPanel defaultSelection={ALL_SELECTED} onSuccess={onSuccess} />
    )
    await fillCredentials()
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(result))
  })

  describe("refreshCurrentUserOnSuccess", () => {
    it("refetches current-user by default after a successful submission", async () => {
      const invalidateQueries = vi.spyOn(
        QueryClient.prototype,
        "invalidateQueries"
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      await screen.findByTestId("v1-import-result")
      expect(refetch).toHaveBeenCalled()
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["current-user"],
      })
      invalidateQueries.mockRestore()
    })

    it("does not refetch current-user when set to false, so a setup-flow guard watching it cannot fire early", async () => {
      const invalidateQueries = vi.spyOn(
        QueryClient.prototype,
        "invalidateQueries"
      )
      render(
        <V1ImportPanel
          defaultSelection={ALL_SELECTED}
          refreshCurrentUserOnSuccess={false}
        />
      )
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      await screen.findByTestId("v1-import-result")
      expect(refetch).not.toHaveBeenCalled()
      expect(invalidateQueries).not.toHaveBeenCalledWith({
        queryKey: ["current-user"],
      })
      invalidateQueries.mockRestore()
    })
  })

  describe("bucketed report", () => {
    it("reports the imported bucket with distinct goal and unit counts (4.2)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          outcomes: [
            outcome({ entityId: "unit-1", goalType: "Unlock" }),
            outcome({ entityId: "unit-1", goalType: "Rank" }),
            outcome({ entityId: "unit-2", goalType: "Rank" }),
            outcome({ entityId: "unit-3", goalType: "Rank" }),
            outcome({ entityId: "unit-4", goalType: "Rank" }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      const bucket = await screen.findByTestId("v1-import-bucket-imported")
      expect(bucket).toHaveTextContent("goals=5")
      expect(bucket).toHaveTextContent("units=4")
    })

    it("collapses the needed-no-import bucket, listing its members only once expanded (4.3)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          outcomes: [
            outcome({
              code: "target_already_reached",
              status: "Skipped",
              entityId: "hero1",
            }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      const trigger = await screen.findByTestId(
        "v1-import-bucket-needsNoImport"
      )
      expect(
        screen.queryByText("goals.v1Import.reasons.targetAlreadyReached")
      ).not.toBeInTheDocument()
      fireEvent.click(trigger)
      expect(
        await screen.findByText("goals.v1Import.reasons.targetAlreadyReached")
      ).toBeInTheDocument()
    })

    it("shows the not-imported and failed buckets expanded when non-empty (4.4)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          outcomes: [
            outcome({
              code: "unknown_unit",
              status: "Failed",
              entityId: "V1RawId",
              goalType: null,
              message: "The goal's character is not in the V2 Game Catalog.",
            }),
            outcome({
              code: "target_rejected",
              status: "Failed",
              entityId: "hero1",
              message: "The target rank exceeds the unit's cap.",
            }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      expect(
        await screen.findByTestId("v1-import-bucket-notImported")
      ).toHaveTextContent("V1RawId")
      expect(screen.getByTestId("v1-import-bucket-failed")).toHaveTextContent(
        "hero1"
      )
    })

    it("shows only the imported bucket when every goal was created (4.5)", async () => {
      importV1Profile.mockResolvedValue(response({ outcomes: [outcome({})] }))
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      await screen.findByTestId("v1-import-bucket-imported")
      expect(
        screen.queryByTestId("v1-import-bucket-needsNoImport")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("v1-import-bucket-notImported")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("v1-import-bucket-failed")
      ).not.toBeInTheDocument()
    })

    it("shows the raw V1 unit identifier for an unknown-unit outcome (4.6)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          outcomes: [
            outcome({
              code: "unknown_unit",
              status: "Failed",
              entityId: "totally-unknown-v1-id",
              goalType: null,
            }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      expect(
        await screen.findByTestId("v1-import-bucket-notImported")
      ).toHaveTextContent("totally-unknown-v1-id")
    })

    it("marks an automatically added prerequisite and names the goal it was added for (4.7)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          outcomes: [
            outcome({
              code: "prerequisite_added",
              entityId: "hero1",
              goalType: "Unlock",
            }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      const bucket = await screen.findByTestId("v1-import-bucket-imported")
      expect(bucket).toHaveTextContent("goals.v1Import.report.autoAdded")
      expect(bucket).toHaveTextContent(
        "goals.v1Import.reasons.prerequisiteAdded"
      )
    })
  })

  describe("part-level reporting", () => {
    it("shows a qualified success alongside its success status (5.1)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          campaignEventProgress: {
            status: "Imported",
            code: "challenge_progress_not_imported",
            message:
              "Regular event progress was imported. V1 challenge counts were not imported because exact battles are unknown.",
          },
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      expect(await screen.findByTestId("v1-import-result")).toHaveTextContent(
        "V1 challenge counts were not imported"
      )
    })

    it("explains a skipped part's reason (5.1)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          guildApiToken: {
            status: "Skipped",
            code: "missing_guild_api_token",
            message: "The V1 profile has no guild API token.",
          },
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      expect(await screen.findByTestId("v1-import-result")).toHaveTextContent(
        "The V1 profile has no guild API token."
      )
    })

    it("omits a row for a part the user did not select (7.1 selection / spec)", async () => {
      // The panel decides per the server's own "not_selected" code (ImportPartResult.NotSelected),
      // not by re-checking its own client-side selection state — so the fixture must echo that code,
      // the same way the real API does for a cleared part.
      importV1Profile.mockResolvedValue(
        response({ guildApiToken: notSelected })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-guildApiToken"))
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      const result = await screen.findByTestId("v1-import-result")
      expect(result).not.toHaveTextContent("goals.v1Import.parts.guildKey")
    })

    it("does not report the goals part as success when nothing was created (5.3)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          outcomes: [
            outcome({
              code: "unknown_unit",
              status: "Failed",
              goalType: null,
            }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      const result = await screen.findByTestId("v1-import-result")
      expect(result).toHaveTextContent("goals.v1Import.status.failed")
    })

    it("presents the sync-required refusal as a blocking explanation naming the remedy (5.4)", async () => {
      importV1Profile.mockResolvedValue(
        response({
          goals: {
            status: "Failed",
            code: "player_data_required",
            message: "Player data must be synced before goals can be imported.",
          },
          outcomes: [
            outcome({
              code: "player_data_required",
              status: "Failed",
              entityType: null,
              entityId: null,
              goalType: null,
              sourceGoalId: null,
            }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      expect(
        await screen.findByTestId("v1-import-sync-required")
      ).toHaveTextContent("goals.v1Import.report.syncRequired")
      expect(
        screen.queryByTestId("v1-import-bucket-failed")
      ).not.toBeInTheDocument()
    })
  })

  it("renders no machine-readable outcome code across all four buckets (9.4)", async () => {
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
      "target_rejected",
      "project_slot_conflict",
    ]
    importV1Profile.mockResolvedValue(
      response({ outcomes: codes.map((code) => outcome({ code })) })
    )
    renderPanel()
    await fillCredentials()
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    const result = await screen.findByTestId("v1-import-result")
    // The needed-no-import bucket is collapsed by default — expand it too before checking, since a
    // collapsed accordion's content is unmounted, not merely hidden.
    fireEvent.click(screen.getByTestId("v1-import-bucket-needsNoImport"))
    for (const code of codes) {
      expect(result).not.toHaveTextContent(code)
    }
  })

  describe("copy details", () => {
    it("copies the not-imported and failed outcomes to the clipboard (6.1)", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } })
      importV1Profile.mockResolvedValue(
        response({
          outcomes: [
            outcome({
              code: "unknown_unit",
              status: "Failed",
              entityId: "raw-v1-id",
              goalType: null,
            }),
          ],
        })
      )
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      fireEvent.click(await screen.findByTestId("v1-import-copy"))

      expect(writeText).toHaveBeenCalledTimes(1)
      const text = writeText.mock.calls[0][0] as string
      expect(text).toContain("raw-v1-id")
      expect(text).toContain("goals.v1Import.reasons.unknownUnit")
      vi.unstubAllGlobals()
    })

    it("offers no copy action when nothing needs attention (6.3)", async () => {
      importV1Profile.mockResolvedValue(response({ outcomes: [outcome({})] }))
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      await screen.findByTestId("v1-import-result")
      expect(screen.queryByTestId("v1-import-copy")).not.toBeInTheDocument()
    })
  })

  it("shows an import failure without refreshing account state", async () => {
    importV1Profile.mockRejectedValue(new Error("network"))
    renderPanel()
    await fillCredentials()
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "goals.v1Import.error"
    )
    expect(refetch).not.toHaveBeenCalled()

    expect(
      screen.queryByTestId("v1-import-submit")?.querySelector("svg")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("v1-import-username")).toHaveValue("legacy-user")
    expect(screen.getByTestId("v1-import-panel")).toBeInTheDocument()
    expect(screen.getByTestId("v1-import-submit")).toBeEnabled()
  })

  describe("resubmitting after a completed run", () => {
    async function completeOneRun() {
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))
      await screen.findByTestId("v1-import-result")
    }

    it("disables the submit control while a submission is in flight", async () => {
      renderPanel()
      await fillCredentials()
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()
    })

    it("disables the submit control immediately after a completed run", async () => {
      await completeOneRun()

      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()
      expect(screen.getByTestId("v1-import-password")).toHaveValue("")
    })

    it("states that the run finished and the password must be re-entered", async () => {
      await completeOneRun()

      expect(screen.getByTestId("v1-import-rerun-hint")).toHaveTextContent(
        "goals.v1Import.rerunRequiresPassword"
      )
    })

    it("re-runs a second import once the password is re-entered, replacing the previous result", async () => {
      await completeOneRun()
      expect(importV1Profile).toHaveBeenCalledTimes(1)

      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "secret-again" },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

      importV1Profile
        .mockReset()
        .mockResolvedValue(response({ personalTacticusApiKey: notSelected }))
      fireEvent.click(screen.getByTestId("v1-import-submit"))

      await waitFor(() => {
        expect(importV1Profile).toHaveBeenCalledTimes(1)
      })
      expect(importV1Profile).toHaveBeenCalledWith(
        expect.objectContaining({ password: "secret-again" }),
        expect.anything()
      )
      await screen.findByTestId("v1-import-result")
    })

    it("keeps the submit control unavailable for an empty or whitespace-only username", () => {
      renderPanel()
      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "secret" },
      })

      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()

      fireEvent.change(screen.getByTestId("v1-import-username"), {
        target: { value: "   " },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()

      fireEvent.change(screen.getByTestId("v1-import-username"), {
        target: { value: "legacy-user" },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()
    })

    it("keeps the submit control unavailable without a selected part or a password", async () => {
      renderPanel()
      await fillCredentials()
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

      for (const key of [
        "personalTacticusApiKey",
        "tacticusUserId",
        "guildApiToken",
        "goals",
        "onslaughtProgress",
        "campaignEventProgress",
      ] as const) {
        fireEvent.click(screen.getByTestId(`v1-import-${key}`))
      }
      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()

      fireEvent.click(screen.getByTestId("v1-import-goals"))
      expect(screen.getByTestId("v1-import-submit")).toBeEnabled()

      fireEvent.change(screen.getByTestId("v1-import-password"), {
        target: { value: "" },
      })
      expect(screen.getByTestId("v1-import-submit")).toBeDisabled()
    })
  })
})
