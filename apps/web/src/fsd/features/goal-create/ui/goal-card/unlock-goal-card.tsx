import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

/**
 * An Unlock goal as both dialogs show it: what unlocking means for the unit, then its shard
 * requirement and sources (none for a Machine of War, whose unlock cost isn't supported) and the
 * note. Unlock has no target to change.
 */
export function UnlockGoalCard({
  entityType,
  requirement,
  sources,
  note,
}: {
  entityType: "Character" | "Mow"
  requirement?: ReactNode
  sources?: ReactNode
  note?: ReactNode
}) {
  const { t } = useTranslation()
  const isMow = entityType === "Mow"

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        {t("goals.create.unlockDescription", {
          context: isMow ? "mow" : undefined,
        })}
      </p>
      {isMow ? (
        <p className="text-xs text-muted-foreground">
          {t("goals.create.unlockCostUnsupportedMow")}
        </p>
      ) : (
        <>
          {requirement}
          {sources}
        </>
      )}
      {note}
    </div>
  )
}
