import type { UnitId } from "@workspace/game-domain"

import { characterIconOverrides } from "../character-icon-overrides"
import { mowIconOverrides } from "../mow-icon-overrides"
import { ASSET_BASE_PATH } from "./asset-path"

function camelToSnake(id: string): string {
  return id.replace(/([A-Z])/g, "_$1").toLowerCase()
}

function roundPortraitIcon(slug: string): string {
  return `${ASSET_BASE_PATH}/characters/ui_image_RoundPortrait_${slug}_01.png`
}

export function characterIcon(id: UnitId): string | undefined {
  const slug = characterIconOverrides.get(id) ?? camelToSnake(id)
  return roundPortraitIcon(slug)
}

// MoW portraits ship in the same `characters/` folder as character portraits (there is no separate
// `mows/` folder), using the same RoundPortrait naming convention.
export function mowIcon(id: UnitId): string | undefined {
  const slug = mowIconOverrides.get(id) ?? camelToSnake(id)
  return roundPortraitIcon(slug)
}
