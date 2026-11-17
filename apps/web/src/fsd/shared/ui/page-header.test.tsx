import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import {
  PageHeader,
  PageHeaderSettings,
  PageHeaderSettingsSlot,
  PageHeaderSlotProvider,
  PageSettingsButton,
} from "./page-header"

const mobile = vi.hoisted(() => ({ value: false }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

/** A shell drawing the header, and a page deeper in the tree filling its settings slot. */
function Shell({ onSettings }: { onSettings: () => void }) {
  return (
    <PageHeaderSlotProvider>
      <PageHeader
        description="Spend today's energy on your active goals."
        settings={<PageHeaderSettingsSlot />}
        title={<h1>Raids</h1>}
      />
      <main>
        <PageHeaderSettings>
          <PageSettingsButton onClick={onSettings} testId="page-settings" />
        </PageHeaderSettings>
      </main>
    </PageHeaderSlotProvider>
  )
}

describe("PageHeader", () => {
  beforeEach(() => {
    mobile.value = false
  })

  it("puts a page's Settings button in the header's slot, labelled on desktop", async () => {
    const onSettings = vi.fn()
    render(<Shell onSettings={onSettings} />)

    const header = screen.getByRole("banner")
    const button = await within(header).findByTestId("page-settings")
    expect(button).toHaveTextContent("Settings")
    expect(
      within(screen.getByRole("main")).queryByTestId("page-settings")
    ).toBeNull()
    expect(header).toHaveTextContent(
      "Spend today's energy on your active goals."
    )

    await userEvent.click(button)
    expect(onSettings).toHaveBeenCalledTimes(1)
  })

  it("draws the Settings button as a named icon on mobile", async () => {
    mobile.value = true
    render(<Shell onSettings={vi.fn()} />)

    const button = await screen.findByTestId("page-settings")
    expect(button).toHaveAccessibleName("Settings")
    expect(button).not.toHaveTextContent("Settings")
  })

  it("renders the settings in place outside a shell", () => {
    render(
      <PageHeaderSettings>
        <PageSettingsButton onClick={vi.fn()} testId="page-settings" />
      </PageHeaderSettings>
    )

    expect(screen.getByTestId("page-settings")).toBeInTheDocument()
  })
})
