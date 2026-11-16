/**
 * The portraits group's accessible label: "Kharn, Abaddon and Typhus" when every unit is shown, or
 * "Kharn, Abaddon, Typhus, Lucius and 2 more" (the `more` text, localized by the caller) otherwise.
 */
export function portraitsLabel(
  names: readonly string[],
  more: number,
  language: string,
  moreText: (count: number, names: string) => string
): string {
  if (more > 0) return moreText(more, names.join(", "))
  try {
    return new Intl.ListFormat(language, {
      style: "long",
      type: "conjunction",
    }).format(names)
  } catch {
    return names.join(", ")
  }
}
