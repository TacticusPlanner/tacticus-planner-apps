import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { UpgradeId } from "@workspace/game-domain"

import type { UpgradeWithFarmLocations } from "@/features/rank-lookup/@x/goal-create"
import {
  RarityCombobox,
  UpgradeIcon,
  type RarityComboboxItem,
} from "@/shared/ui"

import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { FieldIssues } from "../create-goal/goal-form-issues"
import {
  fieldIssueProps,
  goalFieldId,
} from "../create-goal/goal-form-issue-ids"
import { UpgradeQuantityRow } from "../shared/upgrade-quantity-row"
import { ResourcePreviewSection, type ResourcePreview } from "./card-parts"

/**
 * An Upgrade goal as both dialogs show it: the optional range(s) the materials are scoped to, one row
 * per material with its quantity (and its quantity message), "Add material" from the materials that
 * range needs, the resources preview, then the farming locations, the Mythic materials and the note. An edited goal keeps at
 * least one material.
 */
export function UpgradeGoalCard({
  mode,
  targets,
  choices,
  upgradesById,
  ownedQuantities,
  onAdd,
  onRemove,
  onQuantityChange,
  ranges,
  issues,
  preview,
  sources,
  mythic,
  note,
}: {
  mode: "create" | "edit"
  targets: readonly { upgradeId: string; quantity: number }[]
  /** The materials the range needs, with how many. */
  choices: ReadonlyMap<UpgradeId, number>
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  /** How many of each material the account owns (undefined until loaded). */
  ownedQuantities?: ReadonlyMap<string, number>
  onAdd: (id: UpgradeId, quantity: number) => void
  onRemove: (id: UpgradeId) => void
  onQuantityChange: (id: UpgradeId, quantity: number) => void
  ranges?: ReactNode
  issues: readonly GoalFormIssueView[]
  preview: ResourcePreview
  sources?: ReactNode
  mythic?: ReactNode
  note?: ReactNode
}) {
  const { t } = useTranslation()
  const available = useMemo<RarityComboboxItem<UpgradeId>[]>(() => {
    const selected = new Set(targets.map((target) => target.upgradeId))
    return [...choices.entries()]
      .filter(([id]) => !selected.has(id))
      .map(([id, quantity]) => {
        const upgrade = upgradesById.get(id)
        return {
          id,
          name: upgrade?.label ?? id,
          rarity: upgrade?.rarity ?? "Common",
          meta: (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t("goals.create.upgrade.required", { count: quantity })}
            </span>
          ),
        }
      })
  }, [choices, targets, upgradesById, t])
  const lastLocked = mode === "edit" && targets.length <= 1

  return (
    <div className="grid gap-3">
      {ranges}
      <div className="grid gap-2" data-testid="goal-card-target">
        {targets.length > 0 ? (
          targets.map((target) => {
            const id = target.upgradeId as UpgradeId
            const field = `quantity-${id}`
            return (
              <UpgradeQuantityRow
                error={
                  issues.find(
                    (issue) => issue.kind === "Upgrade" && issue.field === field
                  )?.message
                }
                inputId={goalFieldId("Upgrade", field)}
                key={id}
                onQuantityChange={(quantity) => onQuantityChange(id, quantity)}
                onRemove={() => onRemove(id)}
                owned={
                  ownedQuantities ? (ownedQuantities.get(id) ?? 0) : undefined
                }
                quantity={target.quantity}
                removeDisabledReason={
                  lastLocked ? t("goals.target.removeLast") : undefined
                }
                testId={`create-goal-upgrade-target-${id}`}
                upgrade={upgradesById.get(id)}
                upgradeId={id}
              />
            )
          })
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("goals.create.upgrade.empty")}
          </p>
        )}
        {available.length > 0 ? (
          <RarityCombobox
            emptyText={t("goals.create.upgrade.addEmpty")}
            items={available}
            onChange={(id) => onAdd(id, Math.max(1, choices.get(id) ?? 1))}
            placeholder={t("goals.create.upgrade.add")}
            triggerProps={fieldIssueProps(issues, "Upgrade", "materials")}
            renderIcon={(id) => {
              const upgrade = upgradesById.get(id)
              return (
                <UpgradeIcon
                  className="size-6 shrink-0"
                  crafted={upgrade?.crafted}
                  id={id}
                  rarity={upgrade?.rarity}
                />
              )
            }}
          />
        ) : null}
        <FieldIssues field="materials" issues={issues} kind="Upgrade" />
      </div>
      {targets.length > 0 ? (
        <ResourcePreviewSection
          emptyText={t("goals.create.upgrade.noResources")}
          preview={preview}
          testId="create-goal-upgrade-preview"
        />
      ) : null}
      {sources}
      {mythic}
      {note}
    </div>
  )
}
