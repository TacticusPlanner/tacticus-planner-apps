import type { ReactNode } from "react"
import i18next, { type i18n as I18n } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"

import enCharacters from "../../public/locales/en/characters.json"
import enCommon from "../../public/locales/en/common.json"
import enDamageTypes from "../../public/locales/en/damageTypes.json"
import enEvents from "../../public/locales/en/events.json"
import enFactions from "../../public/locales/en/factions.json"
import enLegendaryEvents from "../../public/locales/en/legendaryEvents.json"
import enMows from "../../public/locales/en/mows.json"
import enTraits from "../../public/locales/en/traits.json"
import deCommon from "../../public/locales/de/common.json"
import deLegendaryEvents from "../../public/locales/de/legendaryEvents.json"

/**
 * A real i18next instance over the shipped English (and German) resources, for tests that assert
 * the rendered copy rather than translation keys. `extra` seeds additional entries per language.
 */
export async function createTestI18n(
  lng: "en" | "de" = "en",
  extra: Record<string, Record<string, Record<string, unknown>>> = {}
): Promise<I18n> {
  const instance = i18next.createInstance()
  await instance.use(initReactI18next).init({
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    resources: {
      en: {
        characters: enCharacters,
        common: enCommon,
        damageTypes: enDamageTypes,
        events: enEvents,
        factions: enFactions,
        legendaryEvents: enLegendaryEvents,
        mows: enMows,
        traits: enTraits,
        ...extra.en,
      },
      de: {
        common: deCommon,
        legendaryEvents: deLegendaryEvents,
        ...extra.de,
      },
    },
  })
  return instance
}

export function i18nWrapper(instance: I18n) {
  return function I18nWrapper({ children }: { children: ReactNode }) {
    return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
  }
}
