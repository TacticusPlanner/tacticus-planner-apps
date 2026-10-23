import { useMemo, useRef, type CSSProperties, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
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

  // Stable while this item's drag wiring is unchanged, so a memoized row body that only takes the
  // handle is not re-rendered by drag-state changes elsewhere in the list.
  const dragHandle = useMemo(
    () => ({ ref: setActivatorNodeRef, attributes, listeners }),
    [setActivatorNodeRef, attributes, listeners]
  )

  return renderItem(item, {
    setNodeRef,
    style: { transform: CSS.Transform.toString(transform), transition },
    dragHandle,
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
  getLabel,
  disabled = false,
}: {
  items: T[]
  getId: (item: T) => string
  /** The item's visible name, for the screen-reader reorder announcements. */
  getLabel: (id: string) => string
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
  const { t } = useTranslation("common")

  const describe = (id: UniqueIdentifier, at: UniqueIdentifier = id) => ({
    name: getLabel(String(id)),
    position: ids.indexOf(String(at)) + 1,
    total: ids.length,
  })
  // dnd-kit reports the picked-up item as "over" itself right after pick-up; skipping a repeat of
  // the last position keeps that from overwriting the pick-up announcement.
  const lastOverId = useRef<UniqueIdentifier>(undefined)
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      lastOverId.current = active.id
      return t("reorder.pickedUp", describe(active.id))
    },
    onDragOver: ({ active, over }) => {
      if (!over || over.id === lastOverId.current) return undefined
      lastOverId.current = over.id
      return t("reorder.movedOver", describe(active.id, over.id))
    },
    onDragEnd: ({ active, over }) =>
      over
        ? t("reorder.dropped", describe(active.id, over.id))
        : t("reorder.cancelled", describe(active.id)),
    onDragCancel: ({ active }) => t("reorder.cancelled", describe(active.id)),
  }

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
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: t("reorder.instructions") },
      }}
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
