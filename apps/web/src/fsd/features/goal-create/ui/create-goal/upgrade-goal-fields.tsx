import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import type { Rank, UpgradeId } from "@workspace/game-domain"

import type { UpgradeRange } from "@/entities/goal"
import { RankSelect, RarityCombobox, UpgradeIcon } from "@/shared/ui"
import { OptionalRangeField } from "../shared/optional-range-field"
import type { RarityComboboxItem } from "@/shared/ui"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup/@x/goal-create"
import type { MissingUpgradeEntry } from "../../model/goal-creation-form/goal-spec-builder"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { UpgradeQuantityRow } from "../shared/upgrade-quantity-row"
import { PreviewSection } from "../shared/preview-section"
import { FieldIssues } from "./goal-form-issues"
import { fieldIssueProps, goalFieldId } from "./goal-form-issue-ids"

type MowTrackRange = {
  value: UpgradeRange | null
  maxLevel: number
  onChange: (range: UpgradeRange | null) => void
}

const levelOptions = (maxLevel: number) =>
  Array.from({ length: maxLevel }, (_, index) => ({
    value: index + 1,
    label: index + 1,
  }))

/** Repeatable upgrade target list (plan: re-introduced V1 "Upgrade" goal, phase 9+) — an add-a-row
 * picker restricted to `relevantUpgradeQuantities`' keys (already-selected ids excluded, so the
 * picker itself prevents duplicates, and crafted upgrades excluded entirely — an Upgrade goal only
 * ever targets base upgrades, see that map's own doc comment), grouped by rarity via the same
 * searchable-combobox pattern as `UnitCombobox` (`RarityCombobox`). Each option shows how many of
 * that upgrade are actually required in the current scope (`relevantUpgradeQuantities`' values — a
 * Character's own rank-range picker (`rankRange`) or a Mow's whole ability ladder), and selecting
 * one prefills the quantity input with that same amount — still freely editable afterward. There's
 * no day/energy estimate wired up yet (see `computeUpgradeGoalNeed`'s doc comment) — the preview
 * here is upgrades-only. Kept as its own file so `unit-goal-form-fields.tsx` stays under the
 * 800-line ceiling. */
export function UpgradeGoalFields({
  targets,
  relevantUpgradeQuantities,
  upgradesById,
  onAdd,
  onRemove,
  onQuantityChange,
  missingUpgrades,
  rankRange,
  mowRanges,
  ownedQuantities,
  issues = [],
}: {
  targets: { upgradeId: UpgradeId; quantity: number }[]
  relevantUpgradeQuantities: ReadonlyMap<UpgradeId, number>
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  onAdd: (id: UpgradeId, quantity: number) => void
  onRemove: (id: UpgradeId) => void
  onQuantityChange: (id: UpgradeId, quantity: number) => void
  missingUpgrades: MissingUpgradeEntry[]
  /** Character-only — a Mow has no single range that unambiguously covers both ability tracks, so
   * its upgrades stay scoped to the whole ladder (see `relevantUpgradeQuantities`'s own doc
   * comment). */
  rankRange?: {
    start: Rank
    end: Rank
    startOptions: Rank[]
    endOptions: Rank[]
    onStartChange: (rank: Rank) => void
    onEndChange: (rank: Rank) => void
  }
  /** Machine of War only � one optional level range per ability track. */
  mowRanges?: {
    primary: MowTrackRange
    secondary: MowTrackRange
  }
  /** How many of each material the account owns (undefined until the inventory has loaded). */
  ownedQuantities?: ReadonlyMap<UpgradeId, number>
  issues?: readonly GoalFormIssueView[]
}) {
  const { t } = useTranslation()

  const availableItems = useMemo<RarityComboboxItem<UpgradeId>[]>(() => {
    const selectedIds = new Set(targets.map((target) => target.upgradeId))
    return [...relevantUpgradeQuantities.entries()]
      .filter(([id]) => !selectedIds.has(id))
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
  }, [relevantUpgradeQuantities, upgradesById, targets, t])

  return (
    <div className="grid gap-3">
      {rankRange ? (
        <div className="grid grid-cols-2 gap-3">
          <RankSelect
            label={t("goals.create.rank.start")}
            value={rankRange.start}
            options={rankRange.startOptions}
            onChange={rankRange.onStartChange}
          />
          <RankSelect
            label={t("goals.create.rank.end")}
            value={rankRange.end}
            options={rankRange.endOptions}
            onChange={rankRange.onEndChange}
          />
        </div>
      ) : null}

      {mowRanges ? (
        <>
          <OptionalRangeField
            label={t("goals.create.upgrade.range.primary")}
            onChange={mowRanges.primary.onChange}
            options={levelOptions(mowRanges.primary.maxLevel)}
            testId="create-goal-upgrade-range-primary"
            value={mowRanges.primary.value}
          />
          <OptionalRangeField
            label={t("goals.create.upgrade.range.secondary")}
            onChange={mowRanges.secondary.onChange}
            options={levelOptions(mowRanges.secondary.maxLevel)}
            testId="create-goal-upgrade-range-secondary"
            value={mowRanges.secondary.value}
          />
        </>
      ) : null}

      {targets.length > 0 ? (
        <div className="grid gap-2">
          {targets.map((target) => {
            const field = `quantity-${target.upgradeId}`
            return (
              <UpgradeQuantityRow
                error={
                  issues.find(
                    (issue) => issue.kind === "Upgrade" && issue.field === field
                  )?.message
                }
                inputId={goalFieldId("Upgrade", field)}
                key={target.upgradeId}
                onQuantityChange={(quantity) =>
                  onQuantityChange(target.upgradeId, quantity)
                }
                onRemove={() => onRemove(target.upgradeId)}
                owned={
                  ownedQuantities
                    ? (ownedQuantities.get(target.upgradeId) ?? 0)
                    : undefined
                }
                quantity={target.quantity}
                testId={`create-goal-upgrade-target-${target.upgradeId}`}
                upgrade={upgradesById.get(target.upgradeId)}
                upgradeId={target.upgradeId}
              />
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("goals.create.upgrade.empty")}
        </p>
      )}

      {availableItems.length > 0 ? (
        <RarityCombobox
          emptyText={t("goals.create.upgrade.addEmpty")}
          items={availableItems}
          onChange={(id) => onAdd(id, relevantUpgradeQuantities.get(id) ?? 1)}
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

      {targets.length > 0 ? (
        <PreviewSection
          emptyText={t("goals.create.upgrade.noResources")}
          state={missingUpgrades.length > 0 ? "content" : "empty"}
          testId="create-goal-upgrade-preview"
        >
          <ul className="grid gap-0.5 text-muted-foreground">
            {missingUpgrades.map((entry) => (
              <li className="flex items-center gap-1.5" key={entry.id}>
                <UpgradeIcon className="size-6" id={entry.id} />
                {entry.label} × {entry.missing}
              </li>
            ))}
          </ul>
        </PreviewSection>
      ) : null}
    </div>
  )
}
