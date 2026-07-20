import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { ReadOnlyField } from "@/shared/ui"
import type { LevelGoalCost } from "../model/level-xp-cost"

/** Target-level field + its resource-cost preview (books required + gold to apply, netted against
 * owned books — plan scope decision: no day/energy estimate, since XP books aren't
 * campaign-farmable the way upgrade materials are). The current level is read-only — it always
 * reflects the character's actual synced `xpLevel`. Split out of goal-type-fields.tsx purely for
 * that file's own max-lines budget, mirroring how upgrade-goal-fields.tsx lives in its own file. */
export function LevelGoalFields({
  levelStart,
  levelEnd,
  levelEndOptions,
  onLevelEndChange,
  cost,
}: {
  levelStart: number
  levelEnd: number
  levelEndOptions: readonly number[]
  onLevelEndChange: (value: number) => void
  cost: LevelGoalCost | null
}) {
  const { t } = useTranslation()
  const targetTriggerRef = useRef<HTMLButtonElement>(null)
  const [targetContainer, setTargetContainer] = useState<HTMLElement>()

  return (
    <div className="grid grid-cols-2 gap-3">
      <ReadOnlyField label={t("goals.create.level.current")}>
        {levelStart}
      </ReadOnlyField>
      <div className="grid gap-1.5">
        <label className="text-xs text-muted-foreground">
          {t("goals.create.level.target")}
        </label>
        <Select
          onOpenChange={(open) => {
            if (open) {
              setTargetContainer(
                (targetTriggerRef.current?.closest(
                  '[data-slot="sheet-content"]'
                ) as HTMLElement | null) ?? undefined
              )
            }
          }}
          onValueChange={(value) => onLevelEndChange(Number(value))}
          value={String(levelEnd)}
        >
          <SelectTrigger
            className="w-full"
            data-testid="create-goal-level-target"
            ref={targetTriggerRef}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={targetContainer}>
            {levelEndOptions.map((level) => (
              <SelectItem key={level} value={String(level)}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {cost ? (
        <div
          className="col-span-2 grid gap-0.5 rounded-2xl border p-3 text-sm font-medium"
          data-testid="create-goal-level-cost"
        >
          <p>{t("goals.create.level.booksNeeded", { count: cost.books })}</p>
          <p>{t("goals.create.level.goldToApply", { gold: cost.gold })}</p>
          <p className="text-xs font-normal text-muted-foreground">
            {t("goals.create.level.costDisclaimer")}
          </p>
        </div>
      ) : null}
    </div>
  )
}
