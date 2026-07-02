import type { CampaignDescriptor } from "@workspace/game-catalog"

// Translates a `CampaignDescriptor` (game-data ids/tokens only, see `@workspace/game-catalog`)
// into display text. Kept out of `campaign-insights.ts` so that calc function stays i18n-free and
// unit-testable without a translation setup — callers (page/results components, which already
// have a `t` in scope) compose the final label here instead.

// i18next's own `TFunction<Ns>` is branded by `Ns[0]` (its "default namespace"), so a caller's `t`
// scoped to e.g. `["common", "campaigns", ...]` is never assignable to a `TFunction<["campaigns",
// ...]>` parameter even though it supports every key this file needs — every key here is also a
// runtime-built template literal (`campaigns:${nameKey}`), not a static literal i18next could
// validate anyway, so a minimal structural type (matching `t`'s real call signature) is both
// sufficient and the only shape that works across this module boundary.
export type CampaignTFunction = (
  key: string,
  options?: { defaultValue?: string }
) => string

/** Translated display name for a campaign/event group (`campaigns` namespace, keyed by `nameKey`). */
export function campaignDisplayName(
  t: CampaignTFunction,
  descriptor: Pick<CampaignDescriptor, "nameKey">
): string {
  return t(`campaigns:${descriptor.nameKey}`, {
    defaultValue: descriptor.nameKey,
  })
}

/**
 * Full campaign label for a single (non-event) campaign chip, e.g. "Fall of Cadia Standard",
 * "Indomitus Elite", "Indomitus Mirror" (the mirror base tier omits the redundant "Standard" word
 * since the mirror name already distinguishes it from the non-mirror campaign). Event campaigns
 * just use the plain name — their difficulty tiers are merged into one chip.
 */
export function campaignDisplayFullLabel(
  t: CampaignTFunction,
  descriptor: CampaignDescriptor
): string {
  const name = campaignDisplayName(t, descriptor)
  if (descriptor.isEvent) return name
  if (descriptor.difficultyToken === "elite") {
    return `${name} ${t("campaignDifficulties:elite")}`
  }
  return descriptor.isMirror
    ? name
    : `${name} ${t("campaignDifficulties:standard")}`
}

export interface CampaignShortLabel {
  name: string
  code: string
  challenge: boolean
}

/**
 * Compact form for farm-location chips, e.g. "Fall of Cadia S", "Indomitus ME", "Adeptus
 * Mechanicus Ext" (+ node numbers, "B"-suffixed by the caller when `challenge` is set).
 */
export function campaignDisplayShortLabel(
  t: CampaignTFunction,
  descriptor: CampaignDescriptor
): CampaignShortLabel {
  const name = campaignDisplayName(t, descriptor)
  const code = t(`campaignDifficultyCodes:${descriptor.difficultyToken}`)
  return {
    name,
    code: descriptor.isMirror ? `M${code}` : code,
    challenge: descriptor.challenge,
  }
}
