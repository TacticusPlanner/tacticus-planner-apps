import { useState } from "react"
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
import type { ProjectUnitPlan } from "../../model/projects/project-unit-plans"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { GoalUnitIcon } from "../shared/goal-visuals"

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
  const [dragged, setDragged] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= draft.length) return
    setDraft((current) => {
      const next = [...current]
      const [unit] = next.splice(from, 1)
      if (unit) next.splice(to, 0, unit)
      return next
    })
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
        <ol className="grid flex-1 content-start gap-3 overflow-y-auto px-6">
          {draft.map((unit, index) => {
            const name = getEntityName(unit.entityType, unit.entityId)
            return (
              <li
                className="flex items-center gap-3 rounded-2xl border bg-card p-3"
                data-testid="project-unit-order-item"
                key={`${unit.entityType}:${unit.entityId}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragged !== null) move(dragged, index)
                  setDragged(null)
                }}
              >
                <button
                  aria-label={t("goals.project.dragUnit", { unit: name })}
                  className="cursor-grab rounded-md p-2 text-muted-foreground hover:bg-muted"
                  draggable
                  onDragEnd={() => setDragged(null)}
                  onDragStart={() => setDragged(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp") {
                      event.preventDefault()
                      move(index, index - 1)
                    } else if (event.key === "ArrowDown") {
                      event.preventDefault()
                      move(index, index + 1)
                    }
                  }}
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
          })}
        </ol>
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
