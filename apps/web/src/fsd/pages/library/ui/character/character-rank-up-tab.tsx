import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { isAdamantineRank } from "@workspace/game-domain"
import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getPlayerCharacter,
} from "@workspace/player-data/queries"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { mapCharacterStorageToDomain } from "@/features/rank-lookup"

import { CharacterLookupDesktopPage } from "./desktop/character-lookup-desktop-page"
import { CharacterLookupMobilePage } from "./mobile/character-lookup-mobile-page"
import { useCharacterLookupCalc } from "./hooks/use-character-lookup-calc"
import { useCharacterLookupCatalog } from "./hooks/use-character-lookup-catalog"
import { useLookupSelection } from "./hooks/use-lookup-selection"

// A unique sentinel (not a plain value) so it can be distinguished from a legitimately-resolved
// result via reference equality — the documented Dexie pattern for detecting "still loading" with
// useLiveQuery, since its `defaultResult` argument is only returned before the first resolution.
const PLAYER_CHARACTER_LOADING = Symbol("loading")

/**
 * The unit page's Rank-up materials tab: the former Character Lookup calculator, moved in complete
 * (rank and progression ranges, ".5", include owned, Apply, Share, the range in the URL). The unit
 * page owns which character it is; the page remounts this tab per character.
 */
export function CharacterRankUpTab({
  characterId: unitId,
}: {
  characterId: UnitId
}) {
  // "unitLookup.subtitle" (the only key used directly here) lives in "common", i18next's configured
  // defaultNS. useCharacterLookupCatalog/useCharacterLookupCalc each load whatever other namespaces
  // their own translated output needs.
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const isAuthenticated = useIsAuthenticated()

  const {
    charactersById,
    upgradesById,
    battlesById,
    releaseTypeByGroupId,
    loading,
  } = useCharacterLookupCatalog()

  const {
    applied,
    draft,
    isDirty,
    applyPlayerPrefill,
    setDraftRange,
    setDraftProgressionRange,
    setDraftPointFive,
    handleApply,
  } = useLookupSelection(unitId)

  const draftCharacterId = draft.characterId ?? unitId

  // Synced player record for the currently selected character only (not the whole roster) — used
  // just to prefill the "from" rank/progression once it loads, see the effect below. MoWs are
  // irrelevant here — Character Lookup only ever looks up characters, which have a rank/equipment
  // MoWs don't.
  const playerCharacterResult = useLiveQuery(
    () =>
      isAuthenticated && draftCharacterId
        ? getPlayerCharacter(draftCharacterId).then((data) => ({
            id: draftCharacterId,
            data,
          }))
        : { id: draftCharacterId, data: undefined },
    [isAuthenticated, draftCharacterId],
    PLAYER_CHARACTER_LOADING
  )
  const playerCharacter =
    playerCharacterResult !== PLAYER_CHARACTER_LOADING &&
    playerCharacterResult.id === draftCharacterId
      ? playerCharacterResult.data
      : undefined
  const playerCharacterLoading =
    isAuthenticated &&
    !!draftCharacterId &&
    (playerCharacterResult === PLAYER_CHARACTER_LOADING ||
      playerCharacterResult.id !== draftCharacterId)

  // Applies the synced rank/progression prefill once per character selection, as soon as it's
  // available — never on a later background refresh of the same character, so it can't clobber
  // rank/progression edits the user has since made via the slider. The selection hook keeps its
  // generated default whenever signed out, the record hasn't finished loading, or the unit isn't
  // in the synced chunk at all.
  const prefilledCharacterIdRef = useRef<UnitId | undefined>(undefined)

  useEffect(() => {
    if (
      !isAuthenticated ||
      !draftCharacterId ||
      playerCharacterLoading ||
      prefilledCharacterIdRef.current === draftCharacterId
    ) {
      return
    }

    prefilledCharacterIdRef.current = draftCharacterId

    if (!playerCharacter) {
      return
    }

    // The synced chunk's rank/progressionIndex are already the catalog's own Rank/Progression
    // string values (see @workspace/player-data's schemas) — no numeric-index conversion needed.
    applyPlayerPrefill(draftCharacterId, {
      rankStart: playerCharacter.rank,
      progressionStart: playerCharacter.progressionIndex,
    })
  }, [
    isAuthenticated,
    draftCharacterId,
    playerCharacter,
    playerCharacterLoading,
    applyPlayerPrefill,
  ])

  // Whether to net the player's already-applied/owned upgrades out of the required totals below —
  // deliberately local (not part of useLookupSelection's URL-synced state), since "include my
  // personal inventory" isn't something that should travel in a shareable link. Derived (not
  // reset via an effect) so a disabled toggle can never be shown "on": whenever signed out,
  // `effectiveIncludeOwned` reads false regardless of the raw switch state underneath.
  const [includeOwned, setIncludeOwned] = useState(false)
  const effectiveIncludeOwned = includeOwned && isAuthenticated

  // Whole inventory-upgrades chunk (not a single record — we don't know in advance which ids the
  // player owns), used only once includeOwned is on; harmless/unused otherwise.
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])

  const characterId = applied.characterId ?? unitId

  const character = characterId ? charactersById?.get(characterId) : undefined
  const characterForCalc = character
    ? mapCharacterStorageToDomain(character)
    : undefined

  const { groups, baseUpgrades, campaignInsights, eventInsights, profile } =
    useCharacterLookupCalc({
      character,
      characterForCalc,
      applied,
      upgradesById,
      battlesById,
      releaseTypeByGroupId,
      effectiveIncludeOwned,
      playerCharacter,
      inventoryUpgrades,
    })

  const sharedProps = {
    rankStart: draft.rankStart,
    rankEnd: draft.rankEnd,
    progressionStart: draft.progressionStart,
    progressionEnd: draft.progressionEnd,
    pointFive: draft.pointFive,
    pointFiveDisabled: isAdamantineRank(draft.rankEnd),
    includeOwned: effectiveIncludeOwned,
    includeOwnedDisabled: !isAuthenticated,
    loading,
    profile,
    baseUpgrades,
    groups,
    campaignInsights,
    eventInsights,
    onRangeChange: setDraftRange,
    onProgressionRangeChange: setDraftProgressionRange,
    onPointFiveChange: setDraftPointFive,
    onIncludeOwnedChange: setIncludeOwned,
    onApply: handleApply,
    applyDisabled: !isDirty,
  }

  return (
    <div className="flex flex-col gap-8" data-testid="character-rank-up-tab">
      <p className="text-muted-foreground">{t("unitLookup.subtitle")}</p>

      {isMobile ? (
        <CharacterLookupMobilePage {...sharedProps} />
      ) : (
        <CharacterLookupDesktopPage {...sharedProps} />
      )}
    </div>
  )
}
