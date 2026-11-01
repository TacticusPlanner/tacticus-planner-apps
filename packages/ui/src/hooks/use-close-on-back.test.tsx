import { act, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Sheet, SheetContent, SheetTitle } from "@workspace/ui/components/sheet"

// A stand-in for the browser's CloseWatcher stack: a Back press closes the newest live watcher.
class FakeCloseWatcher {
  static live: FakeCloseWatcher[] = []
  onclose: (() => void) | null = null

  constructor() {
    FakeCloseWatcher.live.push(this)
  }

  destroy() {
    FakeCloseWatcher.live = FakeCloseWatcher.live.filter((w) => w !== this)
  }
}

function pressBack() {
  const top = FakeCloseWatcher.live.at(-1)
  act(() => {
    top?.destroy()
    top?.onclose?.()
  })
}

describe("Back closes overlays", () => {
  beforeEach(() => {
    FakeCloseWatcher.live = []
    vi.stubGlobal("CloseWatcher", FakeCloseWatcher)
    // jsdom has no matchMedia; SheetContent asks it for the mobile breakpoint.
    vi.stubGlobal(
      "matchMedia",
      () =>
        ({
          matches: false,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("closes an uncontrolled dialog and releases the watcher", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(FakeCloseWatcher.live).toHaveLength(0)

    fireEvent.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument()
    expect(FakeCloseWatcher.live).toHaveLength(1)

    pressBack()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(FakeCloseWatcher.live).toHaveLength(0)
  })

  it("reports the close to a controlled sheet's owner", () => {
    const onOpenChange = vi.fn()
    function Controlled() {
      const [open, setOpen] = useState(true)
      return (
        <Sheet
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next)
            setOpen(next)
          }}
        >
          <SheetContent>
            <SheetTitle>Menu</SheetTitle>
          </SheetContent>
        </Sheet>
      )
    }
    render(<Controlled />)

    pressBack()
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("closes only the overlay opened last", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Outer</DialogTitle>
          <Dialog defaultOpen>
            <DialogContent>
              <DialogTitle>Inner</DialogTitle>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    )

    pressBack()
    expect(screen.queryByRole("dialog", { name: "Inner" })).toBeNull()
    expect(screen.getByRole("dialog", { name: "Outer" })).toBeInTheDocument()
  })

  it("leaves Back alone without CloseWatcher support", () => {
    vi.unstubAllGlobals()
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Details</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument()
  })
})
