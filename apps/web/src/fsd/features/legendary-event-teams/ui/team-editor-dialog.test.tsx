import { useEffect, useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildLanePointsModel,
  buildSyncedLaneProgress,
  type ClearEstimate,
  type LaneProgressView,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import type { TeamDraft } from "../model/plan-patches"
import type {
  DepthEstimateContext,
  PlanMutationOutcome,
} from "../model/use-legendary-event-plan"
import { TeamEditorDialog } from "./team-editor-dialog"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return value
  },
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: async () =>
    new Map(Object.values(teamUnits).map((unit) => [unit.id, unit])),
  getMowsMap: async () => new Map(),
}))

let i18n: I18n

const saved: LegendaryEventTeam = {
  id: "team-1",
  laneId: "alpha",
  name: "Melee",
  sortOrder: 0,
  memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
  reserveUnitId: null,
  // Min 5 Hits (1) derives but is not stored.
  objectiveIndexes: [0],
  runDepths: [],
}

function renderEditor({
  team,
  onSubmit = vi.fn(async (): Promise<PlanMutationOutcome> => "saved"),
  onOpenChange = vi.fn(),
  estimateTeam,
  initialMemberUnitIds,
  initialObjectives,
  progress,
}: {
  initialMemberUnitIds?: readonly string[]
  initialObjectives?: readonly number[]
  progress?: LaneProgressView
  team?: LegendaryEventTeam
  onSubmit?: (
    draft: TeamDraft,
    shown: DepthEstimateContext
  ) => Promise<PlanMutationOutcome>
  onOpenChange?: (open: boolean) => void
  estimateTeam?: (memberUnitIds: readonly string[]) => ClearEstimate | null
} = {}) {
  const editor = (key: number) => (
    <TeamEditorDialog
      estimateTeam={estimateTeam}
      key={key}
      initialMemberUnitIds={initialMemberUnitIds}
      initialObjectives={initialObjectives}
      lane={teamLane}
      laneId="alpha"
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      onlyUnlockedDefault={false}
      open
      progress={progress}
      roster={undefined}
      run={2}
      team={team}
      teamNumber={3}
      units={teamUnitList}
    />
  )
  const view = render(editor(0), { wrapper: i18nWrapper(i18n) })
  /** Closes and reopens the editor (a fresh mount, as the page host does). */
  const reopen = () => view.rerender(editor(1))
  return { onSubmit, onOpenChange, reopen }
}

const tap = (unitId: string) => {
  const tile = screen
    .getAllByTestId("team-picker-tile")
    .find((element) => element.dataset.unit === unitId)!
  fireEvent.click(within(tile).getByTestId("team-picker-toggle"))
}
/** The covered objectives' labels, as the footer lists them. */
const chips = () =>
  screen
    .queryAllByTestId("team-editor-summary-objective-label")
    .map((label) => label.textContent)
const nameInput = () => screen.getByTestId("team-editor-name")

