import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { onslaughtAllianceIcon } from "@workspace/game-catalog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  onslaughtReward,
  onslaughtAlliances,
  onslaughtProgressQueries,
  onslaughtSectors,
  rewardKeys,
  updateOnslaughtProgress,
  type OnslaughtAlliance,
  type OnslaughtProgress,
  type OnslaughtSector,
  type OnslaughtTier,
} from "@/entities/player-data-override"
import { useRevisionedDraft } from "@/shared/api"
import { useCatalogDataset } from "@/shared/local-data"
import {
  EntityIcon,
  LocalReadFailure,
  ProgressionBadge,
  UnsavedChangesBar,
  UnsavedChangesGuard,
} from "@/shared/ui"

import { OnslaughtAllianceCard } from "./onslaught-alliance-card"
import { OnslaughtEmblem } from "./onslaught-emblem"
import { useOnslaughtTutorial } from "./onslaught-page.tutorial"
import {
  formatReward,
  rewardProgression,
  useOnslaughtPositionLabel,
} from "./onslaught-position"

type Message = { tone: "success" | "info" | "error"; key: MessageKey }
type MessageKey =
  "onslaught.saved" | "onslaught.conflict" | "onslaught.saveError"

const allianceKey = (alliance: OnslaughtAlliance) =>
  alliance.toLowerCase() as "imperial" | "xenos" | "chaos"

const rewardTiers = [1, 2, 3] as const

const toDraft = (saved: OnslaughtProgress) => saved
const toPayload = (
  draft: OnslaughtProgress,
  saved: OnslaughtProgress
): OnslaughtProgress => ({ ...draft, revision: saved.revision })

export function OnslaughtPage() {
  const { t } = useTranslation()
  const positionLabel = useOnslaughtPositionLabel()
  const isAuthenticated = useIsAuthenticated()
  const rewardsRead = useCatalogDataset("onslaught-rewards")
  const progressDraft = useRevisionedDraft({
    query: onslaughtProgressQueries.current(),
    enabled: isAuthenticated,
    toDraft,
    toPayload,
    save: updateOnslaughtProgress,
  })
  const [message, setMessage] = useState<Message | null>(null)
  const progressQuery = progressDraft.query
  const progress = progressDraft.draft

  useOnslaughtTutorial()

  // The sector-change tier rule (`tier-after-sector-change.ts`) is applied by the card, so `patch`
  // already carries the resulting tier.
  const updateAlliance = (
    alliance: OnslaughtAlliance,
    patch: Partial<{ sector: OnslaughtSector; tier: OnslaughtTier }>
  ) => {
    const key = allianceKey(alliance)
    // Any edit makes the alliance a real position that Save will store.
    progressDraft.update((current) => ({
      ...current,
      [key]: { ...current[key], ...patch, isSet: true },
    }))
    setMessage(null)
  }

  const save = async () => {
    setMessage(null)
    const outcome = await progressDraft.save()
    setMessage(
      outcome === "saved"
        ? { tone: "success", key: "onslaught.saved" }
        : outcome === "conflict"
          ? { tone: "info", key: "onslaught.conflict" }
          : { tone: "error", key: "onslaught.saveError" }
    )
  }

  if (rewardsRead.status === "error") {
    return <LocalReadFailure retry={rewardsRead.retry} />
  }
  if (progressQuery.isPending || rewardsRead.status === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }
  const rewards = rewardsRead.data
  if (!progress) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("onslaught.loadError")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8" data-testid="onslaught-page">
      {message ? (
        <Alert
          variant={message.tone === "error" ? "destructive" : "default"}
          data-testid="onslaught-message"
        >
          <AlertDescription>{t(message.key)}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className="grid gap-4 md:grid-cols-3"
        data-testid="onslaught-alliance-cards"
      >
        {onslaughtAlliances.map((alliance) => {
          const value = progress[allianceKey(alliance)]
          return (
            <OnslaughtAllianceCard
              key={alliance}
              alliance={alliance}
              value={value}
              rewards={rewards}
              onChange={(patch) => updateAlliance(alliance, patch)}
            />
          )
        })}
      </div>

      <p
        className="-mt-4 text-sm text-muted-foreground"
        data-testid="onslaught-progress-help"
      >
        {t("onslaught.help")}
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("onslaught.rewardsTitle")}</h2>
        {/* `relative` keeps the header's absolutely positioned sr-only labels inside this scroller,
            so the wide table cannot widen the page on mobile. */}
        <div className="relative overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">
                  {t("onslaught.sectorTier")}
                </th>
                <th className="px-3 py-2 text-left">
                  {t("onslaught.current")}
                </th>
                {rewardKeys.map((key) => (
                  <th
                    key={key}
                    className="px-3 py-2 text-center whitespace-nowrap"
                  >
                    <div className="flex justify-center">
                      <ProgressionBadge value={rewardProgression[key]} />
                      <span className="sr-only">
                        {t(`onslaught.rewards.${key}`)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {onslaughtSectors.flatMap((sector) =>
                rewardTiers.map((tier) => {
                  const active = onslaughtAlliances.filter((alliance) => {
                    const value = progress[allianceKey(alliance)]
                    return (
                      value.isSet &&
                      value.sector === sector &&
                      (value.tier === tier || (tier === 3 && value.tier === 4))
                    )
                  })
                  return (
                    <tr
                      key={`${sector}-${tier}`}
                      className="border-t odd:bg-background even:bg-muted/20"
                    >
                      <td className="px-3 py-2 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <OnslaughtEmblem sector={sector} tier={tier} />
                          {positionLabel(sector, tier)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {active.map((alliance) => (
                            <EntityIcon
                              key={alliance}
                              src={onslaughtAllianceIcon(alliance)}
                              alt={
                                progress[allianceKey(alliance)].tier === 4
                                  ? `${t(`alliances.${alliance}`)} · ${t("onslaught.tierComplete")}`
                                  : t(`alliances.${alliance}`)
                              }
                              className="size-7"
                            />
                          ))}
                        </div>
                      </td>
                      {rewardKeys.map((key) => {
                        const reward = onslaughtReward(
                          rewards,
                          sector,
                          tier,
                          key
                        )
                        if (!reward) {
                          return (
                            <td
                              key={key}
                              className="px-3 py-2 text-center text-muted-foreground"
                            >
                              —
                            </td>
                          )
                        }
                        return (
                          <td
                            key={key}
                            className={
                              reward.mythic
                                ? "px-3 py-2 text-center font-medium text-violet-500"
                                : "px-3 py-2 text-center"
                            }
                          >
                            {formatReward(reward)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <UnsavedChangesBar
        open={progressDraft.isDirty}
        isSaving={progressDraft.isSaving}
        message={t("onslaught.unsaved.message")}
        saveLabel={t("onslaught.unsaved.save")}
        discardLabel={t("onslaught.unsaved.discard")}
        onSave={() => void save()}
        onDiscard={() => {
          progressDraft.discard()
          setMessage(null)
        }}
      />
      <UnsavedChangesGuard
        when={progressDraft.isDirty}
        title={t("onslaught.leave.title")}
        description={t("onslaught.leave.description")}
        stayLabel={t("onslaught.leave.stay")}
        leaveLabel={t("onslaught.leave.leave")}
      />
    </div>
  )
}
