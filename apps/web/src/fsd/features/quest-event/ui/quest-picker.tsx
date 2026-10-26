import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

/**
 * Picks which catalog quest the tab shows, by featured hero portrait and localized name. On mobile
 * the trigger narrows to its content.
 */
export function QuestPicker({
  heroes,
  value,
  onChange,
  isMobile,
}: {
  /** Every catalog quest's featured hero, with the catalog name when the id resolves. */
  heroes: readonly { id: string; name: string | undefined }[]
  value: string | null
  onChange: (heroId: string) => void
  isMobile: boolean
}) {
  const { t } = useTranslation(["quest", "characters"])
  if (heroes.length === 0) return null
  const label = (hero: { id: string; name: string | undefined }) =>
    hero.name
      ? t(`characters:${hero.id}`, { defaultValue: hero.name })
      : hero.id
  return (
    <Select onValueChange={onChange} value={value ?? undefined}>
      <SelectTrigger
        aria-label={t("quest:picker.label")}
        className={cn("min-h-11", isMobile ? "w-auto max-w-44" : "w-56")}
        data-testid="quest-picker"
      >
        <SelectValue placeholder={t("quest:picker.label")} />
      </SelectTrigger>
      <SelectContent>
        {heroes.map((hero) => (
          <SelectItem data-hero={hero.id} key={hero.id} value={hero.id}>
            <EntityIcon
              alt=""
              className="size-6 rounded-full"
              src={characterIcon(hero.id as UnitId)}
            />
            <span className="truncate">{label(hero)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
