import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import type { Rank, UpgradeId } from "@workspace/game-domain"

import { RankSelect, RarityCombobox, UpgradeIcon } from "@/shared/ui"
import type { RarityComboboxItem } from "@/shared/ui"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"
import type { MissingUpgradeEntry } from "../model/goal-spec-builder"

/** Repeatable upgrade target list (plan: re-introduced V1 "Upgrade" goal, phase 9+) — an add-a-row
 * picker restricted to `relevantUpgradeQuantities`' keys (already-selected ids excluded, so the
 * picker itself prevents duplicates, and crafted upgrades excluded entirely — an Upgrade goal only
 * ever targets base upgrades, see that map's own doc comment), grouped by rarity via the same
 * searchable-combobox pattern as `UnitCombobox` (`RarityCombobox`). Each option shows how many of
 * that upgrade are actually required in the current scope (`relevantUpgradeQuantities`' values — a
 * Character's own rank-range picker (`rankRange`) or a Mow's whole ability ladder), and selecting
 * one prefills the quantity input with that same amount — still freely editable afterward. There's
 * no day/energy estimate wired up yet (see `computeUpgradeGoalNeed`'s doc comment) — the preview
 * here is upgrades-only. Split out of `goal-type-fields.tsx` purely for that file's own max-lines
 * budget. */
export function UpgradeGoalFields({
  targets,
  relevantUpgradeQuantities,
  upgradesById,
  onAdd,
  onRemove,
  onQuantityChange,
  missingUpgrades,
  rankRange,
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

      {targets.length > 0 ? (
        <div className="grid gap-2">
          {targets.map((target) => {
            const upgrade = upgradesById.get(target.upgradeId)
            return (
              <div
                className="flex items-center gap-2"
                data-testid={`create-goal-upgrade-target-${target.upgradeId}`}
                key={target.upgradeId}
              >
                <UpgradeIcon
                  className="size-8 shrink-0"
                  crafted={upgrade?.crafted}
                  id={target.upgradeId}
                  rarity={upgrade?.rarity}
                />
                <span className="flex-1 truncate text-sm">
                  {upgrade?.label ?? target.upgradeId}
                </span>
                <Input
                  aria-label={t("goals.create.upgrade.quantity")}
                  className="w-20"
                  max={10000}
                  min={1}
                  onChange={(event) =>
                    onQuantityChange(
                      target.upgradeId,
                      Math.max(1, Number(event.target.value))
                    )
                  }
                  type="number"
                  value={target.quantity}
                />
                <Button
                  aria-label={t("goals.create.upgrade.remove")}
                  onClick={() => onRemove(target.upgradeId)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X />
                </Button>
              </div>
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

      {missingUpgrades.length > 0 ? (
        <div
          className="grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-upgrade-preview"
        >
          <p className="font-medium">{t("goals.create.previewTitle")}</p>
          <ul className="grid gap-0.5 text-muted-foreground">
            {missingUpgrades.map((entry) => (
              <li className="flex items-center gap-1.5" key={entry.id}>
                <UpgradeIcon className="size-6" id={entry.id} />
                {entry.label} × {entry.missing}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
