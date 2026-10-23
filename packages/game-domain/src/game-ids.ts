import type { z } from "zod"

// A string id narrowed to one game entity kind: the same type zod's `.brand<B>()` produces, so ids
// parsed by the catalog and player-data schemas (`@workspace/game-domain/schemas`) and ids from
// these parsers are interchangeable. The type import is erased, so zod stays out of every bundle
// that only needs ids.
type Branded<B extends string> = string & z.$brand<B>

type SafeParseResult<T> =
  { success: true; data: T } | { success: false; data?: undefined }

/** Brands a string read from an untrusted place (a route param, storage, an API payload field).
 *  Same contract as the zod schema's `parse` / `safeParse`: any string is accepted, anything else
 *  is rejected. */
function idParser<B extends string>(brand: B) {
  return {
    parse(value: unknown): Branded<B> {
      if (typeof value !== "string") {
        throw new TypeError(`${brand} must be a string`)
      }
      return value as Branded<B>
    },
    safeParse(value: unknown): SafeParseResult<Branded<B>> {
      return typeof value === "string"
        ? { success: true, data: value as Branded<B> }
        : { success: false }
    },
  }
}

export const unitIdSchema = idParser("UnitId")
export type UnitId = Branded<"UnitId">

export const campaignIdSchema = idParser("CampaignId")
export type CampaignId = Branded<"CampaignId">

export const upgradeIdSchema = idParser("UpgradeId")
export type UpgradeId = Branded<"UpgradeId">

export const equipmentIdSchema = idParser("EquipmentId")
export type EquipmentId = Branded<"EquipmentId">

export const abilityIdSchema = idParser("AbilityId")
export type AbilityId = Branded<"AbilityId">

export const factionIdSchema = idParser("FactionId")
export type FactionId = Branded<"FactionId">

export const battleIdSchema = idParser("BattleId")
export type BattleId = Branded<"BattleId">
