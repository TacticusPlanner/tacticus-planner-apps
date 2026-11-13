import type { ResolvedEventSlot } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import type { DraftAlliance } from "@/entities/event-shop"

import type { ClassifiedEntry } from "./classify"

// Coverage of goal needs (spec event-shop-planner: Coverage of goal needs). One row per resource the
// event sells that the goals still need: need, planned (to-buy packs only), still needed, the most
// still buyable in the event, how many are short, and the full price of the still-needed amount with
// the cheapest offer. Every cost is in the event currency.

/** A resource as goals need it: `gold`, `xp` (raw XP), `badge:<Alliance>:<Rarity>`,
 *  `orb:<Alliance>:<Rarity>`, `forge:<Rarity>`, `component:<Alliance>`, or a reward type for shards,
 *  mythic shards and Mythic upgrade materials (`shards_astraYarrick`, `upgHpM002`). */
type CoverageResource = string

/** Still needed per resource, already net of inventory. */
export type CoverageNeeds = ReadonlyMap<CoverageResource, number>

type CoverageGroup =
  | "gold"
  | "xp"
  | "badges"
  | "orbs"
  | "components"
  | "forgeBadges"
  | "mythicMaterials"
  | "shards"

const GROUP_ORDER: readonly CoverageGroup[] = [
  "gold",
  "xp",
  "badges",
  "orbs",
  "components",
  "forgeBadges",
  "mythicMaterials",
  "shards",
]

const ALLIANCE_BY_DRAFT: Record<DraftAlliance, string> = {
  imperial: "Imperial",
  xenos: "Xenos",
  chaos: "Chaos",
}
const ALLIANCES = Object.values(ALLIANCE_BY_DRAFT)

export type XpPerBook = Partial<Record<Rarity, number>>

interface Supplied {
  resource: CoverageResource
  group: CoverageGroup
  /** Resource units per reward unit (raw XP per book; 1 otherwise). */
  unitsPerQty: number
}

/**
 * The resources one reward supplies. A draft reward supplies its chosen alliance's resource; an
 * offered draft (no alliance chosen yet) could supply any of the three, so it is listed for each.
 */
