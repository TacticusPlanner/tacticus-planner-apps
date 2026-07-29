import { useTranslation } from "react-i18next"

import type { LevelTarget } from "@/entities/goal"

/** The current -> target level line for a Level goal's detail view — Level goals are uncosted
 * (plan scope decision), so this is the only per-goal summary they get (no farming strategy or
 * location picker, unlike every other costed goal type). Split out of goal-detail-sheet.tsx purely
 * for that file's own max-lines budget. */
export function GoalLevelSummary({ target }: { target: LevelTarget }) {
  const { t } = useTranslation()

  return (
    <p className="text-muted-foreground" data-testid="goal-detail-level">
      {t("goals.create.level.current")}: {target.start}
      {" → "}
      {t("goals.create.level.target")}: {target.end}
    </p>
  )
}
