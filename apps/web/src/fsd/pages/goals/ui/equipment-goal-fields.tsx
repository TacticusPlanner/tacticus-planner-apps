import { useMemo, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { FieldError } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import type { EquipmentStorageModel } from "@workspace/game-catalog"
import { rarityRank } from "@workspace/game-domain"

import {
  EquipmentIcon,
  RarityCombobox,
  type RarityComboboxItem,
} from "@/shared/ui"

/** The "Equipment" pill's form body — an equipment/relic picker plus a target level, both bounded
 * by that piece's own level count. Uses the same searchable, rarity-grouped combobox as the
 * Upgrade picker (`RarityCombobox`), with each option (and the selected value) shown through
 * `EquipmentIcon` — item art layered under a rarity frame, matching V1's equipment-icon.tsx. Relic
 * pieces sort into their own group above Mythic (a piece's `rarity` still governs its icon frame
 * either way — relic is an orthogonal flag, not itself a `Rarity`). Split out of
 * `create-goal-sheet.tsx` purely for that file's own max-lines budget (same reason
 * `UpgradeGoalFields` lives in its own file). */
export function EquipmentGoalFields({
  equipmentById,
  equipmentId,
  handleEquipmentChange,
  targetLevel,
  setTargetLevel,
  maxLevel,
  status,
  errorMessage,
  handleSubmit,
}: {
  equipmentById: ReadonlyMap<string, EquipmentStorageModel> | undefined
  equipmentId: string | undefined
  handleEquipmentChange: (id: string) => void
  targetLevel: number
  setTargetLevel: (value: number) => void
  maxLevel: number
  status: "idle" | "submitting" | "error"
  errorMessage: string | null
  handleSubmit: (event: FormEvent) => void | Promise<void>
}) {
  const { t } = useTranslation()
  const equipmentItems = useMemo<RarityComboboxItem<string>[]>(
    () =>
      [...(equipmentById?.values() ?? [])].map((item) => ({
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        group: item.isRelic
          ? {
              key: "Relic",
              label: t("goals.create.equipment.relicGroup"),
              rank: rarityRank("Mythic") + 1,
            }
          : undefined,
      })),
    [equipmentById, t]
  )
  const selectedEquipment = equipmentId
    ? equipmentById?.get(equipmentId)
    : undefined

  return (
    <form
      id="create-equipment-goal-form"
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-6"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="mt-2 grid gap-2">
        <RarityCombobox
          emptyText={t("goals.create.equipment.empty")}
          items={equipmentItems}
          onChange={handleEquipmentChange}
          placeholder={t("goals.create.equipment.placeholder")}
          renderIcon={(id) => {
            const equipment = equipmentById?.get(id)
            return (
              <EquipmentIcon
                className="size-6 shrink-0"
                id={id}
                isRelic={equipment?.isRelic}
                rarity={equipment?.rarity}
              />
            )
          }}
          value={equipmentId}
        />
      </div>

      {selectedEquipment ? (
        <div className="grid gap-2">
          <Label>{t("goals.create.equipment.targetLevel")}</Label>
          <div className="flex items-center gap-2">
            <EquipmentIcon
              className="size-8 shrink-0"
              id={selectedEquipment.id}
              isRelic={selectedEquipment.isRelic}
              rarity={selectedEquipment.rarity}
            />
            <Input
              data-testid="create-goal-equipment-target-level"
              max={maxLevel}
              min={2}
              onChange={(event) => setTargetLevel(Number(event.target.value))}
              type="number"
              value={targetLevel}
            />
          </div>
        </div>
      ) : null}

      {status === "error" && errorMessage ? (
        <FieldError data-testid="create-goal-equipment-error">
          {errorMessage}
        </FieldError>
      ) : null}
    </form>
  )
}
