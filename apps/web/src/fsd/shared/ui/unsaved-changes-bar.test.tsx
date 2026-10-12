import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { UnsavedChangesBar } from "./unsaved-changes-bar"

const mobile = vi.hoisted(() => ({ value: false }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

const props = {
  message: "You have unsaved changes",
  saveLabel: "Save",
  discardLabel: "Discard",
}

describe("UnsavedChangesBar", () => {
  beforeEach(() => {
    mobile.value = false
  })

  it("renders nothing when closed", () => {
    render(
      <UnsavedChangesBar
        {...props}
        open={false}
        isSaving={false}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    )
    expect(screen.queryByTestId("unsaved-changes-bar")).toBeNull()
  })

  it("offers Save and Discard when open", async () => {
    const onSave = vi.fn()
    const onDiscard = vi.fn()
    render(
      <UnsavedChangesBar
        {...props}
        open
        isSaving={false}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    )
    expect(
      screen.getByRole("region", { name: "You have unsaved changes" })
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await userEvent.click(screen.getByRole("button", { name: "Discard" }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(onDiscard).toHaveBeenCalledOnce()
  })

  it("disables both actions while saving", () => {
    render(
      <UnsavedChangesBar
        {...props}
        open
        isSaving
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    )
    expect(screen.getByTestId("unsaved-changes-save")).toBeDisabled()
    expect(screen.getByTestId("unsaved-changes-discard")).toBeDisabled()
  })

  it("sits above the mobile bottom nav on mobile", () => {
    mobile.value = true
    render(
      <UnsavedChangesBar
        {...props}
        open
        isSaving={false}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    )
    const bar = screen.getByTestId("unsaved-changes-bar")
    expect(bar).toHaveAttribute("data-mobile", "true")
    expect(bar.className).toContain("bottom-[calc(var(--mobile-nav-height)")
  })

  it("pins to the viewport bottom on desktop", () => {
    render(
      <UnsavedChangesBar
        {...props}
        open
        isSaving={false}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    )
    const bar = screen.getByTestId("unsaved-changes-bar")
    expect(bar).not.toHaveAttribute("data-mobile")
    expect(bar.className).toContain("bottom-4")
  })
})
