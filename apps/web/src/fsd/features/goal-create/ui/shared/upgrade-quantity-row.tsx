import { useId } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import type { UpgradeId } from "@workspace/game-domain"

import type { UpgradeWithFarmLocations } from "@/features/rank-lookup/@x/goal-create"
import { UpgradeIcon } from "@/shared/ui"

import {
  isValidUpgradeQuantity,
  MAX_UPGRADE_QUANTITY,
} from "../../model/target-edit/goal-target-edit"

/**
 * One Upgrade material row, shared by creation and the Edit goal dialog: the material, its target
 * quantity with how many the account owns beside it, and a remove control. The quantity is never
 * clamped: a cleared field stays empty (`NaN`) and an invalid value shows its message on this row, and
 * a target at or below the owned count shows a non-blocking "already met" warning.
 */
export function UpgradeQuantityRow({
  upgradeId,
  upgrade,
  quantity,
  owned,
  onQuantityChange,
  onRemove,
  removeDisabledReason,
  inputId,
  error,
  testId,
}: {
  upgradeId: UpgradeId
  upgrade: UpgradeWithFarmLocations | undefined
  quantity: number
  owned: number | undefined
  onQuantityChange: (quantity: number) => void
  onRemove?: () => void
  /** Set when the row can't be removed (the last material of a goal); shown as the control's title. */
  removeDisabledReason?: string
  inputId?: string
  /** The row's quantity message; marks the field invalid. */
  error?: string | null
  testId: string
}) {
  const { t } = useTranslation()
  const fallbackId = useId()
  const id = inputId ?? fallbackId
  const errorId = `${id}-error`
  const warningId = `${id}-warning`
  const alreadyMet =
    !error &&
    owned !== undefined &&
    isValidUpgradeQuantity(quantity) &&
    quantity <= owned

  return (
    <div className="grid gap-1" data-testid={testId}>
      <div className="flex items-center gap-2">
        <UpgradeIcon
          className="size-8 shrink-0"
          crafted={upgrade?.crafted}
          id={upgradeId}
          rarity={upgrade?.rarity}
        />
        <span className="min-w-0 flex-1 text-sm break-words">
          {upgrade?.label ?? upgradeId}
        </span>
        {owned !== undefined ? (
          <span
            className="shrink-0 text-xs text-muted-foreground"
            data-testid={`${testId}-owned`}
          >
            {t("goals.create.upgrade.owned", { count: owned })}
          </span>
        ) : null}
        <Input
          aria-describedby={
            error ? errorId : alreadyMet ? warningId : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-label={t("goals.target.quantity")}
          className="w-24"
          id={id}
          max={MAX_UPGRADE_QUANTITY}
          min={1}
          onChange={(event) =>
            onQuantityChange(
              event.target.value === ""
                ? Number.NaN
                : Number(event.target.value)
            )
          }
          type="number"
          value={Number.isNaN(quantity) ? "" : quantity}
        />
        {onRemove ? (
          <Button
            aria-label={t("goals.create.upgrade.remove")}
            disabled={!!removeDisabledReason}
            onClick={onRemove}
            size="icon"
            title={removeDisabledReason}
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-destructive" id={errorId}>
          {error}
        </p>
      ) : alreadyMet ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid={`${testId}-already-met`}
          id={warningId}
        >
          {t("goals.create.upgrade.alreadyMet")}
        </p>
      ) : null}
    </div>
  )
}
