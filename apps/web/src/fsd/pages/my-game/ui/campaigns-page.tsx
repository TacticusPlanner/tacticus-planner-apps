import { useMemo, useState } from "react"
import { ChevronRight, Gift } from "lucide-react"
import { useTranslation } from "react-i18next"
import { campaignIcon, characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import {
  BattleProgressDialog,
  MedalStats,
  medalIcon,
  UnclaimedRewardsDetails,
  useSavedBattleProgress,
} from "@/features/daily-raids"
import {
  combineReadStates,
  storedPreference,
  usePersistedSelection,
} from "@/shared/lib"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import {
  EntityIcon,
  FILTER_CHIP_CLASS_NAME,
  LocalReadFailure,
  PageToolbar,
  PageLoading,
} from "@/shared/ui"

import {
  buildCampaignsModel,
  completionOf,
  completionOfTracks,
  isEliteTrack,
  percentLabel,
  percentOf,
} from "../model/campaigns-model"
import type { BuiltStory, CampaignsModel } from "../model/campaigns-model"

import { useCampaignsTutorial } from "./campaigns-page.tutorial"
import { ProgressSummary } from "./progress-summary"

const UNCLAIMED_ONLY = "unclaimedOnly"
const UNCLAIMED_ONLY_PREFERENCE = storedPreference(
  "progress",
  "campaignsUnclaimedOnly"
)
const isOnOff = (value: unknown): value is "on" | "off" =>
  value === "on" || value === "off"

/** The four counters (campaign-progress), each over its own tracks: one row on desktop, two rows
 *  of two on a phone, in the order of the track cards below. */
function CampaignCounters({
  summaries,
}: {
  summaries: CampaignsModel["summaries"]
}) {
  const { t } = useTranslation()
  return (
    <div
      className="grid grid-cols-2 gap-6 lg:grid-cols-4"
      data-testid="campaigns-summary"
    >
      <ProgressSummary
        label={t("progress.campaigns.counters.normal")}
        testId="campaigns-summary-normal"
        {...summaries.normal}
      />
      <ProgressSummary
        label={t("progress.campaigns.counters.normalElite")}
        testId="campaigns-summary-normal-elite"
        {...summaries.normalElite}
      />
      <ProgressSummary
        label={t("progress.campaigns.counters.mirror")}
        testId="campaigns-summary-mirror"
        {...summaries.mirror}
      />
      <ProgressSummary
        label={t("progress.campaigns.counters.mirrorElite")}
        testId="campaigns-summary-mirror-elite"
        {...summaries.mirrorElite}
      />
    </div>
  )
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
  const overrides = useSavedBattleProgress()
  const [unclaimedOnly, setUnclaimedOnly] = usePersistedSelection(
    UNCLAIMED_ONLY_PREFERENCE,
    isOnOff,
    "off"
  )
  useCampaignsTutorial()

  // Keyed on each read's data (each referentially stable while unchanged), not on the combined tuple.
  const model = useMemo(
    () =>
      definitions && battles && progress
        ? buildCampaignsModel({
            definitions,
            battles,
            progress,
            characters,
            overrides,
          })
        : null,
    [definitions, battles, progress, characters, overrides]
  )
  if (read.status === "loading") return <PageLoading />
  if (read.status === "error") return <LocalReadFailure retry={read.retry} />
  if (!model) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("progress.loadError")}</AlertDescription>
      </Alert>
    )
  }

  const unclaimedFilter = unclaimedOnly === "on" && model.unclaimedTracks > 0
  const shown = (stories: BuiltStory[]) =>
    unclaimedFilter
      ? stories.filter((story) => story.unclaimedBattles > 0)
      : stories

  return (
    <div className="space-y-8" data-testid="campaigns-page">
      {model.unclaimedTracks > 0 ? (
        <PageToolbar
          find={
            <ToggleGroup
              aria-label={t("progress.campaigns.unclaimedOnly")}
              onValueChange={(values) =>
                setUnclaimedOnly(values.includes(UNCLAIMED_ONLY) ? "on" : "off")
              }
              size="sm"
              spacing={1}
              type="multiple"
              value={unclaimedFilter ? [UNCLAIMED_ONLY] : []}
              variant="outline"
            >
              <ToggleGroupItem
                className={FILTER_CHIP_CLASS_NAME}
                data-testid="campaigns-unclaimed-only"
                value={UNCLAIMED_ONLY}
              >
                {t("progress.campaigns.unclaimedOnly")}
              </ToggleGroupItem>
            </ToggleGroup>
          }
          testId="campaigns-toolbar"
        />
      ) : null}
      <div className="space-y-3">
        <CampaignCounters summaries={model.summaries} />
        {model.unclaimedTracks > 0 ? (
          <p className="text-sm" data-testid="campaigns-unclaimed-summary">
            {t("progress.campaigns.unclaimedSummary", {
              count: model.unclaimedTracks,
            })}
          </p>
        ) : null}
      </div>
      <div
        className="grid items-start gap-6 lg:grid-cols-2"
        data-testid="campaigns-stories"
      >
        <StorySection
          title={t("progress.campaigns.normal")}
          stories={shown(model.normal)}
          onEditMedals={setMedalsGroupId}
        />
        <StorySection
          title={t("progress.campaigns.mirror")}
          stories={shown(model.mirror)}
          onEditMedals={setMedalsGroupId}
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

function StorySection({
  title,
  stories,
  onEditMedals,
}: {
  title: string
  stories: BuiltStory[]
  /** Offers a Medals button on each track; absent while manual battles are off. */
  onEditMedals: (groupId: string) => void
}) {
  return (
    <section className="space-y-3">
      <h3 className="border-b pb-2 text-sm font-medium">{title}</h3>
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
  onEditMedals: (groupId: string) => void
}) {
  const { t } = useTranslation(["campaigns", "dailies", "common"])
  const storyCompletion = completionOfTracks(story.definitions)
  const first = story.definitions[0]
  return (
    <Card>
      {/* `flex` replaces the header's default grid, so icon, title and percent share one row. */}
      <CardHeader className="flex flex-row items-center gap-3">
        <EntityIcon
          size="icon-2xl"
          src={first && campaignIcon(first.definition.groupId, first.type)}
          alt=""
        />
        <div className="min-w-0 flex-1">
          <CardTitle>
            {t(`names.${story.nameKey}`, { defaultValue: story.nameKey })}
          </CardTitle>
          <Progress className="mt-2" value={percentOf(storyCompletion)} />
        </div>
        {story.unclaimedBattles > 0 ? (
          <Badge data-testid={`campaign-story-unclaimed-${story.key}`}>
            <Gift aria-hidden />
            {t("common:progress.campaigns.toClaim", {
              count: story.unclaimedBattles,
            })}
          </Badge>
        ) : null}
        <span className="font-semibold tabular-nums">
          {percentLabel(storyCompletion)}%
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {story.coreCharacters.length > 0 ? (
          <div className="flex gap-2">
            {story.coreCharacters.map((id) => (
              <EntityIcon
                size="portrait-sm"
                key={id}
                src={characterIcon(id as UnitId)}
                alt={id}
                className="rounded-sm"
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
                <span>{isEliteTrack(track) ? "Elite" : "Standard"}</span>
                <strong className="tabular-nums">
                  {track.completed}/{track.max}
                </strong>
              </div>
              <Progress value={percentOf(completionOf(track))} />
              <Button
                variant="outline"
                size="sm"
                // Wraps instead of overlapping when the stats and the label don't fit on one line.
                className="h-auto w-full flex-wrap justify-between gap-x-3 gap-y-1 py-1.5 whitespace-normal"
                onClick={() => onEditMedals(track.definition.groupId)}
                data-testid={`campaign-medals-${track.definition.groupId}`}
              >
                {track.medals ? (
                  <MedalStats stats={track.medals} />
                ) : (
                  <EntityIcon size="icon" alt="" src={medalIcon} />
                )}
                <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap">
                  {t("dailies:battleProgress.edit")}
                  <ChevronRight aria-hidden className="size-icon-sm" />
                </span>
              </Button>
              {track.unclaimed ? (
                <UnclaimedRewardsDetails
                  unclaimed={track.unclaimed}
                  data-testid={`campaign-unclaimed-${track.definition.groupId}`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