describe("TeamEditorDialog", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => setViewportWidth(1280))

  it("derives coverage from the members: A ticks all three, adding B drops No Resilient", () => {
    renderEditor()
    expect(chips()).toEqual([])
    expect(screen.queryByTestId("team-editor-coverage")).not.toBeInTheDocument()

    tap(teamUnits.a.id)
    expect(chips()).toEqual(["Melee", "Min 5 hits", "No Resilient"])

    tap(teamUnits.b.id)
    expect(chips()).toEqual(["Melee", "Min 5 hits"])
  })

  it("defaults the name to the covered objectives, else Team N", () => {
    renderEditor()
    expect(nameInput()).toHaveValue("Team 3")
    tap(teamUnits.a.id)
    tap(teamUnits.b.id)
    expect(nameInput()).toHaveValue("Melee · Min 5 hits")
  })

  it("opens a suggestion as a new team: members in order, coverage ticked, default name", async () => {
    const { onSubmit } = renderEditor({
      initialMemberUnitIds: [teamUnits.b.id, teamUnits.a.id, teamUnits.c.id],
    })
    expect(nameInput()).toHaveValue("Melee · Min 5 hits")
    expect(chips()).toEqual(["Melee", "Min 5 hits"])
    expect(onSubmit).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.click(screen.getByTestId("team-editor-save"))
    })
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        memberUnitIds: [teamUnits.b.id, teamUnits.a.id, teamUnits.c.id],
        objectiveIndexes: [0, 1],
        name: "Melee · Min 5 hits",
      }),
      { estimate: null, fromEstimate: false }
    )
  })

  it("saves nothing when a suggestion's editor is cancelled", () => {
    const { onSubmit, onOpenChange } = renderEditor({
      initialMemberUnitIds: [teamUnits.a.id],
    })
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("reopens a saved team covering what its members derive, and saves that", async () => {
    const { onSubmit } = renderEditor({ team: saved })
    expect(nameInput()).toHaveValue("Melee")
    expect(chips()).toEqual(["Melee", "Min 5 hits"])
    await act(async () => {
      fireEvent.click(screen.getByTestId("team-editor-save"))
    })
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Melee", objectiveIndexes: [0, 1] }),
      expect.anything()
    )
  })

  it("covers an objective that newly derives when a member leaves", () => {
    renderEditor({ team: saved })
    tap(teamUnits.b.id)
    expect(chips()).toEqual(["Melee", "Min 5 hits", "No Resilient"])
  })

  it("refuses a sixth member and pulses the count badge", () => {
    renderEditor()
    for (const unit of ["a", "b", "c", "d", "e"] as const) {
      tap(teamUnits[unit].id)
    }
    const badge = () => screen.getByTestId("team-picker-count")
    expect(badge()).toHaveTextContent("5/5")
    expect(badge()).not.toHaveAttribute("data-pulse")
    tap(teamUnits.r.id)
    expect(badge()).toHaveTextContent("5/5")
    expect(badge()).toHaveAttribute("data-pulse", "1")
    expect(screen.getAllByTestId("team-picker-selected-unit")).toHaveLength(5)
  })

  it("keeps Save unavailable without members and saves a team covering no objective", async () => {
    const { onSubmit, onOpenChange } = renderEditor()
    expect(screen.getByTestId("team-editor-save")).toBeDisabled()

    // Resh is ranged and Beth is Resilient: the three share no objective.
    tap(teamUnits.r.id)
    tap(teamUnits.b.id)
    tap(teamUnits.c.id)
    fireEvent.click(
      within(screen.getByTestId("team-editor-depth")).getByTestId(
        "number-stepper-increase"
      )
    )
    await act(async () => {
      fireEvent.click(screen.getByTestId("team-editor-save"))
    })

    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: "Team 3",
        memberUnitIds: [teamUnits.r.id, teamUnits.b.id, teamUnits.c.id],
        reserveUnitId: null,
        objectiveIndexes: [],
        expectedBattleClears: 1,
      },
      { estimate: null, fromEstimate: false }
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("stays open with the draft after a conflict and says the save was not applied", async () => {
    const onSubmit = vi.fn(async (): Promise<PlanMutationOutcome> => "conflict")
    const { onOpenChange } = renderEditor({ team: saved, onSubmit })
    fireEvent.change(nameInput(), { target: { value: "Renamed" } })

    await act(async () => {
      fireEvent.click(screen.getByTestId("team-editor-save"))
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(nameInput()).toHaveValue("Renamed")
    expect(screen.getByTestId("team-editor-save")).toBeEnabled()
    expect(screen.getByTestId("team-editor-not-saved")).toHaveTextContent(
      "this team was not saved"
    )
  })

  describe.each([
    ["desktop", 1280],
    ["mobile", 390],
  ])("team minimum on %s", (_layout, width) => {
    beforeEach(() => setViewportWidth(width))
    const save = () => screen.getByTestId("team-editor-save")
    const count = () => screen.getByTestId("team-picker-count")
    const message = () => screen.queryByTestId("team-editor-needs-members")

    it("keeps Save unavailable with two members and a reserve, and says why", () => {
      renderEditor()
      tap(teamUnits.a.id)
      tap(teamUnits.b.id)
      fireEvent.click(
        within(
          screen
            .getAllByTestId("team-picker-tile")
            .find((element) => element.dataset.unit === teamUnits.c.id)!
        ).getByTestId("team-picker-reserve")
      )
      expect(count()).toHaveTextContent("2/5 · at least 3")
      expect(message()).toHaveTextContent("A team needs at least 3 characters")
      expect(save()).toBeDisabled()
      expect(save()).toHaveAccessibleDescription(
        "A team needs at least 3 characters"
      )
    })

    it("enables Save once a third member is added", () => {
      renderEditor()
      tap(teamUnits.a.id)
      tap(teamUnits.b.id)
      expect(save()).toBeDisabled()
      tap(teamUnits.c.id)
      expect(message()).not.toBeInTheDocument()
      expect(count()).toHaveTextContent("3/5")
      expect(count()).not.toHaveTextContent("at least")
      expect(save()).toBeEnabled()
    })

    it("makes Save unavailable again when a member of a three-member team is removed", () => {
      renderEditor({ team: saved })
      expect(save()).toBeEnabled()
      tap(teamUnits.c.id)
      expect(save()).toBeDisabled()
      expect(message()).toHaveTextContent("A team needs at least 3 characters")
    })
  })

  it("shows Name, then the member count and Clear depth on one row, then the picker", () => {
    renderEditor()
    const name = nameInput()
    const count = screen.getByTestId("team-picker-count")
    const depth = screen.getByTestId("team-editor-depth")
    const picker = screen.getByTestId("team-unit-picker")
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(follows(name, count)).toBe(true)
    expect(follows(count, depth)).toBe(true)
    expect(follows(depth, picker)).toBe(true)
    expect(count.parentElement?.parentElement).toBe(
      depth.parentElement?.parentElement
    )
  })

  describe("objectives already cleared (spec: cleared through the depth are marked)", () => {
    // No Resilient (catalog index 2, objective id 3) cleared in battles 1 and 2.
    const model = buildLanePointsModel(teamLane)
    const progress = buildSyncedLaneProgress(model, {
      encounters: [0, 1].map(() => ({
        objectivesCleared: [3],
        highScore: 0,
        encounterPoints: 0,
      })),
    })
    const estimateTeam = (memberUnitIds: readonly string[]): ClearEstimate => ({
      depth: memberUnitIds.length,
      battleCount: 18,
      marginAbovePct: 0,
      shortfallToNextPct: 0,
      calibrated: true,
    })
    const noResilient = () =>
      screen
        .getAllByTestId("team-editor-summary-objective")
        .find((chip) => chip.textContent?.includes("No Resilient"))!

    it("marks No Resilient at the estimated depth 1 and drops the mark at depth 3", () => {
      renderEditor({ estimateTeam, progress })
      tap(teamUnits.a.id)
      expect(noResilient()).toHaveAttribute("data-cleared", "true")
      expect(
        within(noResilient()).getByText("Already cleared through battle 1")
      ).toHaveClass("sr-only")

      const depthField = screen.getByTestId("team-editor-depth")
      fireEvent.click(within(depthField).getByTestId("number-stepper-increase"))
      fireEvent.click(within(depthField).getByTestId("number-stepper-increase"))
      expect(noResilient()).not.toHaveAttribute("data-cleared")
    })

    it("marks nothing without progress", () => {
      renderEditor({ estimateTeam })
      tap(teamUnits.a.id)
      expect(noResilient()).not.toHaveAttribute("data-cleared")
    })
  })

  describe("estimate in the depth field", () => {
    // One battle per member: a three-member team is estimated at 3.
    const estimateTeam = (memberUnitIds: readonly string[]): ClearEstimate => ({
      depth: memberUnitIds.length,
      battleCount: 18,
      marginAbovePct: 12,
      shortfallToNextPct: 30,
      calibrated: true,
    })
    const depthField = () => screen.getByTestId("team-editor-depth")
    const depthInput = () =>
      within(depthField()).getByTestId("number-stepper-input")

    it("mirrors the card: the members' live estimate shows while no depth is set", () => {
      renderEditor({ estimateTeam })
      tap(teamUnits.a.id)
      expect(depthInput()).toHaveValue(1)
      expect(depthField()).toHaveAttribute("data-estimated", "true")
      tap(teamUnits.b.id)
      expect(depthInput()).toHaveValue(2)
      expect(screen.getByTestId("team-editor-depth-margin")).toHaveTextContent(
        "12% above battle 2 · 30% short of battle 3"
      )
    })

    it("saves a manual depth stepped from the estimate, and none when left on it", async () => {
      const { onSubmit } = renderEditor({ team: saved, estimateTeam })
      await act(async () => {
        fireEvent.click(screen.getByTestId("team-editor-save"))
      })
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ expectedBattleClears: null }),
        { estimate: 3, fromEstimate: true }
      )

      fireEvent.click(
        within(depthField()).getByTestId("number-stepper-increase")
      )
      expect(depthInput()).toHaveValue(4)
      await act(async () => {
        fireEvent.click(screen.getByTestId("team-editor-save"))
      })
      // The override log gets the estimate the depth was stepped from.
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ expectedBattleClears: 4 }),
        { estimate: 3, fromEstimate: true }
      )
    })

    it("offers Use estimate beside a manual depth", () => {
      renderEditor({
        team: {
          ...saved,
          runDepths: [
            {
              run: 2,
              expectedBattleClears: 9,
              expectedBattleClearsSource: "manual",
              recordedAt: "2026-10-01T00:00:00Z",
            },
          ],
        },
        estimateTeam,
      })
      expect(depthInput()).toHaveValue(9)
      expect(screen.getByTestId("team-editor-depth-hint")).toHaveTextContent(
        "estimate ~3"
      )
      fireEvent.click(screen.getByTestId("team-editor-depth-use-estimate"))
      expect(depthInput()).toHaveValue(3)
      expect(depthField()).toHaveAttribute("data-estimated", "true")
    })
  })

  describe("footer summary (spec: the editor keeps its summary and actions in view)", () => {
    const estimateTeam = (memberUnitIds: readonly string[]): ClearEstimate => ({
      depth: memberUnitIds.length,
      battleCount: 18,
      marginAbovePct: 12,
      shortfallToNextPct: 30,
      calibrated: true,
    })
    const footer = () => screen.getByTestId("team-editor-summary")
    const footerObjectives = () =>
      within(footer())
        .queryAllByTestId("team-editor-summary-objective-label")
        .map((chip) => chip.textContent)

    it("shows the count, covered objectives, estimated depth and actions for four members", () => {
      renderEditor({ estimateTeam })
      for (const unit of [teamUnits.a, teamUnits.b, teamUnits.c, teamUnits.d])
        tap(unit.id)
      expect(
        within(footer()).getByTestId("team-editor-summary-count")
      ).toHaveTextContent("4/5")
      expect(footerObjectives()).toEqual(["Melee", "Min 5 hits"])
      const depth = within(footer()).getByTestId("team-editor-summary-depth")
      expect(depth).toHaveTextContent("Clear depth ~4 · estimated")
      expect(depth).toHaveAttribute("data-estimated", "true")
      const actions = screen.getByTestId("team-editor-actions")
      expect(
        within(actions)
          .getAllByRole("button")
          .map((button) => button.textContent)
      ).toEqual(["Cancel", "Save and add another", "Save team"])
    })

    it("says at least 3 below three members and shows a manual depth", () => {
      renderEditor()
      tap(teamUnits.a.id)
      expect(
        within(footer()).getByTestId("team-editor-summary-count")
      ).toHaveTextContent("1/5 · at least 3")
      expect(
        within(footer()).getByTestId("team-editor-summary-depth")
      ).toHaveTextContent("Clear depth not set")
      fireEvent.click(
        within(screen.getByTestId("team-editor-depth")).getByTestId(
          "number-stepper-increase"
        )
      )
      expect(
        within(footer()).getByTestId("team-editor-summary-depth")
      ).toHaveTextContent("Clear depth 1")
    })

    it("sits outside the scrolling body", () => {
      renderEditor()
      const body = screen
        .getByTestId("team-editor")
        .querySelector('[data-slot="responsive-dialog-body"]')!
      expect(body).not.toContainElement(footer())
      expect(body).not.toContainElement(screen.getByTestId("team-editor-save"))
    })

    it("offers only Cancel and Save when editing a team", () => {
      renderEditor({ team: saved })
      expect(screen.queryByTestId("team-editor-save-another")).toBeNull()
      expect(
        within(screen.getByTestId("team-editor-actions"))
          .getAllByRole("button")
          .map((button) => button.textContent)
      ).toEqual(["Cancel", "Save team"])
    })

    it("gives the actions 44px touch targets on mobile", () => {
      setViewportWidth(390)
      renderEditor()
      for (const button of within(
        screen.getByTestId("team-editor-actions")
      ).getAllByRole("button"))
        expect(button).toHaveClass("h-11")
    })
  })

  describe("Save and add another (spec: builds teams in a row)", () => {
    const saveAnother = () => screen.getByTestId("team-editor-save-another")
    const chip = (label: string) =>
      screen
        .getAllByTestId("team-picker-objective-chip")
        .find((element) => element.textContent?.includes(label))!

    it("saves, then clears the draft for the next team and keeps the chips and search", async () => {
      const { onSubmit, onOpenChange } = renderEditor()
      await screen.findByText("Gimel")
      expect(saveAnother()).toBeDisabled()
      fireEvent.click(chip("Melee"))
      fireEvent.change(screen.getByTestId("team-picker-search"), {
        target: { value: "e" },
      })
      fireEvent.click(screen.getByTestId("team-picker-only-unlocked"))
      tap(teamUnits.a.id)
      tap(teamUnits.b.id)
      tap(teamUnits.c.id)
      fireEvent.click(
        within(screen.getByTestId("team-editor-depth")).getByTestId(
          "number-stepper-increase"
        )
      )
      fireEvent.change(nameInput(), { target: { value: "First" } })
      expect(saveAnother()).toBeEnabled()

      await act(async () => {
        fireEvent.click(saveAnother())
      })

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "First",
          memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
          expectedBattleClears: 1,
        }),
        expect.anything()
      )
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.queryAllByTestId("team-picker-selected-unit")).toHaveLength(
        0
      )
      expect(nameInput()).toHaveValue("Team 3")
      expect(
        within(screen.getByTestId("team-editor-depth")).getByTestId(
          "number-stepper-input"
        )
      ).toHaveValue(null)
      expect(chip("Melee")).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByTestId("team-picker-search")).toHaveValue("e")
      expect(screen.getByTestId("team-picker-only-unlocked")).toBeChecked()
      expect(screen.getByTestId("team-picker-search")).toHaveFocus()
      expect(saveAnother()).toBeDisabled()
    })

    it("keeps the draft after a conflict and says the save was not applied", async () => {
      const onSubmit = vi.fn(
        async (): Promise<PlanMutationOutcome> => "conflict"
      )
      const { onOpenChange } = renderEditor({ onSubmit })
      tap(teamUnits.a.id)
      tap(teamUnits.b.id)
      tap(teamUnits.c.id)

      await act(async () => {
        fireEvent.click(saveAnother())
      })

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(
        screen
          .getAllByTestId("team-picker-selected-unit")
          .map((element) => element.dataset.unit)
      ).toEqual([teamUnits.a.id, teamUnits.b.id, teamUnits.c.id])
      expect(screen.getByTestId("team-editor-not-saved")).toHaveTextContent(
        "this team was not saved"
      )
    })

    it("keeps the draft after an error", async () => {
      const onSubmit = vi.fn(async (): Promise<PlanMutationOutcome> => "error")
      renderEditor({ onSubmit })
      tap(teamUnits.a.id)
      tap(teamUnits.b.id)
      tap(teamUnits.c.id)
      await act(async () => {
        fireEvent.click(saveAnother())
      })
      expect(screen.getAllByTestId("team-picker-selected-unit")).toHaveLength(3)
      expect(saveAnother()).toBeEnabled()
    })
  })

  describe("objective chips (spec: the picker filter composes with the other controls)", () => {
    const chip = (label: string) =>
      screen
        .getAllByTestId("team-picker-objective-chip")
        .find((element) => element.textContent?.includes(label))!

    it("lets a dimmed unit be picked, which drops Melee from the coverage", () => {
      renderEditor()
      fireEvent.click(chip("Melee"))
      const resh = screen
        .getAllByTestId("team-picker-tile")
        .find((element) => element.dataset.unit === teamUnits.r.id)!
      expect(resh).toHaveAttribute("data-dimmed", "true")
      tap(teamUnits.r.id)
      expect(
        screen
          .getAllByTestId("team-picker-selected-unit")
          .map((element) => element.dataset.unit)
      ).toEqual([teamUnits.r.id])
      expect(chips()).not.toContain("Melee")
    })

    it("starts from a suggestion's objectives", () => {
      renderEditor({
        initialMemberUnitIds: [teamUnits.a.id],
        initialObjectives: [0],
      })
      expect(chip("Melee")).toHaveAttribute("aria-pressed", "true")
      expect(chip("Min 5 hits")).toHaveAttribute("aria-pressed", "false")
    })

    it("resets the selection when the editor is closed and reopened", () => {
      const { reopen } = renderEditor()
      fireEvent.click(chip("Melee"))
      expect(chip("Melee")).toHaveAttribute("aria-pressed", "true")
      reopen()
      expect(
        screen
          .getAllByTestId("team-picker-objective-chip")
          .every((element) => element.getAttribute("aria-pressed") === "false")
      ).toBe(true)
    })
  })
})
