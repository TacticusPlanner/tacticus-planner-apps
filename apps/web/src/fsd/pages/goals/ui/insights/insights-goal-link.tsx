import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { goalHref } from "./insights-view"

/** A goal named "<unit> · <goal type>", opening its edit dialog on the Goals list. */
export function GoalLink({
  goalId,
  label,
}: {
  goalId: string
  label: { name: string; goalType: string } | null
}) {
  const { t } = useTranslation()
  return (
    <Link
      className="min-w-0 truncate underline-offset-4 hover:underline"
      to={goalHref(goalId)}
    >
      {label
        ? t("goals.insights.goalLabel", label)
        : t("goals.insights.unknownGoal")}
    </Link>
  )
}
