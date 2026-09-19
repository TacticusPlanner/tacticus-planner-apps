import type { CSSProperties, ReactNode } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type SortableReturn = ReturnType<typeof useSortable>

/** Drag-activator props an item's own grip handle spreads onto itself. */
type DragHandleProps = {
  ref: SortableReturn["setActivatorNodeRef"]
  attributes: SortableReturn["attributes"]
  listeners: SortableReturn["listeners"]
}

export type SortableRenderProps = {
  /** Apply directly to the item's own root DOM element (a `<TableRow>`, an `<li>`, ...) — this
   *  component never wraps items in a div of its own, since a table row can't be wrapped in one
   *  without breaking table semantics. */
  setNodeRef: (element: HTMLElement | null) => void
  style: CSSProperties
  dragHandle: DragHandleProps
  isDragging: boolean
}

function SortableItem<T>({
  item,
  getId,
  renderItem,
}: {
  item: T
  getId: (item: T) => string
  renderItem: (item: T, sortable: SortableRenderProps) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: getId(item) })

  return renderItem(item, {
    setNodeRef,
    style: { transform: CSS.Transform.toString(transform), transition },
    dragHandle: { ref: setActivatorNodeRef, attributes, listeners },
    isDragging,
  })
}

/**
 * Item-agnostic drag reorder (mouse, touch, keyboard) via `@dnd-kit` — ported from
 * `tacticusplanner`'s `sortable-list.tsx` pattern, adapted to apply the sortable ref/style directly
 * onto each item's own root element (via `renderItem`) rather than wrapping it in a div, since a
 * desktop `<TableRow>` can't be wrapped without breaking table semantics the way a mobile `<li>`
 * could be. No `DragOverlay` — the transform-based in-place drag is enough here; add one later if a
 * floating drag preview is wanted.
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  disabled = false,
}: {
  items: T[]
  getId: (item: T) => string
  onReorder: (orderedIds: string[], movedId: string) => void
  renderItem: (item: T, sortable: SortableRenderProps) => ReactNode
  /** While true, drags are ignored (design.md: the drag surface is disabled while a reorder mutation
   *  from a previous drop is still in flight, closing the race a stale second drag could otherwise
   *  cause). */
  disabled?: boolean
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = items.map(getId)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (disabled || !over || active.id === over.id) return
    const from = ids.indexOf(active.id as string)
    const to = ids.indexOf(over.id as string)
    if (from < 0 || to < 0) return
    const reordered = [...ids]
    const [movedId] = reordered.splice(from, 1)
    if (!movedId) return
    reordered.splice(to, 0, movedId)
    onReorder(reordered, movedId)
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem
            getId={getId}
            item={item}
            key={getId(item)}
            renderItem={renderItem}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
