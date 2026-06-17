const OKLCH_PATTERN =
  /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*[\d.%]+)?\s*\)$/

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function linearToSrgb(value: number) {
  if (value <= 0.0031308) {
    return 12.92 * value
  }

  return 1.055 * value ** (1 / 2.4) - 0.055
}

function channelToHex(value: number) {
  return Math.round(clamp(value) * 255)
    .toString(16)
    .padStart(2, "0")
}

export function oklchToHex(value: string) {
  const match = value.trim().match(OKLCH_PATTERN)

  if (!match) {
    return value
  }

  const lightness = Number(match[1])
  const chroma = Number(match[2])
  const hue = (Number(match[3]) * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b

  const l = lPrime ** 3
  const m = mPrime ** 3
  const s = sPrime ** 3

  const red = linearToSrgb(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  )
  const green = linearToSrgb(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  )
  const blue = linearToSrgb(
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  )

  return `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`.toUpperCase()
}
