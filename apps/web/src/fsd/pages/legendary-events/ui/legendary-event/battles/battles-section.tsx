import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

import { BattleMap } from "./battle-map"
import { BattleSelector } from "./battle-selector"
import { BattleHeader, BattleWaves } from "./battle-waves"
import type { BattlesViewModel } from "./battles.view-model"

/**
 * A lane tab's Battles section (spec: legendary-event-battle-preview), after Synced progress and
 * before the leaderboard: the battle selector, then the selected battle's header, map and waves.
 * The heading is the tour target on both forms.
 */
export function BattlesSection({
  laneId,
  battles,
  isMobile,
}: {
  laneId: LegendaryEventLaneId
  battles: BattlesViewModel
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const { state } = battles
  return (
    <section
      aria-labelledby="legendary-event-battles-title"
      className="flex min-w-0 flex-col gap-3"
      data-lane={laneId}
      data-testid="legendary-event-battles-section"
    >
      <h2
        className="scroll-mt-[calc(var(--mobile-header-height)+3rem)] text-lg font-semibold md:scroll-mt-4"
        data-testid="legendary-event-battles"
        id="legendary-event-battles-title"
      >
        {t("battles.title")}
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
  const { t } = useTranslation("legendaryEvents")
  const index = Math.min(
    battles.selectedIndex ?? state.defaultIndex,
    state.battles.length - 1
  )
  const battle = state.battles[index]
  if (!battle) return null
  const map = (
    <BattleMap
      alt={t("battles.map.alt", {
        lane: t(`lanes.${laneId}`),
        number: battle.number,
      })}
      isMobile={isMobile}
      mapId={battle.mapId}
      onOpenChange={battles.onMapOpenChange}
      open={battles.mapOpen}
    />
  )
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="battle-preview">
      <BattleSelector
        battles={state.battles}
        isMobile={isMobile}
        onSelect={battles.onSelect}
        selectedIndex={index}
      />
      <BattleHeader battle={battle} />
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
    </div>
  )
}
