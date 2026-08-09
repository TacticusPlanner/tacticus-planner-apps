import { useEffect, useRef, useState } from "react"
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
import { GripVertical } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Spinner } from "@workspace/ui/components/spinner"

import type { ProjectUnitKey } from "@/entities/project"
import {
  reorderProjectUnits,
  type ProjectUnitPlan,
} from "../../model/projects/project-unit-plans"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalUnitIcon } from "../shared/goal-visuals"

function unitKey(unit: ProjectUnitPlan) {
  return `${unit.entityType}:${unit.entityId}`
}

function SortableUnit({ unit, name }: { unit: ProjectUnitPlan; name: string }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: unitKey(unit) })

  return (
    <li
      className="flex items-center gap-3 rounded-2xl border bg-card p-3"
      data-testid="project-unit-order-item"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={t("goals.project.dragUnit", { unit: name })}
        className="cursor-grab touch-none rounded-md p-2 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        type="button"
      >
        <GripVertical />
      </button>
      <GoalUnitIcon
        entityId={unit.entityId}
        entityType={unit.entityType}
        name={name}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">
          {unit.goals.map((goal) => goal.goalType).join(" · ")}
        </p>
      </div>
    </li>
  )
}

export function ReprioritizeUnitsSheet({
  open,
  onOpenChange,
  units,
  pending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: ProjectUnitPlan[]
  pending: boolean
  onSave: (units: ProjectUnitKey[]) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const [draft, setDraft] = useState(units)
  const wasOpen = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (open && !wasOpen.current) setDraft(units)
    wasOpen.current = open
  }, [open, units])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setDraft((current) => reorderProjectUnits(current, active.id, over.id))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("goals.project.reprioritizeUnits")}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t("goals.project.reprioritizeUnitsDescription")}
          </p>
        </SheetHeader>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={draft.map(unitKey)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="grid flex-1 content-start gap-3 overflow-y-auto px-6">
              {draft.map((unit) => (
                <SortableUnit
                  key={unitKey(unit)}
                  name={getEntityName(unit.entityType, unit.entityId)}
                  unit={unit}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <SheetFooter>
          <Button
            disabled={pending}
            onClick={async () => {
              if (
                await onSave(
                  draft.map(({ entityType, entityId }) => ({
                    entityType,
                    entityId,
                  }))
                )
              )
                onOpenChange(false)
            }}
          >
            {pending ? <Spinner /> : null}
            {t("goals.project.save")}
          </Button>
          <Button
            disabled={pending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            {t("goals.project.cancel")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
