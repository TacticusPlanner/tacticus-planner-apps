import { useTranslation } from "react-i18next"

import type { LevelRequirementPreview } from "../../model/goal-creation-form/use-level-requirement-preview"

/** The level a Rank/Ability target needs, on that goal's own creation card — required level, current
 * level, the raw XP gap, and (after owned XP books) the books and gold still to apply. Ordinary
 * information on the goal: it is never a goal of its own, a suggestion, or a blocker
 * (integrate-level-progression-into-rank-goals). Renders nothing once the level is sufficient. */
export function LevelRequirementNote({
  preview,
}: {
  preview: LevelRequirementPreview | undefined
}) {
  const { t, i18n } = useTranslation()
  if (!preview) return null
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n?.resolvedLanguage).format(value)

  return (
    <div
      className="grid gap-0.5 rounded-2xl border p-3 text-sm"
      data-testid="create-goal-level-requirement"
    >
      <p className="font-medium">
        {t("goals.create.levelRequirement.title", {
          required: preview.requiredLevel,
          current: preview.currentLevel,
        })}
      </p>
      <p>
        {t("goals.create.levelRequirement.xpRemaining", {
          xp: fmt(preview.remainingXp),
        })}
      </p>
      {preview.cost ? (
        <>
          <p data-testid="create-goal-level-cost">
            {t("goals.create.level.booksNeeded", { count: preview.cost.books })}
          </p>
          <p>
            {t("goals.create.level.goldToApply", { gold: preview.cost.gold })}
          </p>
        </>
      ) : null}
      <p className="text-xs font-normal text-muted-foreground">
        {t("goals.create.levelRequirement.note")}
      </p>
    </div>
  )
}
