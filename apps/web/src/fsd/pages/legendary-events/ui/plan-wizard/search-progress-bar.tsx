import { useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { Progress } from "@workspace/ui/components/progress"

import { remainingTime, type SearchProgressStore } from "./search-progress"

/** The upgrade search's progress (spec: the search shows its progress): a bar, the upgrade being
 *  looked for and, once there is enough to go on, at most how long is left. Before the search
 *  reports anything (run inputs settling, farming times loading) the bar is indeterminate. */
export function SearchProgressBar({ store }: { store: SearchProgressStore }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const progress = useSyncExternalStore(store.subscribe, store.get)
  const started = progress !== null && progress.fraction > 0
  const time =
    progress?.remainingMs == null ? null : remainingTime(progress.remainingMs)
  return (
    <div
      className="flex flex-col gap-1.5"
      data-testid="plan-wizard-search-progress"
    >
      <Progress
        aria-label={t("planWizard.target.searchProgressLabel")}
        className={started ? undefined : "animate-pulse"}
        value={started ? Math.round(progress.fraction * 100) : null}
      />
      <p className="text-xs text-muted-foreground">
        {started
          ? t("planWizard.target.searchProgress", {
              round: progress.round,
              cap: progress.cap,
            })
          : t("planWizard.target.estimating")}
        {started && time
          ? ` · ${t("planWizard.target.searchTimeLeft", {
              time: new Intl.NumberFormat(i18n.language, {
                style: "unit",
                unit: time.unit,
                unitDisplay: "long",
              }).format(time.value),
            })}`
          : null}
      </p>
    </div>
  )
}
