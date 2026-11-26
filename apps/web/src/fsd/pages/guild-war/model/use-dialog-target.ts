import { useState } from "react"
import type { Rarity } from "@workspace/game-domain"

import { zoneKindId } from "../lib/season"
import type { GuildWarSeason } from "../lib/season"
import { editRarities, editTarget } from "./attack-target"
import type { ZoneRarity } from "./attack-target"
import type { Selection } from "./offense"
import { pickRarity } from "./page-target"
import type { GuildWarAttack } from "./types"

/** What the Log attack dialog logs or edits: a new attack with the page's selection, at the
 *  page's zone and rarity (changing them there changes the page's too, so the next attack starts
 *  there), or a logged attack, whose zone and rarity can be changed there. */
export type LogAttackSubject =
  | {
      kind: "new"
      selection: Selection
      zoneId: string
      rarities: readonly ZoneRarity[]
      target: ZoneRarity | undefined
      onZoneChange: (zoneId: string) => void
      onRarityChange: (rarity: Rarity) => void
    }
  | { kind: "edit"; attack: GuildWarAttack }

/**
 * The zone and defenders' rarity the dialog logs at, the rarities it offers, and the zone and slot
 * it saves at: a new attack's are the page's; an edited attack's start at its own (its zone as its
 * kind) and change only for it (`editRarities`, `editTarget`).
 */
export function useDialogTarget(
  subject: LogAttackSubject,
  season: GuildWarSeason | undefined,
  battlefieldLevel: number
) {
  const editing = subject.kind === "edit" ? subject.attack : null
  const [zoneId, setZoneId] = useState(() =>
    editing ? zoneKindId(season, editing.zoneId) : ""
  )
  const [picked, setPicked] = useState<Rarity | undefined>(editing?.rarityCap)
  if (subject.kind === "new") {
    const { target } = subject
    return {
      zoneId: subject.zoneId,
      rarities: subject.rarities,
      target,
      onZoneChange: subject.onZoneChange,
      onRarityChange: subject.onRarityChange,
      saveTarget: target && { zoneId: subject.zoneId, slot: target.slot },
    }
  }
  const rarities = editRarities(
    season,
    battlefieldLevel,
    subject.attack,
    zoneId
  )
  const target = pickRarity(rarities, picked)
  return {
    zoneId,
    rarities,
    target,
    onZoneChange: setZoneId,
    onRarityChange: setPicked,
    saveTarget: editTarget(subject.attack, season, zoneId, target),
  }
}
