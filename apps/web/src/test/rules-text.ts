// The committed English rules text, one file per ability, merged back into id-keyed tables for tests
// that read many entries at once.
import type { AbilityTextEntry } from "@/shared/ability-text"

const merge = <Entry>(files: Record<string, Record<string, Entry>>) =>
  Object.assign({}, ...Object.values(files)) as Record<string, Entry>

export const enNpcAbilityText = merge(
  import.meta.glob<Record<string, AbilityTextEntry>>(
    "../../public/locales/en/npcAbilityText/*.json",
    { eager: true, import: "default" }
  )
)
