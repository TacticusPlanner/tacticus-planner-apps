import { Fragment } from "react"
import { Minus, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { campaignIcon } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Slider } from "@workspace/ui/components/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { CampaignEventProgressSource } from "@/entities/player-data-override"
import { EntityIcon } from "@/shared/ui"

import type {
  EventType,
  OverridePatch,
  TrackView,
} from "../model/campaign-events.model"

export type PatchTrack = (
  groupId: string,
  type: EventType,
  patch: OverridePatch
) => void

function SourceBadge({
  source,
  testId,
}: {
  source: CampaignEventProgressSource
  testId?: string
}) {
  const { t } = useTranslation()
  return (
    <Badge
      variant={source === "manual" ? "default" : "outline"}
      className={source === "none" ? "text-muted-foreground" : undefined}
      data-testid={testId}
      data-source={source}
    >
      {t(`progress.events.source.${source}`)}
    </Badge>
  )
}

export function EventTrackEditor({
  groupId,
  type,
  track,
  onPatch,
  testIdPrefix,
}: {
  groupId: string
  type: EventType
  track: TrackView
  onPatch: PatchTrack
  testIdPrefix: string
}) {
  const { t } = useTranslation(["common", "campaigns"])
  const typeLabel = t(`campaigns:difficulties.event${type}`)
  const { battles, progress } = track
  const total = battles.regular.length
  const count = Math.min(progress.completedBattleCount, total)
  const setCount = (value: number) =>
    onPatch(groupId, type, {
      completedBattleCount: Math.max(0, Math.min(total, value)),
    })
  const toggleChallenge = (id: string) => {
    const current = new Set(progress.completedChallengeBattlesIds)
    if (current.has(id)) current.delete(id)
    else current.add(id)
    onPatch(groupId, type, { completedChallengeBattlesIds: [...current] })
  }
  const empty = total === 0 && battles.challenges.length === 0

  return (
    <section
      className="min-w-0 space-y-4 rounded-xl border p-4"
      data-testid={`${testIdPrefix}-track-${type}`}
    >
      <div className="flex items-center gap-2">
        <EntityIcon
          src={campaignIcon(groupId as CampaignId, type)}
          alt=""
          className="size-8"
        />
        <h3 className="font-semibold">{typeLabel}</h3>
      </div>

      {empty ? (
        <p className="text-sm text-muted-foreground">
          {t("progress.events.noBattles")}
        </p>
      ) : null}

      {total > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-1">{t("progress.events.regular")}</span>
            <strong
              className="tabular-nums"
              data-testid={`${testIdPrefix}-${type}-count`}
            >
              {count}/{total}
            </strong>
            <SourceBadge
              source={progress.battleSource}
              testId={`${testIdPrefix}-${type}-battle-source`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={t("progress.events.decrease", { type: typeLabel })}
              disabled={count <= 0}
              onClick={() => setCount(count - 1)}
            >
              <Minus />
            </Button>
            <Slider
              className="flex-1"
              value={[count]}
              min={0}
              max={total}
              step={1}
              aria-label={t("progress.events.slider", { type: typeLabel })}
              onValueChange={([value]) => setCount(value ?? 0)}
            />
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={t("progress.events.increase", { type: typeLabel })}
              disabled={count >= total}
              onClick={() => setCount(count + 1)}
            >
              <Plus />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={count >= total}
              aria-label={t("progress.events.maxFor", { type: typeLabel })}
              onClick={() => setCount(total)}
            >
              {t("progress.events.max")}
            </Button>
          </div>
          {progress.battleSource === "manual" ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-auto px-0 text-xs text-muted-foreground"
              onClick={() =>
                onPatch(groupId, type, { completedBattleCount: null })
              }
            >
              {t("progress.events.resetToSynced")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {battles.challenges.length > 0 ? (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-1">{t("progress.events.challenges")}</span>
            <strong className="tabular-nums">
              {track.completedChallenges}/{battles.challenges.length}
            </strong>
            <SourceBadge
              source={progress.challengeSource}
              testId={`${testIdPrefix}-${type}-challenge-source`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {battles.challenges.map((battle, index) => {
              const selected = progress.completedChallengeBattlesIds.includes(
                battle.id
              )
              const nodeLabel = t("progress.events.challengeNode", {
                id: battle.id,
              })
              const nodeLabelId = `${testIdPrefix}-${battle.id}-node`
              return (
                <Fragment key={battle.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        aria-pressed={selected}
                        aria-describedby={nodeLabelId}
                        onClick={() => toggleChallenge(battle.id)}
                      >
                        {t("progress.events.challengeN", { n: index + 1 })}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{nodeLabel}</TooltipContent>
                  </Tooltip>
                  <span id={nodeLabelId} className="sr-only">
                    {nodeLabel}
                  </span>
                </Fragment>
              )
            })}
          </div>
          {progress.challengeSource === "manual" ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-auto px-0 text-xs text-muted-foreground"
              onClick={() =>
                onPatch(groupId, type, { completedChallengeBattlesIds: null })
              }
            >
              {t("progress.events.resetToSynced")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
