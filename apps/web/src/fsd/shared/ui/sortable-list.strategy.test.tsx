import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render } from "@/test/render"

const captured = vi.hoisted(() => ({
  onDragEnd: undefined as ((event: DragEndEvent) => void) | undefined,
  strategy: undefined as unknown,
}))

// jsdom has no layout, so a real drag can't be simulated; capture what the list hands dnd-kit instead.
vi.mock("@dnd-kit/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@dnd-kit/core")>()),
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode
    onDragEnd: (event: DragEndEvent) => void
  }) => {
    captured.onDragEnd = onDragEnd
    return children
  },
}))
vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/sortable")>()
  return {
    ...actual,
    SortableContext: (props: { children: ReactNode; strategy: unknown }) => {
      captured.strategy = props.strategy
      return props.children
    },
  }
})

import { SortableList, type SortableListStrategy } from "./sortable-list"

const IDS = ["a", "b", "c", "d", "e", "f"]

async function renderList(
  strategy: SortableListStrategy | undefined,
  onReorder = vi.fn()
) {
  const i18n = await createTestI18n()
  render(
    <ul>
      <SortableList
        getId={(id) => id}
        getLabel={(id) => id}
        items={IDS}
        onReorder={onReorder}
        renderItem={(id, { setNodeRef }) => (
          <li key={id} ref={setNodeRef}>
            {id}
          </li>
        )}
        strategy={strategy}
      />
    </ul>,
    { wrapper: i18nWrapper(i18n) }
  )
  return onReorder
}

const drop = (active: string, over: string) =>
  captured.onDragEnd?.({
    active: { id: active },
    over: { id: over },
  } as unknown as DragEndEvent)

describe("SortableList strategy", () => {
  it("keeps the vertical strategy by default", async () => {
    await renderList(undefined)
    expect(captured.strategy).toBe(verticalListSortingStrategy)
  })

  it("uses the rect strategy for a grid", async () => {
    await renderList("grid")
    expect(captured.strategy).toBe(rectSortingStrategy)
  })

  it("commits the same order across grid rows as a vertical list would", async () => {
    // Three per row: A B C / D E F. Dropping F onto B's slot.
    const gridReorder = await renderList("grid")
    drop("f", "b")
    const verticalReorder = await renderList("vertical")
    drop("f", "b")

    expect(gridReorder).toHaveBeenCalledWith(
      ["a", "f", "b", "c", "d", "e"],
      "f"
    )
    expect(verticalReorder).toHaveBeenCalledWith(
      ["a", "f", "b", "c", "d", "e"],
      "f"
    )
  })
})
