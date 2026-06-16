export const uiKitSections = [
  { id: "colors", label: "Colors" },
  { id: "buttons", label: "Buttons" },
  { id: "forms", label: "Forms" },
  { id: "selection", label: "Selection" },
  { id: "feedback", label: "Feedback" },
  { id: "overlays", label: "Overlays" },
  { id: "layout", label: "Layout" },
  { id: "data-display", label: "Data Display" },
] as const

export type UiKitSectionId = (typeof uiKitSections)[number]["id"]

export const colorTokens = [
  {
    name: "Background",
    className: "bg-background",
    cssVariable: "--background",
    textClassName: "text-foreground",
  },
  {
    name: "Foreground",
    className: "bg-foreground",
    cssVariable: "--foreground",
    textClassName: "text-background",
  },
  {
    name: "Primary",
    className: "bg-primary",
    cssVariable: "--primary",
    textClassName: "text-primary-foreground",
  },
  {
    name: "Secondary",
    className: "bg-secondary",
    cssVariable: "--secondary",
    textClassName: "text-secondary-foreground",
  },
  {
    name: "Muted",
    className: "bg-muted",
    cssVariable: "--muted",
    textClassName: "text-muted-foreground",
  },
  {
    name: "Accent",
    className: "bg-accent",
    cssVariable: "--accent",
    textClassName: "text-accent-foreground",
  },
  {
    name: "Destructive",
    className: "bg-destructive",
    cssVariable: "--destructive",
    textClassName: "text-white",
  },
] as const

export const tableRows = [
  { component: "Button", status: "Installed", owner: "Shared UI" },
  { component: "Dialog", status: "Installed", owner: "Shared UI" },
  { component: "Table", status: "Installed", owner: "Shared UI" },
  { component: "Tooltip", status: "Installed", owner: "Shared UI" },
] as const

export type Payment = {
  id: string
  amount: number
  status: "failed" | "pending" | "processing" | "success"
  email: string
}

export const payments: Payment[] = [
  {
    id: "728ed52f",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
  {
    id: "489e1d42",
    amount: 242,
    status: "success",
    email: "abe45@example.com",
  },
  {
    id: "3f94c8f1",
    amount: 837,
    status: "processing",
    email: "monserrat44@example.com",
  },
  {
    id: "6a12b83c",
    amount: 874,
    status: "success",
    email: "silas22@example.com",
  },
  {
    id: "9d43e917",
    amount: 721,
    status: "failed",
    email: "carmella@example.com",
  },
  {
    id: "2f71a65e",
    amount: 128,
    status: "pending",
    email: "noelia@example.com",
  },
]
