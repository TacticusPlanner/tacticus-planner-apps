import { beforeEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, waitFor, within } from "@/test/render"

import { safeStorage } from "@/shared/lib"

import type { EventUnitChipData as UnitChipData } from "../lib/event-unit-chip-data"
import { RankShadingProvider } from "../model/rank-shading"
import { EventUnitChip } from "./event-unit-chip"

/** The chip as the event page renders it: under the page's Rank shading setting. */
function UnitChip(props: Parameters<typeof EventUnitChip>[0]) {
  return (
    <RankShadingProvider>
      <EventUnitChip {...props} />
    </RankShadingProvider>
  )
}

const SHADING_KEY = "legendaryEvents.unitChips.rankShading"
const helbrecht: UnitChipData = {
  unitId: "templHelbrecht",
  owned: true,
  rank: "Diamond1",
  progression: "Legendary:RedFourStars",
  activeLevel: 8,
  passiveLevel: 8,
}
const thoread: UnitChipData = { unitId: "templAncient", owned: false }

const HELBRECHT_LABEL =
  "High Marshal Helbrecht, Legendary, Diamond I, Active ability level 8, passive ability level 8"

async function chipOf(name: string | RegExp) {
  return screen.findByRole("img", { name })
}

describe("EventUnitChip", () => {
  beforeEach(() => safeStorage.remove(SHADING_KEY))

  it("shows an owned unit's name, rarity letter, rank and abilities", async () => {
    render(<UnitChip unit={helbrecht} />)
    const chip = await chipOf(HELBRECHT_LABEL)
    expect(within(chip).getByTestId("event-board-unit-name")).toHaveTextContent(
      "Helbrecht"
    )
    const badge = within(chip).getByTestId("unit-chip-rarity")
    expect(badge).toHaveAttribute("data-rarity", "Legendary")
    expect(badge.querySelector("img")?.getAttribute("src")).toContain(
      "rarity/legendary"
    )
    expect(chip).toHaveTextContent("A8")
    expect(chip).toHaveTextContent("P8")
    expect(chip).toHaveAttribute("data-rank", "Diamond1")
  })

  it("cuts a long name on one line instead of wrapping it", async () => {
    render(<UnitChip fill unit={{ ...helbrecht, unitId: "tyranParasite" }} />)
    const chip = await chipOf(/^Parasite of Mortrex/)
    const name = within(chip).getByTestId("event-board-unit-name")
    expect(name).toHaveTextContent("Parasite of Mortrex")
    expect(name).toHaveClass("truncate")
  })

  it("mutes a locked unit: no badge, rank, abilities or shading", async () => {
    render(<UnitChip unit={thoread} />)
    const chip = await chipOf("Ancient Thoread, not unlocked")
    expect(within(chip).getByTestId("event-board-unit-name")).toHaveTextContent(
      "Thoread"
    )
    expect(chip).toHaveTextContent("Locked")
    expect(
      within(chip).queryByTestId("unit-chip-rarity")
    ).not.toBeInTheDocument()
    expect(chip).not.toHaveTextContent(/A\d/)
    expect(chip).not.toHaveAttribute("data-shaded")
    expect(chip.getAttribute("style")).toBeNull()
  })

  it("shows only the name and portrait without a roster", async () => {
    render(<UnitChip unit={{ unitId: "templHelbrecht", owned: undefined }} />)
    const chip = await chipOf("High Marshal Helbrecht")
    expect(within(chip).getByTestId("event-board-unit-name")).toHaveTextContent(
      "Helbrecht"
    )
    expect(
      within(chip).queryByTestId("unit-chip-rarity")
    ).not.toBeInTheDocument()
    expect(chip).not.toHaveTextContent("Locked")
    expect(chip).not.toHaveTextContent(/A\d/)
  })

  it("tints an owned unit in its rank colour only while Rank shading is on", async () => {
    const { unmount } = render(<UnitChip unit={helbrecht} />)
    const chip = await chipOf(HELBRECHT_LABEL)
    expect(chip).toHaveAttribute("data-shaded", "true")
    expect(chip.style.backgroundColor).toContain("--rank-diamond1")
    unmount()

    safeStorage.set(SHADING_KEY, "off")
    render(<UnitChip unit={helbrecht} />)
    const plain = await chipOf(HELBRECHT_LABEL)
    expect(plain).not.toHaveAttribute("data-shaded")
    expect(plain.style.backgroundColor).toBe("")
  })

  it("never shows stars on the chip", async () => {
    render(<UnitChip unit={helbrecht} />)
    const chip = await chipOf(HELBRECHT_LABEL)
    expect(
      within(chip).queryByTestId("event-board-unit-stars")
    ).not.toBeInTheDocument()
  })
})

