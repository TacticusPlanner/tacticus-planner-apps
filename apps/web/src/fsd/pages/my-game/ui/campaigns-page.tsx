import { useMemo, useState } from "react"
import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  campaignDescriptor,
  campaignIcon,
  characterIcon,
  type CampaignBattleStorageModel,
  type CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  BattleProgressDialog,
  lightningVictoryIcon,
  medalIcon,
  medalCompletion,
  trackMedalStats,
  useSavedBattleProgress,
  type TrackMedalStats,
} from "@/features/daily-raids"
import { useFeatureFlag } from "@/shared/feature-flags"
import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import { EntityIcon, LocalReadFailure } from "@/shared/ui"

type Story = {
  key: string
  nameKey: string
  mirror: boolean
  definitions: CampaignDefinitionStorageModel[]
}

export function CampaignsPage() {
  const { t } = useTranslation(["common", "campaigns"])
  const read = combineReadStates(
    useCatalogDataset("campaign-definitions"),
    useCatalogDataset("campaign-battles"),
    usePlayerChunk("campaign-progress"),
    usePlayerChunk("characters")
  )
  const [definitions, battles, progress, characters] =
    read.status === "ready" ? read.data : []
  const [medalsGroupId, setMedalsGroupId] = useState<string | null>(null)
  const onEditMedals = useFeatureFlag("ManualBattles")
    ? setMedalsGroupId
    : undefined
  const overrides = useSavedBattleProgress()

  // Keyed on each read's data (each referentially stable while unchanged), not on the combined tuple.
  const model = useMemo(
    () =>
      definitions && battles && progress
        ? buildModel({ definitions, battles, progress, characters, overrides })
        : null,
    [definitions, battles, progress, characters, overrides]
  )
  if (read.status === "loading") return <Loading />
  if (read.status === "error") return <LocalReadFailure retry={read.retry} />
  if (!model) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("progress.loadError")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8" data-testid="campaigns-page">
      <div className="flex flex-wrap gap-8">
        <Summary
          label={t("progress.campaigns.normal")}
          {...model.normalSummary}
        />
        <Summary
          label={t("progress.campaigns.mirror")}
          {...model.mirrorSummary}
        />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <StorySection
          title={t("progress.campaigns.normal")}
          stories={model.normal}
          onEditMedals={onEditMedals}
        />
        <StorySection
          title={t("progress.campaigns.mirror")}
          stories={model.mirror}
          onEditMedals={onEditMedals}
        />
      </div>
      {medalsGroupId ? (
        <BattleProgressDialog
          campaignGroupId={medalsGroupId}
          onOpenChange={(open) => {
            if (!open) setMedalsGroupId(null)
          }}
          open
        />
      ) : null}
    </div>
  )
}

function buildModel(data: {
  definitions: CampaignDefinitionStorageModel[]
  battles: CampaignBattleStorageModel[]
  progress: PlayerDataChunkDto<"campaign-progress">
  characters: PlayerDataChunkDto<"characters"> | null | undefined
  /** Saved battle progress; absent while manual battles are off or it hasn't loaded. */
  overrides?: Parameters<typeof trackMedalStats>[2]
}) {
  const battlesByGroup = new Map<string, CampaignBattleStorageModel[]>()
  for (const battle of data.battles) {
    const current = battlesByGroup.get(battle.campaignGroupId) ?? []
    current.push(battle)
    battlesByGroup.set(battle.campaignGroupId, current)
  }
  const progressByKey = new Map(
    data.progress.map((entry) => [
      `${entry.tacticusCampaignId}|${entry.type}`,
      entry.highestCompletedBattleIndex,
    ])
  )
  const owned = new Set(
    (data.characters ?? []).map((character) => character.unitId)
  )
  const grouped = new Map<string, Story>()
  for (const definition of data.definitions) {
    if (definition.releaseType === "event") continue
    const type = definition.types[0] ?? "Standard"
    const descriptor = campaignDescriptor(definition.groupId, type)
    if (!descriptor) continue
    const key = `${descriptor.nameKey}|${descriptor.isMirror}`
    const current = grouped.get(key)
    if (current) current.definitions.push(definition)
    else {
      grouped.set(key, {
        key,
        nameKey: descriptor.nameKey,
        mirror: descriptor.isMirror,
        definitions: [definition],
      })
    }
  }

  const toStory = (story: Story) => ({
    ...story,
    definitions: story.definitions
      .map((definition) => {
        const type = definition.types[0] ?? "Standard"
        const battles = (battlesByGroup.get(definition.groupId) ?? []).filter(
          (battle) => battle.type === type && !battle.challenge
        )
        const max = battles.length
        // The synced index is the frontier battle (not yet 3-medalled), so it equals the number of
        // cleared battles before it — V1's `battles.length - 1`.
        const frontierIndex = progressByKey.get(`${definition.groupId}|${type}`)
        const completed = Math.max(0, Math.min(max, frontierIndex ?? 0))
        const medals = data.overrides
          ? trackMedalStats(battles, frontierIndex, data.overrides)
          : undefined
        return { definition, type, max, completed, medals }
      })
      .sort((a, b) => a.max - b.max),
    coreCharacters: [
      ...new Set(
        story.definitions.flatMap((definition) => definition.coreCharacters)
      ),
    ].filter((id) => owned.has(id)),
  })
  const stories = [...grouped.values()].map(toStory)
  const normal = stories.filter((story) => !story.mirror)
  const mirror = stories.filter((story) => story.mirror)
  return {
    normal,
    mirror,
    normalSummary: summarize(normal),
    mirrorSummary: summarize(mirror),
  }
}

/** A track's completion: medals and Lightning Victories when recorded, else battles cleared. */
const completionOf = (track: BuiltTrack) =>
  track.medals
    ? medalCompletion(track.medals)
    : { done: track.completed, total: track.max }

