import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("../hooks/use-mobile", () => ({ useIsMobile: () => false }))

import { SidebarProvider } from "./sidebar"

function renderProvider(keyboardShortcut?: boolean) {
  const onOpenChange = vi.fn()
  render(
    <SidebarProvider
      keyboardShortcut={keyboardShortcut}
      onOpenChange={onOpenChange}
      open
    />
  )
  fireEvent.keyDown(window, { ctrlKey: true, key: "b" })
  return onOpenChange
}

describe("SidebarProvider keyboard shortcut", () => {
  it("toggles the sidebar on Ctrl+B by default", () => {
    expect(renderProvider()).toHaveBeenCalledWith(false)
  })

  it("does nothing on Ctrl+B when keyboardShortcut is false", () => {
    expect(renderProvider(false)).not.toHaveBeenCalled()
  })
})
