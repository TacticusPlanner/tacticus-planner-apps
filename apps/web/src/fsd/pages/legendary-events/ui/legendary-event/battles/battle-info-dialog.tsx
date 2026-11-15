import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type {
  LegendaryEventLane,
  LegendaryEventLaneId,
} from "@/entities/legendary-event"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { adjacentBattle, type BattleInfoTarget } from "./battle-info-target"
import { BattlePreview } from "./battles-section"
import type { BattlesViewModel } from "./battles.view-model"

/**
 * The battle info dialog, opened from a Token plan row, the Next token card or its next tokens:
 * that one battle's header, map and waves, from the same `lre-battles` read as the Plan tab's
 * Battles section. Previous / Next step through the lane's battles; on mobile a Close button sits
 * at the bottom beside them.
 */
export function BattleInfoDialog({
  event,
  target,
  battles,
  isMobile,
  onClose,
  onChange,
}: {
  event: Record<LegendaryEventLaneId, Pick<LegendaryEventLane, "battlesPoints">>
  target: BattleInfoTarget | null
  battles: Partial<Record<LegendaryEventLaneId, BattlesViewModel>>
  isMobile: boolean
  onClose: () => void
  /** Shows another battle of the lane. */
  onChange: (target: BattleInfoTarget) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const lane = target ? battles[target.laneId] : undefined
  const state = lane?.state
  // The dialog's own Map disclosure, apart from Plan's Battles section.
  const [mapOpen, setMapOpen] = useState(false)
  // By number, not position: the ready list leaves out battles the read did not serve.
  const battle =
    target && state?.kind === "ready"
      ? state.battles.find((entry) => entry.number === target.battleIndex + 1)
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
            mapOpen={mapOpen}
            onMapOpenChange={setMapOpen}
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
      {target ? (
        <BattleInfoNav
          battleCount={event[target.laneId].battlesPoints.length}
          isMobile={isMobile}
          onChange={onChange}
          onClose={onClose}
          target={target}
        />
      ) : null}
    </ResponsiveDialog>
  )
}

function BattleInfoNav({
  target,
  battleCount,
  isMobile,
  onChange,
  onClose,
}: {
  target: BattleInfoTarget
  battleCount: number
  isMobile: boolean
  onChange: (target: BattleInfoTarget) => void
  onClose: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const previous = adjacentBattle(target, battleCount, -1)
  const next = adjacentBattle(target, battleCount, 1)
  return (
    <ResponsiveDialogFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t md:justify-between">
      <Button
        data-testid="battle-info-previous"
        disabled={!previous}
        onClick={() => previous && onChange(previous)}
        size={isMobile ? "default" : "sm"}
        type="button"
        variant="outline"
      >
        <ChevronLeft aria-hidden="true" />
        {t("battleInfo.previous")}
      </Button>
      {isMobile ? (
        <Button
          data-testid="battle-info-close"
          onClick={onClose}
          type="button"
          variant="secondary"
        >
          {t("battleInfo.close")}
        </Button>
      ) : null}
      <Button
        data-testid="battle-info-next"
        disabled={!next}
        onClick={() => next && onChange(next)}
        size={isMobile ? "default" : "sm"}
        type="button"
        variant="outline"
      >
        {t("battleInfo.next")}
        <ChevronRight aria-hidden="true" />
      </Button>
    </ResponsiveDialogFooter>
  )
}