const completionOfTracks = (tracks: readonly BuiltTrack[]) =>
  tracks.map(completionOf).reduce(
    (sum, part) => ({
      done: sum.done + part.done,
      total: sum.total + part.total,
    }),
    { done: 0, total: 0 }
  )

const percent = ({ done, total }: { done: number; total: number }) =>
  total ? (done / total) * 100 : 0

type BuiltTrack = {
  definition: CampaignDefinitionStorageModel
  type: string
  max: number
  completed: number
  medals: TrackMedalStats | undefined
}

type BuiltStory = Omit<Story, "definitions"> & {
  definitions: BuiltTrack[]
  coreCharacters: string[]
}

function summarize(stories: BuiltStory[]) {
  const tracks = stories.flatMap((story) => story.definitions)
  const done = tracks.reduce((sum, track) => sum + track.completed, 0)
  const total = tracks.reduce((sum, track) => sum + track.max, 0)
  const completion = completionOfTracks(tracks)
  const withMedals = tracks.flatMap((track) => track.medals ?? [])
  return {
    done,
    total,
    percent: Math.round(percent(completion)),
    cleared: tracks.filter((track) => track.completed >= track.max).length,
    medals:
      withMedals.length > 0
        ? withMedals.reduce(
            (sum, stats) => ({
              medals: sum.medals + stats.medals,
              maxMedals: sum.maxMedals + stats.maxMedals,
              lightningVictories:
                sum.lightningVictories + stats.lightningVictories,
              maxLightningVictories:
                sum.maxLightningVictories + stats.maxLightningVictories,
            }),
            {
              medals: 0,
              maxMedals: 0,
              lightningVictories: 0,
              maxLightningVictories: 0,
            }
          )
        : undefined,
  }
}

/** Medals and Lightning Victories earned against the maximum, with the game's icons. */
function MedalStats({ stats }: { stats: TrackMedalStats }) {
  const { t } = useTranslation("dailies")
  return (
    <span className="inline-flex items-center gap-3 text-xs tabular-nums">
      <span
        className="inline-flex items-center gap-1"
        title={t("battleProgress.medalsEarned")}
      >
        <EntityIcon
          alt={t("battleProgress.medalsEarned")}
          src={medalIcon}
          className="size-4"
        />
        {stats.medals}/{stats.maxMedals}
      </span>
      {stats.maxLightningVictories > 0 ? (
        <span
          className="inline-flex items-center gap-1"
          title={t("battleProgress.lightningVictory")}
        >
          <EntityIcon
            alt={t("battleProgress.lightningVictory")}
            src={lightningVictoryIcon}
            className="size-4"
          />
          {stats.lightningVictories}/{stats.maxLightningVictories}
        </span>
      ) : null}
    </span>
  )
}

function Summary({
  label,
  done,
  total,
  percent: pct,
  cleared,
  medals,
}: {
  label: string
  done: number
  total: number
  percent: number
  cleared: number
  medals: TrackMedalStats | undefined
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums">{pct}%</p>
      <p className="text-xs text-muted-foreground">
        {done}/{total} · {cleared} cleared
      </p>
      {medals ? (
        <p className="mt-1 text-muted-foreground">
          <MedalStats stats={medals} />
        </p>
      ) : null}
    </div>
  )
}

function StorySection({
  title,
  stories,
  onEditMedals,
}: {
  title: string
  stories: BuiltStory[]
  /** Offers a Medals button on each track; absent while manual battles are off. */
  onEditMedals?: (groupId: string) => void
}) {
  return (
    <section className="space-y-3">
      <h3 className="border-b pb-2 text-sm font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {stories.map((story) => (
        <StoryCard key={story.key} story={story} onEditMedals={onEditMedals} />
      ))}
    </section>
  )
}

function StoryCard({
  story,
  onEditMedals,
}: {
  story: BuiltStory
  onEditMedals?: (groupId: string) => void
}) {
  const { t } = useTranslation(["campaigns", "dailies"])
  const storyPercent = percent(completionOfTracks(story.definitions))
  const first = story.definitions[0]
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <EntityIcon
          src={first && campaignIcon(first.definition.groupId, first.type)}
          alt=""
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <CardTitle>
            {t(`names.${story.nameKey}`, { defaultValue: story.nameKey })}
          </CardTitle>
          <Progress className="mt-2" value={storyPercent} />
        </div>
        <span className="font-semibold tabular-nums">
          {Math.round(storyPercent)}%
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {story.coreCharacters.length ? (
          <div className="flex gap-2">
            {story.coreCharacters.map((id) => (
              <EntityIcon
                key={id}
                src={characterIcon(id as UnitId)}
                alt={id}
                className="size-9 rounded"
              />
            ))}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {story.definitions.map((track) => (
            <div
              key={track.definition.groupId}
              className="space-y-2 rounded-lg border p-3"
            >
              <div className="flex justify-between text-sm">
                <span>
                  {track.type.includes("Elite") ? "Elite" : "Standard"}
                </span>
                <strong className="tabular-nums">
                  {track.completed}/{track.max}
                </strong>
              </div>
              <Progress value={percent(completionOf(track))} />
              {onEditMedals ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => onEditMedals(track.definition.groupId)}
                  data-testid={`campaign-medals-${track.definition.groupId}`}
                >
                  {track.medals ? (
                    <MedalStats stats={track.medals} />
                  ) : (
                    <EntityIcon alt="" src={medalIcon} className="size-4" />
                  )}
                  <span className="inline-flex items-center gap-1">
                    {t("dailies:battleProgress.edit")}
                    <ChevronRight aria-hidden className="size-4" />
                  </span>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Loading() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
