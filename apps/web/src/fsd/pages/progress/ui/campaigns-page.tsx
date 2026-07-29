import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"
import {
  campaignDescriptor,
  campaignIcon,
  characterIcon,
  type CampaignBattleStorageModel,
  type CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"
import {
  getCampaignBattles,
  getCampaignDefinitions,
} from "@workspace/game-catalog/queries"
import type { CampaignId, UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"
import {
  getCampaignProgress,
  getPlayerCharacters,
} from "@workspace/player-data/queries"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"

import { EntityIcon } from "@/shared/ui"

type Story = {
  key: string
  nameKey: string
  mirror: boolean
  definitions: CampaignDefinitionStorageModel[]
}

export function CampaignsPage() {
  const { t } = useTranslation(["common", "campaigns"])
  const data = useLiveQuery(async () => {
    const [definitions, battles, progress, characters] = await Promise.all([
      getCampaignDefinitions(),
      getCampaignBattles(),
      getCampaignProgress(),
      getPlayerCharacters(),
    ])
    return { definitions, battles, progress, characters }
  }, [])

  const model = useMemo(() => (data ? buildModel(data) : null), [data])
  if (!data) return <Loading />
  if (!data.progress || !model) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("progress.loadError")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8" data-testid="campaigns-page">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">
          {t("progress.campaigns.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("progress.campaigns.description")}
        </p>
      </header>
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
        />
        <StorySection
          title={t("progress.campaigns.mirror")}
          stories={model.mirror}
        />
      </div>
    </div>
  )
}

function buildModel(data: {
  definitions: CampaignDefinitionStorageModel[]
  battles: CampaignBattleStorageModel[]
  progress: PlayerDataChunkDto<"campaign-progress"> | undefined
  characters: PlayerDataChunkDto<"characters"> | undefined
}) {
  if (!data.progress) return null
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
    (data.characters ?? []).map((character) => character.id)
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
        const highestCompletedIndex = progressByKey.get(
          `${definition.groupId}|${type}`
        )
        const completed = Math.max(
          0,
          Math.min(
            max,
            highestCompletedIndex === undefined ? 0 : highestCompletedIndex + 1
          )
        )
        return { definition, type, max, completed }
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

type BuiltTrack = {
  definition: CampaignDefinitionStorageModel
  type: string
  max: number
  completed: number
}

type BuiltStory = Omit<Story, "definitions"> & {
  definitions: BuiltTrack[]
  coreCharacters: string[]
}

function summarize(stories: BuiltStory[]) {
  const tracks = stories.flatMap((story) => story.definitions)
  const done = tracks.reduce((sum, track) => sum + track.completed, 0)
  const total = tracks.reduce((sum, track) => sum + track.max, 0)
  return {
    done,
    total,
    cleared: tracks.filter((track) => track.completed >= track.max).length,
  }
}

function Summary({
  label,
  done,
  total,
  cleared,
}: {
  label: string
  done: number
  total: number
  cleared: number
}) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums">{pct}%</p>
      <p className="text-xs text-muted-foreground">
        {done}/{total} · {cleared} cleared
      </p>
    </div>
  )
}

function StorySection({
  title,
  stories,
}: {
  title: string
  stories: BuiltStory[]
}) {
  return (
    <section className="space-y-3">
      <h3 className="border-b pb-2 text-sm font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {stories.map((story) => (
        <StoryCard key={story.key} story={story} />
      ))}
    </section>
  )
}

function StoryCard({ story }: { story: BuiltStory }) {
  const { t } = useTranslation("campaigns")
  const total = story.definitions.reduce((sum, track) => sum + track.max, 0)
  const done = story.definitions.reduce(
    (sum, track) => sum + track.completed,
    0
  )
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <EntityIcon
          src={campaignIcon(
            story.definitions[0].definition.groupId as CampaignId,
            story.definitions[0].type
          )}
          alt=""
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <CardTitle>
            {t(`names.${story.nameKey}`, { defaultValue: story.nameKey })}
          </CardTitle>
          <Progress className="mt-2" value={total ? (done / total) * 100 : 0} />
        </div>
        <span className="font-semibold tabular-nums">
          {total ? Math.round((done / total) * 100) : 0}%
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
              <Progress
                value={track.max ? (track.completed / track.max) * 100 : 0}
              />
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
