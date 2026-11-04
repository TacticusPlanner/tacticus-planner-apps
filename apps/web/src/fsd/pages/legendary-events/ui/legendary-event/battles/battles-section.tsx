import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

import { BattleMap } from "./battle-map"
import { BattleSelector } from "./battle-selector"
import { BattleHeader, BattleWaves } from "./battle-waves"
import type {
  BattlePreviewViewModel,
  BattlesViewModel,
} from "./battles.view-model"

/**
 * A lane's Battles section on Plan (spec: legendary-event-battle-preview): the battle selector,
 * then the selected battle's header, map and waves. With `showLane` (more than one lane shown)
 * the heading names the lane. The heading is the tour target on both forms.
 */
export function BattlesSection({
  laneId,
  battles,
  isMobile,
  showLane = false,
}: {
  laneId: LegendaryEventLaneId
  battles: BattlesViewModel
  isMobile: boolean
  showLane?: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const { state } = battles
  const titleId = `legendary-event-battles-title-${laneId}`
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-3"
      data-lane={laneId}
      data-testid="legendary-event-battles-section"
    >
      <h2
        className="scroll-mt-[calc(var(--mobile-header-height)+3rem)] text-lg font-semibold md:scroll-mt-4"
        data-testid="legendary-event-battles"
        id={titleId}
      >
        {showLane
          ? t("battles.titleLane", { lane: t(`lanes.${laneId}`) })
          : t("battles.title")}
      </h2>
      {state.kind === "loading" ? (
        <div data-testid="battles-loading">
          <span className="sr-only">{t("battles.loading")}</span>
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="mt-3 h-64 w-full rounded-xl" />
        </div>
      ) : state.kind === "error" ? (
        <div
          className="flex flex-col items-start gap-2"
          data-testid="battles-error"
        >
          <p className="text-sm text-destructive">{t("battles.error")}</p>
          <Button onClick={state.retry} variant="outline">
            {t("hub.retry")}
          </Button>
        </div>
      ) : state.kind === "empty" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="battles-empty"
        >
          {t("battles.empty")}
        </p>
      ) : (
        <ReadyBattles
          battles={battles}
          isMobile={isMobile}
          laneId={laneId}
          state={state}
        />
      )}
    </section>
  )
}

function ReadyBattles({
  laneId,
  battles,
  state,
  isMobile,
}: {
  laneId: LegendaryEventLaneId
  battles: BattlesViewModel
  state: Extract<BattlesViewModel["state"], { kind: "ready" }>
  isMobile: boolean
}) {
  const index = Math.min(
    battles.selectedIndex ?? state.defaultIndex,
    state.battles.length - 1
  )
  const battle = state.battles[index]
  if (!battle) return null
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="battle-preview">
      <BattleSelector
        battles={state.battles}
        isMobile={isMobile}
        onSelect={battles.onSelect}
        selectedIndex={index}
      />
      <BattlePreview
        battle={battle}
        isMobile={isMobile}
        laneId={laneId}
        mapOpen={battles.mapOpen}
        onMapOpenChange={battles.onMapOpenChange}
        retryNpcs={state.retryNpcs}
      />
    </div>
  )
}

/** One battle's preview: its header, map and waves (the map beside the waves on desktop). The
 *  Battles section and the battle info dialog both draw it. */
export function BattlePreview({
  laneId,
  battle,
  retryNpcs,
  isMobile,
  mapOpen,
  onMapOpenChange,
}: {
  laneId: LegendaryEventLaneId
  battle: BattlePreviewViewModel
  retryNpcs: (() => void) | undefined
  isMobile: boolean
  mapOpen: boolean
  onMapOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const map = (
    <BattleMap
      alt={t("battles.map.alt", {
        lane: t(`lanes.${laneId}`),
        number: battle.number,
      })}
      isMobile={isMobile}
      mapId={battle.mapId}
      onOpenChange={onMapOpenChange}
      open={mapOpen}
    />
  )
  return (
    <>
      <BattleHeader battle={battle} />
      {retryNpcs ? (
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="battles-npcs-error"
        >
          <p className="text-sm text-destructive">{t("battles.npcsError")}</p>
          <Button onClick={retryNpcs} size="sm" variant="outline">
            {t("hub.retry")}
          </Button>
        </div>
      ) : null}
      {isMobile ? (
        <>
          {map}
          <BattleWaves battle={battle} isMobile />
        </>
      ) : (
        <div className="flex min-w-0 items-start gap-4">
          {map}
          <div className="min-w-0 flex-1">
            <BattleWaves battle={battle} isMobile={false} />
          </div>
        </div>
      )}
    </>
  )
}
