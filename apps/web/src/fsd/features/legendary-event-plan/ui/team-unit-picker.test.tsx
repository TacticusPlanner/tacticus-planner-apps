import { useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import {
  initialEditorDraft,
  toggleMember,
  toggleReserve,
} from "../model/team-editor-draft"
import type { PickerEstimates, PickerGoalsPreview } from "../model/team-picker"
import { TeamUnitPicker } from "./team-unit-picker"

// Effective power by unit for the Power sort; the real formula needs the unit-power dataset.
const POWER: Record<string, number> = { unitA: 10_000, unitR: 30_000 }
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  unitEffectivePower: (unitId: string) => POWER[unitId] ?? 0,
}))

beforeEach(async () => {
  await seedGameCatalog({ characters: Object.values(teamUnits) })
})

let i18n: I18n
const context = { lane: teamLane, units: teamUnitList }

function Harness({
  roster,
  goalsPreview,
  goalLines,
  estimates,
  units = teamUnitList,
}: {
  roster?: { unitId: string }[]
  units?: typeof teamUnitList
  goalsPreview?: PickerGoalsPreview
  goalLines?: (unitId: string) => readonly string[]
  estimates?: PickerEstimates
}) {
  const [draft, setDraft] = useState(() =>
    initialEditorDraft(undefined, 1, context)
  )
  return (
    <TeamUnitPicker
      estimates={estimates}
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
      units={units}
    />
  )
}

