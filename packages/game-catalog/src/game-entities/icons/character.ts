import type { UnitId } from "@workspace/game-domain"

import { characterIconOverrides } from "../character-icon-overrides"
import { mowIconOverrides } from "../mow-icon-overrides"
import { datamineAssetUrl } from "./asset-path"

function camelToSnake(id: string): string {
  return id.replace(/([A-Z])/g, "_$1").toLowerCase()
}

function roundPortraitIcon(slug: string): string {
  return datamineAssetUrl(`atlases/ui_image_RoundPortrait_${slug}_01.webp`)
}

export function characterIcon(id: UnitId): string | undefined {
  const slug = characterIconOverrides.get(id) ?? camelToSnake(id)
  return roundPortraitIcon(slug)
}

// MoW portraits ship in the same game atlas as character portraits, using the same RoundPortrait
// naming convention.
export function mowIcon(id: UnitId): string | undefined {
  const slug = mowIconOverrides.get(id) ?? camelToSnake(id)
  return roundPortraitIcon(slug)
}
