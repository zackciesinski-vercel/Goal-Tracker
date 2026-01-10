/**
 * Theme system with preset themes and font options
 */

export type ThemeColors = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
}

export type ThemePreset = {
  id: string
  name: string
  description: string
  preview: { primary: string; accent: string; bg: string }
  light: ThemeColors
  dark: ThemeColors
}

export type FontOption = {
  id: string
  name: string
  description: string
  variable: string
  fallback: string
}

// Status colors - consistent across all themes for accessibility
export const STATUS_COLORS = {
  light: {
    onTrack: 'oklch(0.72 0.19 142)',
    atRisk: 'oklch(0.75 0.18 85)',
    behind: 'oklch(0.63 0.24 25)',
  },
  dark: {
    onTrack: 'oklch(0.75 0.17 145)',
    atRisk: 'oklch(0.78 0.16 80)',
    behind: 'oklch(0.70 0.20 22)',
  },
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Energizing purples and teals inspired by northern lights',
    preview: { primary: '#8b5cf6', accent: '#06b6d4', bg: '#faf5ff' },
    light: {
      background: 'oklch(0.99 0.01 300)',
      foreground: 'oklch(0.20 0.02 280)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.20 0.02 280)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.20 0.02 280)',
      primary: 'oklch(0.55 0.24 290)',
      primaryForeground: 'oklch(0.98 0.01 290)',
      secondary: 'oklch(0.95 0.03 290)',
      secondaryForeground: 'oklch(0.35 0.10 290)',
      muted: 'oklch(0.96 0.02 290)',
      mutedForeground: 'oklch(0.50 0.03 280)',
      accent: 'oklch(0.70 0.15 195)',
      accentForeground: 'oklch(0.18 0.02 195)',
      border: 'oklch(0.91 0.02 290)',
      input: 'oklch(0.91 0.02 290)',
      ring: 'oklch(0.55 0.24 290)',
    },
    dark: {
      background: 'oklch(0.16 0.03 280)',
      foreground: 'oklch(0.96 0.01 290)',
      card: 'oklch(0.22 0.04 280)',
      cardForeground: 'oklch(0.96 0.01 290)',
      popover: 'oklch(0.22 0.04 280)',
      popoverForeground: 'oklch(0.96 0.01 290)',
      primary: 'oklch(0.70 0.20 290)',
      primaryForeground: 'oklch(0.15 0.03 290)',
      secondary: 'oklch(0.28 0.05 280)',
      secondaryForeground: 'oklch(0.92 0.02 290)',
      muted: 'oklch(0.28 0.05 280)',
      mutedForeground: 'oklch(0.68 0.03 280)',
      accent: 'oklch(0.65 0.14 195)',
      accentForeground: 'oklch(0.95 0.01 195)',
      border: 'oklch(0.32 0.04 280)',
      input: 'oklch(0.32 0.04 280)',
      ring: 'oklch(0.70 0.20 290)',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Warm coral and orange tones that spark motivation',
    preview: { primary: '#f97316', accent: '#ec4899', bg: '#fff7ed' },
    light: {
      background: 'oklch(0.99 0.01 70)',
      foreground: 'oklch(0.22 0.03 50)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.22 0.03 50)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.22 0.03 50)',
      primary: 'oklch(0.70 0.20 45)',
      primaryForeground: 'oklch(0.98 0.01 50)',
      secondary: 'oklch(0.95 0.03 50)',
      secondaryForeground: 'oklch(0.40 0.08 50)',
      muted: 'oklch(0.96 0.02 50)',
      mutedForeground: 'oklch(0.50 0.03 50)',
      accent: 'oklch(0.68 0.20 350)',
      accentForeground: 'oklch(0.98 0.01 350)',
      border: 'oklch(0.92 0.02 50)',
      input: 'oklch(0.92 0.02 50)',
      ring: 'oklch(0.70 0.20 45)',
    },
    dark: {
      background: 'oklch(0.16 0.02 40)',
      foreground: 'oklch(0.96 0.01 50)',
      card: 'oklch(0.22 0.03 40)',
      cardForeground: 'oklch(0.96 0.01 50)',
      popover: 'oklch(0.22 0.03 40)',
      popoverForeground: 'oklch(0.96 0.01 50)',
      primary: 'oklch(0.75 0.18 45)',
      primaryForeground: 'oklch(0.15 0.02 45)',
      secondary: 'oklch(0.28 0.04 40)',
      secondaryForeground: 'oklch(0.92 0.02 50)',
      muted: 'oklch(0.28 0.04 40)',
      mutedForeground: 'oklch(0.68 0.03 50)',
      accent: 'oklch(0.72 0.18 350)',
      accentForeground: 'oklch(0.15 0.02 350)',
      border: 'oklch(0.32 0.03 40)',
      input: 'oklch(0.32 0.03 40)',
      ring: 'oklch(0.75 0.18 45)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blues and aqua for calm focus',
    preview: { primary: '#0ea5e9', accent: '#22d3ee', bg: '#f0f9ff' },
    light: {
      background: 'oklch(0.99 0.01 230)',
      foreground: 'oklch(0.20 0.03 230)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.20 0.03 230)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.20 0.03 230)',
      primary: 'oklch(0.60 0.18 235)',
      primaryForeground: 'oklch(0.98 0.01 230)',
      secondary: 'oklch(0.95 0.02 230)',
      secondaryForeground: 'oklch(0.35 0.08 230)',
      muted: 'oklch(0.96 0.01 230)',
      mutedForeground: 'oklch(0.50 0.03 230)',
      accent: 'oklch(0.78 0.12 195)',
      accentForeground: 'oklch(0.18 0.02 195)',
      border: 'oklch(0.91 0.02 230)',
      input: 'oklch(0.91 0.02 230)',
      ring: 'oklch(0.60 0.18 235)',
    },
    dark: {
      background: 'oklch(0.14 0.03 235)',
      foreground: 'oklch(0.96 0.01 230)',
      card: 'oklch(0.20 0.04 235)',
      cardForeground: 'oklch(0.96 0.01 230)',
      popover: 'oklch(0.20 0.04 235)',
      popoverForeground: 'oklch(0.96 0.01 230)',
      primary: 'oklch(0.72 0.14 235)',
      primaryForeground: 'oklch(0.14 0.03 235)',
      secondary: 'oklch(0.26 0.05 235)',
      secondaryForeground: 'oklch(0.92 0.01 230)',
      muted: 'oklch(0.26 0.05 235)',
      mutedForeground: 'oklch(0.68 0.02 230)',
      accent: 'oklch(0.75 0.10 195)',
      accentForeground: 'oklch(0.14 0.02 195)',
      border: 'oklch(0.30 0.04 235)',
      input: 'oklch(0.30 0.04 235)',
      ring: 'oklch(0.72 0.14 235)',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Rich greens and earth tones for natural energy',
    preview: { primary: '#22c55e', accent: '#84cc16', bg: '#f0fdf4' },
    light: {
      background: 'oklch(0.99 0.01 145)',
      foreground: 'oklch(0.20 0.03 150)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.20 0.03 150)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.20 0.03 150)',
      primary: 'oklch(0.65 0.20 150)',
      primaryForeground: 'oklch(0.98 0.01 150)',
      secondary: 'oklch(0.95 0.03 150)',
      secondaryForeground: 'oklch(0.35 0.10 150)',
      muted: 'oklch(0.96 0.02 150)',
      mutedForeground: 'oklch(0.50 0.03 150)',
      accent: 'oklch(0.75 0.18 115)',
      accentForeground: 'oklch(0.20 0.03 115)',
      border: 'oklch(0.91 0.02 150)',
      input: 'oklch(0.91 0.02 150)',
      ring: 'oklch(0.65 0.20 150)',
    },
    dark: {
      background: 'oklch(0.14 0.02 150)',
      foreground: 'oklch(0.96 0.01 145)',
      card: 'oklch(0.20 0.03 150)',
      cardForeground: 'oklch(0.96 0.01 145)',
      popover: 'oklch(0.20 0.03 150)',
      popoverForeground: 'oklch(0.96 0.01 145)',
      primary: 'oklch(0.72 0.17 150)',
      primaryForeground: 'oklch(0.14 0.02 150)',
      secondary: 'oklch(0.26 0.04 150)',
      secondaryForeground: 'oklch(0.92 0.01 145)',
      muted: 'oklch(0.26 0.04 150)',
      mutedForeground: 'oklch(0.68 0.02 150)',
      accent: 'oklch(0.72 0.15 115)',
      accentForeground: 'oklch(0.14 0.02 115)',
      border: 'oklch(0.30 0.03 150)',
      input: 'oklch(0.30 0.03 150)',
      ring: 'oklch(0.72 0.17 150)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm gradients from gold to magenta',
    preview: { primary: '#f59e0b', accent: '#d946ef', bg: '#fefce8' },
    light: {
      background: 'oklch(0.99 0.01 90)',
      foreground: 'oklch(0.22 0.03 70)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.22 0.03 70)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.22 0.03 70)',
      primary: 'oklch(0.78 0.16 75)',
      primaryForeground: 'oklch(0.22 0.03 75)',
      secondary: 'oklch(0.95 0.03 80)',
      secondaryForeground: 'oklch(0.40 0.08 75)',
      muted: 'oklch(0.96 0.02 80)',
      mutedForeground: 'oklch(0.50 0.03 75)',
      accent: 'oklch(0.65 0.25 320)',
      accentForeground: 'oklch(0.98 0.01 320)',
      border: 'oklch(0.92 0.02 80)',
      input: 'oklch(0.92 0.02 80)',
      ring: 'oklch(0.78 0.16 75)',
    },
    dark: {
      background: 'oklch(0.15 0.02 60)',
      foreground: 'oklch(0.96 0.01 80)',
      card: 'oklch(0.21 0.03 60)',
      cardForeground: 'oklch(0.96 0.01 80)',
      popover: 'oklch(0.21 0.03 60)',
      popoverForeground: 'oklch(0.96 0.01 80)',
      primary: 'oklch(0.82 0.14 75)',
      primaryForeground: 'oklch(0.15 0.02 75)',
      secondary: 'oklch(0.27 0.04 60)',
      secondaryForeground: 'oklch(0.92 0.01 80)',
      muted: 'oklch(0.27 0.04 60)',
      mutedForeground: 'oklch(0.68 0.02 75)',
      accent: 'oklch(0.70 0.22 320)',
      accentForeground: 'oklch(0.15 0.02 320)',
      border: 'oklch(0.31 0.03 60)',
      input: 'oklch(0.31 0.03 60)',
      ring: 'oklch(0.82 0.14 75)',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    description: 'Soft purples and pinks for gentle productivity',
    preview: { primary: '#a855f7', accent: '#f472b6', bg: '#fdf4ff' },
    light: {
      background: 'oklch(0.99 0.01 310)',
      foreground: 'oklch(0.22 0.02 300)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.22 0.02 300)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.22 0.02 300)',
      primary: 'oklch(0.62 0.22 305)',
      primaryForeground: 'oklch(0.98 0.01 305)',
      secondary: 'oklch(0.95 0.02 310)',
      secondaryForeground: 'oklch(0.38 0.08 305)',
      muted: 'oklch(0.96 0.02 310)',
      mutedForeground: 'oklch(0.52 0.03 300)',
      accent: 'oklch(0.72 0.18 350)',
      accentForeground: 'oklch(0.20 0.02 350)',
      border: 'oklch(0.92 0.02 310)',
      input: 'oklch(0.92 0.02 310)',
      ring: 'oklch(0.62 0.22 305)',
    },
    dark: {
      background: 'oklch(0.15 0.02 300)',
      foreground: 'oklch(0.96 0.01 310)',
      card: 'oklch(0.21 0.03 300)',
      cardForeground: 'oklch(0.96 0.01 310)',
      popover: 'oklch(0.21 0.03 300)',
      popoverForeground: 'oklch(0.96 0.01 310)',
      primary: 'oklch(0.72 0.18 305)',
      primaryForeground: 'oklch(0.15 0.02 305)',
      secondary: 'oklch(0.27 0.04 300)',
      secondaryForeground: 'oklch(0.92 0.01 310)',
      muted: 'oklch(0.27 0.04 300)',
      mutedForeground: 'oklch(0.68 0.02 300)',
      accent: 'oklch(0.75 0.16 350)',
      accentForeground: 'oklch(0.15 0.02 350)',
      border: 'oklch(0.31 0.03 300)',
      input: 'oklch(0.31 0.03 300)',
      ring: 'oklch(0.72 0.18 305)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep indigo with electric blue accents',
    preview: { primary: '#6366f1', accent: '#38bdf8', bg: '#eef2ff' },
    light: {
      background: 'oklch(0.98 0.01 265)',
      foreground: 'oklch(0.20 0.03 260)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.20 0.03 260)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.20 0.03 260)',
      primary: 'oklch(0.55 0.22 265)',
      primaryForeground: 'oklch(0.98 0.01 265)',
      secondary: 'oklch(0.95 0.02 265)',
      secondaryForeground: 'oklch(0.35 0.10 265)',
      muted: 'oklch(0.96 0.02 265)',
      mutedForeground: 'oklch(0.50 0.03 260)',
      accent: 'oklch(0.75 0.14 220)',
      accentForeground: 'oklch(0.18 0.02 220)',
      border: 'oklch(0.91 0.02 265)',
      input: 'oklch(0.91 0.02 265)',
      ring: 'oklch(0.55 0.22 265)',
    },
    dark: {
      background: 'oklch(0.13 0.03 260)',
      foreground: 'oklch(0.96 0.01 265)',
      card: 'oklch(0.19 0.04 260)',
      cardForeground: 'oklch(0.96 0.01 265)',
      popover: 'oklch(0.19 0.04 260)',
      popoverForeground: 'oklch(0.96 0.01 265)',
      primary: 'oklch(0.68 0.18 265)',
      primaryForeground: 'oklch(0.13 0.03 265)',
      secondary: 'oklch(0.25 0.05 260)',
      secondaryForeground: 'oklch(0.92 0.01 265)',
      muted: 'oklch(0.25 0.05 260)',
      mutedForeground: 'oklch(0.68 0.02 260)',
      accent: 'oklch(0.78 0.12 220)',
      accentForeground: 'oklch(0.13 0.02 220)',
      border: 'oklch(0.29 0.04 260)',
      input: 'oklch(0.29 0.04 260)',
      ring: 'oklch(0.68 0.18 265)',
    },
  },
]

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'geist',
    name: 'Geist',
    description: 'Modern and technical',
    variable: '--font-geist-sans',
    fallback: 'system-ui, sans-serif',
  },
  {
    id: 'inter',
    name: 'Inter',
    description: 'Clean and readable',
    variable: '--font-inter',
    fallback: 'system-ui, sans-serif',
  },
  {
    id: 'outfit',
    name: 'Outfit',
    description: 'Geometric and friendly',
    variable: '--font-outfit',
    fallback: 'system-ui, sans-serif',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    description: 'Futuristic and bold',
    variable: '--font-space-grotesk',
    fallback: 'system-ui, sans-serif',
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    description: 'Warm and approachable',
    variable: '--font-dm-sans',
    fallback: 'system-ui, sans-serif',
  },
]

export function getThemeById(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((t) => t.id === id)
}

export function getFontById(id: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.id === id)
}
