import { useState } from "react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, Link, RouterProvider } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"

import { UnsavedChangesGuard } from "./unsaved-changes-guard"

function Editor({ initiallyDirty }: { initiallyDirty: boolean }) {
  const [dirty, setDirty] = useState(initiallyDirty)
  return (
    <div data-testid="editor">
      <button type="button" onClick={() => setDirty(false)}>
        mark clean
      </button>
      <Link to="/other">go elsewhere</Link>
      <UnsavedChangesGuard
        when={dirty}
        title="Leave this page?"
        description="Unsaved changes will be lost."
        stayLabel="Stay"
        leaveLabel="Leave"
      />
    </div>
  )
}

function renderGuard(initiallyDirty: boolean) {
  const router = createMemoryRouter(
    [
      { path: "/editor", element: <Editor initiallyDirty={initiallyDirty} /> },
      { path: "/other", element: <div data-testid="other">other</div> },
    ],
    { initialEntries: ["/editor"] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("UnsavedChangesGuard", () => {
  it("asks before in-app navigation while dirty, and Stay keeps the page", async () => {
    renderGuard(true)
    await userEvent.click(screen.getByRole("link", { name: "go elsewhere" }))
    expect(await screen.findByText("Leave this page?")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Stay" }))
    await waitFor(() =>
      expect(screen.queryByText("Leave this page?")).toBeNull()
    )
    expect(screen.getByTestId("editor")).toBeInTheDocument()
  })

  it("navigates when the player chooses Leave", async () => {
    renderGuard(true)
    await userEvent.click(screen.getByRole("link", { name: "go elsewhere" }))
    await userEvent.click(await screen.findByRole("button", { name: "Leave" }))
    expect(await screen.findByTestId("other")).toBeInTheDocument()
  })

  it("does not interrupt navigation while clean", async () => {
    renderGuard(false)
    await userEvent.click(screen.getByRole("link", { name: "go elsewhere" }))
    expect(await screen.findByTestId("other")).toBeInTheDocument()
    expect(screen.queryByText("Leave this page?")).toBeNull()
  })

  it("registers a beforeunload prompt only while dirty", async () => {
    const add = vi.spyOn(window, "addEventListener")
    const remove = vi.spyOn(window, "removeEventListener")
    renderGuard(true)
    expect(add).toHaveBeenCalledWith("beforeunload", expect.any(Function))
    const event = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)

    await userEvent.click(screen.getByRole("button", { name: "mark clean" }))
    expect(remove).toHaveBeenCalledWith("beforeunload", expect.any(Function))
    const after = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(false)
    add.mockRestore()
    remove.mockRestore()
  })
})