describe("EventUnitChip details", () => {
  const visibleDetails = () =>
    document.querySelector<HTMLElement>(
      '[data-slot="tooltip-content"] [data-testid="unit-chip-details"], [data-slot="popover-content"] [data-testid="unit-chip-details"]'
    )

  it("shows the long name, rarity with stars, rank and abilities on hover", async () => {
    render(<UnitChip unit={helbrecht} />)
    const chip = await chipOf(HELBRECHT_LABEL)
    fireEvent.pointerMove(chip, { pointerType: "mouse" })
    await waitFor(() => expect(visibleDetails()).not.toBeNull())
    const details = visibleDetails()!
    expect(details).toHaveTextContent("High Marshal Helbrecht")
    expect(details).toHaveTextContent("Legendary")
    // Four red stars, as art and, for screen readers, in words.
    expect(details.querySelectorAll('img[src*="star"]')).toHaveLength(4)
    expect(details).toHaveTextContent("Red Four Stars")
    expect(details).toHaveTextContent("Diamond I")
    expect(details).toHaveTextContent("Active 8 · Passive 8")
  })

  it("shows the details on keyboard focus of a table chip, and Enter still runs its action", async () => {
    const onActivate = vi.fn()
    render(
      <UnitChip
        action={{ onActivate, hint: "Start a team with this unit" }}
        unit={helbrecht}
      />
    )
    const button = await screen.findByRole("button", { name: HELBRECHT_LABEL })
    expect(button).toHaveAccessibleDescription("Start a team with this unit")
    fireEvent.focus(button)
    await waitFor(() => expect(visibleDetails()).not.toBeNull())
    fireEvent.click(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('shows the start-team "+" only on hover or keyboard focus of an action chip', async () => {
    render(
      <UnitChip
        action={{ onActivate: vi.fn(), hint: "Start a team with this unit" }}
        unit={helbrecht}
      />
    )
    const button = await screen.findByRole("button", { name: HELBRECHT_LABEL })
    const plus = within(button).getByTestId("event-unit-chip-start-team")
    expect(plus).toHaveAttribute("aria-hidden", "true")
    expect(plus).toHaveClass(
      "hidden",
      "group-hover:block",
      "group-focus-visible:block"
    )
    expect(button).toHaveClass("group")
  })

  it('shows no start-team "+" on a chip without an action', async () => {
    render(<UnitChip unit={helbrecht} />)
    await chipOf(HELBRECHT_LABEL)
    expect(screen.queryByTestId("event-unit-chip-start-team")).toBeNull()
  })

  it("lets a focusable chip (a team card's) open its details from the keyboard", async () => {
    render(<UnitChip focusable unit={helbrecht} />)
    const button = await screen.findByRole("button", { name: HELBRECHT_LABEL })
    expect(button).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "High Marshal Helbrecht"
    )
  })

  it("returns focus to a focusable chip when its details close with Escape", async () => {
    render(<UnitChip focusable unit={helbrecht} />)
    const button = await screen.findByRole("button", { name: HELBRECHT_LABEL })
    button.focus()
    fireEvent.click(button)
    const dialog = await screen.findByRole("dialog")
    fireEvent.keyDown(dialog, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(button).toHaveFocus()
  })

  it("keeps a plain chip out of the Tab order", async () => {
    render(<UnitChip unit={helbrecht} />)
    await chipOf(HELBRECHT_LABEL)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("opens the details on a touch long-press without running the action", async () => {
    const onActivate = vi.fn()
    render(
      <UnitChip
        action={{ onActivate, hint: "Start a team with this unit" }}
        unit={helbrecht}
      />
    )
    const button = await screen.findByRole("button", { name: HELBRECHT_LABEL })
    vi.useFakeTimers()
    try {
      fireEvent.pointerDown(button, { pointerType: "touch" })
      vi.advanceTimersByTime(450)
      fireEvent.pointerUp(button, { pointerType: "touch" })
      fireEvent.click(button)
    } finally {
      vi.useRealTimers()
    }
    await waitFor(() =>
      expect(
        document.querySelector(
          '[data-slot="popover-content"] [data-testid="unit-chip-details"]'
        )
      ).not.toBeNull()
    )
    expect(onActivate).not.toHaveBeenCalled()
  })

  it("keeps a touch tap's action and opens no details", async () => {
    const onActivate = vi.fn()
    render(
      <UnitChip
        action={{ onActivate, hint: "Start a team with this unit" }}
        unit={helbrecht}
      />
    )
    const button = await screen.findByRole("button", { name: HELBRECHT_LABEL })
    fireEvent.pointerDown(button, { pointerType: "touch" })
    fireEvent.pointerUp(button, { pointerType: "touch" })
    fireEvent.click(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(visibleDetails()).toBeNull()
  })

  it("opens a long-pressed chip inside a team row without opening the row", async () => {
    const onRowClick = vi.fn()
    render(
      <button onClick={onRowClick} type="button">
        <UnitChip unit={helbrecht} />
      </button>
    )
    const chip = await chipOf(HELBRECHT_LABEL)
    vi.useFakeTimers()
    try {
      fireEvent.pointerDown(chip, { pointerType: "touch" })
      vi.advanceTimersByTime(450)
      fireEvent.pointerUp(chip, { pointerType: "touch" })
      fireEvent.click(chip)
    } finally {
      vi.useRealTimers()
    }
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it("shows a locked unit's name and Not owned", async () => {
    render(<UnitChip unit={thoread} />)
    const chip = await chipOf("Ancient Thoread, not unlocked")
    fireEvent.pointerMove(chip, { pointerType: "mouse" })
    await waitFor(() => expect(visibleDetails()).not.toBeNull())
    const details = visibleDetails()!
    expect(details).toHaveTextContent("Ancient Thoread")
    expect(details).toHaveTextContent("Not owned")
    expect(details).not.toHaveTextContent("Active")
  })
})
