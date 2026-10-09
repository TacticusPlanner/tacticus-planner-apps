import { useEffect, useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type { LegendaryEventTeam } from "@/entities/legendary-event"
import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import type { TeamDraft } from "../model/plan-patches"
import type { PlanMutationOutcome } from "../model/use-legendary-event-plan"
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
  memberUnitIds: [teamUnits.a.id, teamUnits.b.id],
  reserveUnitId: null,
  // Min 5 Hits (1) derives but was unticked.
  objectiveIndexes: [0],
  runDepths: [],
}

function renderEditor({
  team,
  onSubmit = vi.fn(async (): Promise<PlanMutationOutcome> => "saved"),
  onOpenChange = vi.fn(),
}: {
  team?: LegendaryEventTeam
  onSubmit?: (draft: TeamDraft) => Promise<PlanMutationOutcome>
  onOpenChange?: (open: boolean) => void
} = {}) {
  render(
    <TeamEditorDialog
      lane={teamLane}
      laneId="alpha"
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      onlyUnlockedDefault={false}
      open
      roster={undefined}
      run={2}
      team={team}
      teamNumber={3}
      units={teamUnitList}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return { onSubmit, onOpenChange }
}

const tap = (unitId: string) => {
  const tile = screen
    .getAllByTestId("team-picker-tile")
    .find((element) => element.dataset.unit === unitId)!
  fireEvent.click(within(tile).getByTestId("team-picker-toggle"))
}
const chips = () =>
  screen.getAllByTestId("team-editor-objective").map((chip) => ({
    label: within(chip).getByTestId("team-editor-objective-label").textContent,
    checked: chip.getAttribute("aria-pressed") === "true",
  }))
const nameInput = () => screen.getByTestId("team-editor-name")

describe("TeamEditorDialog", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => setViewportWidth(1280))

  it("derives coverage from the members: A ticks all three, adding B drops No Resilient", () => {
    renderEditor()
    expect(screen.queryAllByTestId("team-editor-objective")).toHaveLength(0)

    tap(teamUnits.a.id)
    expect(chips()).toEqual([
      { label: "Melee", checked: true },
      { label: "Min 5 hits", checked: true },
      { label: "No Resilient", checked: true },
    ])

    tap(teamUnits.b.id)
    expect(chips()).toEqual([
      { label: "Melee", checked: true },
      { label: "Min 5 hits", checked: true },
    ])
  })

  it("defaults the name to the covered objectives, else Team N", () => {
    renderEditor()
    expect(nameInput()).toHaveValue("Team 3")
    tap(teamUnits.a.id)
    tap(teamUnits.b.id)
    expect(nameInput()).toHaveValue("Melee · Min 5 hits")
  })

  it("reopens a saved team with its untick kept", () => {
    renderEditor({ team: saved })
    expect(nameInput()).toHaveValue("Melee")
    expect(chips()).toEqual([
      { label: "Melee", checked: true },
      { label: "Min 5 hits", checked: false },
    ])
  })

  it("re-ticks an objective that newly derives when a member leaves", () => {
    renderEditor({ team: saved })
    tap(teamUnits.b.id)
    expect(chips()).toEqual([
      { label: "Melee", checked: true },
      { label: "Min 5 hits", checked: false },
      { label: "No Resilient", checked: true },
    ])
  })

  it("keeps Save unavailable without members and saves a team covering no objective", async () => {
    const { onSubmit, onOpenChange } = renderEditor()
    expect(screen.getByTestId("team-editor-save")).toBeDisabled()

    tap(teamUnits.r.id)
    fireEvent.click(screen.getAllByTestId("team-editor-objective")[0]!)
    fireEvent.click(
      within(screen.getByTestId("team-editor-depth")).getByTestId(
        "number-stepper-increase"
      )
    )
    await act(async () => {
      fireEvent.click(screen.getByTestId("team-editor-save"))
    })

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Team 3",
      memberUnitIds: [teamUnits.r.id],
      reserveUnitId: null,
      objectiveIndexes: [],
      expectedBattleClears: 1,
    })
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
})
