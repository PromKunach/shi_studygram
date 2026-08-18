/** Shared semantic classes for the appointment module — matches app globals.css tokens. */

export const aptCard =
  "rounded-xl border border-border bg-background shadow-sm"

export const aptPanel =
  "rounded-xl border border-border bg-sidebar"

export const aptPanelSubtle =
  "rounded-xl border border-border bg-hover/60"

export const aptPopover =
  "overflow-hidden rounded-xl border border-border bg-background shadow-lg"

export const aptDialog =
  "rounded-2xl border border-border bg-background shadow-xl"

export const aptField =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-border"

export const aptTagActive =
  "border-border bg-hover text-foreground"

export const aptTagInactive =
  "border-border bg-background text-muted hover:bg-hover"

export const aptListItem =
  "rounded-xl border border-border bg-hover/80 px-4 py-3 text-left transition-colors hover:bg-background"

export const aptListEmpty =
  "rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted"

export const aptTabActive =
  "border-b-2 border-foreground text-foreground"

export const aptTabInactive =
  "text-muted hover:text-foreground"

export const aptDaySelected = "bg-foreground text-background"

export const aptDayDefault = "text-foreground hover:bg-hover"

export const aptDropdownActive = "bg-hover font-semibold text-foreground"

export const aptDropdownItem = "text-muted hover:bg-hover"

export const aptToggleTrackOn = "bg-foreground"

export const aptToggleTrackOff = "bg-border"

export const aptToggleKnob = "bg-background"

/** Base colors for date-card tinting — aligned with globals.css light/dark tokens. */
export const APT_THEME_BASE = {
  light: {
    card: "#ffffff",
    border: "#e9e9e7",
    ring: "#d4d4d4",
    ringBorder: "#9b9a97",
    stack1: "#f7f7f5",
    stack2: "#efefef",
    monthText: "#9b9a97",
    dayText: "#37352f",
    weekdayText: "#9b9a97",
  },
  dark: {
    card: "#191919",
    border: "#2f2f2f",
    ring: "#404040",
    ringBorder: "#525252",
    stack1: "#141414",
    stack2: "#101010",
    monthText: "#7a7a78",
    dayText: "#e6e6e5",
    weekdayText: "#7a7a78",
  },
} as const
