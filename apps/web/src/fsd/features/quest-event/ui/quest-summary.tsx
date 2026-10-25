import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Progress } from "@workspace/ui/components/progress"

import type { QuestScore } from "../model/quest-score"

/**
 * The points total against the quest's maximum, the crates it opens and the points to the next one,
 * and the battles where points are left (most first), each selecting its battle. `crateCount` null
 * (crates loading or failed) shows a dash for the crate line only.
 */
export function QuestSummary({
  score,
  crateCount,
  onSelect,
  saveFailed,
}: {
  score: QuestScore
  crateCount: number | null
  onSelect: (battle: number) => void
  saveFailed: boolean
}) {
  const { t, i18n } = useTranslation("quest")
  const number = new Intl.NumberFormat(i18n.language)
  return (
    <section
      aria-labelledby="quest-summary-title"
      className="flex min-w-0 flex-col gap-3 rounded-xl border p-4"
      data-testid="quest-summary"
    >
      <h3 className="font-semibold" id="quest-summary-title">
        {t("summary.title")}
      </h3>
      <p
        className="text-2xl font-semibold tabular-nums"
        data-testid="quest-summary-total"
      >
        {t("summary.total", {
          total: number.format(score.total),
          max: number.format(score.max),
        })}
      </p>
      <Progress
        aria-label={t("summary.title")}
        value={score.max > 0 ? (score.total / score.max) * 100 : 0}
      />
      <p className="text-sm" data-testid="quest-summary-crates">
        {crateCount === null ? (
          t("summary.cratesUnknown")
        ) : (
          <>
            {t("summary.crates", {
              opened: number.format(score.cratesOpened),
              count: number.format(crateCount),
            })}
            {score.nextCrate ? (
              <span className="text-muted-foreground">
                {" · "}
                {t("summary.nextCrate", {
                  points: number.format(score.nextCrate.pointsLeft),
                  number: score.nextCrate.number,
                })}
              </span>
            ) : null}
          </>
        )}
      </p>
      {score.pointsLeft.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-medium">{t("summary.pointsLeft")}</h4>
          <ul
            className="flex flex-wrap gap-1.5"
            data-testid="quest-points-left"
          >
            {score.pointsLeft.map((battle) => (
              <li key={battle.number}>
                <button
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  data-battle={battle.number}
                  onClick={() => onSelect(battle.number)}
                  type="button"
                >
                  <span className="font-medium">
                    {t("battles.battle", { number: battle.number })}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {t("summary.pointsLeftRow", {
                      left: number.format(battle.left),
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {saveFailed ? (
        <Alert data-testid="quest-save-failed" variant="destructive">
          <AlertDescription>{t("summary.saveFailed")}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
