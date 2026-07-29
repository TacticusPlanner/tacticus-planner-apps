import { useTranslation } from "react-i18next"

import {
  campaignIcon,
  characterIcon,
  type CampaignBattleStorageModel,
} from "@workspace/game-catalog"
import type { CampaignId, UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Progress } from "@workspace/ui/components/progress"
import { Slider } from "@workspace/ui/components/slider"

import type { CampaignEventProgressOverride } from "@/entities/player-data-override"
import { EntityIcon } from "@/shared/ui"

import {
  keyOf,
  type EventModel,
  type EventType,
} from "../model/campaign-events.model"

type UpdatePatch = Partial<
  Pick<
    CampaignEventProgressOverride,
    "completedBattleCount" | "completedChallengeBattlesIds"
  >
>
type UpdateFn = (groupId: string, type: EventType, patch: UpdatePatch) => void

export function EventCard({
  event,
  syncedByKey,
  draftByKey,
  update,
}: {
  event: EventModel
  syncedByKey: Map<
    string,
    PlayerDataChunkDto<"campaign-events-progress">[number]
  >
  draftByKey: Map<string, CampaignEventProgressOverride>
  update: UpdateFn
}) {
  const { t } = useTranslation("campaigns")
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <EntityIcon
          src={campaignIcon(event.definition.groupId as CampaignId, "Standard")}
          alt=""
          className="size-12"
        />
        <div className="flex-1">
          <CardTitle>
            {t(`names.${event.nameKey}`, { defaultValue: event.nameKey })}
          </CardTitle>
        </div>
        <div className="flex gap-1">
          {event.coreCharacters.map((id) => (
            <EntityIcon
              key={id}
              src={characterIcon(id as UnitId)}
              alt={id}
              className="size-9 rounded"
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {(["Standard", "Extremis"] as const).map((type) => {
          const synced = syncedByKey.get(keyOf(event.definition.groupId, type))
          const manual = draftByKey.get(keyOf(event.definition.groupId, type))
          return (
            <EventTrack
              key={type}
              groupId={event.definition.groupId}
              type={type}
              battles={event.tracks[type]}
              completed={
                manual?.completedBattleCount ??
                synced?.completedBattleCount ??
                0
              }
              completedChallenges={
                manual?.completedChallengeBattlesIds ??
                synced?.completedChallengeBattlesIds ??
                []
              }
              regularManual={
                manual?.completedBattleCount !== null &&
                manual?.completedBattleCount !== undefined
              }
              challengesManual={
                manual?.completedChallengeBattlesIds !== null &&
                manual?.completedChallengeBattlesIds !== undefined
              }
              update={update}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

function EventTrack({
  groupId,
  type,
  battles,
  completed,
  completedChallenges,
  regularManual,
  challengesManual,
  update,
}: {
  groupId: string
  type: EventType
  battles: {
    regular: CampaignBattleStorageModel[]
    challenges: CampaignBattleStorageModel[]
  }
  completed: number
  completedChallenges: string[]
  regularManual: boolean
  challengesManual: boolean
  update: UpdateFn
}) {
  const { t } = useTranslation()
  const setCompleted = (value: number) =>
    update(groupId, type, {
      completedBattleCount: Math.max(
        0,
        Math.min(battles.regular.length, value)
      ),
    })
  const toggleChallenge = (id: string) => {
    const current = new Set(completedChallenges)
    if (current.has(id)) current.delete(id)
    else current.add(id)
    update(groupId, type, { completedChallengeBattlesIds: [...current] })
  }
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{type}</h3>
        <EntityIcon
          src={campaignIcon(groupId as CampaignId, type)}
          alt=""
          className="size-8"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{t("progress.events.regular")}</span>
          <Badge variant="secondary">
            {t(
              regularManual
                ? "progress.events.manual"
                : "progress.events.synced"
            )}
          </Badge>
          <strong className="tabular-nums">
            {completed}/{battles.regular.length}
          </strong>
        </div>
        <Slider
          value={[completed]}
          min={0}
          max={Math.max(1, battles.regular.length)}
          step={1}
          disabled={battles.regular.length === 0}
          onValueChange={([value]) => setCompleted(value ?? 0)}
        />
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={t("progress.events.decrease")}
            onClick={() => setCompleted(completed - 1)}
          >
            −
          </Button>
          <Input
            className="w-20 text-center"
            type="number"
            min={0}
            max={battles.regular.length}
            value={completed}
            aria-label={`${t("progress.events.regularProgress")} ${type}`}
            onChange={(event) => setCompleted(Number(event.target.value))}
          />
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={t("progress.events.increase")}
            onClick={() => setCompleted(completed + 1)}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCompleted(battles.regular.length)}
          >
            {t("progress.events.max")}
          </Button>
          {regularManual ? (
            <Button
              className="ml-auto"
              size="sm"
              variant="ghost"
              onClick={() =>
                update(groupId, type, { completedBattleCount: null })
              }
            >
              {t("progress.events.useSynced")}
            </Button>
          ) : null}
        </div>
        <Progress
          value={
            battles.regular.length
              ? (completed / battles.regular.length) * 100
              : 0
          }
        />
      </div>
      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center justify-between text-sm">
          <span>{t("progress.events.challenges")}</span>
          <Badge variant="secondary">
            {t(
              challengesManual
                ? "progress.events.manual"
                : "progress.events.synced"
            )}
          </Badge>
          <strong>
            {completedChallenges.length}/{battles.challenges.length}
          </strong>
        </div>
        <div className="flex flex-wrap gap-2">
          {battles.challenges.map((battle) => {
            const selected = completedChallenges.includes(battle.id)
            return (
              <Button
                key={battle.id}
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                onClick={() => toggleChallenge(battle.id)}
              >
                {challengeLabel(battle)}
              </Button>
            )
          })}
          {challengesManual ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                update(groupId, type, { completedChallengeBattlesIds: null })
              }
            >
              {t("progress.events.useSynced")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

const challengeLabel = (battle: CampaignBattleStorageModel) => {
  const number = battle.id.match(/(\d+)B$/)?.[1]
  return number ? `${Number(number)}B` : `${battle.nodeNumber}B`
}