export function rewardResources(
  rewardType: string,
  draftAlliance: DraftAlliance | null | undefined,
  xpPerBook: XpPerBook
): Supplied[] {
  const alliances = draftAlliance
    ? [ALLIANCE_BY_DRAFT[draftAlliance]]
    : ALLIANCES
  let match: RegExpExecArray | null
  if (rewardType === "gold")
    return [{ resource: "gold", group: "gold", unitsPerQty: 1 }]
  if (
    (match = /^xp(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(
      rewardType
    ))
  ) {
    const xp = xpPerBook[match[1] as Rarity]
    return xp ? [{ resource: "xp", group: "xp", unitsPerQty: xp }] : []
  }
  if (
    (match = /^abilityToken(\w+?)_(Imperial|Xenos|Chaos)$/.exec(rewardType))
  ) {
    return [one(`badge:${match[2]}:${match[1]}`, "badges")]
  }
  if (
    (match = /^heroAscensionOrb(\w+?)_(Imperial|Xenos|Chaos)$/.exec(rewardType))
  ) {
    return [one(`orb:${match[2]}:${match[1]}`, "orbs")]
  }
  if ((match = /^itemAscensionResource_(\w+)$/.exec(rewardType))) {
    return [one(`forge:${match[1]}`, "forgeBadges")]
  }
  if ((match = /^draft_abilityTokens(\w+)$/.exec(rewardType))) {
    const rarity = match[1]
    return alliances.map((alliance) =>
      one(`badge:${alliance}:${rarity}`, "badges")
    )
  }
  if ((match = /^draft_ascensionOrbs(\w+)$/.exec(rewardType))) {
    const rarity = match[1]
    return alliances.map((alliance) => one(`orb:${alliance}:${rarity}`, "orbs"))
  }
  if (rewardType === "draft_machinesOfWarTokens") {
    return alliances.map((alliance) =>
      one(`component:${alliance}`, "components")
    )
  }
  if (/^(mythicShards|shards)_/.test(rewardType))
    return [one(rewardType, "shards")]
  if (/^upg/.test(rewardType)) return [one(rewardType, "mythicMaterials")]
  return []
}

const one = (resource: string, group: CoverageGroup): Supplied => ({
  resource,
  group,
  unitsPerQty: 1,
})

export interface CoverageRow {
  resource: CoverageResource
  group: CoverageGroup
  /** A reward type that supplies the resource (the cheapest offer's), for its icon and name. */
  rewardType: string
  need: number
  planned: number
  stillNeeded: number
  maxStillBuyable: number
  /** Still needed beyond what the event can still sell; 0 when it can be covered. */
  short: number
  /** The cheapest offer's packs and full price for the whole still-needed amount; null when nothing is
   *  left to buy or the event sells none from today on. */
  estimate: { packs: number; cost: number } | null
}

export interface BuildCoverageParams {
  needs: CoverageNeeds
  /** The classified cart. */
  entries: readonly ClassifiedEntry[]
  /** Today's event day; offers from today on count as still buyable. */
  todayIndex: number
  dayCount: number
  /** The slots the player gets on an event day (locks resolved). */
  slotsOnDay: (dayIndex: number) => readonly ResolvedEventSlot[]
  xpPerBook: XpPerBook
}

/** One row per needed resource the event sells, in the spec's order. */
export function buildCoverage({
  needs,
  entries,
  todayIndex,
  dayCount,
  slotsOnDay,
  xpPerBook,
}: BuildCoverageParams): CoverageRow[] {
  const planned = new Map<CoverageResource, number>()
  const plannedPacks = new Map<string, number>()
  for (const entry of entries) {
    const key = `${entry.dayIndex}/${entry.entry.slotIndex}/${entry.entry.rewardType}`
    plannedPacks.set(key, entry.entry.quantity)
    for (const supplied of rewardResources(
      entry.entry.rewardType,
      entry.entry.draftAlliance,
      xpPerBook
    )) {
      planned.set(
        supplied.resource,
        (planned.get(supplied.resource) ?? 0) +
          entry.toBuyPacks * entry.qtyPerPack * supplied.unitsPerQty
      )
    }
  }

  interface Offer {
    rewardType: string
    unitsPerPack: number
    cost: number
  }
  const sold = new Map<
    CoverageResource,
    { group: CoverageGroup; rewardType: string }
  >()
  const maxBuyable = new Map<CoverageResource, number>()
  const cheapest = new Map<CoverageResource, Offer>()
  const firstDay = Math.max(0, todayIndex)
  for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
    for (const slot of slotsOnDay(dayIndex)) {
      for (const offer of slot.offers) {
        for (const supplied of rewardResources(
          offer.rewardType,
          null,
          xpPerBook
        )) {
          if (!sold.has(supplied.resource)) {
            sold.set(supplied.resource, {
              group: supplied.group,
              rewardType: offer.rewardType,
            })
          }
          if (dayIndex < firstDay) continue
          const unitsPerPack = offer.rewardQty * supplied.unitsPerQty
          const inCart =
            plannedPacks.get(
              `${dayIndex}/${slot.slotIndex}/${offer.rewardType}`
            ) ?? 0
          maxBuyable.set(
            supplied.resource,
            (maxBuyable.get(supplied.resource) ?? 0) +
              Math.max(0, offer.maxPerDay - inCart) * unitsPerPack
          )
          const best = cheapest.get(supplied.resource)
          if (
            !best ||
            offer.cost.amount / unitsPerPack < best.cost / best.unitsPerPack
          ) {
            cheapest.set(supplied.resource, {
              rewardType: offer.rewardType,
              unitsPerPack,
              cost: offer.cost.amount,
            })
          }
        }
      }
    }
  }

  const rows: CoverageRow[] = []
  for (const [resource, need] of needs) {
    const sale = sold.get(resource)
    if (!sale || need <= 0) continue
    const plannedUnits = planned.get(resource) ?? 0
    const stillNeeded = Math.max(0, need - plannedUnits)
    const maxStillBuyable = maxBuyable.get(resource) ?? 0
    const best = cheapest.get(resource)
    const packs = best ? Math.ceil(stillNeeded / best.unitsPerPack) : 0
    rows.push({
      resource,
      group: sale.group,
      rewardType: best?.rewardType ?? sale.rewardType,
      need,
      planned: plannedUnits,
      stillNeeded,
      maxStillBuyable,
      short: Math.max(0, stillNeeded - maxStillBuyable),
      estimate:
        best && stillNeeded > 0 ? { packs, cost: packs * best.cost } : null,
    })
  }
  return rows.sort(
    (a, b) =>
      GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) ||
      a.resource.localeCompare(b.resource)
  )
}

/** The goals' still-needed amounts as coverage resources: shard / mythic shard / Mythic material needs
 *  (`required − acquired`) and the plan's missing badges, orbs, forge badges, components, XP and gold. */
export function toCoverageNeeds(
  shopNeeds: ReadonlyMap<string, { acquired: number; required: number }>,
  missing: {
    abilityBadges: Partial<Record<string, Partial<Record<string, number>>>>
    orbs: Partial<Record<string, Partial<Record<string, number>>>>
    forgeBadges: Partial<Record<string, number>>
    components: Partial<Record<string, number>>
    xp: number
    gold: number
  }
): CoverageNeeds {
  const needs = new Map<CoverageResource, number>()
  const add = (resource: string, amount: number | undefined) => {
    if (amount && amount > 0)
      needs.set(resource, (needs.get(resource) ?? 0) + amount)
  }
  for (const [rewardType, need] of shopNeeds) {
    add(rewardType, need.required - need.acquired)
  }
  for (const [alliance, byRarity] of Object.entries(missing.abilityBadges)) {
    for (const [rarity, count] of Object.entries(byRarity ?? {})) {
      add(`badge:${alliance}:${rarity}`, count)
    }
  }
  for (const [alliance, byRarity] of Object.entries(missing.orbs)) {
    for (const [rarity, count] of Object.entries(byRarity ?? {})) {
      add(`orb:${alliance}:${rarity}`, count)
    }
  }
  for (const [rarity, count] of Object.entries(missing.forgeBadges)) {
    add(`forge:${rarity}`, count)
  }
  for (const [alliance, count] of Object.entries(missing.components)) {
    add(`component:${alliance}`, count)
  }
  add("xp", missing.xp)
  add("gold", missing.gold)
  return needs
}
