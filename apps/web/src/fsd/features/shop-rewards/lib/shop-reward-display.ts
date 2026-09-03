import type { TFunction } from "i18next"
import {
  characterIcon,
  EquipmentIcons,
  equipmentSlotIcon,
  mowIcon,
  UpgradeIcons,
} from "@workspace/game-catalog"
import { unitIdSchema } from "@workspace/game-domain"

// The V2 equivalent of V1's `3-features/shop-rewards` `rewardInfo` / `summarizeSlotItems`: resolves a
// shop reward-type string to a display label + best-effort icon, keyed entirely by id. Shared by the
// Dailies recommendations page and the public Library browsing page. Icons come from
// `@workspace/game-catalog`'s helpers and the app's `public/game_catalog/**` assets, ported to cover
// every reward vocabulary the four daily shops use (V1 `reward-icon.ts` + `reward-info.tsx`); anything
// still without a V2 asset falls back to a prettified text label (EntityIcon hides a missing src).

export type ShopRewardKind =
  | "shard"
  | "mythicShard"
  | "upgrade"
  | "forgeBadge"
  | "mowToken"
  | "orb"
  | "abilityBadge"
  | "xpBook"
  | "dust"
  | "equipment"
  | "gold"
  | "other"

export interface ShopRewardDisplay {
  kind: ShopRewardKind
  iconUrl?: string
  label: string
}

/**
 * A `TFunction` scoped to the namespaces this helper reads. i18next's `TFunction<Ns>` is nominally
 * branded to the first namespace, so a consumer whose page `t` is scoped differently (e.g. the Library
 * browser, first-ns `library`) binds a second `useTranslation(["shops", "characters", "upgrades"])`
 * just for this call — the same pattern as `pages/goals/model/shared/use-goal-catalog.ts`.
 */
type ShopRewardTranslate = TFunction<["shops", "characters", "upgrades"]>

export interface ShopRewardDisplayContext {
  t: ShopRewardTranslate
  /** Catalog unit name maps, for resolving a shard reward's unit label + portrait. */
  charactersById: ReadonlyMap<string, { name: string }>
  mowsById: ReadonlyMap<string, { name: string }>
}

const ASSET_ROOT = "/game_catalog"

const RARITY_SUFFIXES = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
] as const

type RaritySuffix = (typeof RARITY_SUFFIXES)[number]

/** XP-book asset index by rarity (`ui_icon_consumable_xp_book_{0..5}.png`). */
const XP_BOOK_INDEX: Record<RaritySuffix, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Mythic: 5,
}

/** Humanizes a raw reward type for the reward vocabularies with no dedicated label. */
function prettifyRewardType(rewardType: string): string {
  return rewardType
    .replace(/^[a-z]+_/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase())
}

function trailingRarity(rewardType: string): RaritySuffix | undefined {
  return RARITY_SUFFIXES.find((rarity) => rewardType.endsWith(rarity))
}

function unitPortrait(
  unitId: string,
  ctx: ShopRewardDisplayContext
): string | undefined {
  const parsed = unitIdSchema.safeParse(unitId)
  if (!parsed.success) return undefined
  return ctx.mowsById.has(unitId) && !ctx.charactersById.has(unitId)
    ? mowIcon(parsed.data)
    : characterIcon(parsed.data)
}

function unitName(unitId: string, ctx: ShopRewardDisplayContext): string {
  if (ctx.charactersById.has(unitId)) {
    return ctx.t(`characters:${unitId}`, {
      defaultValue: ctx.charactersById.get(unitId)?.name ?? unitId,
    })
  }
  return ctx.mowsById.get(unitId)?.name ?? unitId
}

