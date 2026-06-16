export type ViewSettingKey = "badges" | "abilities" | "power"

export type ViewSetting = {
  key: ViewSettingKey
  label: string
  enabled: boolean
}

export const defaultViewSettings: ViewSetting[] = [
  { key: "badges", label: "Show badges", enabled: true },
  { key: "abilities", label: "Show abilities", enabled: true },
  { key: "power", label: "Show power", enabled: false },
]
