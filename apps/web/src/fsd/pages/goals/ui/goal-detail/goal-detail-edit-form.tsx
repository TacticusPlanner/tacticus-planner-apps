import { useTranslation } from "react-i18next"
import { rankAt } from "@workspace/game-domain"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

import type { FarmingStrategy, GoalDetail } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"

import { additionalTargetFromWire } from "@/features/goal-farming"
import { FarmingStrategyField } from "../create-goal/farming-strategy-field"
import { GoalLevelSummary } from "../create-goal/goal-level-summary"
import { GoalLocationsField } from "../create-goal/goal-locations-field"
import { GoalProjectsField } from "../projects/goal-projects-field"

export type GoalDetailDraft = {
  notes: string
  selectedLocations: string[]
  selectedProjectIds: string[]
  farmingStrategy: FarmingStrategy
}

/**
 * Edit mode's form — only the properties a user can actually change (plan §5). Split out of
 * `goal-detail-sheet.tsx` to keep that file under this repo's max-lines rule; unchanged from what
 * used to be the sheet's single always-editable body, now gated behind the sheet's Edit action.
 */
export function GoalDetailEditForm({
  detail,
  draft,
  onDraftChange,
  projects,
  projectsValid,
  isRank,
  isLevel,
  isUnlock,
  allLocations,
  overrideValid,
}: {
  detail: GoalDetail
  draft: GoalDetailDraft
  onDraftChange: (next: GoalDetailDraft) => void
  projects: ProjectSummary[]
  projectsValid: boolean
  isRank: boolean
  isLevel: boolean
  isUnlock: boolean
  allLocations: string[]
  overrideValid: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className="grid gap-6 px-4 text-sm"
      data-testid="goal-detail-edit-form"
    >
      <Field>
        <FieldLabel htmlFor="goal-notes">{t("goals.detail.notes")}</FieldLabel>
        <Textarea
          id="goal-notes"
          maxLength={200}
          value={draft.notes}
          onChange={(event) =>
            onDraftChange({ ...draft, notes: event.target.value })
          }
        />
        <span className="text-xs text-muted-foreground">
          {draft.notes.length}/200
        </span>
      </Field>

      <GoalProjectsField
        projects={projects}
        selectedProjectIds={draft.selectedProjectIds}
        projectsValid={projectsValid}
        onToggle={(projectId, checked) =>
          onDraftChange({
            ...draft,
            selectedProjectIds: checked
              ? [...draft.selectedProjectIds, projectId]
              : draft.selectedProjectIds.filter((id) => id !== projectId),
          })
        }
      />

      {isRank && detail.config.rank ? (
        <FarmingStrategyField
          abilityActiveEnd={0}
          abilityActiveStart={0}
          abilityPassiveEnd={0}
          abilityPassiveStart={0}
          context="rank"
          farmingStrategy={draft.farmingStrategy}
          onFarmingStrategyChange={(value) =>
            onDraftChange({ ...draft, farmingStrategy: value })
          }
          rankAdditionalTarget={additionalTargetFromWire(
            rankAt(detail.config.rank.end),
            detail.config.rank
          )}
          rankEnd={rankAt(detail.config.rank.end)}
          rankStart={rankAt(detail.config.rank.start)}
        />
      ) : null}

      {isLevel && detail.config.level ? (
        <GoalLevelSummary target={detail.config.level} />
      ) : null}

      {!isRank && !isLevel ? (
        <GoalLocationsField
          allLocations={allLocations}
          isUnlock={isUnlock}
          onToggle={(battleId, checked) =>
            onDraftChange({
              ...draft,
              selectedLocations: checked
                ? [...draft.selectedLocations, battleId]
                : draft.selectedLocations.filter((id) => id !== battleId),
            })
          }
          overrideValid={overrideValid}
          selectedLocations={draft.selectedLocations}
        />
      ) : null}
    </div>
  )
}