export function shopRewardDisplay(
  rewardType: string,
  unitId: string | undefined,
  ctx: ShopRewardDisplayContext
): ShopRewardDisplay {
  const { t } = ctx

  if (rewardType.startsWith("mythicShards_")) {
    const id = unitId ?? rewardType.slice("mythicShards_".length)
    return {
      kind: "mythicShard",
      iconUrl: unitPortrait(id, ctx),
      label: t("shops:reward.mythicShards", { unit: unitName(id, ctx) }),
    }
  }
  if (rewardType.startsWith("shards_")) {
    const id = unitId ?? rewardType.slice("shards_".length)
    return {
      kind: "shard",
      iconUrl: unitPortrait(id, ctx),
      label: t("shops:reward.shards", { unit: unitName(id, ctx) }),
    }
  }

  if (rewardType === "gold") {
    return {
      kind: "gold",
      iconUrl: `${ASSET_ROOT}/misc/ui_icon_resource_coin.png`,
      label: t("shops:reward.gold"),
    }
  }
  if (rewardType === "dust") {
    return {
      kind: "dust",
      iconUrl: `${ASSET_ROOT}/resources/ui_icon_resource_salvage.png`,
      label: t("shops:reward.dust"),
    }
  }
  if (rewardType === "mythicDust") {
    return {
      kind: "dust",
      iconUrl: `${ASSET_ROOT}/resources/ui_icon_resource_mythic_salvage.png`,
      label: t("shops:reward.mythicDust"),
    }
  }
  if (rewardType === "expeditionSpeedUp") {
    return {
      kind: "other",
      iconUrl: `${ASSET_ROOT}/resources/Resource_ExpeditionSpeedUp.png`,
      label: t("shops:reward.expeditionSpeedUp"),
    }
  }

  const xpRarity = /^xp(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(
    rewardType
  )?.[1] as RaritySuffix | undefined
  if (xpRarity) {
    return {
      kind: "xpBook",
      iconUrl: `${ASSET_ROOT}/books/ui_icon_consumable_xp_book_${XP_BOOK_INDEX[xpRarity]}.png`,
      label: t("shops:reward.xpBook", { rarity: xpRarity }),
    }
  }

  if (rewardType.startsWith("upg")) {
    return {
      kind: "upgrade",
      iconUrl: UpgradeIcons.icon(rewardType as never),
      label: t(`upgrades:${rewardType}`, {
        defaultValue: prettifyRewardType(rewardType),
      }),
    }
  }

  if (rewardType.startsWith("itemAscensionResource_")) {
    const rarity = trailingRarity(rewardType)
    return {
      kind: "forgeBadge",
      iconUrl: rarity
        ? `${ASSET_ROOT}/resources/ui_forge_badges_${rarity.toLowerCase()}.png`
        : `${ASSET_ROOT}/misc/forge_badges_generic.png`,
      label: t("shops:reward.forgeBadge", {
        rarity: rarity ?? prettifyRewardType(rewardType),
      }),
    }
  }

  if (rewardType.startsWith("draft_abilityTokens")) {
    const rarity = trailingRarity(rewardType)
    return {
      kind: "abilityBadge",
      iconUrl: rarity
        ? `${ASSET_ROOT}/resources/ui_icon_droptable_draft_abilityTokens${rarity}.png`
        : undefined,
      label: t("shops:reward.abilityBadge", {
        rarity: rarity ?? prettifyRewardType(rewardType),
      }),
    }
  }

  if (rewardType.startsWith("draft_ascensionOrbs")) {
    const rarity = trailingRarity(rewardType)
    // V1 has dedicated draft-orb art for Uncommon..Mythic; Common (rare in data) falls back to the
    // rarity-tinted hero-orb icon.
    return {
      kind: "orb",
      iconUrl:
        rarity && rarity !== "Common"
          ? `${ASSET_ROOT}/resources/ui_icon_droptable_draft_ascensionOrbs${rarity}.png`
          : rarity
            ? `${ASSET_ROOT}/resources/ui_hero_ascension_orbs_${rarity.toLowerCase()}.png`
            : undefined,
      label: t("shops:reward.orb", {
        rarity: rarity ?? prettifyRewardType(rewardType),
      }),
    }
  }

  if (
    rewardType === "draft_machinesOfWarTokens" ||
    rewardType.startsWith("mowComponent_")
  ) {
    return {
      kind: "mowToken",
      iconUrl: `${ASSET_ROOT}/resources/ui_icon_droptable_draft_machinesOfWarToken.png`,
      label: t("shops:reward.mowToken", {
        alliance: rewardType.startsWith("mowComponent_")
          ? prettifyRewardType(rewardType)
          : t("shops:reward.generic", { name: "MoW" }),
      }),
    }
  }

  // Generic equipment reward pools: items{Rarity}_{SlotType} (e.g. itemsLegendary_I_Block).
  const pool = /^items(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(.+)$/.exec(
    rewardType
  )
  if (pool) {
    const rarity = pool[1] as RaritySuffix
    const slotType = pool[2]!
    return {
      kind: "equipment",
      iconUrl: equipmentSlotIcon(slotType),
      label: t("shops:reward.equipmentPool", {
        rarity,
        type: prettifyRewardType(slotType),
      }),
    }
  }

  // Specific equipment pieces / relics: I_* or R_* (ids match the equipment asset filename directly).
  if (rewardType.startsWith("I_") || rewardType.startsWith("R_")) {
    return {
      kind: "equipment",
      iconUrl: EquipmentIcons.icon(rewardType as never),
      label: t("shops:reward.generic", {
        name: prettifyRewardType(rewardType),
      }),
    }
  }

  // dust variants already handled; anything else (unknown drafts, event tokens) → prettified text only.
  return {
    kind: "other",
    label: t("shops:reward.generic", { name: prettifyRewardType(rewardType) }),
  }
}
