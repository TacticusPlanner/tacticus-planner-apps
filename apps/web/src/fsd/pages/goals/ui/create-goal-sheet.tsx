import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"

import type { GoalKind } from "@/entities/goal"
import { CharacterCombobox } from "@/shared/ui"

import { useCreateGoalForm } from "../model/use-create-goal-form"
import {
  AbilityGoalFields,
  AscensionGoalFields,
  RankGoalFields,
  ShardsGoalFields,
} from "./goal-type-fields"

const GOAL_KINDS: GoalKind[] = [
  "Rank",
  "Ascension",
  "Ability",
  "Unlock",
  "Shards",
]

type CreateGoalSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful, non-"create another" save so the caller can refresh its list. */
  onCreated: () => void
}

/**
 * Goal-creation side panel — Characters only, combined multi-goal-type composer (plan §6/§7/§16
 * phase 5): toggle any combination of Rank/Ascension/Ability/Unlock/Shards for one character,
 * `useCreateGoalForm`'s `useGoalPrerequisites` auto-suggests Unlock (locked character) and Ascension
 * (unreachable target rank), and the review block below lists everything about to be created before
 * a single combined submit. Mirrors `manage-account-dialog.tsx`'s controlled-form shape
 * (reset-and-stay-open on "create another"), but hosted in a `Sheet` instead of a `Dialog`. All
 * state/handlers live in `useCreateGoalForm`; per-goal-type fields in `./goal-type-fields.tsx` —
 * both kept separate so this file stays presentational and under this repo's max-lines rule.
 */
export function CreateGoalSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateGoalSheetProps) {
  const { t } = useTranslation()
  const form = useCreateGoalForm({ open, onOpenChange, onCreated })

  if (!form.account) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-testid="create-goal-sheet">
        <SheetHeader>
          <SheetTitle>{t("goals.create.title")}</SheetTitle>
        </SheetHeader>

        <form
          id="create-goal-form"
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-6"
          onSubmit={(event) => void form.handleSubmit(event)}
        >
          <div className="grid gap-2">
            <Label>{t("goals.create.characterLabel")}</Label>
            <CharacterCombobox
              groups={form.characterGroups}
              value={form.characterId}
              onChange={form.handleCharacterChange}
              placeholder={t("goals.create.characterPlaceholder")}
              emptyText={t("goals.create.characterEmpty")}
            />
          </div>

          {form.charactersById && form.characterId ? (
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("goals.create.goalTypeLabel")}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_KINDS.map((kind) => (
                  <Field key={kind} orientation="horizontal">
                    <Switch
                      checked={form.enabledTypes.has(kind)}
                      onCheckedChange={(checked) =>
                        form.toggleType(kind, checked)
                      }
                      data-testid={`create-goal-type-toggle-${kind}`}
                    />
                    <FieldLabel className="font-normal">
                      {t(`goals.create.goalTypes.${kind}`)}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            </div>
          ) : null}

          {form.characterId && form.enabledTypes.has("Rank") ? (
            <RankGoalFields
              rankStart={form.rankStart}
              rankEnd={form.rankEnd}
              rankEndOptions={form.rankEndOptions}
              rankStartPointFive={form.rankStartPointFive}
              rankEndPointFive={form.rankEndPointFive}
              onRankStartChange={form.setRankStart}
              onRankEndChange={form.setRankEnd}
              onRankStartPointFiveChange={form.setRankStartPointFive}
              onRankEndPointFiveChange={form.setRankEndPointFive}
              missingUpgrades={form.missingUpgrades}
              estimate={form.estimatePreview}
            />
          ) : null}

          {form.characterId && form.enabledTypes.has("Ascension") ? (
            <AscensionGoalFields
              progressionStart={form.progressionStart}
              progressionEnd={form.progressionEnd}
              onProgressionStartChange={form.setProgressionStart}
              onProgressionEndChange={form.setProgressionEnd}
            />
          ) : null}

          {form.characterId && form.enabledTypes.has("Ability") ? (
            <AbilityGoalFields
              activeStart={form.abilityActiveStart}
              activeEnd={form.abilityActiveEnd}
              passiveStart={form.abilityPassiveStart}
              passiveEnd={form.abilityPassiveEnd}
              onActiveStartChange={form.setAbilityActiveStart}
              onActiveEndChange={form.setAbilityActiveEnd}
              onPassiveStartChange={form.setAbilityPassiveStart}
              onPassiveEndChange={form.setAbilityPassiveEnd}
            />
          ) : null}

          {form.characterId && form.enabledTypes.has("Shards") ? (
            <ShardsGoalFields
              count={form.shardsCount}
              onCountChange={form.setShardsCount}
            />
          ) : null}

          {form.characterId && form.enabledTypes.has("Unlock") ? (
            <p className="text-sm text-muted-foreground">
              {t("goals.create.unlockDescription")}
            </p>
          ) : null}

          {form.characterId && form.reviewItems.length > 0 ? (
            <div
              className="grid gap-1 rounded-2xl border p-3 text-sm"
              data-testid="create-goal-review"
            >
              <p className="font-medium">{t("goals.create.reviewTitle")}</p>
              <ul className="grid gap-0.5 text-muted-foreground">
                {form.reviewItems.map((item) => (
                  <li key={item.goalType}>
                    {t(`goals.create.goalTypes.${item.goalType}`)}
                    {item.autoSuggested ? (
                      <span className="text-xs">
                        {" — "}
                        {t(
                          item.goalType === "Unlock"
                            ? "goals.create.suggestions.unlockRequired"
                            : "goals.create.suggestions.ascensionRequired"
                        )}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {form.characterId ? (
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("goals.create.projectLabel")}
              </Label>
              <Select value={form.projectId} onValueChange={form.setProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={form.defaultProjectValue}>
                    {t("goals.create.projectDefault")}
                  </SelectItem>
                  {form.projects.map((project) => (
                    <SelectItem
                      key={project.projectId}
                      value={project.projectId}
                    >
                      {project.name}
                      {project.isActivePlan
                        ? ` (${t("goals.create.projectActive")})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {form.status === "error" && form.errorMessage ? (
            <FieldError data-testid="create-goal-error">
              {form.errorMessage}
            </FieldError>
          ) : null}
        </form>

        <SheetFooter>
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
          <Button
            data-testid="create-goal-submit"
            disabled={!form.canSubmit || form.status === "submitting"}
            form="create-goal-form"
            type="submit"
          >
            {form.status === "submitting" ? <Spinner /> : null}
            {t("goals.create.submit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