/** A synced roster entry: Gold 1 at Epic. */
const owned = (unitId: string) => ({
  unitId,
  rank: "Gold1",
  progressionIndex: "Epic:RedOneStar",
})

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

  it("lists only the lane's allowed units with their points left", () => {
    render(<Harness />, { wrapper: i18nWrapper(i18n) })
    const ids = screen
      .getAllByTestId("team-picker-tile")
      .map((element) => element.dataset.unit)
    expect(ids).not.toContain(teamUnits.x.id)
    expect(ids).toHaveLength(6)
    // A, no progress: (30 + 20 + 25 + 15) × 18 battles.
    expect(
      within(tile(teamUnits.a.id)).getByTestId("team-picker-points")
    ).toHaveTextContent("1,620 pts left")
  })

  it("sets a reserve through the tile's secondary action, apart from the members", () => {
    render(<Harness />, { wrapper: i18nWrapper(i18n) })
    tap(teamUnits.a.id)
    fireEvent.click(
      within(tile(teamUnits.r.id)).getByTestId("team-picker-reserve")
    )

    expect(tile(teamUnits.a.id)).toHaveAttribute("data-selected", "true")
    expect(tile(teamUnits.a.id)).not.toHaveAttribute("data-reserve")
    expect(tile(teamUnits.r.id)).toHaveAttribute("data-reserve", "true")
    expect(tile(teamUnits.r.id)).not.toHaveAttribute("data-selected")
  })

  it("searches by name and hides locked units when only unlocked is on", async () => {
    render(<Harness roster={[owned(teamUnits.a.id)]} />, {
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
        roster={[owned(teamUnits.a.id)]}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    await screen.findByText("Beth")
    expect(screen.getByTestId("team-picker-goals-preview")).toBeChecked()
    expect(tile(teamUnits.b.id)).not.toHaveAttribute("data-locked")
    expect(tile(teamUnits.b.id)).toHaveAttribute("data-preview", "true")
    expect(
      within(tile(teamUnits.b.id)).getByTestId("team-picker-unit-state")
    ).toHaveTextContent("~2")
    expect(
      within(tile(teamUnits.b.id)).getByTestId("unit-goal-badge")
    ).toHaveAttribute("title", "Goals: Unlock")

    fireEvent.click(screen.getByTestId("team-picker-goals-preview"))
    expect(onToggle).toHaveBeenCalledWith(false)
    expect(tile(teamUnits.b.id)).toHaveAttribute("data-locked", "true")
    expect(
      within(tile(teamUnits.b.id)).queryByTestId("team-picker-unit-state")
    ).not.toBeInTheDocument()
    // The synced roster's owned unit keeps its rarity and rank, with no preview marker.
    expect(
      within(tile(teamUnits.a.id)).getByTestId("team-picker-unit-state")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("team-picker-preview-marker")
    ).not.toBeInTheDocument()
  })

  describe("unit strength and sort", () => {
    const withPower: PickerEstimates = {
      clearsOf: (unitId) => (unitId === teamUnits.a.id ? 9 : null),
      config: { unitPower: {} } as never,
    }
    const listed = () =>
      screen.getAllByTestId("team-picker-tile").map((el) => el.dataset.unit)

    it("shows an owned unit's rarity, rank and estimated clears without Goals Preview", async () => {
      render(
        <Harness estimates={withPower} roster={[owned(teamUnits.a.id)]} />,
        { wrapper: i18nWrapper(i18n) }
      )
      await screen.findByText("Beth")
      const state = within(tile(teamUnits.a.id)).getByTestId(
        "team-picker-unit-state"
      )
      expect(state).toHaveTextContent("~9")
      expect(
        within(tile(teamUnits.b.id)).queryByTestId("team-picker-unit-state")
      ).not.toBeInTheDocument()
      expect(
        within(tile(teamUnits.a.id)).getByTestId("team-picker-points")
      ).toHaveTextContent("pts left")
    })

    it("shows a placeholder dash while estimates load", async () => {
      render(<Harness estimates="pending" roster={[owned(teamUnits.a.id)]} />, {
        wrapper: i18nWrapper(i18n),
      })
      await screen.findByText("Beth")
      expect(
        within(tile(teamUnits.a.id)).getByTestId("team-picker-clears")
      ).toHaveTextContent("–")
    })

    it("orders by power by default, and by points left on request", async () => {
      render(
        <Harness
          estimates={withPower}
          roster={[owned(teamUnits.a.id), owned(teamUnits.r.id)]}
        />,
        { wrapper: i18nWrapper(i18n) }
      )
      await screen.findByText("Beth")
      // R (30,000) leads on power; A (90 per battle) leads on points.
      expect(listed().slice(0, 2)).toEqual([teamUnits.r.id, teamUnits.a.id])
      fireEvent.click(screen.getByTestId("team-picker-sort-points"))
      expect(listed()[0]).toBe(teamUnits.a.id)
      fireEvent.click(screen.getByTestId("team-picker-sort-power"))
      expect(listed()[0]).toBe(teamUnits.r.id)
    })

    it("disables Power with the reason when power data is unavailable", async () => {
      render(<Harness roster={[owned(teamUnits.a.id)]} />, {
        wrapper: i18nWrapper(i18n),
      })
      await screen.findByText("Beth")
      const power = screen.getByTestId("team-picker-sort-power")
      expect(power).toBeDisabled()
      expect(power).toHaveAccessibleDescription("Power data unavailable")
      expect(screen.getByTestId("team-picker-sort-points")).toHaveAttribute(
        "data-state",
        "on"
      )
    })
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
      // The counts follow the selection: Aleph and He are Melee and not Resilient.
      expect(chip("Melee")).toHaveAttribute("data-count", "2")
      expect(chip("No Resilient")).toHaveAttribute("data-count", "3")
      fireEvent.click(chip("No Resilient"))
      expect(chip("Melee")).toHaveAttribute("data-count", "3")

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
      // A divider separates the matching units from the others.
      const divider = screen.getByTestId("team-picker-not-matching-divider")
      expect(divider).toHaveTextContent("Not matching the selected objectives")
      expect(divider.previousElementSibling).toBe(tile(teamUnits.b.id))
      expect(divider.nextElementSibling).toBe(tile(teamUnits.r.id))
      fireEvent.click(chip("Melee"))
      expect(
        screen.queryByTestId("team-picker-not-matching-divider")
      ).not.toBeInTheDocument()
    })

    it("keeps a dimmed unit selectable", async () => {
      render(<Harness />, { wrapper: i18nWrapper(i18n) })
      await screen.findByText("Beth")
      fireEvent.click(chip("Melee"))
      tap(teamUnits.r.id)
      expect(tile(teamUnits.r.id)).toHaveAttribute("data-selected", "true")
    })

    it("counts only unlocked units while Only unlocked is on", async () => {
      render(
        <Harness roster={[owned(teamUnits.a.id), owned(teamUnits.r.id)]} />,
        { wrapper: i18nWrapper(i18n) }
      )
      await screen.findByText("Beth")
      fireEvent.click(screen.getByTestId("team-picker-only-unlocked"))
      expect(chip("Melee")).toHaveAttribute("data-count", "1")
      expect(listed()).toEqual([teamUnits.a.id, teamUnits.r.id])
    })
  })

  describe("tier and support markers (spec: picker tiles mark tier and support traits)", () => {
    const withTrait = (id: string, ...traits: string[]) =>
      ({
        ...teamUnitList.find((unit) => unit.id === id)!,
        traits,
      }) as (typeof teamUnitList)[number]
    // Aleph: S-tier healer; He: untiered mechanic; Dalet: A-tier healer the roster lacks.
    const units = teamUnitList.map((unit) => {
      if (unit.id === teamUnits.a.id) return withTrait(unit.id, "Healer")
      if (unit.id === teamUnits.e.id) return withTrait(unit.id, "Mechanic")
      if (unit.id === teamUnits.d.id) return withTrait(unit.id, "Healer")
      return unit
    })
    const estimates: PickerEstimates = {
      clearsOf: () => null,
      config: {
        hordeTiers: new Map([
          [teamUnits.a.id, "S"],
          [teamUnits.d.id, "A"],
        ]),
      } as never,
    }
    const markers = (unitId: string) =>
      within(tile(unitId)).queryByTestId("team-picker-markers")

    it("stacks the tier badge over the healer icon", () => {
      render(<Harness estimates={estimates} units={units} />, {
        wrapper: i18nWrapper(i18n),
      })
      const column = markers(teamUnits.a.id)!
      const tier = within(column).getByTestId("team-picker-tier")
      expect(tier).toHaveAttribute("data-tier", "S")
      expect(tier).toHaveTextContent("Tier S")
      const trait = within(column).getByTestId("team-picker-trait")
      expect(trait).toHaveAttribute("data-trait", "Healer")
      expect(
        Boolean(
          tier.compareDocumentPosition(trait) & Node.DOCUMENT_POSITION_FOLLOWING
        )
      ).toBe(true)
    })

    it("shows only the trait for an untiered mechanic, and nothing for a plain unit", () => {
      render(<Harness estimates={estimates} units={units} />, {
        wrapper: i18nWrapper(i18n),
      })
      const column = markers(teamUnits.e.id)!
      expect(within(column).queryByTestId("team-picker-tier")).toBeNull()
      expect(within(column).getByTestId("team-picker-trait")).toHaveAttribute(
        "data-trait",
        "Mechanic"
      )
      expect(markers(teamUnits.c.id)).toBeNull()
    })

    it("marks a locked unit too", async () => {
      render(
        <Harness
          estimates={estimates}
          roster={[owned(teamUnits.a.id)]}
          units={units}
        />,
        { wrapper: i18nWrapper(i18n) }
      )
      await screen.findByText("Beth")
      expect(tile(teamUnits.d.id)).toHaveAttribute("data-locked", "true")
      const column = markers(teamUnits.d.id)!
      expect(within(column).getByTestId("team-picker-tier")).toHaveAttribute(
        "data-tier",
        "A"
      )
      expect(
        within(column).getByTestId("team-picker-trait")
      ).toBeInTheDocument()
    })

    it("shows no tier badge without estimates", () => {
      render(<Harness units={units} />, { wrapper: i18nWrapper(i18n) })
      expect(
        within(markers(teamUnits.a.id)!).queryByTestId("team-picker-tier")
      ).toBeNull()
    })
  })
})
