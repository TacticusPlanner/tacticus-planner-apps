import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { BattlePreview } from "./battles-section"
import type { BattlesViewModel } from "./battles.view-model"

/** The battle a token's battle button asked for (0-based index in its lane). */
export interface BattleInfoTarget {
  laneId: LegendaryEventLaneId
  battleIndex: number
}

/**
 * The battle info dialog, opened from a Token plan row, the Next token card or its next tokens:
 * that one battle's header, map and waves, from the same `lre-battles` read as the Plan tab's
 * Battles section.
 */
export function BattleInfoDialog({
  target,
  battles,
  isMobile,
  onClose,
}: {
  target: BattleInfoTarget | null
  battles: Partial<Record<LegendaryEventLaneId, BattlesViewModel>>
  isMobile: boolean
  onClose: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const lane = target ? battles[target.laneId] : undefined
  const state = lane?.state
  const battle =
    target && state?.kind === "ready"
      ? state.battles[target.battleIndex]
      : undefined
  return (
    <ResponsiveDialog
      data-testid="battle-info-dialog"
      desktopClassName="sm:max-w-3xl"
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      open={target !== null}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {target
            ? t("battleInfo.title", {
                lane: t(`lanes.${target.laneId}`),
                battle: target.battleIndex + 1,
              })
            : null}
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="flex min-w-0 flex-col gap-3 pb-6">
        {target && lane && battle && state?.kind === "ready" ? (
          <BattlePreview
            battle={battle}
            isMobile={isMobile}
            laneId={target.laneId}
            mapOpen={lane.mapOpen}
            onMapOpenChange={lane.onMapOpenChange}
            retryNpcs={state.retryNpcs}
          />
        ) : state?.kind === "error" ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-destructive">{t("battles.error")}</p>
            <Button onClick={state.retry} variant="outline">
              {t("hub.retry")}
            </Button>
          </div>
        ) : state === undefined || state.kind === "loading" ? (
          <div data-testid="battle-info-loading">
            <span className="sr-only">{t("battles.loading")}</span>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("battles.empty")}</p>
        )}
      </ResponsiveDialogBody>
    </ResponsiveDialog>
  )
}
