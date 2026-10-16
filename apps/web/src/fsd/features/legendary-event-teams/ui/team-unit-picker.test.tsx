import { useEffect, useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import {
  initialEditorDraft,
  toggleMember,
  toggleReserve,
} from "../model/team-editor-draft"
import type { PickerGoalsPreview } from "../model/team-picker"
import { TeamUnitPicker } from "./team-unit-picker"

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
const context = { lane: teamLane, units: teamUnitList }

function Harness({
  roster,
  goalsPreview,
  goalLines,
}: {
  roster?: { unitId: string }[]
  goalsPreview?: PickerGoalsPreview
  goalLines?: (unitId: string) => readonly string[]
}) {
  const [draft, setDraft] = useState(() =>
    initialEditorDraft(undefined, 1, context)
  )
  return (
    <TeamUnitPicker
      goalLines={goalLines}
      goalsPreview={goalsPreview}
      lane={teamLane}
      memberUnitIds={draft.memberUnitIds}
      onToggleMember={(unitId) => {
        const result = toggleMember(draft, unitId, context)
        setDraft(result.draft)
        return !result.refused
      }}
      onToggleReserve={(unitId) =>
        setDraft((current) => toggleReserve(current, unitId, context))
      }
      onlyUnlockedDefault={false}
      reserveUnitId={draft.reserveUnitId}
      roster={roster as never}
      units={teamUnitList}
    />
  )
}

const tile = (unitId: string) =>
  screen
    .getAllByTestId("team-picker-tile")
    .find((element) => element.dataset.unit === unitId)!
const tap = (unitId: string) =>
  fireEvent.click(within(tile(unitId)).getByTestId("team-picker-toggle"))

describe("TeamUnitPicker", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("lists only the lane's allowed units with their points per battle", () => {
    render(<Harness />, { wrapper: i18nWrapper(i18n) })
    const ids = screen
      .getAllByTestId("team-picker-tile")
      .map((element) => element.dataset.unit)
    expect(ids).not.toContain(teamUnits.x.id)
    expect(ids).toHaveLength(6)
    // A: 30 + 20 + 25 + 15.
    expect(
      within(tile(teamUnits.a.id)).getByTestId("team-picker-points")
    ).toHaveTextContent("90 pts")
  })

  it("refuses a sixth member and pulses the count badge", () => {
    render(<Harness />, { wrapper: i18nWrapper(i18n) })
    for (const unit of ["a", "b", "c", "d", "e"] as const) {
      tap(teamUnits[unit].id)
    }
    const badge = screen.getByTestId("team-picker-count")
    expect(badge).toHaveTextContent("5/5")
    expect(badge).not.toHaveAttribute("data-pulse")

    tap(teamUnits.r.id)
    expect(screen.getByTestId("team-picker-count")).toHaveTextContent("5/5")
    expect(screen.getByTestId("team-picker-count")).toHaveAttribute(
      "data-pulse",
      "1"
    )
    expect(tile(teamUnits.r.id)).not.toHaveAttribute("data-selected")
  })

  it("sets a reserve through the tile's secondary action, apart from the members", () => {
    render(<Harness />, { wrapper: i18nWrapper(i18n) })
    tap(teamUnits.a.id)
    fireEvent.click(
      within(tile(teamUnits.r.id)).getByTestId("team-picker-reserve")
    )

    const selected = screen.getAllByTestId("team-picker-selected-unit")
    expect(selected.map((element) => element.dataset.unit)).toEqual([
      teamUnits.a.id,
      teamUnits.r.id,
    ])
    expect(selected[1]).toHaveAttribute("data-reserve", "true")
    expect(screen.getByTestId("team-picker-count")).toHaveTextContent("1/5")
  })

  it("searches by name and hides locked units when only unlocked is on", async () => {
    render(<Harness roster={[{ unitId: teamUnits.a.id }]} />, {
      wrapper: i18nWrapper(i18n),
    })
    await screen.findByText("Beth")
    expect(tile(teamUnits.b.id)).toHaveAttribute("data-locked", "true")

    fireEvent.change(screen.getByTestId("team-picker-search"), {
      target: { value: "bet" },
    })
    expect(
      screen.getAllByTestId("team-picker-tile").map((el) => el.dataset.unit)
    ).toEqual([teamUnits.b.id])

    fireEvent.change(screen.getByTestId("team-picker-search"), {
      target: { value: "" },
    })
    fireEvent.click(screen.getByTestId("team-picker-only-unlocked"))
    expect(
      screen.getAllByTestId("team-picker-tile").map((el) => el.dataset.unit)
    ).toEqual([teamUnits.a.id])
  })

  it("starts from the page's Goals Preview and can be turned off in the picker", async () => {
    const onToggle = vi.fn()
    render(
      <Harness
        goalLines={(unitId) => (unitId === teamUnits.b.id ? ["Unlock"] : [])}
        goalsPreview={{
          enabled: true,
          available: true,
          roster: [
            {
              unitId: teamUnits.a.id,
              rank: "Gold1",
              progressionIndex: "Epic:RedOneStar",
            },
            {
              unitId: teamUnits.b.id,
              rank: "Stone1",
              progressionIndex: "Common:None",
            },
          ] as never,
          previewed: new Set([teamUnits.b.id]),
          clearsOf: (unitId) => (unitId === teamUnits.b.id ? 2 : 6),
          onToggle,
        }}
        roster={[{ unitId: teamUnits.a.id }]}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    await screen.findByText("Beth")
    expect(screen.getByTestId("team-picker-goals-preview")).toBeChecked()
    expect(tile(teamUnits.b.id)).not.toHaveAttribute("data-locked")
    expect(tile(teamUnits.b.id)).toHaveAttribute("data-preview", "true")
    expect(
      within(tile(teamUnits.b.id)).getByTestId("team-picker-preview-state")
    ).toHaveTextContent("~2")
    expect(
      within(tile(teamUnits.b.id)).getByTestId("unit-goal-badge")
    ).toHaveAttribute("title", "Goals: Unlock")

    fireEvent.click(screen.getByTestId("team-picker-goals-preview"))
    expect(onToggle).toHaveBeenCalledWith(false)
    expect(tile(teamUnits.b.id)).toHaveAttribute("data-locked", "true")
    expect(
      screen.queryByTestId("team-picker-preview-state")
    ).not.toBeInTheDocument()
  })

  describe("objective chips", () => {
    const chip = (label: string) =>
      screen
        .getAllByTestId("team-picker-objective-chip")
        .find((element) => element.textContent?.includes(label))!
    const listed = () =>
      screen.getAllByTestId("team-picker-tile").map((el) => el.dataset.unit)

    it("shows the lane's objectives with their scores and counts, none selected", async () => {
      render(<Harness />, { wrapper: i18nWrapper(i18n) })
      await screen.findByText("Beth")
      const chips = screen.getAllByTestId("team-picker-objective-chip")
      expect(chips.map((element) => element.dataset.index)).toEqual([
        "0",
        "1",
        "2",
      ])
      expect(
        chips.every(
          (element) => element.getAttribute("aria-pressed") === "false"
        )
      ).toBe(true)
      // Melee: every allowed unit but Resh (ranged).
      expect(chip("Melee")).toHaveAttribute("data-count", "5")
      expect(chip("Melee")).toHaveAccessibleName("Melee: 5 units satisfy it")
      expect(screen.queryAllByTestId("team-picker-tile")).not.toHaveLength(0)
      expect(
        screen
          .getAllByTestId("team-picker-tile")
          .some((element) => element.dataset.dimmed === "true")
      ).toBe(false)
    })

    it("lists only the search matches, those satisfying Melee first", async () => {
      render(<Harness />, { wrapper: i18nWrapper(i18n) })
      await screen.findByText("Beth")
      fireEvent.change(screen.getByTestId("team-picker-search"), {
        target: { value: "h" },
      })
      // Aleph, Beth, Resh and He contain "h", in points order.
      expect(listed()).toEqual([
        teamUnits.a.id,
        teamUnits.e.id,
        teamUnits.b.id,
        teamUnits.r.id,
      ])
      expect(chip("Melee")).toHaveAttribute("data-count", "3")

      // No Resilient lifts Resh above Beth (Resilient), which follows dimmed.
      fireEvent.click(chip("No Resilient"))
      expect(listed()).toEqual([
        teamUnits.a.id,
        teamUnits.e.id,
        teamUnits.r.id,
        teamUnits.b.id,
      ])
      expect(tile(teamUnits.b.id)).toHaveAttribute("data-dimmed", "true")
      fireEvent.click(chip("No Resilient"))

      fireEvent.click(chip("Melee"))
      expect(chip("Melee")).toHaveAttribute("aria-pressed", "true")
      expect(listed()).toEqual([
        teamUnits.a.id,
        teamUnits.e.id,
        teamUnits.b.id,
        teamUnits.r.id,
      ])
      expect(tile(teamUnits.r.id)).toHaveAttribute("data-dimmed", "true")
      expect(
        within(tile(teamUnits.r.id)).getByTestId("team-picker-toggle")
      ).toHaveAccessibleDescription("Does not satisfy Melee")
      expect(tile(teamUnits.a.id)).not.toHaveAttribute("data-dimmed")
    })

    it("keeps a dimmed unit selectable", async () => {
      render(<Harness />, { wrapper: i18nWrapper(i18n) })
      await screen.findByText("Beth")
      fireEvent.click(chip("Melee"))
      tap(teamUnits.r.id)
      expect(
        screen
          .getAllByTestId("team-picker-selected-unit")
          .map((element) => element.dataset.unit)
      ).toEqual([teamUnits.r.id])
    })

    it("counts only unlocked units while Only unlocked is on", async () => {
      render(
        <Harness
          roster={[{ unitId: teamUnits.a.id }, { unitId: teamUnits.r.id }]}
        />,
        { wrapper: i18nWrapper(i18n) }
      )
      await screen.findByText("Beth")
      fireEvent.click(screen.getByTestId("team-picker-only-unlocked"))
      expect(chip("Melee")).toHaveAttribute("data-count", "1")
      expect(listed()).toEqual([teamUnits.a.id, teamUnits.r.id])
    })
  })
})
