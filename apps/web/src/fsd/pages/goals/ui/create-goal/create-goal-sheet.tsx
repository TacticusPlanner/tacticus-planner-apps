import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Spinner } from "@workspace/ui/components/spinner"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import { useCreateEquipmentGoalForm } from "../../model/goal-creation-form/use-create-equipment-goal-form"
import { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import type { CreateGoalPrefill } from "../../model/goal-creation-form/create-goal-launcher-context"
import { EquipmentGoalFields } from ".//equipment-goal-fields"
import { UnitGoalFormFields } from ".//unit-goal-form-fields"

type Pill = "Unit" | "Equipment"

type CreateGoalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful, non-"create another" save so the caller can refresh its list. */
  onCreated: () => void
  prefill?: CreateGoalPrefill
}

/**
 * Goal-creation side panel — a Unit/Equipment top-level pill switch over two independent forms:
 * "Unit" is the combined multi-goal-type composer (plan §6/§16 phase 5) for a single Character or
 * Mow (picked from one combined combobox — its actual kind is inferred, not chosen via a separate
 * tab — and which goal kinds are offered depends on that inferred kind, e.g. Rank never for a Mow),
 * "Equipment" is a single equipment/relic piece plus a target level. Both forms' hooks run
 * unconditionally (hooks can't be called conditionally); only the active pill's fields/submit are
 * shown. Mirrors `manage-account-dialog.tsx`'s controlled-form shape (reset-and-stay-open on
 * "create another", Unit pill only), but hosted in a `Sheet` instead of a `Dialog`.
 */
export function CreateGoalSheet({
  open,
  onOpenChange,
  onCreated,
  prefill,
}: CreateGoalSheetProps) {
  const { t } = useTranslation()
  const [pill, setPill] = useState<Pill>("Unit")
  const form = useCreateGoalForm({ open, onOpenChange, onCreated, prefill })
  const equipmentForm = useCreateEquipmentGoalForm({
    open,
    onOpenChange,
    onCreated,
  })

  const unitIcon = (id: UnitId) =>
    form.charactersById?.has(id) ? characterIcon(id) : mowIcon(id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-testid="create-goal-sheet"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{t("goals.create.title")}</SheetTitle>
        </SheetHeader>

        <Tabs
          className="px-6"
          onValueChange={(value) => setPill(value as Pill)}
          value={pill}
        >
          <TabsList>
            <TabsTrigger data-testid="create-goal-pill-unit" value="Unit">
              {t("goals.create.entityType.unit")}
            </TabsTrigger>
            <TabsTrigger
              data-testid="create-goal-pill-equipment"
              value="Equipment"
            >
              {t("goals.create.entityType.equipment")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {pill === "Unit" ? (
          <UnitGoalFormFields form={form} unitIcon={unitIcon} />
        ) : (
          <EquipmentGoalFields
            equipmentById={equipmentForm.equipmentById}
            equipmentId={equipmentForm.equipmentId}
            handleEquipmentChange={equipmentForm.handleEquipmentChange}
            targetLevel={equipmentForm.targetLevel}
            setTargetLevel={equipmentForm.setTargetLevel}
            maxLevel={equipmentForm.maxLevel}
            ownedByLevel={equipmentForm.ownedByLevel}
            status={equipmentForm.status}
            errorMessage={equipmentForm.errorMessage}
            handleSubmit={equipmentForm.handleSubmit}
          />
        )}

        <SheetFooter>
          {pill === "Unit" ? (
            <Field orientation="horizontal">
              <Checkbox
                id="create-goal-another"
                checked={form.createAnother}
                onCheckedChange={(checked) =>
                  form.setCreateAnother(checked === true)
                }
              />
              <FieldLabel
                className="font-normal text-muted-foreground"
                htmlFor="create-goal-another"
              >
                {t("goals.create.createAnother")}
              </FieldLabel>
            </Field>
          ) : null}
          <Button
            data-testid="create-goal-submit"
            disabled={
              pill === "Unit"
                ? !form.canSubmit || form.status === "submitting"
                : !equipmentForm.canSubmit ||
                  equipmentForm.status === "submitting"
            }
            form={
              pill === "Unit"
                ? "create-goal-form"
                : "create-equipment-goal-form"
            }
            type="submit"
          >
            {(pill === "Unit" ? form.status : equipmentForm.status) ===
            "submitting" ? (
              <Spinner />
            ) : null}
            {t("goals.create.submit")}
          </Button>
          <Button
            data-testid="create-goal-close"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("goals.create.close")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
