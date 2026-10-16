import { useCallback } from "react"
import { useTranslation } from "react-i18next"

/**
 * Rules-text resolution for unit abilities (NPCs and characters share ability ids), from the id-keyed
 * `npcAbilityText` game-data namespace (ported from V1's ability table). The served datasets carry
 * ability ids only; the
 * `{[variable]}` tokens in a description are resolved against these per-ability-level tables, indexed
 * by the selected stat row's `abilityLevel`.
 *
 * The namespace holds only abilities whose description resolves **completely** from its own variable
 * and constant tables, so a caller can never render a leftover token. In practice that is every
 * ability the page displays; an id absent here has no text, and the caller renders its name alone.
 */
export type AbilityTextEntry = {
  description: string
  variables: Record<string, (string | number)[]>
  /** Level-independent values (hit counts, ranges, damage profiles) the description also references. */
  constants: Record<string, string>
  /** Variable names multiplied by the rarity factor when rendered. */
  scaled: string[]
}

export type TraitTextEntry = {
  description: string
  variables: Record<string, (string | number)[]>
}

export function useAbilityText() {
  const { i18n } = useTranslation("npcAbilityText")

  return useCallback(
    (abilityId: string): AbilityTextEntry | undefined =>
      (i18n.getResource(i18n.language, "npcAbilityText", abilityId) ??
        i18n.getResource("en", "npcAbilityText", abilityId)) as
        AbilityTextEntry | undefined,
    [i18n]
  )
}

/**
 * The same resolution for trait rules text, from the `npcTraitText` namespace. V1 ships trait
 * descriptions in English only, so this namespace is en-only and other languages fall back to it,
 * mirroring `raidBossTraitText`; the localized trait *name* comes from the `traits` namespace.
 * Traits have no levels — each value is stored as a single-element array so the shared renderer,
 * which indexes variables by level, resolves them at level 1.
 */
export function useTraitText() {
  const { i18n } = useTranslation("npcTraitText")

  return useCallback(
    (traitId: string): TraitTextEntry | undefined =>
      (i18n.getResource(i18n.language, "npcTraitText", traitId) ??
        i18n.getResource("en", "npcTraitText", traitId)) as
        TraitTextEntry | undefined,
    [i18n]
  )
}
