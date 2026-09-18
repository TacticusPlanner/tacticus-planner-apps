import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { CampaignDescriptor } from "@workspace/game-catalog"

export interface CampaignShortLabel {
  name: string
  code: string
  challenge: boolean
}

/**
 * Translates `CampaignDescriptor`s (game-data ids/tokens only, see `@workspace/game-catalog`) into
 * display text. Binding `t` here — instead of threading it through a separately-typed parameter —
 * sidesteps i18next's `TFunction<Ns>` nominal branding (it's keyed to the *first* namespace passed
 * to `useTranslation`, so a `t` scoped elsewhere is never assignable to a differently-branded
 * parameter type even when it resolves every key needed); every key built here is a runtime
 * template literal anyway; only the final translated strings ever leave this hook.
 */
export function useCampaignDisplay() {
  const { t } = useTranslation(["campaigns"])

  /** Translated display name for a campaign/event group (`campaigns:names`, keyed by `nameKey`). */
  const name = useCallback(
    (descriptor: Pick<CampaignDescriptor, "nameKey">) =>
      t(`campaigns:names.${descriptor.nameKey}`, {
        defaultValue: descriptor.nameKey,
      }),
    [t]
  )

  /**
   * Just the tier words for a campaign/event tier, e.g. "Standard", "Elite", "Mirror",
   * "Mirror Elite", or "Extremis" — everything that distinguishes a tier from its siblings,
   * with the campaign's own name left out.
   *
   * Every qualifier a storyline tier carries has to show up here: the four tiers of one storyline
   * are four distinct campaigns with their own nodes and drops, so dropping "Mirror" from an
   * `eliteMirror{n}` group (tacticus-planner-apps#119) named a different campaign than the one the
   * entry actually points at. The mirror base tier is the one case that omits its difficulty word:
   * "Indomitus Mirror" already reads as a campaign name, and "Indomitus Mirror Standard" would only
   * add a redundant word.
   */
  const tierLabel = useCallback(
    (descriptor: CampaignDescriptor) => {
      if (descriptor.isEvent) {
        return t(`campaigns:difficulties.${descriptor.difficultyToken}`)
      }
      const mirror = descriptor.isMirror
        ? t("campaigns:difficulties.mirror")
        : ""
      if (descriptor.difficultyToken === "elite") {
        const elite = t("campaigns:difficulties.elite")
        return mirror ? `${mirror} ${elite}` : elite
      }
      return mirror || t("campaigns:difficulties.standard")
    },
    [t]
  )

  /**
   * Full campaign label for a single campaign/event chip, e.g. "Fall of Cadia Standard",
   * "Indomitus Elite", "Indomitus Mirror", "Saim-Hann Mirror Elite", or "Death Guard Extremis"
   * for an event tier — events carry two distinct difficulty tiers (Standard/Extremis) that farm
   * at very different rates, so the tier must stay visible here too.
   *
   * Composed from `name` + `tierLabel` so the tier words live in exactly one place.
   */
  const fullLabel = useCallback(
    (descriptor: CampaignDescriptor) =>
      `${name(descriptor)} ${tierLabel(descriptor)}`,
    [name, tierLabel]
  )

  /**
   * Compact form for farm-location chips, e.g. "Fall of Cadia S", "Indomitus ME", "Adeptus
   * Mechanicus E" (+ node numbers, "B"-suffixed by the caller when `challenge` is set).
   */
  const shortLabel = useCallback(
    (descriptor: CampaignDescriptor): CampaignShortLabel => {
      const label = name(descriptor)
      const code = t(`campaigns:codes.${descriptor.difficultyToken}`)
      const mirrorCode = t("campaigns:codes.mirror")
      return {
        name: label,
        code: descriptor.isMirror ? `${mirrorCode}${code}` : code,
        challenge: descriptor.challenge,
      }
    },
    [name, t]
  )

  /** Single-letter code for an event insight's Standard/Extremis tier breakdown. */
  const tierCode = useCallback(
    (tier: "standard" | "extremis") =>
      tier === "standard"
        ? t("campaigns:codes.eventStandard")
        : t("campaigns:codes.eventExtremis"),
    [t]
  )

  return { name, tierLabel, fullLabel, shortLabel, tierCode }
}
