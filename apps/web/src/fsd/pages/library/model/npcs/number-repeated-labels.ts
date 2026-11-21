/**
 * Keeps option labels distinguishable once raw ids are hidden: a label that only one option carries
 * stays as it is, and a label shared by several options gets its ordinal ("Legendary 1",
 * "Legendary 2") in list order.
 */
export function numberRepeatedLabels<T extends { label: string }>(
  options: readonly T[]
): T[] {
  const totals = new Map<string, number>()
  for (const option of options) {
    totals.set(option.label, (totals.get(option.label) ?? 0) + 1)
  }
  const seen = new Map<string, number>()
  return options.map((option) => {
    if ((totals.get(option.label) ?? 0) < 2) return option
    const ordinal = (seen.get(option.label) ?? 0) + 1
    seen.set(option.label, ordinal)
    return { ...option, label: `${option.label} ${ordinal}` }
  })
}
