import { useTranslation } from "react-i18next"
import { ArrowRight, Lock } from "lucide-react"
import { equipmentSlotIcon } from "@workspace/game-catalog"
import type { EquipmentStorageModel } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import { UnitPortrait } from "@/entities/unit"
import { ItemIcon } from "@/shared/equipment"
import { CountBadge, EntityIcon, ListDivider, TruncatedText } from "@/shared/ui"

import type {
  CharacterSuggestions,
  ItemCopy,
  Suggestion,
  SuggestionReason,
  UnwornRelic,
} from "../../../model/items/suggestions"
import { portraitSrc } from "../portrait-src"

type Item = EquipmentStorageModel

/** What the cards need to name and draw things. */
export type SuggestionsContext = {
  itemOf: (id: string) => Item | undefined
  itemName: (item: Item) => string
  slotName: (type: string) => string
  unitName: (id: string) => string
  rarityOf: (id: string) => Rarity | undefined
}

/** One character and what to equip, slot by slot. */
export function SuggestionCard({
  entry,
  context,
}: {
  entry: CharacterSuggestions
  context: SuggestionsContext
}) {
  return (
    <article
      className="flex flex-col gap-3 rounded-lg border bg-card p-3"
      data-character-id={entry.characterId}
      data-testid="item-suggestion-character"
    >
      <header className="flex items-center gap-3">
        <UnitPortrait
          rarity={entry.rarity}
          size="portrait-sm"
          src={portraitSrc(entry.characterId)}
        />
        <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold">
          <TruncatedText>{context.unitName(entry.characterId)}</TruncatedText>
          <CountBadge count={entry.suggestions.length} />
        </h3>
      </header>
      <ul className="flex flex-col gap-3 border-t pt-3">
        {entry.suggestions.map((suggestion) => (
          <SuggestionRow
            context={context}
            key={suggestion.slotIndex}
            suggestion={suggestion}
          />
        ))}
      </ul>
    </article>
  )
}

function useReasonText() {
  const { t, i18n } = useTranslation(["myItems", "progression"])
  const rarity = (value: Rarity) =>
    t(`progression:rarities.${value}`, { defaultValue: value })
  const percent = (value: number) =>
    value.toLocaleString(i18n.language, { maximumFractionDigits: 1 })
  return (reason: SuggestionReason): string => {
    switch (reason.kind) {
      case "empty": {
        return t("suggestions.reasons.empty")
      }
      case "rarity": {
        return t("suggestions.reasons.rarity", {
          from: rarity(reason.from),
          to: rarity(reason.to),
        })
      }
      case "level": {
        return t("suggestions.reasons.level", reason)
      }
      case "chance": {
        return t("suggestions.reasons.chance", {
          from: percent(reason.from),
          to: percent(reason.to),
        })
      }
    }
  }
}

/** The item in a slot now, or an empty dashed frame. */
function SlotItem({
  copy,
  context,
}: {
  copy: ItemCopy | undefined
  context: SuggestionsContext
}) {
  const item = copy ? context.itemOf(copy.itemId) : undefined
  if (!copy || !item) {
    return (
      <span
        aria-hidden="true"
        className="size-icon-lg shrink-0 rounded-md border-2 border-dashed"
      />
    )
  }
  return <ItemIcon item={item} level={copy.level} size="icon-lg" />
}

/** One slot: what it holds, the spare to put in, and why it's better. */
function SuggestionRow({
  suggestion,
  context,
}: {
  suggestion: Suggestion
  context: SuggestionsContext
}) {
  const { t } = useTranslation("myItems")
  const reasonText = useReasonText()
  const next = context.itemOf(suggestion.next.itemId)
  const current = suggestion.current
    ? context.itemOf(suggestion.current.itemId)
    : undefined
  if (!next) return null
  const title =
    suggestion.current && current
      ? t("suggestions.swap", {
          current: context.itemName(current),
          currentLevel: suggestion.current.level,
          item: context.itemName(next),
          level: suggestion.next.level,
        })
      : t("suggestions.equip", {
          item: context.itemName(next),
          level: suggestion.next.level,
        })
  return (
    <li className="flex items-center gap-3" data-testid="item-suggestion">
      <span className="flex shrink-0 items-center gap-1">
        <SlotItem context={context} copy={suggestion.current} />
        <ArrowRight
          aria-hidden="true"
          className="size-icon-sm text-muted-foreground"
        />
        <SlotItem context={context} copy={suggestion.next} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
          <EntityIcon
            alt=""
            size="icon-sm"
            src={equipmentSlotIcon(suggestion.slotType)}
          />
          {t("suggestions.slot", {
            slot: context.slotName(suggestion.slotType),
          })}{" "}
          · {reasonText(suggestion.reason)}
        </span>
        {suggestion.locked ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock aria-hidden="true" className="size-icon-sm" />
            {t("suggestions.locked")}
          </span>
        ) : null}
      </span>
    </li>
  )
}

/** Spare relics, each with the characters who could wear it and whether they can now. */
export function UnwornRelics({
  relics,
  context,
}: {
  relics: readonly UnwornRelic<Item>[]
  context: SuggestionsContext
}) {
  const { t } = useTranslation("myItems")
  if (relics.length === 0) return null
  return (
    <section className="flex flex-col gap-2" data-testid="items-unworn-relics">
      <ListDivider
        aria-label={t("suggestions.relics.title")}
        heading="h2"
        label={
          <span className="flex items-center gap-2">
            {t("suggestions.relics.title")}
            <CountBadge count={relics.length} />
          </span>
        }
      />
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-2">
        {relics.map((relic) => (
          <li
            className="flex flex-col gap-3 rounded-lg border bg-card p-3"
            data-item-id={relic.item.id}
            data-testid="item-unworn-relic"
            key={relic.item.id}
          >
            <span className="flex items-center gap-3">
              <ItemIcon item={relic.item} size="icon-2xl" />
              <span className="flex min-w-0 flex-col gap-1">
                <TruncatedText className="text-sm font-medium" lines={2}>
                  {context.itemName(relic.item)}
                </TruncatedText>
                {relic.copies.map((copy) => (
                  <span
                    className="text-xs text-muted-foreground tabular-nums"
                    key={copy.level}
                  >
                    {t("suggestions.relics.copies", {
                      level: copy.level,
                      count: copy.spare,
                    })}
                  </span>
                ))}
              </span>
            </span>
            <ul className="flex flex-col gap-2 border-t pt-2">
              {relic.wearers.map((wearer) => (
                <li
                  className="flex items-center gap-2 text-sm"
                  key={wearer.characterId}
                >
                  <UnitPortrait
                    greyed={wearer.status === "notOwned"}
                    rarity={context.rarityOf(wearer.characterId)}
                    size="portrait-sm"
                    src={portraitSrc(wearer.characterId)}
                  />
                  <span className="flex min-w-0 flex-col">
                    <TruncatedText>
                      {context.unitName(wearer.characterId)}
                    </TruncatedText>
                    <span
                      className={
                        wearer.status === "ready"
                          ? "text-xs font-medium text-primary"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {t(`suggestions.relics.status.${wearer.status}`)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
