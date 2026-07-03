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
   * Full campaign label for a single (non-event) campaign chip, e.g. "Fall of Cadia Standard",
   * "Indomitus Elite", "Indomitus Mirror" (the mirror base tier omits the redundant "Standard"
   * word since the mirror name already distinguishes it from the non-mirror campaign). Event
   * campaigns just use the plain name — their difficulty tiers are merged into one chip.
   */
  const fullLabel = useCallback(
    (descriptor: CampaignDescriptor) => {
      const label = name(descriptor)
      if (descriptor.isEvent) return label
      if (descriptor.difficultyToken === "elite") {
        return `${label} ${t("campaigns:difficulties.elite")}`
      }
      return descriptor.isMirror
        ? label
        : `${label} ${t("campaigns:difficulties.standard")}`
    },
    [name, t]
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

  return { name, fullLabel, shortLabel, tierCode }
}
