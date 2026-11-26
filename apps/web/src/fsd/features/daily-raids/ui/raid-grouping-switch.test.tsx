import userEvent from "@testing-library/user-event"
import { battleIdSchema } from "@workspace/game-domain"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { CampaignGroupedList } from "./campaign-group"
import { RaidGroupingSwitch } from "./raid-grouping-switch"
import { readPreference, storedPreference, writePreference } from "@/shared/lib"

const captureEvent = vi.fn()
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent }),
}))

const b1 = battleIdSchema.parse("B1")
const b2 = battleIdSchema.parse("B2")
const location = (id: string, nodeLabel: string) => ({
  id,
  campaignName: "Indomitus",
  nodeLabel,
  difficultyLabel: "Elite",
  shortLabel: `Indomitus ${nodeLabel}`,
  challenge: false,
  icon: undefined,
  campaignKey: "indomitus:Elite",
})
const locations = new Map([
  [b1, location("B1", "Elite 4")],
  [b2, location("B2", "Elite 9")],
])

/** The switch beside a one-row-per-battle list, as Today and Home share the one setting. */
function SwitchAndList() {
  return (
    <>
      <RaidGroupingSwitch />
      <CampaignGroupedList
        battleIdOf={(row) => row}
        locationsByBattleId={locations}
        renderRow={(row) => <li key={row}>{row}</li>}
        rows={[b1, b2]}
        testId="list"
      />
    </>
  )
}

describe("RaidGroupingSwitch", () => {
  it("starts on Campaign, with a campaign's battles in one group", () => {
    render(<SwitchAndList />)

    expect(screen.getByRole("radio", { name: "Campaign" })).toBeChecked()
    expect(screen.getByTestId("campaign-group-B1")).toHaveTextContent("B1B2")
    expect(screen.queryByTestId("campaign-group-B2")).not.toBeInTheDocument()
  })

  it("puts every battle on its own by upgrade, remembers it on the device and reports the switch", async () => {
    render(<SwitchAndList />)

    await userEvent.click(screen.getByRole("radio", { name: "Upgrade" }))

    expect(readPreference(storedPreference("dailies", "raidGrouping"))).toBe(
      "upgrade"
    )
    expect(captureEvent).toHaveBeenCalledExactlyOnceWith({
      type: "daily_raids_grouping_changed",
      grouping: "upgrade",
    })
    expect(screen.getByTestId("campaign-group-B1")).toHaveTextContent("B1")
    expect(screen.getByTestId("campaign-group-B2")).toHaveTextContent("B2")

    // Pressing the picked grouping again neither unpicks it nor reports anything.
    await userEvent.click(screen.getByRole("radio", { name: "Upgrade" }))
    expect(captureEvent).toHaveBeenCalledTimes(1)
  })

  it("restores the remembered grouping, ignoring an unknown stored value", () => {
    writePreference(storedPreference("dailies", "raidGrouping"), "upgrade")
    const { unmount } = render(<SwitchAndList />)
    expect(screen.getByRole("radio", { name: "Upgrade" })).toBeChecked()
    unmount()

    writePreference(storedPreference("dailies", "raidGrouping"), "nonsense")
    render(<SwitchAndList />)
    expect(screen.getByRole("radio", { name: "Campaign" })).toBeChecked()
  })

  it("keeps the pick on this tab when storage refuses the write, even with an older value stored", async () => {
    writePreference(storedPreference("dailies", "raidGrouping"), "campaign")
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError")
      })
    try {
      render(<SwitchAndList />)
      await userEvent.click(screen.getByRole("radio", { name: "Upgrade" }))

      expect(screen.getByRole("radio", { name: "Upgrade" })).toBeChecked()
      expect(screen.getByTestId("campaign-group-B2")).toHaveTextContent("B2")
    } finally {
      setItem.mockRestore()
    }
  })
})
